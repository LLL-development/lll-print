import { describe, expect, it } from 'vitest'
import {
  assertCanConvertQuotation,
  assertCanEditQuotation,
  assertCanReviseQuotation,
  assertCanTransitionQuotation,
  canConvertQuotation,
  canEditQuotation,
  canReviseQuotation,
  canTransitionQuotation,
} from './lifecycle'
import type { QuotationFamilyRecord, QuotationView, SendReadinessResult } from './types'

function makeTestQuote(overrides?: Partial<QuotationView>): QuotationView {
  return {
    id: 'Q-3028',
    familyId: 'QF-3028',
    version: 1,
    revision: 1,
    number: 'Q-3028',
    previousRevisionId: null,
    isLatest: true,
    status: 'draft',
    jobId: null,
    customerId: 'C-01',
    customerName: 'Meridian Studio',
    dueDate: '2026-09-15',
    sourceNote: 'WhatsApp',
    lines: [
      {
        description: 'Polo shirts',
        quantity: '50',
        unit: 'pcs',
        unitPrice: '30.00',
      },
    ],
    lineTotals: ['1500.00'],
    totals: {
      subtotal: '1500.00',
      discountAmount: '0.00',
      discountedSubtotal: '1500.00',
      taxRate: '0.00',
      taxAmount: '0.00',
      grandTotal: '1500.00',
      provisional: false,
    },
    notes: '',
    createdAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTestFamily(overrides?: Partial<QuotationFamilyRecord>): QuotationFamilyRecord {
  return {
    id: 'QF-3028',
    latestRevisionId: 'Q-3028',
    convertedJobId: null,
    version: 1,
    ...overrides,
  }
}

const readyState: SendReadinessResult = { isReady: true, issues: [] }
const unreadyState: SendReadinessResult = { isReady: false, issues: ['Missing customer', 'Lines empty'] }

describe('Quotation lifecycle rules (SDD § 4/5, FR-2, FR-3, AT-02)', () => {
  describe('canEditQuotation & assertCanEditQuotation', () => {
    it('permits editing latest draft in unconverted family with matching version', () => {
      const quote = makeTestQuote({ status: 'draft', isLatest: true })
      const family = makeTestFamily({ latestRevisionId: quote.id, convertedJobId: null, version: 1 })

      expect(canEditQuotation(quote, family)).toBe(true)
      expect(() => assertCanEditQuotation(quote, family, 1)).not.toThrow()
    })

    it('rejects editing non-draft status', () => {
      const quote = makeTestQuote({ status: 'sent' })
      const family = makeTestFamily()
      expect(canEditQuotation(quote, family)).toBe(false)
      expect(() => assertCanEditQuotation(quote, family, 1)).toThrowError(/Only draft quotations can be edited/)
    })

    it('rejects editing older revision when newer revision exists', () => {
      const quote = makeTestQuote({ isLatest: false })
      const family = makeTestFamily({ latestRevisionId: 'Q-3029' })
      expect(canEditQuotation(quote, family)).toBe(false)
      expect(() => assertCanEditQuotation(quote, family, 1)).toThrowError(/Only the latest revision/)
    })

    it('rejects editing converted family', () => {
      const quote = makeTestQuote({ status: 'draft' })
      const family = makeTestFamily({ convertedJobId: 'J-1049' })
      expect(canEditQuotation(quote, family)).toBe(false)
      expect(() => assertCanEditQuotation(quote, family, 1)).toThrowError(/already been converted/)
    })

    it('rejects editing on stale version mismatch', () => {
      const quote = makeTestQuote({ status: 'draft' })
      const family = makeTestFamily({ version: 2 })
      expect(() => assertCanEditQuotation(quote, family, 1)).toThrowError(/expected version 1, current version 2/)
    })
  })

  describe('canTransitionQuotation & assertCanTransitionQuotation', () => {
    it('permits send when draft is ready, latest, and unconverted', () => {
      const quote = makeTestQuote({ status: 'draft' })
      const family = makeTestFamily()
      expect(canTransitionQuotation(quote, family, 'send', readyState)).toBe(true)
      expect(() => assertCanTransitionQuotation(quote, family, 'send', 1, readyState)).not.toThrow()
    })

    it('rejects send when quotation is not ready', () => {
      const quote = makeTestQuote({ status: 'draft' })
      const family = makeTestFamily()
      expect(canTransitionQuotation(quote, family, 'send', unreadyState)).toBe(false)
      expect(() => assertCanTransitionQuotation(quote, family, 'send', 1, unreadyState)).toThrowError(
        /not ready to be sent/,
      )
    })

    it('rejects send when already sent or accepted', () => {
      const quote = makeTestQuote({ status: 'sent' })
      const family = makeTestFamily()
      expect(canTransitionQuotation(quote, family, 'send', readyState)).toBe(false)
      expect(() => assertCanTransitionQuotation(quote, family, 'send', 1, readyState)).toThrowError(
        /Must be in draft status/,
      )
    })

    it('permits accept and decline from sent status only', () => {
      const quote = makeTestQuote({ status: 'sent' })
      const family = makeTestFamily()

      expect(canTransitionQuotation(quote, family, 'accept')).toBe(true)
      expect(canTransitionQuotation(quote, family, 'decline')).toBe(true)

      expect(() => assertCanTransitionQuotation(quote, family, 'accept', 1)).not.toThrow()
      expect(() => assertCanTransitionQuotation(quote, family, 'decline', 1)).not.toThrow()
    })

    it('rejects accept from draft status', () => {
      const quote = makeTestQuote({ status: 'draft' })
      const family = makeTestFamily()
      expect(canTransitionQuotation(quote, family, 'accept')).toBe(false)
      expect(() => assertCanTransitionQuotation(quote, family, 'accept', 1)).toThrowError(
        /Must be in sent status/,
      )
    })

    it('rejects accept/decline on stale version', () => {
      const quote = makeTestQuote({ status: 'sent' })
      const family = makeTestFamily({ version: 3 })
      try {
        assertCanTransitionQuotation(quote, family, 'accept', 2)
        expect.unreachable()
      } catch (err: any) {
        expect(err.code).toBe('STALE_VERSION')
      }
    })
  })

  describe('canReviseQuotation & assertCanReviseQuotation', () => {
    it('permits revising sent, accepted, or declined latest revision', () => {
      const family = makeTestFamily()
      for (const status of ['sent', 'accepted', 'declined'] as const) {
        const quote = makeTestQuote({ status })
        expect(canReviseQuotation(quote, family)).toBe(true)
        expect(() => assertCanReviseQuotation(quote, family, 1)).not.toThrow()
      }
    })

    it('rejects revising a draft (draft can simply be edited)', () => {
      const quote = makeTestQuote({ status: 'draft' })
      const family = makeTestFamily()
      expect(canReviseQuotation(quote, family)).toBe(false)
      expect(() => assertCanReviseQuotation(quote, family, 1)).toThrowError(/Must be sent, accepted, or declined/)
    })

    it('rejects revising non-latest revision or converted family', () => {
      const quote = makeTestQuote({ status: 'accepted', isLatest: false })
      const family = makeTestFamily({ latestRevisionId: 'Q-3029' })
      expect(canReviseQuotation(quote, family)).toBe(false)
      expect(() => assertCanReviseQuotation(quote, family, 1)).toThrowError(/Only the latest revision/)

      const quoteLatest = makeTestQuote({ status: 'accepted', isLatest: true })
      const convertedFamily = makeTestFamily({ convertedJobId: 'J-1049' })
      expect(canReviseQuotation(quoteLatest, convertedFamily)).toBe(false)
      expect(() => assertCanReviseQuotation(quoteLatest, convertedFamily, 1)).toThrowError(
        /already been converted/,
      )
    })
  })

  describe('canConvertQuotation & assertCanConvertQuotation', () => {
    it('permits conversion of latest accepted revision in unconverted family', () => {
      const quote = makeTestQuote({ status: 'accepted' })
      const family = makeTestFamily()
      expect(canConvertQuotation(quote, family)).toBe(true)
      expect(() => assertCanConvertQuotation(quote, family, 1)).not.toThrow()
    })

    it('rejects conversion of draft, sent, or declined quotations', () => {
      const family = makeTestFamily()
      for (const status of ['draft', 'sent', 'declined'] as const) {
        const quote = makeTestQuote({ status })
        expect(canConvertQuotation(quote, family)).toBe(false)
        expect(() => assertCanConvertQuotation(quote, family, 1)).toThrowError(
          /Only accepted quotations can be converted/,
        )
      }
    })

    it('rejects conversion if family is already converted', () => {
      const quote = makeTestQuote({ status: 'accepted' })
      const family = makeTestFamily({ convertedJobId: 'J-1049' })
      expect(canConvertQuotation(quote, family)).toBe(false)
      expect(() => assertCanConvertQuotation(quote, family, 1)).toThrowError(
        /Duplicate conversion is prohibited/,
      )
    })

    it('rejects conversion of older accepted revision if newer revision exists (even draft)', () => {
      // Revision 1 was accepted, but Revision 2 was created as draft
      const rev1 = makeTestQuote({ id: 'Q-3028-R1', revision: 1, isLatest: false, status: 'accepted' })
      const family = makeTestFamily({ latestRevisionId: 'Q-3028-R2' })

      expect(canConvertQuotation(rev1, family)).toBe(false)
      expect(() => assertCanConvertQuotation(rev1, family, 1)).toThrowError(
        /Only the latest revision of a quotation family can be converted/,
      )
    })
  })
})
