import type { QuotationView } from '../../quotations/domain/types'
import type {
  JobCommercialLineSnapshot,
  JobCommercialSnapshot,
  JobCustomerProjection,
  JobLineView,
  JobRecord,
  JobView,
} from './types'

/**
 * Creates an immutable deep copy of an accepted quotation's commercial snapshot
 * and instantiates the initial JobRecord in pending/preparation state.
 */
export function createJobFromAcceptedQuotation(
  quotation: QuotationView,
  nextJobId: string,
  nowUtc: string = new Date().toISOString(),
): { jobRecord: JobRecord; jobView: JobView } {
  const lines: JobLineView[] = quotation.lines.map((l) => ({
    description: l.description,
    quantity: l.quantity ?? '1',
    unit: l.unit || 'pcs',
  }))

  const commercialLines: JobCommercialLineSnapshot[] = quotation.lines.map((l, idx) => ({
    sourceLineIndex: idx,
    description: l.description,
    quantity: l.quantity ?? '1',
    unit: l.unit || 'pcs',
    unitPrice: l.unitPrice,
    lineTotal: quotation.lineTotals[idx] ?? null,
  }))

  const snapshot: JobCommercialSnapshot = {
    sourceQuotationId: quotation.id,
    sourceFamilyId: quotation.familyId,
    sourceRevision: quotation.revision,
    customerId: quotation.customerId,
    customerName: quotation.customerName,
    dueDate: quotation.dueDate ?? '',
    sourceNote: quotation.sourceNote,
    notes: quotation.notes,
    lines: commercialLines,
    subtotal: quotation.totals.subtotal,
    discountAmount: quotation.totals.discountAmount,
    taxRate: quotation.totals.taxRate,
    taxAmount: quotation.totals.taxAmount,
    grandTotal: quotation.totals.grandTotal,
  }

  const customer: JobCustomerProjection | null = quotation.customerName
    ? {
        id: quotation.customerId || 'C-UNKNOWN',
        displayName: quotation.customerName,
      }
    : null

  const jobRecord: JobRecord = {
    id: nextJobId,
    number: nextJobId,
    version: 1,
    createdAt: nowUtc,
    status: 'pending',
    stage: 'preparation',
    dueDate: quotation.dueDate ?? '',
    deliveryStatus: 'not_ready',
    lines,
    customer,
    sourceQuotationId: quotation.id,
    provenance: 'quotation_conversion',
    snapshot,
  }

  const jobView = projectJobView(jobRecord)
  return { jobRecord, jobView }
}

/**
 * Projects an internal JobRecord to a public JobView matching SDD § 5.
 * Strictly excludes all commercial/financial data (unitPrice, totals, etc.).
 */
export function projectJobView(
  record: JobRecord,
  options?: { hasContactsView?: boolean; hasQuotationsView?: boolean },
): JobView {
  const hasContactsView = options?.hasContactsView ?? true
  const hasQuotationsView = options?.hasQuotationsView ?? true

  return {
    id: record.id,
    number: record.number,
    version: record.version,
    createdAt: record.createdAt,
    status: record.status,
    stage: record.stage,
    dueDate: record.dueDate,
    deliveryStatus: record.deliveryStatus,
    lines: record.lines.map((l) => ({ ...l })),
    customer: hasContactsView && record.customer ? { ...record.customer } : null,
    sourceQuotationId: hasQuotationsView ? record.sourceQuotationId : null,
  }
}
