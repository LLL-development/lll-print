import { OperationError } from '../../../adapters/requestResults'
import type { PrintJob } from '../../../domain/models'
import type { DeliveryStatus, JobRecord, JobStatus, Stage } from './types'

/**
 * Deterministically migrates legacy PrintJob prototype fixtures into standard JobRecord models
 * per SDD § 4/5 & T4_PLAN.md.
 */
export function mapLegacyJobStatus(legacyStatus: PrintJob['status']): {
  status: JobStatus
  stage: Stage
  deliveryStatus: DeliveryStatus
} {
  switch (legacyStatus) {
    case 'Pending':
      return {
        status: 'pending',
        stage: 'preparation',
        deliveryStatus: 'not_ready',
      }
    case 'In Production':
      return {
        status: 'in_production',
        stage: 'production',
        deliveryStatus: 'not_ready',
      }
    case 'Quality Check':
      return {
        status: 'in_production',
        stage: 'quality_check',
        deliveryStatus: 'not_ready',
      }
    case 'Completed':
      return {
        status: 'ready_for_delivery',
        stage: 'packing',
        deliveryStatus: 'ready',
      }
    case 'Cancelled':
      return {
        status: 'cancelled',
        stage: 'preparation',
        deliveryStatus: 'not_applicable',
      }
    default:
      throw new OperationError(
        'VALIDATION_FAILED',
        `Unknown legacy job status: "${legacyStatus}" cannot be migrated.`,
      )
  }
}

export function migrateLegacyJob(legacy: PrintJob): JobRecord {
  const { status, stage, deliveryStatus } = mapLegacyJobStatus(legacy.status)

  return {
    id: legacy.id,
    number: legacy.id,
    version: 1,
    createdAt: '2026-08-25T08:00:00.000Z',
    status,
    stage,
    dueDate: legacy.dueDate,
    deliveryStatus,
    lines: [
      {
        description: legacy.title,
        quantity: String(legacy.quantity),
        unit: 'pcs',
      },
    ],
    customer: legacy.customerName
      ? {
          id: legacy.customerId,
          displayName: legacy.customerName,
        }
      : null,
    sourceQuotationId: null,
    provenance: 'legacy_prototype',
    snapshot: null,
    legacyMethod: legacy.method,
  }
}

export function migrateLegacyJobs(legacyJobs: PrintJob[]): JobRecord[] {
  return legacyJobs.map(migrateLegacyJob)
}
