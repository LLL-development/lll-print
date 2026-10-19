/**
 * Job domain models and DTO contracts matching SDD § 4/5.
 */

export type JobStatus = 'pending' | 'in_production' | 'ready_for_delivery' | 'delivered' | 'cancelled'

export type Stage = 'preparation' | 'production' | 'quality_check' | 'packing'

export type DeliveryStatus = 'not_ready' | 'ready' | 'delivered' | 'not_applicable'

export interface JobLineView {
  description: string
  quantity: string
  unit: string
}

export interface JobCustomerProjection {
  id: string
  displayName: string
}

export interface JobView {
  id: string
  number: string
  version: number
  createdAt: string
  status: JobStatus
  stage: Stage
  dueDate: string
  deliveryStatus: DeliveryStatus
  lines: JobLineView[]
  customer: JobCustomerProjection | null
  sourceQuotationId: string | null
}

export type JobAction = 'start' | 'ready' | 'deliver' | 'cancel'

export interface TransitionJobBody {
  expectedVersion: number
  action: JobAction
  reason?: string
}

export interface ChangeJobStageBody {
  expectedVersion: number
  target: Stage
  reason?: string
}

export interface JobCommercialLineSnapshot {
  sourceLineIndex: number
  description: string
  quantity: string
  unit: string
  unitPrice: string | null
  lineTotal: string | null
}

export interface JobCommercialSnapshot {
  sourceQuotationId: string
  sourceFamilyId: string
  sourceRevision: number
  customerId: string | null
  customerName: string
  dueDate: string
  sourceNote: string
  notes: string
  lines: JobCommercialLineSnapshot[]
  subtotal: string
  discountAmount: string
  taxRate: string
  taxAmount: string | null
  grandTotal: string | null
}

export type JobProvenance = 'quotation_conversion' | 'legacy_prototype'

export interface JobRecord {
  id: string
  number: string
  version: number
  createdAt: string
  status: JobStatus
  stage: Stage
  dueDate: string
  deliveryStatus: DeliveryStatus
  lines: JobLineView[]
  customer: JobCustomerProjection | null
  sourceQuotationId: string | null
  provenance: JobProvenance
  snapshot: JobCommercialSnapshot | null
  legacyMethod?: string
}
