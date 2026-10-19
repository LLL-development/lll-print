import type { DraftLine, Money, Quantity, QuotationInput, QuotationTotals, SendReadinessResult, TaxRate } from './types'

/**
 * Authoritative numeric, line, and string boundary limits per SDD § 4 and § 5.
 */
export const SDD_LIMITS = {
  MAX_LINES: 200,
  MAX_MONEY_STR: '999999999999.99',
  MAX_MONEY_CENTS: 99999999999999n, // 12 integer digits, 2 decimal places (scale 10^2)
  MAX_QUANTITY_STR: '9999999.999',
  MAX_QUANTITY_MILLI: 9999999999n, // 7 integer digits, 3 decimal places (scale 10^3)
  MAX_UNIT_PRICE_STR: '9999999.99',
  MAX_UNIT_PRICE_CENTS: 999999999n, // 7 integer digits, 2 decimal places (scale 10^2)
  MAX_TAX_RATE_PERCENT: 10000n, // 100.00% (scale 10^2)
  MAX_STRING_NAME: 200,
  MAX_STRING_UNIT: 30,
  MAX_STRING_SOURCE_NOTE: 200,
  MAX_STRING_NOTES: 2000,
} as const

/**
 * Parses a decimal string into a scaled BigInt.
 * @param str The decimal string, e.g. "18.00" or "50"
 * @param maxDecimals Expected maximum decimal places to scale by (e.g. 2 for Money, 3 for Quantity)
 * @returns Scaled BigInt or null if invalid format, negative, NaN, exponential, or excessive precision.
 */
export function parseToScaledBigInt(str: string | null | undefined, maxDecimals: number): bigint | null {
  if (str === null || str === undefined) return null
  const trimmed = str.trim()
  if (!trimmed) return null

  // Reject negative numbers, exponential notation, or invalid characters
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null

  const parts = trimmed.split('.')
  const integerPart = parts[0]
  const fractionPart = parts[1] || ''

  if (fractionPart.length > maxDecimals) {
    return null // Excess precision rejected per SDD § 5
  }

  const paddedFraction = fractionPart.padEnd(maxDecimals, '0')
  return BigInt(integerPart + paddedFraction)
}

/**
 * Formats a scaled BigInt back to a decimal string with exact scale decimal places.
 */
export function formatScaledBigInt(value: bigint, scale: number): string {
  if (value < 0n) {
    const absStr = (-value).toString().padStart(scale + 1, '0')
    const intPart = absStr.slice(0, -scale)
    const fracPart = absStr.slice(-scale)
    return `-${intPart}.${fracPart}`
  }
  const str = value.toString().padStart(scale + 1, '0')
  const intPart = str.slice(0, -scale)
  const fracPart = str.slice(-scale)
  return `${intPart}.${fracPart}`
}

/**
 * Integer half-up division: roundHalfUp(N, D) = (N + (D / 2)) / D
 */
export function divRoundHalfUp(numerator: bigint, divisor: bigint): bigint {
  if (divisor <= 0n) throw new Error('Divisor must be positive')
  if (numerator < 0n) throw new Error('Numerator must be non-negative in this domain')
  const half = divisor / 2n
  return (numerator + half) / divisor
}

/**
 * Checks whether a line item's calculated total exceeds the SDD maximum money limit.
 */
export function doesLineTotalExceedLimit(quantity: Quantity | null, unitPrice: Money | null): boolean {
  const qtyScaled = parseToScaledBigInt(quantity, 3)
  const priceScaled = parseToScaledBigInt(unitPrice, 2)
  if (qtyScaled === null || qtyScaled <= 0n || priceScaled === null || priceScaled < 0n) {
    return false
  }
  const product = qtyScaled * priceScaled
  const lineTotalCents = divRoundHalfUp(product, 1000n)
  return lineTotalCents > SDD_LIMITS.MAX_MONEY_CENTS
}

/**
 * Calculates line total: quantity (scale 3) * unitPrice (scale 2) / 1000 -> Money (scale 2).
 * Per SDD § 5, only rows with description, unit, positive quantity, and non-negative unit price
 * within SDD limits produce a line total; others return null.
 */
export function calculateLineTotal(
  quantity: Quantity | null,
  unitPrice: Money | null,
  description?: string | null,
  unit?: string | null,
): Money | null {
  // Description and unit are strictly required to produce a valid line total
  if (!description || description.trim().length === 0) return null
  if (!unit || unit.trim().length === 0) return null

  const qtyScaled = parseToScaledBigInt(quantity, 3)
  const priceScaled = parseToScaledBigInt(unitPrice, 2)

  if (qtyScaled === null || qtyScaled <= 0n || qtyScaled > SDD_LIMITS.MAX_QUANTITY_MILLI) return null
  if (priceScaled === null || priceScaled < 0n || priceScaled > SDD_LIMITS.MAX_UNIT_PRICE_CENTS) return null

  // product is scale 10^3 * 10^2 = 10^5. Divide by 1000n to get scale 10^2 with half-up rounding.
  const product = qtyScaled * priceScaled
  const lineTotalCents = divRoundHalfUp(product, 1000n)

  // Enforce SDD maximum on calculated line total (not only entered values)
  if (lineTotalCents > SDD_LIMITS.MAX_MONEY_CENTS) {
    return null
  }

  return formatScaledBigInt(lineTotalCents, 2)
}

/**
 * Calculates complete quotation commercial totals using pure BigInt math.
 * Avoids silent clamping of excessive discounts and silent replacement of invalid tax inputs.
 * Invalid inputs set provisional: true and withhold computed final totals.
 */
export function calculateQuotationTotals(
  lines: DraftLine[],
  discountAmountInput: Money,
  taxRateInput: TaxRate,
  headerContext?: { customerId?: string | null; dueDate?: string | null; sourceNote?: string },
): QuotationTotals {
  let subtotalCents = 0n
  let hasIncompleteLine = lines.length === 0
  let hasLineTotalExceedingLimit = false

  if (lines.length > SDD_LIMITS.MAX_LINES) {
    hasIncompleteLine = true
  }

  for (const line of lines) {
    if (doesLineTotalExceedLimit(line.quantity, line.unitPrice)) {
      hasLineTotalExceedingLimit = true
    }
    const lineTotal = calculateLineTotal(line.quantity, line.unitPrice, line.description, line.unit)
    if (lineTotal !== null) {
      const cents = parseToScaledBigInt(lineTotal, 2)!
      subtotalCents += cents
    } else {
      hasIncompleteLine = true
    }
  }

  const isSubtotalValid = subtotalCents <= SDD_LIMITS.MAX_MONEY_CENTS
  const subtotalError = !isSubtotalValid
    ? `Subtotal exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`
    : undefined

  const subtotal = formatScaledBigInt(subtotalCents, 2)

  // 1. Discount validation & calculation
  // Do NOT silently clamp excessive discounts to subtotal!
  const trimmedDiscount = (discountAmountInput || '').trim()
  const discountParsed = parseToScaledBigInt(trimmedDiscount || '0.00', 2)
  let isDiscountValid = true
  let discountError: string | undefined
  let discountAmount = trimmedDiscount || '0.00'

  if (discountParsed === null || discountParsed < 0n) {
    isDiscountValid = false
    discountError = 'Discount must be a valid non-negative amount with at most 2 decimal places'
  } else if (discountParsed > SDD_LIMITS.MAX_MONEY_CENTS) {
    isDiscountValid = false
    discountError = `Discount exceeds maximum allowable amount (RM ${SDD_LIMITS.MAX_MONEY_STR})`
  } else if (isSubtotalValid && discountParsed > subtotalCents) {
    isDiscountValid = false
    discountError = `Discount (RM ${formatScaledBigInt(discountParsed, 2)}) cannot exceed the subtotal (RM ${subtotal})`
    discountAmount = formatScaledBigInt(discountParsed, 2) // Retain entered amount; do not clamp!
  } else {
    discountAmount = formatScaledBigInt(discountParsed, 2)
  }

  // 2. Tax rate validation & calculation
  // Do NOT silently replace invalid tax rate with 0.00!
  const trimmedTaxRate = (taxRateInput || '').trim()
  const taxRateParsed = parseToScaledBigInt(trimmedTaxRate || '0.00', 2)
  let isTaxRateValid = true
  let taxRateError: string | undefined
  let taxRate = trimmedTaxRate || '0.00'

  if (taxRateParsed === null || taxRateParsed < 0n || taxRateParsed > SDD_LIMITS.MAX_TAX_RATE_PERCENT) {
    isTaxRateValid = false
    taxRateError = 'Tax rate must be between 0.00% and 100.00%'
  } else {
    taxRate = formatScaledBigInt(taxRateParsed, 2)
  }

  // Commercial totals are computed only when subtotal, discount, and tax rates are mathematically valid
  let discountedSubtotal: Money | null = null
  let taxAmount: Money | null = null
  let grandTotal: Money | null = null
  let isTaxAmountValid = true
  let taxAmountError: string | undefined
  let isGrandTotalValid = true
  let grandTotalError: string | undefined

  if (isSubtotalValid && isDiscountValid && !hasLineTotalExceedingLimit) {
    const discountedSubtotalCents = subtotalCents - discountParsed!
    discountedSubtotal = formatScaledBigInt(discountedSubtotalCents, 2)

    if (isTaxRateValid) {
      const taxProduct = discountedSubtotalCents * taxRateParsed!
      const taxCents = divRoundHalfUp(taxProduct, 10000n)
      if (taxCents > SDD_LIMITS.MAX_MONEY_CENTS) {
        isTaxAmountValid = false
        taxAmountError = `Calculated tax exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`
      } else {
        taxAmount = formatScaledBigInt(taxCents, 2)
      }

      if (isTaxAmountValid) {
        const grandTotalCents = discountedSubtotalCents + taxCents
        if (grandTotalCents > SDD_LIMITS.MAX_MONEY_CENTS) {
          isGrandTotalValid = false
          grandTotalError = `Grand total exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`
        } else {
          grandTotal = formatScaledBigInt(grandTotalCents, 2)
        }
      }
    }
  }

  // Header completeness check
  const isHeaderIncomplete =
    headerContext !== undefined &&
    (!headerContext.customerId || !headerContext.dueDate || !headerContext.sourceNote?.trim())

  // Provisional if:
  // - any line is incomplete/empty or exceeds line limit
  // - any calculated line total exceeds maximum money limit
  // - any required header is incomplete
  // - discount, tax rate, subtotal, tax amount, or grand total is invalid/excessive
  const provisional =
    hasIncompleteLine ||
    hasLineTotalExceedingLimit ||
    isHeaderIncomplete ||
    !isDiscountValid ||
    !isTaxRateValid ||
    !isSubtotalValid ||
    !isTaxAmountValid ||
    !isGrandTotalValid

  return {
    subtotal,
    discountAmount,
    discountedSubtotal,
    taxRate,
    taxAmount,
    grandTotal,
    provisional,
    isDiscountValid,
    isTaxRateValid,
    isSubtotalValid,
    isTaxAmountValid,
    isGrandTotalValid,
    discountError,
    taxRateError,
    subtotalError,
    taxAmountError,
    grandTotalError,
  }
}

/**
 * Checks whether entered discount exceeds subtotal.
 */
export function isDiscountExcessive(subtotal: Money, discountAmount: Money): boolean {
  const subtotalCents = parseToScaledBigInt(subtotal, 2) ?? 0n
  const discountCents = parseToScaledBigInt(discountAmount, 2)
  if (discountCents === null || discountCents < 0n) return true
  return discountCents > subtotalCents
}

/**
 * Evaluates whether a draft quotation satisfies all FR-1.6 & FR-4.2 requirements and SDD limits.
 * In T3, this is for preview / display only; no status transition is executed.
 */
export function evaluateSendReadiness(input: QuotationInput, totals: QuotationTotals): SendReadinessResult {
  const issues: string[] = []

  if (!input.customerId || input.customerId.trim().length === 0) {
    issues.push('Customer must be selected')
  }

  if (!input.dueDate || input.dueDate.trim().length === 0) {
    issues.push('Due date is required')
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate.trim())) {
    issues.push('Due date must be in valid YYYY-MM-DD format')
  }

  if (!input.sourceNote || input.sourceNote.trim().length === 0) {
    issues.push('Source of enquiry note is required (FR-4)')
  } else if (input.sourceNote.length > SDD_LIMITS.MAX_STRING_SOURCE_NOTE) {
    issues.push(`Source of enquiry note cannot exceed ${SDD_LIMITS.MAX_STRING_SOURCE_NOTE} characters`)
  }

  if (input.notes && input.notes.length > SDD_LIMITS.MAX_STRING_NOTES) {
    issues.push(`Notes cannot exceed ${SDD_LIMITS.MAX_STRING_NOTES} characters`)
  }

  if (input.lines.length === 0) {
    issues.push('At least one line item is required')
  } else if (input.lines.length > SDD_LIMITS.MAX_LINES) {
    issues.push(`Quotation cannot exceed ${SDD_LIMITS.MAX_LINES} line items`)
  }

  input.lines.forEach((line, index) => {
    const lineNum = index + 1
    if (!line.description || line.description.trim().length === 0) {
      issues.push(`Line ${lineNum}: Description is missing`)
    } else if (line.description.length > SDD_LIMITS.MAX_STRING_NAME) {
      issues.push(`Line ${lineNum}: Description cannot exceed ${SDD_LIMITS.MAX_STRING_NAME} characters`)
    }

    if (!line.unit || line.unit.trim().length === 0) {
      issues.push(`Line ${lineNum}: Unit is required`)
    } else if (line.unit.length > SDD_LIMITS.MAX_STRING_UNIT) {
      issues.push(`Line ${lineNum}: Unit cannot exceed ${SDD_LIMITS.MAX_STRING_UNIT} characters`)
    }

    const qtyScaled = parseToScaledBigInt(line.quantity, 3)
    if (qtyScaled === null || qtyScaled <= 0n) {
      issues.push(`Line ${lineNum}: Quantity must be positive`)
    } else if (qtyScaled > SDD_LIMITS.MAX_QUANTITY_MILLI) {
      issues.push(`Line ${lineNum}: Quantity exceeds maximum of ${SDD_LIMITS.MAX_QUANTITY_STR}`)
    }

    const priceScaled = parseToScaledBigInt(line.unitPrice, 2)
    if (priceScaled === null || priceScaled < 0n) {
      issues.push(`Line ${lineNum}: Unit price must be non-negative`)
    } else if (priceScaled > SDD_LIMITS.MAX_UNIT_PRICE_CENTS) {
      issues.push(`Line ${lineNum}: Unit price exceeds maximum of RM ${SDD_LIMITS.MAX_UNIT_PRICE_STR}`)
    }

    if (doesLineTotalExceedLimit(line.quantity, line.unitPrice)) {
      issues.push(`Line ${lineNum}: Line total exceeds maximum allowable limit of RM ${SDD_LIMITS.MAX_MONEY_STR}`)
    }
  })

  const discountScaled = parseToScaledBigInt(input.discountAmount, 2)
  if (discountScaled === null || discountScaled < 0n) {
    issues.push('Discount must be a valid non-negative amount')
  } else if (discountScaled > SDD_LIMITS.MAX_MONEY_CENTS) {
    issues.push(`Discount exceeds maximum of RM ${SDD_LIMITS.MAX_MONEY_STR}`)
  } else if (isDiscountExcessive(totals.subtotal, input.discountAmount)) {
    issues.push('Discount cannot exceed the subtotal')
  }

  const taxScaled = parseToScaledBigInt(input.taxRate, 2)
  if (taxScaled === null || taxScaled < 0n || taxScaled > SDD_LIMITS.MAX_TAX_RATE_PERCENT) {
    issues.push('Tax rate must be between 0.00% and 100.00%')
  }

  if (totals.subtotalError) {
    issues.push(totals.subtotalError)
  }
  if (totals.taxAmountError) {
    issues.push(totals.taxAmountError)
  }
  if (totals.grandTotalError) {
    issues.push(totals.grandTotalError)
  }

  if (totals.provisional) {
    if (issues.length === 0) {
      issues.push('Totals are provisional and cannot be sent')
    }
  }

  return {
    isReady: issues.length === 0,
    issues,
  }
}
