import { assertValidExpectedVersion, OperationError } from '../../../adapters/requestResults'
import type { QuotationAction, QuotationFamilyRecord, QuotationView, SendReadinessResult } from './types'

/**
 * Pure eligibility, revision, and family invariants matching SDD § 4/5 & SRS FR-2/FR-3.
 */

export function canEditQuotation(quotation: QuotationView, family: QuotationFamilyRecord): boolean {
  if (family.convertedJobId !== null) return false
  if (!quotation.isLatest || family.latestRevisionId !== quotation.id) return false
  return quotation.status === 'draft'
}

export function canTransitionQuotation(
  quotation: QuotationView,
  family: QuotationFamilyRecord,
  action: QuotationAction,
  readiness?: SendReadinessResult,
): boolean {
  if (family.convertedJobId !== null) return false
  if (!quotation.isLatest || family.latestRevisionId !== quotation.id) return false

  if (action === 'send') {
    if (quotation.status !== 'draft') return false
    if (readiness && !readiness.isReady) return false
    return true
  }

  if (action === 'accept' || action === 'decline') {
    return quotation.status === 'sent'
  }

  return false
}

export function canReviseQuotation(quotation: QuotationView, family: QuotationFamilyRecord): boolean {
  if (family.convertedJobId !== null) return false
  if (!quotation.isLatest || family.latestRevisionId !== quotation.id) return false
  return quotation.status === 'sent' || quotation.status === 'accepted' || quotation.status === 'declined'
}

export function canConvertQuotation(quotation: QuotationView, family: QuotationFamilyRecord): boolean {
  if (family.convertedJobId !== null) return false
  if (!quotation.isLatest || family.latestRevisionId !== quotation.id) return false
  return quotation.status === 'accepted'
}

export function assertCanEditQuotation(
  quotation: QuotationView,
  family: QuotationFamilyRecord,
  expectedVersion: number,
): void {
  assertValidExpectedVersion(expectedVersion)
  if (expectedVersion !== family.version) {
    throw new OperationError(
      'STALE_VERSION',
      `Quotation family has been modified (expected version ${expectedVersion}, current version ${family.version}). Please refresh and review.`,
    )
  }
  if (family.convertedJobId !== null) {
    throw new OperationError(
      'FAMILY_ALREADY_CONVERTED',
      'Quotation family has already been converted to a job and cannot be edited.',
    )
  }
  if (!quotation.isLatest || family.latestRevisionId !== quotation.id) {
    throw new OperationError(
      'REVISION_NOT_LATEST',
      'Only the latest revision of a quotation family can be edited.',
    )
  }
  if (quotation.status !== 'draft') {
    throw new OperationError(
      'INVALID_TRANSITION',
      `Cannot edit quotation with status "${quotation.status}". Only draft quotations can be edited.`,
    )
  }
}

export function assertCanTransitionQuotation(
  quotation: QuotationView,
  family: QuotationFamilyRecord,
  action: QuotationAction,
  expectedVersion: number,
  readiness?: SendReadinessResult,
): void {
  assertValidExpectedVersion(expectedVersion)
  if (expectedVersion !== family.version) {
    throw new OperationError(
      'STALE_VERSION',
      `Quotation family has been modified (expected version ${expectedVersion}, current version ${family.version}). Please refresh and review.`,
    )
  }
  if (family.convertedJobId !== null) {
    throw new OperationError(
      'FAMILY_ALREADY_CONVERTED',
      'Quotation family has already been converted to a job and cannot undergo lifecycle transitions.',
    )
  }
  if (!quotation.isLatest || family.latestRevisionId !== quotation.id) {
    throw new OperationError(
      'REVISION_NOT_LATEST',
      'Only the latest revision of a quotation family can undergo lifecycle transitions.',
    )
  }

  if (action === 'send') {
    if (quotation.status !== 'draft') {
      throw new OperationError(
        'INVALID_TRANSITION',
        `Cannot record quotation as sent from status "${quotation.status}". Must be in draft status.`,
      )
    }
    if (readiness && !readiness.isReady) {
      throw new OperationError(
        'VALIDATION_FAILED',
        `Quotation is not ready to be sent: ${readiness.issues.join('; ')}`,
      )
    }
    return
  }

  if (action === 'accept') {
    if (quotation.status !== 'sent') {
      throw new OperationError(
        'INVALID_TRANSITION',
        `Cannot record quotation as accepted from status "${quotation.status}". Must be in sent status.`,
      )
    }
    return
  }

  if (action === 'decline') {
    if (quotation.status !== 'sent') {
      throw new OperationError(
        'INVALID_TRANSITION',
        `Cannot record quotation as declined from status "${quotation.status}". Must be in sent status.`,
      )
    }
    return
  }

  throw new OperationError('INVALID_REQUEST', `Unknown quotation action: "${action}"`)
}

export function assertCanReviseQuotation(
  quotation: QuotationView,
  family: QuotationFamilyRecord,
  expectedVersion: number,
): void {
  assertValidExpectedVersion(expectedVersion)
  if (expectedVersion !== family.version) {
    throw new OperationError(
      'STALE_VERSION',
      `Quotation family has been modified (expected version ${expectedVersion}, current version ${family.version}). Please refresh and review.`,
    )
  }
  if (family.convertedJobId !== null) {
    throw new OperationError(
      'FAMILY_ALREADY_CONVERTED',
      'Quotation family has already been converted to a job and cannot create new revisions.',
    )
  }
  if (!quotation.isLatest || family.latestRevisionId !== quotation.id) {
    throw new OperationError(
      'REVISION_NOT_LATEST',
      'Only the latest revision of a quotation family can be revised.',
    )
  }
  if (quotation.status !== 'sent' && quotation.status !== 'accepted' && quotation.status !== 'declined') {
    throw new OperationError(
      'INVALID_TRANSITION',
      `Cannot revise quotation with status "${quotation.status}". Must be sent, accepted, or declined.`,
    )
  }
}

export function assertCanConvertQuotation(
  quotation: QuotationView,
  family: QuotationFamilyRecord,
  expectedVersion: number,
): void {
  assertValidExpectedVersion(expectedVersion)
  if (expectedVersion !== family.version) {
    throw new OperationError(
      'STALE_VERSION',
      `Quotation family has been modified (expected version ${expectedVersion}, current version ${family.version}). Please refresh and review.`,
    )
  }
  if (family.convertedJobId !== null) {
    throw new OperationError(
      'FAMILY_ALREADY_CONVERTED',
      'Quotation family has already been converted to a job. Duplicate conversion is prohibited.',
    )
  }
  if (!quotation.isLatest || family.latestRevisionId !== quotation.id) {
    throw new OperationError(
      'REVISION_NOT_LATEST',
      'Only the latest revision of a quotation family can be converted to a job.',
    )
  }
  if (quotation.status !== 'accepted') {
    throw new OperationError(
      'INVALID_TRANSITION',
      `Cannot convert quotation with status "${quotation.status}". Only accepted quotations can be converted to a job.`,
    )
  }
}
