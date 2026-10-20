import { describe, expect, it } from 'vitest'
import { validateDraftQuotation } from './validation'
import type { QuotationInput } from './types'

describe('validateDraftQuotation', () => {
  it('allows valid complete draft input', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'WhatsApp, 28 Aug',
      lines: [
        { description: 'Polo shirts', quantity: '50', unit: 'pcs', unitPrice: '18.00' },
      ],
      discountAmount: '10.00',
      taxRate: '6.00',
      notes: 'Customer requested navy blue',
    }

    const result = validateDraftQuotation(input, '900.00')
    expect(result.isValid).toBe(true)
    expect(result.summaryErrors.length).toBe(0)
  })

  it('allows saving an incomplete draft as long as values are not invalid', () => {
    const incompleteInput: QuotationInput = {
      customerId: null,
      customerName: '',
      dueDate: null,
      sourceNote: '',
      lines: [
        { description: 'Draft line', quantity: null, unit: 'pcs', unitPrice: null },
      ],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }

    const result = validateDraftQuotation(incompleteInput, '0.00')
    expect(result.isValid).toBe(true)
    expect(result.summaryErrors.length).toBe(0)
  })

  it('allows saving an incomplete draft with empty lines array', () => {
    const emptyLinesInput: QuotationInput = {
      customerId: null,
      customerName: '',
      dueDate: null,
      sourceNote: '',
      lines: [],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }

    const result = validateDraftQuotation(emptyLinesInput, '0.00')
    expect(result.isValid).toBe(true)
    expect(result.summaryErrors.length).toBe(0)
  })

  it('rejects discount that exceeds subtotal', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: '',
      lines: [
        { description: 'Sample', quantity: '1', unit: 'pcs', unitPrice: '50.00' },
      ],
      discountAmount: '55.00',
      taxRate: '0.00',
      notes: '',
    }

    const result = validateDraftQuotation(input, '50.00')
    expect(result.isValid).toBe(false)
    expect(result.fieldErrors.discountAmount).toContain('cannot exceed the subtotal')
    expect(result.summaryErrors).toContain('Discount cannot exceed the subtotal')
  })

  it('rejects negative quantity or unit price and excess precision', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: '',
      lines: [
        { description: 'Invalid item', quantity: '-5', unit: 'pcs', unitPrice: '10.005' },
      ],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }

    const result = validateDraftQuotation(input, '0.00')
    expect(result.isValid).toBe(false)
    expect(result.fieldErrors.lines?.[0]?.quantity).toBeDefined()
    expect(result.fieldErrors.lines?.[0]?.unitPrice).toBeDefined()
  })

  it('rejects tax rate out of 0.00 to 100.00 range', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: '',
      lines: [],
      discountAmount: '0.00',
      taxRate: '105.00',
      notes: '',
    }

    const result = validateDraftQuotation(input, '0.00')
    expect(result.isValid).toBe(false)
    expect(result.fieldErrors.taxRate).toContain('between 0.00% and 100.00%')
  })

  it('rejects input with more than 200 lines per SDD § 4', () => {
    const lines201 = Array.from({ length: 201 }, (_, i) => ({
      description: `Line ${i + 1}`,
      quantity: '1',
      unit: 'pcs',
      unitPrice: '1.00',
    }))
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: '',
      lines: lines201,
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }

    const result = validateDraftQuotation(input, '201.00')
    expect(result.isValid).toBe(false)
    expect(result.summaryErrors.some((e) => e.includes('cannot exceed 200 lines'))).toBe(true)
  })

  it('rejects SDD numeric limit overflows (max qty 9999999.999, max unit price 9999999.99, max discount 999999999999.99)', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: '',
      lines: [
        { description: 'Overflow item', quantity: '10000000', unit: 'pcs', unitPrice: '10000000.00' },
      ],
      discountAmount: '1000000000000.00',
      taxRate: '0.00',
      notes: '',
    }

    const result = validateDraftQuotation(input, '0.00')
    expect(result.isValid).toBe(false)
    expect(result.fieldErrors.lines?.[0]?.quantity).toContain('Quantity cannot exceed')
    expect(result.fieldErrors.lines?.[0]?.unitPrice).toContain('Unit price cannot exceed')
    expect(result.fieldErrors.discountAmount).toContain('Discount exceeds maximum allowable limit')
  })

  it('rejects calculated line total when valid quantity and unit price product exceeds 999999999999.99', () => {
    // qty: 1000000 (<= 9999999.999), unitPrice: 1000000.00 (<= 9999999.99)
    // product: 1,000,000,000,000.00 > 999999999999.99
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: '',
      lines: [
        { description: 'Exceeds line total limit', quantity: '1000000', unit: 'pcs', unitPrice: '1000000.00' },
      ],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }

    const result = validateDraftQuotation(input, '0.00')
    expect(result.isValid).toBe(false)
    expect(result.fieldErrors.lines?.[0]?.lineTotal).toContain('Line total exceeds maximum allowable limit of RM 999999999999.99')
    expect(result.summaryErrors.some((e) => e.includes('Line 1: Line total exceeds maximum allowable limit'))).toBe(true)
  })

  it('rejects subtotal when individually valid line totals sum to exceed 999999999999.99', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: '',
      lines: [
        { description: 'Batch 1', quantity: '100000', unit: 'pcs', unitPrice: '6000000.00' },
        { description: 'Batch 2', quantity: '100000', unit: 'pcs', unitPrice: '5000000.00' },
      ],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }

    const result = validateDraftQuotation(input, '1100000000000.00')
    expect(result.isValid).toBe(false)
    expect(result.summaryErrors.some((e) => e.includes('Subtotal exceeds maximum allowable limit of RM 999999999999.99'))).toBe(true)
  })

  it('rejects grand total when tax pushes the grand total over 999999999999.99', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: '',
      lines: [
        { description: 'Batch 1', quantity: '100000', unit: 'pcs', unitPrice: '9500000.00' },
      ],
      discountAmount: '0.00',
      taxRate: '10.00',
      notes: '',
    }

    const result = validateDraftQuotation(input, '950000000000.00')
    expect(result.isValid).toBe(false)
    expect(result.summaryErrors.some((e) => e.includes('Grand total exceeds maximum allowable limit of RM 999999999999.99'))).toBe(true)
  })

  it('accepts values exactly at the permitted boundary of 999999999999.99', () => {
    const input: QuotationInput = {
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: '',
      lines: [
        { description: 'Boundary Item', quantity: '1000000.100', unit: 'pcs', unitPrice: '999999.90' },
      ],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    }

    const result = validateDraftQuotation(input, '999999999999.99')
    expect(result.isValid).toBe(true)
    expect(result.summaryErrors).toEqual([])
  })
})
