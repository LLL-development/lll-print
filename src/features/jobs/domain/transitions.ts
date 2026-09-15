import { assertValidExpectedVersion, OperationError } from '../../../adapters/requestResults'
import type { ChangeJobStageBody, JobAction, JobRecord, JobStatus, Stage, TransitionJobBody } from './types'

export const STAGE_ORDER: readonly Stage[] = ['preparation', 'production', 'quality_check', 'packing'] as const

export function getStageIndex(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage)
}

export function isBackwardStageMove(from: Stage, to: Stage): boolean {
  return getStageIndex(to) < getStageIndex(from)
}

export function validateReason(reason?: string, fieldName = 'Reason'): string {
  const trimmed = (reason || '').trim()
  if (!trimmed) {
    throw new OperationError('VALIDATION_FAILED', `${fieldName} is required and cannot be blank.`)
  }
  if (trimmed.length > 500) {
    throw new OperationError('VALIDATION_FAILED', `${fieldName} exceeds maximum of 500 characters.`)
  }
  return trimmed
}

export function canTransitionJob(job: JobRecord, action: JobAction): boolean {
  switch (action) {
    case 'start':
      return job.status === 'pending'
    case 'ready':
      return job.status === 'in_production' && job.stage === 'packing'
    case 'deliver':
      return job.status === 'ready_for_delivery'
    case 'cancel':
      return job.status === 'pending' || job.status === 'in_production'
    default:
      return false
  }
}

export function canChangeJobStage(job: JobRecord, target: Stage): boolean {
  if (job.status !== 'in_production') return false
  return job.stage !== target
}

export function applyJobTransition(
  job: JobRecord,
  body: TransitionJobBody,
  newVersion: number,
): { updatedJob: JobRecord; validatedReason: string | null } {
  assertValidExpectedVersion(body.expectedVersion)
  if (body.expectedVersion !== job.version) {
    throw new OperationError(
      'STALE_VERSION',
      `Job has been modified (expected version ${body.expectedVersion}, current version ${job.version}). Please refresh and review.`,
    )
  }

  let nextStatus: JobStatus
  let nextDelivery = job.deliveryStatus
  let validatedReason: string | null = null

  switch (body.action) {
    case 'start': {
      if (job.status !== 'pending') {
        throw new OperationError(
          'INVALID_TRANSITION',
          `Cannot start job from status "${job.status}". Must be pending.`,
        )
      }
      nextStatus = 'in_production'
      nextDelivery = 'not_ready'
      break
    }
    case 'ready': {
      if (job.status !== 'in_production') {
        throw new OperationError(
          'INVALID_TRANSITION',
          `Cannot mark job ready from status "${job.status}". Job must be in production.`,
        )
      }
      if (job.stage !== 'packing') {
        throw new OperationError(
          'INVALID_TRANSITION',
          `Cannot mark job ready for delivery while in "${job.stage}" stage. Packing stage is required before ready.`,
        )
      }
      nextStatus = 'ready_for_delivery'
      nextDelivery = 'ready'
      break
    }
    case 'deliver': {
      if (job.status !== 'ready_for_delivery') {
        throw new OperationError(
          'INVALID_TRANSITION',
          `Cannot deliver job from status "${job.status}". Job must be ready for delivery.`,
        )
      }
      nextStatus = 'delivered'
      nextDelivery = 'delivered'
      break
    }
    case 'cancel': {
      if (job.status !== 'pending' && job.status !== 'in_production') {
        throw new OperationError(
          'INVALID_TRANSITION',
          `Cannot cancel job with status "${job.status}". Only pending or in-production jobs may be cancelled.`,
        )
      }
      validatedReason = validateReason(body.reason, 'Cancellation reason')
      nextStatus = 'cancelled'
      nextDelivery = 'not_applicable'
      break
    }
    default:
      throw new OperationError('INVALID_REQUEST', `Unknown job action: "${body.action}"`)
  }

  const updatedJob: JobRecord = {
    ...job,
    status: nextStatus,
    deliveryStatus: nextDelivery,
    version: newVersion,
  }

  return { updatedJob, validatedReason }
}

export function applyJobStageChange(
  job: JobRecord,
  body: ChangeJobStageBody,
  newVersion: number,
): { updatedJob: JobRecord; validatedReason: string | null } {
  assertValidExpectedVersion(body.expectedVersion)
  if (body.expectedVersion !== job.version) {
    throw new OperationError(
      'STALE_VERSION',
      `Job has been modified (expected version ${body.expectedVersion}, current version ${job.version}). Please refresh and review.`,
    )
  }

  if (job.status !== 'in_production') {
    throw new OperationError(
      'INVALID_TRANSITION',
      `Cannot change stage when job is in status "${job.status}". Stage changes are only allowed while in production.`,
    )
  }

  if (!STAGE_ORDER.includes(body.target)) {
    throw new OperationError('INVALID_REQUEST', `Invalid stage target: "${body.target}"`)
  }

  if (job.stage === body.target) {
    throw new OperationError('INVALID_TRANSITION', `Job is already in "${body.target}" stage.`)
  }

  let validatedReason: string | null = null
  if (isBackwardStageMove(job.stage, body.target)) {
    validatedReason = validateReason(body.reason, 'Rework reason')
  } else if (body.reason && body.reason.trim()) {
    validatedReason = validateReason(body.reason, 'Stage reason')
  }

  const updatedJob: JobRecord = {
    ...job,
    stage: body.target,
    version: newVersion,
  }

  return { updatedJob, validatedReason }
}
