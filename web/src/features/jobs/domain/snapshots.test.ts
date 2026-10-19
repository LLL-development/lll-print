import { describe, expect, it } from 'vitest'
import type { QuotationView } from '../../quotations/domain/types'
import { createJobFromAcceptedQuotation, projectJobView } from './snapshots'

function makeTestAcceptedQuotation(): QuotationView {
  return {
    id: 'Q-3028',
    familyId: 'QF-3028',
    version: 3,
    revision: 1,
    number: 'Q-3028',
    previousRevisionId: null,
    isLatest: true,
    status: 'accepted',
    jobId: null,
    customerId: 'C-01',
    customerName: 'Meridian Studio',
    dueDate: '2026-09-15',
    sourceNote: 'WhatsApp enquiry',
    lines: [
      {
        description: 'Navy polo shirts batch A',
        quantity: '50',
        unit: 'pcs',
        unitPrice: '30.00',
      },
      {
        description: 'Navy polo shirts batch B',
        quantity: '50',
        unit: 'pcs',
        unitPrice: '30.00',
      },
    ],
    lineTotals: ['1500.00', '1500.00'],
    totals: {
      subtotal: '3000.00',
      discountAmount: '100.00',
      discountedSubtotal: '2900.00',
      taxRate: '6.00',
      taxAmount: '174.00',
      grandTotal: '3074.00',
      provisional: false,
    },
    notes: 'Urgent weekend delivery required',
    createdAt: '2026-08-27T10:00:00.000Z',
  }
}

describe('Job Snapshots and JobView Projections (SDD § 4/5, AT-02)', () => {
  it('creates JobRecord with immutable commercial snapshot from accepted quotation', () => {
    const quote = makeTestAcceptedQuotation()
    const { jobRecord, jobView } = createJobFromAcceptedQuotation(quote, 'J-1049', '2026-09-01T12:00:00.000Z')

    expect(jobRecord.id).toBe('J-1049')
    expect(jobRecord.status).toBe('pending')
    expect(jobRecord.stage).toBe('preparation')
    expect(jobRecord.deliveryStatus).toBe('not_ready')
    expect(jobRecord.version).toBe(1)
    expect(jobRecord.sourceQuotationId).toBe('Q-3028')
    expect(jobRecord.provenance).toBe('quotation_conversion')

    // Preserves both 50-item lines without merging (AT-02)
    expect(jobRecord.lines).toHaveLength(2)
    expect(jobRecord.lines[0]).toEqual({
      description: 'Navy polo shirts batch A',
      quantity: '50',
      unit: 'pcs',
    })
    expect(jobRecord.lines[1]).toEqual({
      description: 'Navy polo shirts batch B',
      quantity: '50',
      unit: 'pcs',
    })

    // Commercial snapshot retains all financials
    expect(jobRecord.snapshot).not.toBeNull()
    expect(jobRecord.snapshot?.subtotal).toBe('3000.00')
    expect(jobRecord.snapshot?.discountAmount).toBe('100.00')
    expect(jobRecord.snapshot?.taxAmount).toBe('174.00')
    expect(jobRecord.snapshot?.grandTotal).toBe('3074.00')
    expect(jobRecord.snapshot?.lines[0].unitPrice).toBe('30.00')
    expect(jobRecord.snapshot?.lines[0].lineTotal).toBe('1500.00')
    expect(jobRecord.snapshot?.notes).toBe('Urgent weekend delivery required')

    // JobView strictly omits financial fields
    expect((jobView as any).subtotal).toBeUndefined()
    expect((jobView as any).grandTotal).toBeUndefined()
    expect((jobView as any).snapshot).toBeUndefined()
    expect((jobView.lines[0] as any).unitPrice).toBeUndefined()
    expect((jobView.lines[0] as any).lineTotal).toBeUndefined()
  })

  it('guarantees deep immutability: mutating quote or view does not mutate stored snapshot', () => {
    const quote = makeTestAcceptedQuotation()
    const { jobRecord, jobView } = createJobFromAcceptedQuotation(quote, 'J-1049')

    // Mutate source quote lines
    quote.lines[0].description = 'MUTATED DESCRIPTION'
    quote.totals.grandTotal = '999999.00'

    // Mutate public jobView lines
    jobView.lines[0].description = 'ANOTHER MUTATION'

    expect(jobRecord.lines[0].description).toBe('Navy polo shirts batch A')
    expect(jobRecord.snapshot?.lines[0].description).toBe('Navy polo shirts batch A')
    expect(jobRecord.snapshot?.grandTotal).toBe('3074.00')
  })

  it('projects customer and quotation IDs as null when corresponding view grants are absent', () => {
    const quote = makeTestAcceptedQuotation()
    const { jobRecord } = createJobFromAcceptedQuotation(quote, 'J-1049')

    const viewWithoutGrants = projectJobView(jobRecord, {
      hasContactsView: false,
      hasQuotationsView: false,
    })

    expect(viewWithoutGrants.customer).toBeNull()
    expect(viewWithoutGrants.sourceQuotationId).toBeNull()
  })
})
