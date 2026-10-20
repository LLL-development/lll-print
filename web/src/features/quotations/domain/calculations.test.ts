import { describe, expect, it } from 'vitest'
import {
  calculateLineTotal,
  calculateQuotationTotals,
  divRoundHalfUp,
  doesLineTotalExceedLimit,
  evaluateSendReadiness,
  formatScaledBigInt,
  isDiscountExcessive,
  parseToScaledBigInt,
  SDD_LIMITS,
} from './calculations'
import type { DraftLine, QuotationInput } from './types'

describe('BigInt parsing, formatting, and half-up division', () => {
  it('parses valid decimal strings to scaled BigInt correctly', () => {
    expect(parseToScaledBigInt('18.00', 2)).toBe(1800n)
    expect(parseToScaledBigInt('18', 2)).toBe(1800n)
    expect(parseToScaledBigInt('18.5', 2)).toBe(1850n)
    expect(parseToScaledBigInt('0.05', 2)).toBe(5n)
    expect(parseToScaledBigInt('0', 2)).toBe(0n)
    expect(parseToScaledBigInt('50', 3)).toBe(50000n)
    expect(parseToScaledBigInt('1.250', 3)).toBe(1250n)
  })

  it('rejects excess precision, negative values, and invalid characters', () => {
    expect(parseToScaledBigInt('18.005', 2)).toBeNull() // max 2 decimals for money
    expect(parseToScaledBigInt('-18.00', 2)).toBeNull()
    expect(parseToScaledBigInt('abc', 2)).toBeNull()
    expect(parseToScaledBigInt('', 2)).toBeNull()
    expect(parseToScaledBigInt(null, 2)).toBeNull()
  })

  it('formats scaled BigInt to exact decimal strings', () => {
    expect(formatScaledBigInt(1800n, 2)).toBe('18.00')
    expect(formatScaledBigInt(5n, 2)).toBe('0.05')
    expect(formatScaledBigInt(0n, 2)).toBe('0.00')
    expect(formatScaledBigInt(50000n, 3)).toBe('50.000')
  })

  it('divides with exact half-up rounding', () => {
    // 615000 / 10000 = 61.5 -> half-up rounds to 62
    expect(divRoundHalfUp(615000n, 10000n)).toBe(62n)

    // 614999 / 10000 = 61.4999 -> rounds to 61
    expect(divRoundHalfUp(614999n, 10000n)).toBe(61n)

    // 615001 / 10000 = 61.5001 -> rounds to 62
    expect(divRoundHalfUp(615001n, 10000n)).toBe(62n)

    // Exact division
    expect(divRoundHalfUp(600000n, 10000n)).toBe(60n)
  })
})

describe('Line total calculations', () => {
  it('calculates exact line total with decimal strings when description and unit are present', () => {
    expect(calculateLineTotal('50', '18.00', 'Shirts', 'pcs')).toBe('900.00')
    expect(calculateLineTotal('100', '28.00', 'Apparel', 'pcs')).toBe('2800.00')
    expect(calculateLineTotal('3', '12.33', 'Print', 'pcs')).toBe('36.99')
    expect(calculateLineTotal('7', '5.15', 'Badge', 'pcs')).toBe('36.05')
  })

  it('handles decimal quantity and half-up rounding on line total', () => {
    // 2.500 pcs * 10.25 RM = 25.625 -> rounds half-up to 25.63
    expect(calculateLineTotal('2.500', '10.25', 'Cut fabric', 'm')).toBe('25.63')
  })

  it('returns null whenever description or unit is missing, empty, or whitespace', () => {
    expect(calculateLineTotal('50', '18.00', '', 'pcs')).toBeNull()
    expect(calculateLineTotal('50', '18.00', '   ', 'pcs')).toBeNull()
    expect(calculateLineTotal('50', '18.00', null, 'pcs')).toBeNull()
    expect(calculateLineTotal('50', '18.00', 'Shirts', '')).toBeNull()
    expect(calculateLineTotal('50', '18.00', 'Shirts', '   ')).toBeNull()
    expect(calculateLineTotal('50', '18.00', 'Shirts', null)).toBeNull()
    expect(calculateLineTotal('50', '18.00')).toBeNull()
  })

  it('returns null for incomplete, zero, negative, or overflow inputs', () => {
    expect(calculateLineTotal(null, '18.00', 'Shirts', 'pcs')).toBeNull()
    expect(calculateLineTotal('50', null, 'Shirts', 'pcs')).toBeNull()
    expect(calculateLineTotal('0', '18.00', 'Shirts', 'pcs')).toBeNull()
    expect(calculateLineTotal('-5', '18.00', 'Shirts', 'pcs')).toBeNull()
    expect(calculateLineTotal('50', '-10.00', 'Shirts', 'pcs')).toBeNull()
    // Over SDD limits
    expect(calculateLineTotal('10000000', '18.00', 'Shirts', 'pcs')).toBeNull() // > 9999999.999
    expect(calculateLineTotal('50', '10000000.00', 'Shirts', 'pcs')).toBeNull() // > 9999999.99
  })
})

describe('Quotation totals: SRS worked examples and rounding edge cases', () => {
  it('Example 1: SRS Worked Example (100 Printed Shirts, RM100 discount, 0% tax)', () => {
    const lines: DraftLine[] = [
      { description: '50 Medium shirts', quantity: '50', unit: 'pcs', unitPrice: '18.00' },
      { description: '50 Large shirts', quantity: '50', unit: 'pcs', unitPrice: '18.00' },
    ]

    const totals = calculateQuotationTotals(lines, '100.00', '0.00')

    expect(totals.subtotal).toBe('1800.00')
    expect(totals.discountAmount).toBe('100.00')
    expect(totals.discountedSubtotal).toBe('1700.00')
    expect(totals.taxRate).toBe('0.00')
    expect(totals.taxAmount).toBe('0.00')
    expect(totals.grandTotal).toBe('1700.00')
    expect(totals.provisional).toBe(false)
  })

  it('Example 2: Non-zero tax & half-up rounding boundary (6% tax on RM10.25 subtotal)', () => {
    const lines: DraftLine[] = [
      { description: 'Test item', quantity: '1', unit: 'pcs', unitPrice: '10.25' },
    ]

    // 10.25 * 0.06 = 0.615 -> rounds half-up to 0.62
    const totals = calculateQuotationTotals(lines, '0.00', '6.00')

    expect(totals.subtotal).toBe('10.25')
    expect(totals.discountAmount).toBe('0.00')
    expect(totals.discountedSubtotal).toBe('10.25')
    expect(totals.taxAmount).toBe('0.62')
    expect(totals.grandTotal).toBe('10.87')
    expect(totals.provisional).toBe(false)
  })

  it('Example 3: Multi-line tax calculation on discounted subtotal', () => {
    const lines: DraftLine[] = [
      { description: 'Line A', quantity: '3', unit: 'pcs', unitPrice: '12.33' }, // 36.99
      { description: 'Line B', quantity: '7', unit: 'pcs', unitPrice: '5.15' },  // 36.05
    ]
    const totals = calculateQuotationTotals(lines, '5.00', '6.00')

    expect(totals.subtotal).toBe('73.04')
    expect(totals.discountAmount).toBe('5.00')
    expect(totals.discountedSubtotal).toBe('68.04')
    expect(totals.taxAmount).toBe('4.08')
    expect(totals.grandTotal).toBe('72.12')
  })

  it('Example 4: Full 100% discount edge case', () => {
    const lines: DraftLine[] = [
      { description: 'Promo item', quantity: '10', unit: 'pcs', unitPrice: '15.00' }, // 150.00
    ]
    const totals = calculateQuotationTotals(lines, '150.00', '6.00')

    expect(totals.subtotal).toBe('150.00')
    expect(totals.discountAmount).toBe('150.00')
    expect(totals.discountedSubtotal).toBe('0.00')
    expect(totals.taxAmount).toBe('0.00')
    expect(totals.grandTotal).toBe('0.00')
  })

  it('does not silently clamp excessive discount; sets provisional true, withholds final totals, and reports error', () => {
    const lines: DraftLine[] = [
      { description: 'Item', quantity: '1', unit: 'pcs', unitPrice: '50.00' },
    ]
    expect(isDiscountExcessive('50.00', '60.00')).toBe(true)
    expect(isDiscountExcessive('50.00', '50.00')).toBe(false)
    expect(isDiscountExcessive('50.00', '10.00')).toBe(false)

    // Calculation does NOT silently clamp 60.00 down to 50.00
    const totals = calculateQuotationTotals(lines, '60.00', '0.00')
    expect(totals.subtotal).toBe('50.00')
    expect(totals.discountAmount).toBe('60.00') // Retains entered discount
    expect(totals.discountedSubtotal).toBeNull()
    expect(totals.grandTotal).toBeNull() // Does not present invalid total as final
    expect(totals.provisional).toBe(true)
    expect(totals.isDiscountValid).toBe(false)
    expect(totals.discountError).toContain('cannot exceed the subtotal')
  })

  it('does not silently replace invalid tax input with 0.00; sets provisional true, withholds final totals, and reports error', () => {
    const lines: DraftLine[] = [
      { description: 'Item', quantity: '1', unit: 'pcs', unitPrice: '50.00' },
    ]
    const totalsInvalid = calculateQuotationTotals(lines, '0.00', '150.00')
    expect(totalsInvalid.taxRate).toBe('150.00') // Not replaced with 0.00!
    expect(totalsInvalid.taxAmount).toBeNull()
    expect(totalsInvalid.grandTotal).toBeNull()
    expect(totalsInvalid.provisional).toBe(true)
    expect(totalsInvalid.isTaxRateValid).toBe(false)
    expect(totalsInvalid.taxRateError).toContain('between 0.00% and 100.00%')

    const totalsNegative = calculateQuotationTotals(lines, '0.00', '-5.00')
    expect(totalsNegative.taxRate).toBe('-5.00')
    expect(totalsNegative.taxAmount).toBeNull()
    expect(totalsNegative.grandTotal).toBeNull()
    expect(totalsNegative.provisional).toBe(true)
    expect(totalsNegative.isTaxRateValid).toBe(false)
  })

  it('marks totals as provisional when lines are empty or partially completed', () => {
    // Empty lines
    const emptyTotals = calculateQuotationTotals([], '0.00', '0.00')
    expect(emptyTotals.provisional).toBe(true)

    // Partial line (missing unit price)
    const partialLines: DraftLine[] = [
      { description: 'Incomplete line', quantity: '10', unit: 'pcs', unitPrice: null },
    ]
    const partialTotals = calculateQuotationTotals(partialLines, '0.00', '0.00')
    expect(partialTotals.provisional).toBe(true)
    expect(partialTotals.subtotal).toBe('0.00')

    // Mixed lines: one complete (50.00), one incomplete
    const mixedLines: DraftLine[] = [
      { description: 'Complete line', quantity: '5', unit: 'pcs', unitPrice: '10.00' },
      { description: 'Draft line', quantity: null, unit: 'pcs', unitPrice: null },
    ]
    const mixedTotals = calculateQuotationTotals(mixedLines, '0.00', '0.00')
    expect(mixedTotals.provisional).toBe(true)
    expect(mixedTotals.subtotal).toBe('50.00')
    expect(mixedTotals.grandTotal).toBe('50.00')
  })
})

describe('Send readiness evaluation (preview only, no transitions in T3)', () => {
  it('passes when all FR-1.6 and FR-4.2 requirements and SDD limits are satisfied', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'WhatsApp, 28 Aug',
      lines: [
        { description: '50 Navy polos', quantity: '50', unit: 'pcs', unitPrice: '20.00' },
      ],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }
    const totals = calculateQuotationTotals(input.lines, input.discountAmount, input.taxRate)
    const readiness = evaluateSendReadiness(input, totals)

    expect(readiness.isReady).toBe(true)
    expect(readiness.issues.length).toBe(0)
  })

  it('flags missing customer, missing due date, and missing source note', () => {
    const input: QuotationInput = {
      customerId: null,
      customerName: '',
      dueDate: null,
      sourceNote: '',
      lines: [
        { description: 'Polo', quantity: '10', unit: 'pcs', unitPrice: '20.00' },
      ],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }
    const totals = calculateQuotationTotals(input.lines, input.discountAmount, input.taxRate)
    const readiness = evaluateSendReadiness(input, totals)

    expect(readiness.isReady).toBe(false)
    expect(readiness.issues).toContain('Customer must be selected')
    expect(readiness.issues).toContain('Due date is required')
    expect(readiness.issues).toContain('Source of enquiry note is required (FR-4)')
  })

  it('flags incomplete line items and excessive discounts', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'Phone call',
      lines: [
        { description: '', quantity: '0', unit: '', unitPrice: null },
      ],
      discountAmount: '50.00',
      taxRate: '0.00',
      notes: '',
    }
    const totals = calculateQuotationTotals(input.lines, input.discountAmount, input.taxRate)
    const readiness = evaluateSendReadiness(input, totals)

    expect(readiness.isReady).toBe(false)
    expect(readiness.issues.some((i) => i.includes('Description is missing'))).toBe(true)
    expect(readiness.issues.some((i) => i.includes('Quantity must be positive'))).toBe(true)
    expect(readiness.issues.some((i) => i.includes('Unit is required'))).toBe(true)
    expect(readiness.issues.some((i) => i.includes('Unit price must be non-negative'))).toBe(true)
    expect(readiness.issues).toContain('Discount cannot exceed the subtotal')
  })

  it('enforces SDD maximum 200 lines and numeric boundary limits in send readiness', () => {
    // 201 lines
    const lines201: DraftLine[] = Array.from({ length: 201 }, (_, i) => ({
      description: `Item ${i + 1}`,
      quantity: '1',
      unit: 'pcs',
      unitPrice: '10.00',
    }))
    const input201: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'WhatsApp',
      lines: lines201,
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }
    const totals201 = calculateQuotationTotals(input201.lines, '0.00', '0.00')
    const readiness201 = evaluateSendReadiness(input201, totals201)
    expect(readiness201.isReady).toBe(false)
    expect(readiness201.issues.some((i) => i.includes(`cannot exceed ${SDD_LIMITS.MAX_LINES} line items`))).toBe(true)

    // Excess quantity (> 9999999.999)
    const inputExcessQty: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'WhatsApp',
      lines: [{ description: 'Polo', quantity: '10000000', unit: 'pcs', unitPrice: '10.00' }],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }
    const totalsExcess = calculateQuotationTotals(inputExcessQty.lines, '0.00', '0.00')
    const readinessExcess = evaluateSendReadiness(inputExcessQty, totalsExcess)
    expect(readinessExcess.isReady).toBe(false)
    expect(readinessExcess.issues.some((i) => i.includes('Quantity exceeds maximum'))).toBe(true)

    // Excess unit price (> 9999999.99)
    const inputExcessPrice: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'WhatsApp',
      lines: [{ description: 'Polo', quantity: '10', unit: 'pcs', unitPrice: '10000000.00' }],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }
    const totalsExcessPrice = calculateQuotationTotals(inputExcessPrice.lines, '0.00', '0.00')
    const readinessExcessPrice = evaluateSendReadiness(inputExcessPrice, totalsExcessPrice)
    expect(readinessExcessPrice.isReady).toBe(false)
    expect(readinessExcessPrice.issues.some((i) => i.includes('Unit price exceeds maximum'))).toBe(true)
  })
})

describe('Calculated amount limits (line totals, subtotal, tax amount, grand total <= 999999999999.99)', () => {
  it('rejects line total when valid quantity and unit price product exceeds 999999999999.99', () => {
    // Both qty (1000000 <= 9999999.999) and unitPrice (1000000.00 <= 9999999.99) are within SDD limits
    // Product is 1,000,000,000,000.00 > 999999999999.99
    expect(doesLineTotalExceedLimit('1000000', '1000000.00')).toBe(true)
    expect(calculateLineTotal('1000000', '1000000.00', 'Exceeds limit', 'pcs')).toBeNull()

    const lines: DraftLine[] = [
      { description: 'Massive line item', quantity: '1000000', unit: 'pcs', unitPrice: '1000000.00' },
    ]
    const totals = calculateQuotationTotals(lines, '0.00', '0.00')
    expect(totals.provisional).toBe(true)

    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'WhatsApp',
      lines,
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }
    const readiness = evaluateSendReadiness(input, totals)
    expect(readiness.isReady).toBe(false)
    expect(readiness.issues.some((i) => i.includes('Line 1: Line total exceeds maximum'))).toBe(true)
  })

  it('rejects subtotal when individually valid line totals sum to exceed 999999999999.99', () => {
    // Line 1: 100000 * 6000000.00 = 600,000,000,000.00 (<= 999999999999.99, valid)
    // Line 2: 100000 * 5000000.00 = 500,000,000,000.00 (<= 999999999999.99, valid)
    // Sum = 1,100,000,000,000.00 > 999999999999.99
    const line1Total = calculateLineTotal('100000', '6000000.00', 'Batch A', 'pcs')
    const line2Total = calculateLineTotal('100000', '5000000.00', 'Batch B', 'pcs')
    expect(line1Total).toBe('600000000000.00')
    expect(line2Total).toBe('500000000000.00')

    const lines: DraftLine[] = [
      { description: 'Batch A', quantity: '100000', unit: 'pcs', unitPrice: '6000000.00' },
      { description: 'Batch B', quantity: '100000', unit: 'pcs', unitPrice: '5000000.00' },
    ]
    const totals = calculateQuotationTotals(lines, '0.00', '0.00')
    expect(totals.subtotal).toBe('1100000000000.00')
    expect(totals.isSubtotalValid).toBe(false)
    expect(totals.subtotalError).toContain('Subtotal exceeds maximum allowable limit of RM 999999999999.99')
    expect(totals.discountedSubtotal).toBeNull()
    expect(totals.taxAmount).toBeNull()
    expect(totals.grandTotal).toBeNull()
    expect(totals.provisional).toBe(true)

    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'WhatsApp',
      lines,
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }
    const readiness = evaluateSendReadiness(input, totals)
    expect(readiness.isReady).toBe(false)
    expect(readiness.issues.some((i) => i.includes('Subtotal exceeds maximum allowable limit'))).toBe(true)
  })

  it('rejects grand total when tax pushes the grand total over 999999999999.99', () => {
    // Line: 100000 * 9500000.00 = 950,000,000,000.00 (<= 999999999999.99, valid)
    // Tax: 10.00% -> 95,000,000,000.00 (<= 999999999999.99, valid)
    // Grand total: 950,000,000,000.00 + 95,000,000,000.00 = 1,045,000,000,000.00 > 999999999999.99!
    const lines: DraftLine[] = [
      { description: 'High-value fleet', quantity: '100000', unit: 'pcs', unitPrice: '9500000.00' },
    ]
    const totals = calculateQuotationTotals(lines, '0.00', '10.00')
    expect(totals.isSubtotalValid).toBe(true)
    expect(totals.subtotal).toBe('950000000000.00')
    expect(totals.discountedSubtotal).toBe('950000000000.00')
    expect(totals.isTaxAmountValid).toBe(true)
    expect(totals.taxAmount).toBe('95000000000.00')
    expect(totals.isGrandTotalValid).toBe(false)
    expect(totals.grandTotal).toBeNull()
    expect(totals.grandTotalError).toContain('Grand total exceeds maximum allowable limit of RM 999999999999.99')
    expect(totals.provisional).toBe(true)

    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'WhatsApp',
      lines,
      discountAmount: '0.00',
      taxRate: '10.00',
      notes: '',
    }
    const readiness = evaluateSendReadiness(input, totals)
    expect(readiness.isReady).toBe(false)
    expect(readiness.issues.some((i) => i.includes('Grand total exceeds maximum allowable limit'))).toBe(true)
  })

  it('accepts values exactly at the permitted boundary of 999999999999.99', () => {
    // qty: 1000000.100 (<= 9999999.999), unitPrice: 999999.90 (<= 9999999.99)
    // 1000000.100 * 999999.90 = 999999999999.99 exactly
    expect(doesLineTotalExceedLimit('1000000.100', '999999.90')).toBe(false)
    const lineTotal = calculateLineTotal('1000000.100', '999999.90', 'Boundary Item', 'pcs')
    expect(lineTotal).toBe('999999999999.99')

    const lines: DraftLine[] = [
      { description: 'Boundary Item', quantity: '1000000.100', unit: 'pcs', unitPrice: '999999.90' },
    ]
    const totals = calculateQuotationTotals(lines, '0.00', '0.00', {
      customerId: 'C-01',
      dueDate: '2026-09-15',
      sourceNote: 'Direct inquiry',
    })

    expect(totals.subtotal).toBe('999999999999.99')
    expect(totals.isSubtotalValid).toBe(true)
    expect(totals.subtotalError).toBeUndefined()
    expect(totals.discountedSubtotal).toBe('999999999999.99')
    expect(totals.taxAmount).toBe('0.00')
    expect(totals.isTaxAmountValid).toBe(true)
    expect(totals.grandTotal).toBe('999999999999.99')
    expect(totals.isGrandTotalValid).toBe(true)
    expect(totals.grandTotalError).toBeUndefined()
    expect(totals.provisional).toBe(false)

    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'Direct inquiry',
      lines,
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }
    const readiness = evaluateSendReadiness(input, totals)
    expect(readiness.isReady).toBe(true)
    expect(readiness.issues).toEqual([])
  })
})
