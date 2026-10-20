/**
 * In-memory request identity, replay helpers, and typed operation errors matching SDD § 4/5.
 */

export type OperationErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'INVALID_REQUEST'
  | 'STALE_VERSION'
  | 'REVISION_NOT_LATEST'
  | 'FAMILY_ALREADY_CONVERTED'
  | 'INVALID_TRANSITION'
  | 'IDEMPOTENCY_CONFLICT'

export interface FieldError {
  path: string
  message: string
}

export class OperationError extends Error {
  readonly code: OperationErrorCode
  readonly fieldErrors?: FieldError[]
  readonly requestId?: string

  constructor(
    code: OperationErrorCode,
    message: string,
    fieldErrors?: FieldError[],
    requestId?: string,
  ) {
    super(message)
    this.name = 'OperationError'
    this.code = code
    this.fieldErrors = fieldErrors
    this.requestId = requestId
  }
}

export interface WriteMeta {
  requestKey: string // UUID or stable key for retryable intent
  actorLabel?: string
}

export interface VersionInput {
  expectedVersion: number
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

export interface PageInput {
  limit?: number
  cursor?: string | null
}

/**
 * Validates expectedVersion is present and a positive integer (SDD § 4/5).
 * A missing or malformed version must reject before any state comparison,
 * so a fabricated/defaulted version can never masquerade as a real check.
 */
export function assertValidExpectedVersion(expectedVersion: unknown): asserts expectedVersion is number {
  if (typeof expectedVersion !== 'number' || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw new OperationError(
      'VALIDATION_FAILED',
      'expectedVersion is required and must be a positive integer.',
      [{ path: 'expectedVersion', message: 'expectedVersion is required and must be a positive integer.' }],
    )
  }
}

// `c:<scope>|<anchorId>` — scope binds the token to one subject/filter/list
// operation (SDD: "cursors are scoped to filters and authorized ownership"),
// and the anchor is the id of the last item already returned rather than a
// raw array offset. Anchoring by id keeps continuation stable when new
// entries are prepended between requests (this store's newest-first insert
// order): the anchor's position may shift, but re-finding it and resuming
// just after it can neither re-emit nor skip anything the caller already saw.
const CURSOR_PATTERN = /^c:([^|]+)\|(.+)$/

/**
 * Opaque-cursor pagination over an already-filtered, stably-ordered list.
 * Invalid limit/cursor is rejected per SDD list-envelope contract rather than
 * silently clamped, so a caller cannot pass a bad token and get a slice back.
 * `scope` must uniquely identify the subject and list operation being paged
 * (e.g. `jobActivity:J-1048`); a cursor minted under a different scope, or
 * whose anchor no longer exists in this result set, is rejected outright.
 */
export function paginate<T extends { id: string }>(
  items: readonly T[],
  scope: string,
  page?: PageInput,
): Page<T> {
  const limit = page?.limit ?? 25
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new OperationError('INVALID_REQUEST', 'limit must be an integer between 1 and 100.', [
      { path: 'limit', message: 'limit must be an integer between 1 and 100.' },
    ])
  }

  let startIndex = 0
  if (page?.cursor !== undefined && page.cursor !== null) {
    const match = CURSOR_PATTERN.exec(page.cursor)
    if (!match) {
      throw new OperationError('INVALID_REQUEST', 'cursor is not a recognized pagination token.', [
        { path: 'cursor', message: 'cursor is not a recognized pagination token.' },
      ])
    }
    const [, cursorScope, anchorId] = match
    if (cursorScope !== scope) {
      throw new OperationError(
        'INVALID_REQUEST',
        'cursor does not belong to this result set (wrong subject or list operation).',
        [{ path: 'cursor', message: 'cursor does not belong to this result set.' }],
      )
    }
    const anchorIndex = items.findIndex((item) => item.id === anchorId)
    if (anchorIndex === -1) {
      throw new OperationError('INVALID_REQUEST', 'cursor does not match the current result set.', [
        { path: 'cursor', message: 'cursor does not match the current result set.' },
      ])
    }
    startIndex = anchorIndex + 1
  }

  const pageItems = items.slice(startIndex, startIndex + limit)
  const hasMore = startIndex + pageItems.length < items.length
  const lastItem = pageItems[pageItems.length - 1]
  const nextCursor = hasMore && lastItem ? `c:${scope}|${lastItem.id}` : null

  return { items: pageItems, nextCursor }
}

export interface CachedReplay<T = unknown> {
  operation: string
  targetId: string
  canonicalPayload: string
  result: T
  occurredAt: string
}

export class IdempotencyStore {
  private cache = new Map<string, CachedReplay>()

  get<T>(requestKey: string, operation: string, targetId: string, canonicalPayload: string): { replayed: true; result: T } | null {
    const entry = this.cache.get(requestKey)
    if (!entry) return null

    if (entry.operation !== operation || entry.targetId !== targetId || entry.canonicalPayload !== canonicalPayload) {
      throw new OperationError(
        'IDEMPOTENCY_CONFLICT',
        `Request key "${requestKey}" was already used with a different operation or payload.`,
      )
    }

    return { replayed: true, result: entry.result as T }
  }

  record<T>(requestKey: string, operation: string, targetId: string, canonicalPayload: string, result: T): void {
    this.cache.set(requestKey, {
      operation,
      targetId,
      canonicalPayload,
      result,
      occurredAt: new Date().toISOString(),
    })
  }

  clear(): void {
    this.cache.clear()
  }
}
