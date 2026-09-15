import { describe, expect, it } from 'vitest'
import {
  applyJobStageChange,
  applyJobTransition,
  canChangeJobStage,
  canTransitionJob,
  isBackwardStageMove,
  validateReason,
} from './transitions'
import type { JobRecord } from './types'

function makeTestJob(overrides?: Partial<JobRecord>): JobRecord {
  return {
    id: 'J-1049',
    number: 'J-1049',
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    status: 'pending',
    stage: 'preparation',
    dueDate: '2026-09-15',
    deliveryStatus: 'not_ready',
    lines: [{ description: 'Custom T-shirts', quantity: '50', unit: 'pcs' }],
    customer: { id: 'C-01', displayName: 'Meridian Studio' },
    sourceQuotationId: 'Q-3028',
    provenance: 'quotation_conversion',
    snapshot: null,
    ...overrides,
  }
}

describe('Job transitions engine (SDD § 4/5, AT-03)', () => {
  describe('validateReason', () => {
    it('accepts trimmed string 1-500 chars', () => {
      expect(validateReason('  Valid reason  ')).toBe('Valid reason')
      const maxLen = 'a'.repeat(500)
      expect(validateReason(maxLen)).toBe(maxLen)
    })

    it('rejects empty or whitespace-only reason', () => {
      expect(() => validateReason('')).toThrowError(/is required and cannot be blank/)
      expect(() => validateReason('   ')).toThrowError(/is required and cannot be blank/)
      expect(() => validateReason(undefined)).toThrowError(/is required and cannot be blank/)
    })

    it('rejects reasons longer than 500 characters', () => {
      const tooLong = 'a'.repeat(501)
      expect(() => validateReason(tooLong)).toThrowError(/exceeds maximum of 500 characters/)
    })
  })

  describe('isBackwardStageMove', () => {
    it('correctly identifies forward and backward stage transitions', () => {
      expect(isBackwardStageMove('preparation', 'production')).toBe(false)
      expect(isBackwardStageMove('preparation', 'packing')).toBe(false)
      expect(isBackwardStageMove('production', 'quality_check')).toBe(false)
      expect(isBackwardStageMove('quality_check', 'packing')).toBe(false)

      expect(isBackwardStageMove('packing', 'quality_check')).toBe(true)
      expect(isBackwardStageMove('packing', 'preparation')).toBe(true)
      expect(isBackwardStageMove('quality_check', 'production')).toBe(true)
      expect(isBackwardStageMove('production', 'preparation')).toBe(true)
    })
  })

  describe('applyJobTransition', () => {
    it('starts a pending job into in_production (retaining preparation stage and not_ready delivery)', () => {
      const job = makeTestJob({ status: 'pending', stage: 'preparation' })
      expect(canTransitionJob(job, 'start')).toBe(true)

      const { updatedJob } = applyJobTransition(job, { expectedVersion: 1, action: 'start' }, 2)
      expect(updatedJob.status).toBe('in_production')
      expect(updatedJob.stage).toBe('preparation')
      expect(updatedJob.deliveryStatus).toBe('not_ready')
      expect(updatedJob.version).toBe(2)
    })

    it('rejects start from non-pending status', () => {
      const job = makeTestJob({ status: 'in_production' })
      expect(canTransitionJob(job, 'start')).toBe(false)
      expect(() => applyJobTransition(job, { expectedVersion: 1, action: 'start' }, 2)).toThrowError(
        /Cannot start job from status "in_production"/,
      )
    })

    it('marks ready only when in_production AND stage is packing', () => {
      const jobNotPacking = makeTestJob({ status: 'in_production', stage: 'production' })
      expect(canTransitionJob(jobNotPacking, 'ready')).toBe(false)
      expect(() => applyJobTransition(jobNotPacking, { expectedVersion: 1, action: 'ready' }, 2)).toThrowError(
        /Packing stage is required before ready/,
      )

      const jobPacking = makeTestJob({ status: 'in_production', stage: 'packing' })
      expect(canTransitionJob(jobPacking, 'ready')).toBe(true)
      const { updatedJob } = applyJobTransition(jobPacking, { expectedVersion: 1, action: 'ready' }, 2)
      expect(updatedJob.status).toBe('ready_for_delivery')
      expect(updatedJob.deliveryStatus).toBe('ready')
    })

    it('delivers a ready_for_delivery job without payment gate', () => {
      const job = makeTestJob({ status: 'ready_for_delivery', stage: 'packing', deliveryStatus: 'ready' })
      expect(canTransitionJob(job, 'deliver')).toBe(true)

      const { updatedJob } = applyJobTransition(job, { expectedVersion: 1, action: 'deliver' }, 2)
      expect(updatedJob.status).toBe('delivered')
      expect(updatedJob.deliveryStatus).toBe('delivered')
    })

    it('rejects deliver from other statuses', () => {
      const job = makeTestJob({ status: 'in_production' })
      expect(canTransitionJob(job, 'deliver')).toBe(false)
      expect(() => applyJobTransition(job, { expectedVersion: 1, action: 'deliver' }, 2)).toThrowError(
        /Job must be ready for delivery/,
      )
    })

    it('cancels pending or in_production job with valid reason', () => {
      const pendingJob = makeTestJob({ status: 'pending' })
      const { updatedJob: c1, validatedReason: r1 } = applyJobTransition(
        pendingJob,
        { expectedVersion: 1, action: 'cancel', reason: 'Customer changed mind' },
        2,
      )
      expect(c1.status).toBe('cancelled')
      expect(c1.deliveryStatus).toBe('not_applicable')
      expect(r1).toBe('Customer changed mind')

      const inProdJob = makeTestJob({ status: 'in_production', stage: 'production' })
      const { updatedJob: c2 } = applyJobTransition(
        inProdJob,
        { expectedVersion: 1, action: 'cancel', reason: 'Defective raw materials' },
        2,
      )
      expect(c2.status).toBe('cancelled')
      expect(c2.stage).toBe('production') // stage retained!
      expect(c2.deliveryStatus).toBe('not_applicable')
    })

    it('rejects cancel without valid reason', () => {
      const job = makeTestJob({ status: 'pending' })
      expect(() => applyJobTransition(job, { expectedVersion: 1, action: 'cancel', reason: '' }, 2)).toThrowError(
        /Cancellation reason is required/,
      )
    })

    it('rejects cancel on ready_for_delivery or delivered jobs', () => {
      const readyJob = makeTestJob({ status: 'ready_for_delivery' })
      expect(canTransitionJob(readyJob, 'cancel')).toBe(false)
      expect(() =>
        applyJobTransition(readyJob, { expectedVersion: 1, action: 'cancel', reason: 'Late cancel' }, 2),
      ).toThrowError(/Cannot cancel job with status "ready_for_delivery"/)
    })

    it('rejects transitions on stale version', () => {
      const job = makeTestJob({ status: 'pending', version: 3 })
      try {
        applyJobTransition(job, { expectedVersion: 2, action: 'start' }, 4)
        expect.unreachable()
      } catch (err: any) {
        expect(err.code).toBe('STALE_VERSION')
      }
    })
  })

  describe('applyJobStageChange', () => {
    it('allows forward stage changes without reason', () => {
      const job = makeTestJob({ status: 'in_production', stage: 'preparation' })
      expect(canChangeJobStage(job, 'production')).toBe(true)

      const { updatedJob } = applyJobStageChange(job, { expectedVersion: 1, target: 'production' }, 2)
      expect(updatedJob.stage).toBe('production')
    })

    it('allows forward skipping stage without implying intermediate checks occurred', () => {
      const job = makeTestJob({ status: 'in_production', stage: 'preparation' })
      const { updatedJob } = applyJobStageChange(job, { expectedVersion: 1, target: 'packing' }, 2)
      expect(updatedJob.stage).toBe('packing')
    })

    it('requires rework reason on backward stage transition', () => {
      const job = makeTestJob({ status: 'in_production', stage: 'quality_check' })

      // Missing reason
      expect(() =>
        applyJobStageChange(job, { expectedVersion: 1, target: 'production' }, 2),
      ).toThrowError(/Rework reason is required/)

      // Blank reason
      expect(() =>
        applyJobStageChange(job, { expectedVersion: 1, target: 'production', reason: '   ' }, 2),
      ).toThrowError(/Rework reason is required/)

      // Valid reason
      const { updatedJob, validatedReason } = applyJobStageChange(
        job,
        { expectedVersion: 1, target: 'production', reason: 'Color mismatch on sleeve' },
        2,
      )
      expect(updatedJob.stage).toBe('production')
      expect(validatedReason).toBe('Color mismatch on sleeve')
    })

    it('rejects stage change when same stage', () => {
      const job = makeTestJob({ status: 'in_production', stage: 'production' })
      expect(canChangeJobStage(job, 'production')).toBe(false)
      expect(() => applyJobStageChange(job, { expectedVersion: 1, target: 'production' }, 2)).toThrowError(
        /already in "production" stage/,
      )
    })

    it('rejects stage change when job is not in_production', () => {
      const pendingJob = makeTestJob({ status: 'pending' })
      expect(canChangeJobStage(pendingJob, 'production')).toBe(false)
      expect(() =>
        applyJobStageChange(pendingJob, { expectedVersion: 1, target: 'production' }, 2),
      ).toThrowError(/Stage changes are only allowed while in production/)

      const readyJob = makeTestJob({ status: 'ready_for_delivery' })
      expect(() =>
        applyJobStageChange(readyJob, { expectedVersion: 1, target: 'preparation' }, 2),
      ).toThrowError(/Stage changes are only allowed while in production/)
    })
  })
})
