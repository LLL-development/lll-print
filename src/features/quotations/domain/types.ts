/**
 * Quotation domain and boundary contracts matching SDD § 5.
 * Values at boundary use decimal strings; binary floats are prohibited.
 */

/** Monetary decimal string with exactly two decimal places, e.g. "18.00", "1700.00" */
export type Money = string

/** Quantity decimal string with up to three decimal places, e.g. "50", "1.500" */
export type Quantity = string

/** Tax rate percentage string with up to two decimal places, e.g. "0.00", "6.00" */
export type TaxRate = string

/**
 * Full quotation lifecycle status type per SDD § 5 & SRS FR-2.
 * In T3, the system strictly creates and manages 'draft' quotations;
 * lifecycle transitions ('sent', 'accepted', etc.) are deferred to T4.
 */
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'converted_to_job'

export interface DraftLine {
  id?: string
  description: string
  quantity: Quantity | null
  unit: string
  unitPrice: Money | null
}

export interface QuotationTotals {
  subtotal: Money
  discountAmount: Money
  discountedSubtotal: Money | null
  taxRate: TaxRate
  taxAmount: Money | null
  grandTotal: Money | null
  provisional: boolean
  isDiscountValid?: boolean
  isTaxRateValid?: boolean
  isSubtotalValid?: boolean
  isTaxAmountValid?: boolean
  isGrandTotalValid?: boolean
  discountError?: string
  taxRateError?: string
  subtotalError?: string
  taxAmountError?: string
  grandTotalError?: string
}

export interface QuotationInput {
  customerId: string | null
  customerName: string
  dueDate: string | null
  sourceNote: string
  lines: DraftLine[]
  discountAmount: Money
  taxRate: TaxRate
  notes: string
}

export interface QuotationView {
  id: string
  familyId: string
  version: number
  revision: number
  number: string
  previousRevisionId: string | null
  isLatest: boolean
  status: QuotationStatus
  jobId: string | null
  customerId: string | null
  customerName: string
  dueDate: string | null
  sourceNote: string
  lines: DraftLine[]
  lineTotals: (Money | null)[]
  totals: QuotationTotals
  notes: string
  createdAt: string
}

export interface SendReadinessResult {
  isReady: boolean
  issues: string[]
}

export type QuotationAction = 'send' | 'accept' | 'decline'

export interface QuotationFamilyRecord {
  id: string
  latestRevisionId: string
  convertedJobId: string | null
  version: number
}

export interface SaveDraftBody {
  expectedVersion: number
  quotation: QuotationInput
}

export interface TransitionQuotationBody {
  expectedVersion: number
  action: QuotationAction
}

export interface CreateQuotationRevisionBody {
  expectedVersion: number
}

export interface ConvertQuotationBody {
  expectedVersion: number
}
