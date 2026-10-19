import { OperationError } from '../../../adapters/requestResults'
import {
  calculateLineTotal,
  calculateQuotationTotals,
  doesLineTotalExceedLimit,
  parseToScaledBigInt,
  SDD_LIMITS,
} from './calculations'
import {
  assertCanConvertQuotation,
  assertCanEditQuotation,
  assertCanReviseQuotation,
  assertCanTransitionQuotation,
} from './lifecycle'
import type {
  ConvertQuotationBody,
  CreateQuotationRevisionBody,
  QuotationFamilyRecord,
  QuotationInput,
  QuotationView,
  SaveDraftBody,
  SendReadinessResult,
  TransitionQuotationBody,
} from './types'

/**
 * Validates quotation input strictly according to SDD § 4/5 bounds and limits.
 * Throws OperationError with code 'VALIDATION_FAILED' if invalid.
 */
export function validateQuotationInput(input: QuotationInput): void {
  if (input.lines.length > SDD_LIMITS.MAX_LINES) {
    throw new OperationError(
      'VALIDATION_FAILED',
      `Quotation lines exceed maximum allowable limit of ${SDD_LIMITS.MAX_LINES}`,
    )
  }

  if (input.customerName && input.customerName.length > SDD_LIMITS.MAX_STRING_NAME) {
    throw new OperationError(
      'VALIDATION_FAILED',
      `Customer name exceeds maximum of ${SDD_LIMITS.MAX_STRING_NAME} characters`,
    )
  }
  if (input.sourceNote && input.sourceNote.length > SDD_LIMITS.MAX_STRING_SOURCE_NOTE) {
    throw new OperationError(
      'VALIDATION_FAILED',
      `Source note exceeds maximum of ${SDD_LIMITS.MAX_STRING_SOURCE_NOTE} characters`,
    )
  }
  if (input.notes && input.notes.length > SDD_LIMITS.MAX_STRING_NOTES) {
    throw new OperationError(
      'VALIDATION_FAILED',
      `Notes exceed maximum of ${SDD_LIMITS.MAX_STRING_NOTES} characters`,
    )
  }

  for (let i = 0; i < input.lines.length; i++) {
    const l = input.lines[i]
    if (l.description && l.description.length > SDD_LIMITS.MAX_STRING_NAME) {
      throw new OperationError(
        'VALIDATION_FAILED',
        `Line ${i + 1} description exceeds maximum of ${SDD_LIMITS.MAX_STRING_NAME} characters`,
      )
    }
    if (l.unit && l.unit.length > SDD_LIMITS.MAX_STRING_UNIT) {
      throw new OperationError(
        'VALIDATION_FAILED',
        `Line ${i + 1} unit exceeds maximum of ${SDD_LIMITS.MAX_STRING_UNIT} characters`,
      )
    }
    if (l.quantity !== null && l.quantity !== undefined && l.quantity !== '') {
      const q = parseToScaledBigInt(l.quantity, 3)
      if (q === null || q <= 0n) {
        throw new OperationError('VALIDATION_FAILED', `Line ${i + 1} quantity must be a positive decimal`)
      }
      if (q > SDD_LIMITS.MAX_QUANTITY_MILLI) {
        throw new OperationError(
          'VALIDATION_FAILED',
          `Line ${i + 1} quantity exceeds maximum of ${SDD_LIMITS.MAX_QUANTITY_STR}`,
        )
      }
    }
    if (l.unitPrice !== null && l.unitPrice !== undefined && l.unitPrice !== '') {
      const p = parseToScaledBigInt(l.unitPrice, 2)
      if (p === null || p < 0n) {
        throw new OperationError('VALIDATION_FAILED', `Line ${i + 1} unit price must be a non-negative decimal`)
      }
      if (p > SDD_LIMITS.MAX_UNIT_PRICE_CENTS) {
        throw new OperationError(
          'VALIDATION_FAILED',
          `Line ${i + 1} unit price exceeds maximum of RM ${SDD_LIMITS.MAX_UNIT_PRICE_STR}`,
        )
      }
    }
    if (doesLineTotalExceedLimit(l.quantity, l.unitPrice)) {
      throw new OperationError(
        'VALIDATION_FAILED',
        `Line ${i + 1} total exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`,
      )
    }
  }

  if (input.discountAmount) {
    const d = parseToScaledBigInt(input.discountAmount, 2)
    if (d === null || d < 0n) {
      throw new OperationError('VALIDATION_FAILED', 'Discount amount must be a non-negative decimal')
    }
    if (d > SDD_LIMITS.MAX_MONEY_CENTS) {
      throw new OperationError(
        'VALIDATION_FAILED',
        `Discount amount exceeds maximum of RM ${SDD_LIMITS.MAX_MONEY_STR}`,
      )
    }
    const tempTotals = calculateQuotationTotals(input.lines, '0.00', '0.00')
    const subtotalCents = parseToScaledBigInt(tempTotals.subtotal, 2) ?? 0n
    if (d > subtotalCents) {
      throw new OperationError(
        'VALIDATION_FAILED',
        `Discount amount (RM ${input.discountAmount}) cannot exceed the subtotal (RM ${tempTotals.subtotal})`,
      )
    }
  }

  if (input.taxRate) {
    const t = parseToScaledBigInt(input.taxRate, 2)
    if (t === null || t < 0n || t > SDD_LIMITS.MAX_TAX_RATE_PERCENT) {
      throw new OperationError('VALIDATION_FAILED', 'Tax rate must be a valid percentage between 0.00 and 100.00')
    }
  }

  const totals = calculateQuotationTotals(input.lines, input.discountAmount, input.taxRate)
  if (!totals.isSubtotalValid) {
    throw new OperationError(
      'VALIDATION_FAILED',
      totals.subtotalError || `Subtotal exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`,
    )
  }
  if (!totals.isTaxAmountValid) {
    throw new OperationError(
      'VALIDATION_FAILED',
      totals.taxAmountError || `Calculated tax exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`,
    )
  }
  if (!totals.isGrandTotalValid) {
    throw new OperationError(
      'VALIDATION_FAILED',
      totals.grandTotalError || `Grand total exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`,
    )
  }
}

export function prepareCreateQuotation(
  input: QuotationInput,
  id: string,
  familyId: string,
  nowUtc: string = new Date().toISOString(),
): { quotation: QuotationView; family: QuotationFamilyRecord } {
  validateQuotationInput(input)

  const lineTotals = input.lines.map((l) => calculateLineTotal(l.quantity, l.unitPrice, l.description, l.unit))
  const totals = calculateQuotationTotals(input.lines, input.discountAmount, input.taxRate, {
    customerId: input.customerId,
    dueDate: input.dueDate,
    sourceNote: input.sourceNote,
  })

  const quotation: QuotationView = {
    id,
    familyId,
    version: 1,
    revision: 1,
    number: id,
    previousRevisionId: null,
    isLatest: true,
    status: 'draft',
    jobId: null,
    customerId: input.customerId,
    customerName: input.customerName,
    dueDate: input.dueDate,
    sourceNote: input.sourceNote,
    lines: input.lines.map((l) => ({ ...l })),
    lineTotals,
    totals,
    notes: input.notes,
    createdAt: nowUtc,
  }

  const family: QuotationFamilyRecord = {
    id: familyId,
    latestRevisionId: id,
    convertedJobId: null,
    version: 1,
  }

  return { quotation, family }
}

export function prepareUpdateDraft(
  current: QuotationView,
  family: QuotationFamilyRecord,
  body: SaveDraftBody,
  newFamilyVersion: number,
): QuotationView {
  assertCanEditQuotation(current, family, body.expectedVersion)
  validateQuotationInput(body.quotation)

  const lineTotals = body.quotation.lines.map((l) =>
    calculateLineTotal(l.quantity, l.unitPrice, l.description, l.unit),
  )
  const totals = calculateQuotationTotals(body.quotation.lines, body.quotation.discountAmount, body.quotation.taxRate, {
    customerId: body.quotation.customerId,
    dueDate: body.quotation.dueDate,
    sourceNote: body.quotation.sourceNote,
  })

  return {
    ...current,
    version: newFamilyVersion,
    customerId: body.quotation.customerId,
    customerName: body.quotation.customerName,
    dueDate: body.quotation.dueDate,
    sourceNote: body.quotation.sourceNote,
    lines: body.quotation.lines.map((l) => ({ ...l })),
    lineTotals,
    totals,
    notes: body.quotation.notes,
  }
}

export function prepareTransition(
  current: QuotationView,
  family: QuotationFamilyRecord,
  body: TransitionQuotationBody,
  readiness: SendReadinessResult,
  newFamilyVersion: number,
): QuotationView {
  assertCanTransitionQuotation(current, family, body.action, body.expectedVersion, readiness)

  let nextStatus: QuotationView['status']
  if (body.action === 'send') nextStatus = 'sent'
  else if (body.action === 'accept') nextStatus = 'accepted'
  else if (body.action === 'decline') nextStatus = 'declined'
  else throw new OperationError('INVALID_REQUEST', `Unknown action: ${body.action}`)

  return {
    ...current,
    status: nextStatus,
    version: newFamilyVersion,
  }
}

export function prepareRevision(
  current: QuotationView,
  family: QuotationFamilyRecord,
  body: CreateQuotationRevisionBody,
  nextRevisionId: string,
  newFamilyVersion: number,
  nowUtc: string = new Date().toISOString(),
): { newRevision: QuotationView; updatedFamily: QuotationFamilyRecord } {
  assertCanReviseQuotation(current, family, body.expectedVersion)

  const newRevision: QuotationView = {
    id: nextRevisionId,
    familyId: current.familyId,
    version: newFamilyVersion,
    revision: current.revision + 1,
    number: nextRevisionId,
    previousRevisionId: current.id,
    isLatest: true,
    status: 'draft',
    jobId: null,
    customerId: current.customerId,
    customerName: current.customerName,
    dueDate: current.dueDate,
    sourceNote: current.sourceNote,
    lines: current.lines.map((l) => ({ ...l })),
    lineTotals: [...current.lineTotals],
    totals: { ...current.totals },
    notes: current.notes,
    createdAt: nowUtc,
  }

  const updatedFamily: QuotationFamilyRecord = {
    ...family,
    latestRevisionId: nextRevisionId,
    version: newFamilyVersion,
  }

  return { newRevision, updatedFamily }
}

export function prepareConversion(
  current: QuotationView,
  family: QuotationFamilyRecord,
  body: ConvertQuotationBody,
  jobId: string,
  newFamilyVersion: number,
): { updatedQuotation: QuotationView; updatedFamily: QuotationFamilyRecord } {
  assertCanConvertQuotation(current, family, body.expectedVersion)

  const updatedQuotation: QuotationView = {
    ...current,
    status: 'converted_to_job',
    jobId,
    version: newFamilyVersion,
  }

  const updatedFamily: QuotationFamilyRecord = {
    ...family,
    convertedJobId: jobId,
    version: newFamilyVersion,
  }

  return { updatedQuotation, updatedFamily }
}
