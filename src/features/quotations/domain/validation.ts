import { calculateQuotationTotals, doesLineTotalExceedLimit, isDiscountExcessive, parseToScaledBigInt, SDD_LIMITS } from './calculations'
import type { DraftLine, Money, QuotationInput } from './types'

export interface FieldErrors {
  customerId?: string
  dueDate?: string
  sourceNote?: string
  discountAmount?: string
  taxRate?: string
  subtotal?: string
  grandTotal?: string
  lines?: {
    [lineIndex: number]: {
      description?: string
      quantity?: string
      unit?: string
      unitPrice?: string
      lineTotal?: string
    }
  }
}

export interface ValidationResult {
  isValid: boolean
  fieldErrors: FieldErrors
  summaryErrors: string[]
}

/**
 * Validates quotation input for saving a draft.
 * Incomplete drafts are permitted (FR-1.14), but invalid formats, negative numbers,
 * excessive discounts (> subtotal), line limit (max 200), and SDD numeric bounds on entered
 * and calculated totals (line totals, subtotal, tax, grand total <= 999999999999.99) are strictly rejected.
 */
export function validateDraftQuotation(input: QuotationInput, subtotal: Money): ValidationResult {
  const fieldErrors: FieldErrors = {}
  const summaryErrors: string[] = []

  // Max lines enforcement (SDD § 4 / § 5)
  if (input.lines.length > SDD_LIMITS.MAX_LINES) {
    summaryErrors.push(`Quotation cannot exceed ${SDD_LIMITS.MAX_LINES} lines (currently ${input.lines.length})`)
  }

  // Customer name length check
  if (input.customerName && input.customerName.length > SDD_LIMITS.MAX_STRING_NAME) {
    fieldErrors.customerId = `Customer name must be ${SDD_LIMITS.MAX_STRING_NAME} characters or fewer`
    summaryErrors.push(`Customer name must be ${SDD_LIMITS.MAX_STRING_NAME} characters or fewer`)
  }

  // Source note length check if provided
  if (input.sourceNote && input.sourceNote.length > SDD_LIMITS.MAX_STRING_SOURCE_NOTE) {
    fieldErrors.sourceNote = `Source note must be ${SDD_LIMITS.MAX_STRING_SOURCE_NOTE} characters or fewer`
    summaryErrors.push(`Source note must be ${SDD_LIMITS.MAX_STRING_SOURCE_NOTE} characters or fewer`)
  }

  // Notes length check
  if (input.notes && input.notes.length > SDD_LIMITS.MAX_STRING_NOTES) {
    summaryErrors.push(`Notes must be ${SDD_LIMITS.MAX_STRING_NOTES} characters or fewer`)
  }

  // Discount validation (SDD non-negative money <= 999999999999.99, max 2 decimals, <= subtotal)
  if (input.discountAmount) {
    const discountBigInt = parseToScaledBigInt(input.discountAmount, 2)
    if (discountBigInt === null || discountBigInt < 0n) {
      fieldErrors.discountAmount = 'Discount must be a valid non-negative amount with at most 2 decimal places'
      summaryErrors.push('Discount must be a valid non-negative amount')
    } else if (discountBigInt > SDD_LIMITS.MAX_MONEY_CENTS) {
      fieldErrors.discountAmount = `Discount exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`
      summaryErrors.push(`Discount exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`)
    } else if (isDiscountExcessive(subtotal, input.discountAmount)) {
      fieldErrors.discountAmount = `Discount (RM ${input.discountAmount}) cannot exceed the subtotal (RM ${subtotal})`
      summaryErrors.push('Discount cannot exceed the subtotal')
    }
  }

  // Tax rate validation (0.00% to 100.00%, max 2 decimals)
  if (input.taxRate) {
    const taxRateBigInt = parseToScaledBigInt(input.taxRate, 2)
    if (taxRateBigInt === null || taxRateBigInt < 0n || taxRateBigInt > SDD_LIMITS.MAX_TAX_RATE_PERCENT) {
      fieldErrors.taxRate = 'Tax rate must be between 0.00% and 100.00%'
      summaryErrors.push('Tax rate must be between 0.00% and 100.00%')
    }
  }

  // Line-level bounds checks (including calculated line total <= 999999999999.99)
  const lineErrors: FieldErrors['lines'] = {}
  input.lines.forEach((line: DraftLine, index: number) => {
    const rowErrors: { description?: string; quantity?: string; unit?: string; unitPrice?: string; lineTotal?: string } = {}

    if (line.description && line.description.length > SDD_LIMITS.MAX_STRING_NAME) {
      rowErrors.description = `Description must be ${SDD_LIMITS.MAX_STRING_NAME} characters or fewer`
      summaryErrors.push(`Line ${index + 1}: Description is too long`)
    }

    if (line.unit && line.unit.length > SDD_LIMITS.MAX_STRING_UNIT) {
      rowErrors.unit = `Unit must be ${SDD_LIMITS.MAX_STRING_UNIT} characters or fewer`
      summaryErrors.push(`Line ${index + 1}: Unit label is too long`)
    }

    if (line.quantity !== null && line.quantity !== undefined && line.quantity !== '') {
      const qtyBigInt = parseToScaledBigInt(line.quantity, 3)
      if (qtyBigInt === null || qtyBigInt <= 0n) {
        rowErrors.quantity = 'Quantity must be a positive number with at most 3 decimal places'
        summaryErrors.push(`Line ${index + 1}: Quantity must be positive`)
      } else if (qtyBigInt > SDD_LIMITS.MAX_QUANTITY_MILLI) {
        rowErrors.quantity = `Quantity cannot exceed ${SDD_LIMITS.MAX_QUANTITY_STR}`
        summaryErrors.push(`Line ${index + 1}: Quantity exceeds maximum limit of ${SDD_LIMITS.MAX_QUANTITY_STR}`)
      }
    }

    if (line.unitPrice !== null && line.unitPrice !== undefined && line.unitPrice !== '') {
      const priceBigInt = parseToScaledBigInt(line.unitPrice, 2)
      if (priceBigInt === null || priceBigInt < 0n) {
        rowErrors.unitPrice = 'Unit price must be non-negative with at most 2 decimal places'
        summaryErrors.push(`Line ${index + 1}: Unit price must be non-negative`)
      } else if (priceBigInt > SDD_LIMITS.MAX_UNIT_PRICE_CENTS) {
        rowErrors.unitPrice = `Unit price cannot exceed RM ${SDD_LIMITS.MAX_UNIT_PRICE_STR}`
        summaryErrors.push(`Line ${index + 1}: Unit price exceeds maximum limit of RM ${SDD_LIMITS.MAX_UNIT_PRICE_STR}`)
      }
    }

    // Calculated line total overflow check
    if (doesLineTotalExceedLimit(line.quantity, line.unitPrice)) {
      rowErrors.lineTotal = `Line total exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`
      if (!rowErrors.unitPrice) {
        rowErrors.unitPrice = `Line total exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`
      }
      summaryErrors.push(`Line ${index + 1}: Line total exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`)
    }

    if (Object.keys(rowErrors).length > 0) {
      lineErrors[index] = rowErrors
    }
  })

  if (Object.keys(lineErrors).length > 0) {
    fieldErrors.lines = lineErrors
  }

  // Calculated commercial totals limits (subtotal, tax amount, grand total <= 999999999999.99)
  const totals = calculateQuotationTotals(input.lines, input.discountAmount, input.taxRate)
  if (totals.subtotalError) {
    fieldErrors.subtotal = totals.subtotalError
    summaryErrors.push(totals.subtotalError)
  }
  if (totals.taxAmountError) {
    summaryErrors.push(totals.taxAmountError)
  }
  if (totals.grandTotalError) {
    fieldErrors.grandTotal = totals.grandTotalError
    summaryErrors.push(totals.grandTotalError)
  }

  return {
    isValid: summaryErrors.length === 0,
    fieldErrors,
    summaryErrors,
  }
}
