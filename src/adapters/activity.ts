/**
 * Shared synthetic activity shape and storage matching SDD § 4/5.
 * Tracks quotation and job lifecycle events with audit trails.
 */

export type ActivitySubjectType = 'quotation' | 'job'

export interface ActivityEntry {
  id: string
  subjectType: ActivitySubjectType
  subjectId: string
  action: string
  actorLabel: string
  occurredAt: string
  reason: string | null
  changedInformation: string
  previousStatus?: string | null
  nextStatus?: string | null
  previousStage?: string | null
  nextStage?: string | null
  linkedQuotationId?: string | null
  linkedJobId?: string | null
  metadata?: Record<string, unknown>
}

let nextActivityNum = 1

export function resetActivitySequence(startNum = 1): void {
  nextActivityNum = startNum
}

export function createActivityEntry(params: {
  subjectType: ActivitySubjectType
  subjectId: string
  action: string
  actorLabel?: string
  occurredAt?: string
  reason?: string | null
  changedInformation: string
  previousStatus?: string | null
  nextStatus?: string | null
  previousStage?: string | null
  nextStage?: string | null
  linkedQuotationId?: string | null
  linkedJobId?: string | null
  metadata?: Record<string, unknown>
}): ActivityEntry {
  const id = `ACT-${String(nextActivityNum++).padStart(4, '0')}`
  return {
    id,
    subjectType: params.subjectType,
    subjectId: params.subjectId,
    action: params.action,
    actorLabel: params.actorLabel || 'Staff',
    occurredAt: params.occurredAt || new Date().toISOString(),
    reason: params.reason ?? null,
    changedInformation: params.changedInformation,
    previousStatus: params.previousStatus ?? null,
    nextStatus: params.nextStatus ?? null,
    previousStage: params.previousStage ?? null,
    nextStage: params.nextStage ?? null,
    linkedQuotationId: params.linkedQuotationId ?? null,
    linkedJobId: params.linkedJobId ?? null,
    metadata: params.metadata,
  }
}
