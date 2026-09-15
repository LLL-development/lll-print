import { beforeEach, describe, expect, it } from 'vitest'
import type { QuotationInput } from '../features/quotations/domain/types'
import { MemoryStore } from './memoryStore'

function make50ItemLinesQuotationInput(): QuotationInput {
  return {
    customerId: 'C-01',
    customerName: 'Meridian Studio',
    dueDate: '2026-09-20',
    sourceNote: 'WhatsApp enquiry, 27 Aug',
    lines: [
      {
        description: 'Navy corporate polo shirts - Batch 1',
        quantity: '50',
        unit: 'pcs',
        unitPrice: '30.00',
      },
      {
        description: 'Navy corporate polo shirts - Batch 2',
        quantity: '50',
        unit: 'pcs',
        unitPrice: '30.00',
      },
    ],
    discountAmount: '0.00',
    taxRate: '6.00',
    notes: 'Urgent turnaround requested',
  }
}

describe('T4 Lifecycle Adapter Invariants & Journeys (AT-02, AT-03, SDD § 4/5)', () => {
  let store: MemoryStore

  beforeEach(() => {
    store = new MemoryStore()
  })

  describe('AT-02: Quotation Revisions, Conversion, Concurrency & Idempotency', () => {
    it('executes full journey: draft -> send -> accept -> revise -> accept rev2 -> convert once -> immutable snapshot', () => {
      // 1. Add quotation with two 50-item lines
      const input = make50ItemLinesQuotationInput()
      const q1 = store.addQuotation(input, { requestKey: 'req-add-q1' })

      expect(q1.id).toBe('Q-3029')
      expect(q1.status).toBe('draft')
      expect(q1.revision).toBe(1)
      expect(q1.isLatest).toBe(true)
      expect(q1.totals.subtotal).toBe('3000.00')
      expect(q1.totals.grandTotal).toBe('3180.00')

      // 2. Send externally
      const q1Sent = store.transitionQuotation(
        q1.id,
        { expectedVersion: 1, action: 'send' },
        { requestKey: 'req-send-q1' },
      )
      expect(q1Sent.status).toBe('sent')
      expect(q1Sent.version).toBe(2)

      // 3. Accept externally
      const q1Accepted = store.transitionQuotation(
        q1.id,
        { expectedVersion: 2, action: 'accept' },
        { requestKey: 'req-accept-q1' },
      )
      expect(q1Accepted.status).toBe('accepted')
      expect(q1Accepted.version).toBe(3)

      // 4. Create Revision 2
      const q2Draft = store.createQuotationRevision(
        q1.id,
        { expectedVersion: 3 },
        { requestKey: 'req-rev-q2' },
      )
      expect(q2Draft.id).toBe('Q-3030')
      expect(q2Draft.revision).toBe(2)
      expect(q2Draft.status).toBe('draft')
      expect(q2Draft.isLatest).toBe(true)
      expect(q2Draft.previousRevisionId).toBe('Q-3029')
      expect(q2Draft.version).toBe(4)

      // Older revision (Q-3029) is now marked isLatest: false
      const q1Reload = store.getQuotation(q1.id)!
      expect(q1Reload.isLatest).toBe(false)

      // Invariant check: older accepted revision (Q-3029) cannot convert because newer revision exists!
      expect(() =>
        store.convertQuotationToJob(q1.id, { expectedVersion: 4 }, { requestKey: 'req-convert-old' }),
      ).toThrowError(/Only the latest revision of a quotation family can be converted/)

      // 5. Send and accept Revision 2
      const q2Sent = store.transitionQuotation(
        q2Draft.id,
        { expectedVersion: 4, action: 'send' },
        { requestKey: 'req-send-q2' },
      )
      expect(q2Sent.status).toBe('sent')
      expect(q2Sent.version).toBe(5)

      const q2Accepted = store.transitionQuotation(
        q2Draft.id,
        { expectedVersion: 5, action: 'accept' },
        { requestKey: 'req-accept-q2' },
      )
      expect(q2Accepted.status).toBe('accepted')
      expect(q2Accepted.version).toBe(6)

      // 6. Convert Revision 2 to Job
      const { quotation: convQuote, job: convJob } = store.convertQuotationToJob(
        q2Draft.id,
        { expectedVersion: 6 },
        { requestKey: 'req-convert-q2' },
      )

      expect(convQuote.status).toBe('converted_to_job')
      expect(convQuote.jobId).toBe(convJob.id)
      expect(convQuote.version).toBe(7)

      expect(convJob.id).toBe('J-1049')
      expect(convJob.status).toBe('pending')
      expect(convJob.stage).toBe('preparation')
      expect(convJob.deliveryStatus).toBe('not_ready')
      expect(convJob.sourceQuotationId).toBe('Q-3030')

      // Verifies both 50-item lines are preserved without merging
      expect(convJob.lines).toHaveLength(2)
      expect(convJob.lines[0]).toEqual({
        description: 'Navy corporate polo shirts - Batch 1',
        quantity: '50',
        unit: 'pcs',
      })
      expect(convJob.lines[1]).toEqual({
        description: 'Navy corporate polo shirts - Batch 2',
        quantity: '50',
        unit: 'pcs',
      })

      // Commercial snapshot is stored privately in JobRecord
      const storedJobRecord = store.getJobRecord(convJob.id)!
      expect(storedJobRecord.snapshot).not.toBeNull()
      expect(storedJobRecord.snapshot?.subtotal).toBe('3000.00')
      expect(storedJobRecord.snapshot?.grandTotal).toBe('3180.00')
      expect(storedJobRecord.snapshot?.lines[0].unitPrice).toBe('30.00')
      expect(storedJobRecord.snapshot?.lines[0].lineTotal).toBe('1500.00')

      // 7. Duplicate conversion rejection
      expect(() =>
        store.convertQuotationToJob(q2Draft.id, { expectedVersion: 7 }, { requestKey: 'req-convert-dup' }),
      ).toThrowError(/Duplicate conversion is prohibited/)

      // 8. Converted family cannot be revised or edited
      expect(() =>
        store.createQuotationRevision(q2Draft.id, { expectedVersion: 7 }),
      ).toThrowError(/already been converted/)

      expect(() =>
        store.updateQuotation(q2Draft.id, { expectedVersion: 7, quotation: input }),
      ).toThrowError(/already been converted/)
    })

    it('supports idempotent request replay with stable result and zero duplicate writes', () => {
      const input = make50ItemLinesQuotationInput()
      const quote = store.addQuotation(input)
      store.transitionQuotation(quote.id, { expectedVersion: 1, action: 'send' })
      store.transitionQuotation(quote.id, { expectedVersion: 2, action: 'accept' })

      const initialActivitiesCount = store.listQuotationActivity(quote.id).items.length

      // First convert call with requestKey
      const res1 = store.convertQuotationToJob(
        quote.id,
        { expectedVersion: 3 },
        { requestKey: 'idempotent-key-001' },
      )

      // Replay with identical key & payload
      const res2 = store.convertQuotationToJob(
        quote.id,
        { expectedVersion: 3 },
        { requestKey: 'idempotent-key-001' },
      )

      expect(res2.job.id).toBe(res1.job.id)
      expect(res2.quotation.id).toBe(res1.quotation.id)

      // Activities count should only increase by 2 (quote activity + job activity) from first call, not duplicate
      const activitiesAfterReplay = store.listQuotationActivity(quote.id).items.length
      expect(activitiesAfterReplay).toBe(initialActivitiesCount + 1) // 1 quotation activity added for conversion
    })

    it('rejects same requestKey with different payload with IDEMPOTENCY_CONFLICT', () => {
      const input = make50ItemLinesQuotationInput()
      store.addQuotation(input, { requestKey: 'key-test-conflict' })

      try {
        const modifiedInput = { ...input, notes: 'Changed notes' }
        store.addQuotation(modifiedInput, { requestKey: 'key-test-conflict' })
        expect.unreachable()
      } catch (err: any) {
        expect(err.code).toBe('IDEMPOTENCY_CONFLICT')
      }
    })

    it('rejects stale version concurrency mismatch', () => {
      const input = make50ItemLinesQuotationInput()
      const quote = store.addQuotation(input)
      store.transitionQuotation(quote.id, { expectedVersion: 1, action: 'send' })

      // expectedVersion 1 is now stale since version is 2
      try {
        store.transitionQuotation(quote.id, { expectedVersion: 1, action: 'accept' })
        expect.unreachable()
      } catch (err: any) {
        expect(err.code).toBe('STALE_VERSION')
      }
    })

    it('rolls back completely on precommit failure leaving zero partial state or activity', () => {
      const input = make50ItemLinesQuotationInput()
      const quote = store.addQuotation(input)
      store.transitionQuotation(quote.id, { expectedVersion: 1, action: 'send' })
      store.transitionQuotation(quote.id, { expectedVersion: 2, action: 'accept' })

      const jobsBefore = store.listJobs().length
      const activitiesBefore = store.listQuotationActivity(quote.id).items.length

      // Inject failure hook
      store.setPrecommitHook(() => {
        throw new Error('Simulated precommit hardware/network crash')
      })

      expect(() =>
        store.convertQuotationToJob(quote.id, { expectedVersion: 3 }, { requestKey: 'crash-key' }),
      ).toThrowError(/Simulated precommit/)

      // Clear hook
      store.setPrecommitHook(undefined)

      // State must be completely unmodified
      const quoteAfter = store.getQuotation(quote.id)!
      expect(quoteAfter.status).toBe('accepted')
      expect(quoteAfter.jobId).toBeNull()
      expect(store.listJobs().length).toBe(jobsBefore)
      expect(store.listQuotationActivity(quote.id).items.length).toBe(activitiesBefore)
    })
  })

  describe('AT-03: Job Transitions & Stages', () => {
    it('tracks full job lifecycle: pending -> in_production -> packing -> ready_for_delivery -> delivered', () => {
      // J-1048 is initially pending
      const job1 = store.getJob('J-1048')!
      expect(job1.status).toBe('pending')
      expect(job1.stage).toBe('preparation')

      // 1. Start job
      const started = store.transitionJob('J-1048', { expectedVersion: 1, action: 'start' })
      expect(started.status).toBe('in_production')
      expect(started.stage).toBe('preparation')
      expect(started.version).toBe(2)

      // 2. Forward stage change: preparation -> production
      const inProdStage = store.changeJobStage('J-1048', { expectedVersion: 2, target: 'production' })
      expect(inProdStage.stage).toBe('production')
      expect(inProdStage.version).toBe(3)

      // 3. Forward skip: production -> packing (allowed without reason)
      const inPackingStage = store.changeJobStage('J-1048', { expectedVersion: 3, target: 'packing' })
      expect(inPackingStage.stage).toBe('packing')
      expect(inPackingStage.version).toBe(4)

      // 4. Backward stage change requires rework reason
      expect(() =>
        store.changeJobStage('J-1048', { expectedVersion: 4, target: 'production' }),
      ).toThrowError(/Rework reason is required/)

      const reworked = store.changeJobStage('J-1048', {
        expectedVersion: 4,
        target: 'production',
        reason: 'Print smudged on sleeve during packing inspection',
      })
      expect(reworked.stage).toBe('production')
      expect(reworked.version).toBe(5)

      // Move back to packing
      const rePacked = store.changeJobStage('J-1048', { expectedVersion: 5, target: 'packing' })
      expect(rePacked.stage).toBe('packing')
      expect(rePacked.version).toBe(6)

      // 5. Ready command: requires in_production and packing
      const ready = store.transitionJob('J-1048', { expectedVersion: 6, action: 'ready' })
      expect(ready.status).toBe('ready_for_delivery')
      expect(ready.deliveryStatus).toBe('ready')
      expect(ready.version).toBe(7)

      // 6. Deliver command: marks delivered
      const delivered = store.transitionJob('J-1048', { expectedVersion: 7, action: 'deliver' })
      expect(delivered.status).toBe('delivered')
      expect(delivered.deliveryStatus).toBe('delivered')
      expect(delivered.version).toBe(8)

      // 7. Terminal state: delivered cannot change stage or reopen
      expect(() =>
        store.changeJobStage('J-1048', { expectedVersion: 8, target: 'production' }),
      ).toThrowError(/Stage changes are only allowed while in production/)

      expect(() =>
        store.transitionJob('J-1048', { expectedVersion: 8, action: 'start' }),
      ).toThrowError(/Cannot start job from status "delivered"/)
    })

    it('requires cancellation reason and retains stage upon cancellation', () => {
      // J-1047 is in_production / production
      const job = store.getJob('J-1047')!
      expect(job.status).toBe('in_production')
      expect(job.stage).toBe('production')

      expect(() =>
        store.transitionJob('J-1047', { expectedVersion: 1, action: 'cancel', reason: '' }),
      ).toThrowError(/Cancellation reason is required/)

      const cancelled = store.transitionJob('J-1047', {
        expectedVersion: 1,
        action: 'cancel',
        reason: 'Customer cancelled event due to weather',
      })

      expect(cancelled.status).toBe('cancelled')
      expect(cancelled.stage).toBe('production') // stage retained!
      expect(cancelled.deliveryStatus).toBe('not_applicable')
    })
  })

  describe('Correction: expectedVersion is required and validated at mutation boundaries', () => {
    it('rejects updateQuotation with missing/invalid/stale expectedVersion without mutating state', () => {
      const input = make50ItemLinesQuotationInput()
      const quote = store.addQuotation(input)
      const before = store.getQuotation(quote.id)!

      const invalidVersions: unknown[] = [undefined, null, 0, -1, 1.5, 'abc', NaN]
      for (const bad of invalidVersions) {
        expect(() =>
          store.updateQuotation(quote.id, {
            expectedVersion: bad as number,
            quotation: input,
          }),
        ).toThrowError(/positive integer/)
      }

      // Stale but well-formed version is rejected too, distinctly (STALE_VERSION)
      try {
        store.updateQuotation(quote.id, { expectedVersion: 999, quotation: input })
        expect.unreachable()
      } catch (err: any) {
        expect(err.code).toBe('STALE_VERSION')
      }

      // No mutation occurred across every rejected attempt
      const after = store.getQuotation(quote.id)!
      expect(after).toEqual(before)
    })

    it('rejects transitionJob/changeJobStage with missing/invalid expectedVersion without mutating state', () => {
      const before = store.getJob('J-1048')!

      const invalidVersions: unknown[] = [undefined, null, 0, -1, 2.5]
      for (const bad of invalidVersions) {
        expect(() =>
          store.transitionJob('J-1048', { expectedVersion: bad as number, action: 'start' }),
        ).toThrowError(/positive integer/)
      }

      const after = store.getJob('J-1048')!
      expect(after).toEqual(before)
    })

    it('no longer accepts a bare quotation body that substitutes the current version (legacy path removed)', () => {
      const input = make50ItemLinesQuotationInput()
      const quote = store.addQuotation(input)

      // The adapter interface only accepts { expectedVersion, quotation }; a caller
      // that omits expectedVersion is rejected rather than silently defaulted to
      // the current family version.
      expect(() =>
        store.updateQuotation(quote.id, { quotation: input } as any),
      ).toThrowError(/positive integer/)

      const unchanged = store.getQuotation(quote.id)!
      expect(unchanged.version).toBe(1)
    })
  })

  describe('Correction: stable request identity replays a committed result whose response was lost', () => {
    it('retries transitionJob with the same request key without duplicate activity or version bump', () => {
      const jobBefore = store.getJob('J-1048')!
      expect(jobBefore.status).toBe('pending')

      const activitiesBefore = store.listJobActivity('J-1048').items.length

      const first = store.transitionJob(
        'J-1048',
        { expectedVersion: 1, action: 'start' },
        { requestKey: 'stable-start-key' },
      )
      expect(first.status).toBe('in_production')
      expect(first.version).toBe(2)

      // Simulated lost response: UI retries with the SAME request key and payload
      const retry = store.transitionJob(
        'J-1048',
        { expectedVersion: 1, action: 'start' },
        { requestKey: 'stable-start-key' },
      )

      expect(retry).toEqual(first)
      expect(retry.version).toBe(2) // not incremented again
      expect(store.listJobActivity('J-1048').items.length).toBe(activitiesBefore + 1) // one entry, not two
    })

    it('retries changeJobStage with the same request key without duplicate rework activity', () => {
      store.transitionJob('J-1048', { expectedVersion: 1, action: 'start' })

      const activitiesBefore = store.listJobActivity('J-1048').items.length

      const first = store.changeJobStage(
        'J-1048',
        { expectedVersion: 2, target: 'production' },
        { requestKey: 'stable-stage-key' },
      )
      expect(first.stage).toBe('production')
      expect(first.version).toBe(3)

      const retry = store.changeJobStage(
        'J-1048',
        { expectedVersion: 2, target: 'production' },
        { requestKey: 'stable-stage-key' },
      )

      expect(retry).toEqual(first)
      expect(store.listJobActivity('J-1048').items.length).toBe(activitiesBefore + 1)
    })

    it('a distinct request key against the same payload is treated as a separate write (not a forced replay)', () => {
      const activitiesBefore = store.listJobActivity('J-1048').items.length

      store.transitionJob('J-1048', { expectedVersion: 1, action: 'start' }, { requestKey: 'key-a' })

      // Same payload shape but stale expectedVersion now (already consumed) and a
      // fresh key: correctly rejected as STALE_VERSION rather than replayed.
      expect(() =>
        store.transitionJob('J-1048', { expectedVersion: 1, action: 'start' }, { requestKey: 'key-b' }),
      ).toThrowError(/modified/)

      expect(store.listJobActivity('J-1048').items.length).toBe(activitiesBefore + 1)
    })
  })

  describe('Correction: detached activity reads', () => {
    it('mutating a returned quotation activity entry does not affect stored history', () => {
      const input = make50ItemLinesQuotationInput()
      const quote = store.addQuotation(input)
      store.transitionQuotation(quote.id, { expectedVersion: 1, action: 'send' })

      const page = store.listQuotationActivity(quote.id)
      const entry = page.items[0]
      const originalReason = entry.reason
      const originalChangedInformation = entry.changedInformation

      // Tamper with the returned object, including a nested metadata bag
      entry.reason = 'TAMPERED'
      entry.changedInformation = 'TAMPERED'
      ;(entry as any).metadata = { tampered: true }

      const reread = store.listQuotationActivity(quote.id)
      const rereadEntry = reread.items.find((a) => a.id === entry.id)!
      expect(rereadEntry.reason).toBe(originalReason)
      expect(rereadEntry.changedInformation).toBe(originalChangedInformation)
      expect(rereadEntry.metadata).toBeUndefined()
    })

    it('mutating a returned job activity entry does not affect stored history', () => {
      store.transitionJob('J-1048', { expectedVersion: 1, action: 'start' })

      const page = store.listJobActivity('J-1048')
      const entry = page.items[0]
      entry.changedInformation = 'TAMPERED'

      const reread = store.listJobActivity('J-1048')
      const rereadEntry = reread.items.find((a) => a.id === entry.id)!
      expect(rereadEntry.changedInformation).not.toBe('TAMPERED')
    })
  })

  describe('Correction: working cursor pagination', () => {
    it('paginates more than 25 job activity entries reachably and without duplicates', () => {
      store.transitionJob('J-1048', { expectedVersion: 1, action: 'start' })

      // Alternate stage forward/backward to accumulate activity entries beyond
      // the default page size of 25.
      let version = 2
      for (let i = 0; i < 15; i++) {
        store.changeJobStage('J-1048', { expectedVersion: version, target: 'production' })
        version++
        store.changeJobStage('J-1048', {
          expectedVersion: version,
          target: 'preparation',
          reason: `Iteration ${i} rework reason`,
        })
        version++
      }

      const totalActivities = store.listJobActivity('J-1048', { limit: 100 }).items.length
      expect(totalActivities).toBeGreaterThan(25)

      // Walk every page using the returned cursor and confirm full, unique coverage.
      const seenIds = new Set<string>()
      let cursor: string | null | undefined = undefined
      let pages = 0
      do {
        const page = store.listJobActivity('J-1048', { limit: 25, cursor: cursor ?? undefined })
        expect(page.items.length).toBeLessThanOrEqual(25)
        for (const item of page.items) {
          expect(seenIds.has(item.id)).toBe(false)
          seenIds.add(item.id)
        }
        cursor = page.nextCursor
        pages++
      } while (cursor)

      expect(pages).toBeGreaterThan(1)
      expect(seenIds.size).toBe(totalActivities)
    })

    it('paginates more than 25 quotation revisions reachably and without duplicates', () => {
      const input = make50ItemLinesQuotationInput()
      let current = store.addQuotation(input)
      let version = 1

      for (let i = 0; i < 30; i++) {
        const sent = store.transitionQuotation(current.id, { expectedVersion: version, action: 'send' })
        version = sent.version
        const declined = store.transitionQuotation(current.id, { expectedVersion: version, action: 'decline' })
        version = declined.version
        current = store.createQuotationRevision(current.id, { expectedVersion: version })
        version = current.version
      }

      const totalRevisions = store.listQuotationRevisions(current.familyId, { limit: 100 }).items.length
      expect(totalRevisions).toBeGreaterThan(25)

      const seenIds = new Set<string>()
      let cursor: string | null | undefined = undefined
      let pages = 0
      do {
        const page = store.listQuotationRevisions(current.familyId, { limit: 25, cursor: cursor ?? undefined })
        for (const item of page.items) {
          expect(seenIds.has(item.id)).toBe(false)
          seenIds.add(item.id)
        }
        cursor = page.nextCursor
        pages++
      } while (cursor)

      expect(pages).toBeGreaterThan(1)
      expect(seenIds.size).toBe(totalRevisions)
    })

    it('rejects invalid limit and cursor pagination inputs', () => {
      store.transitionJob('J-1048', { expectedVersion: 1, action: 'start' })

      expect(() => store.listJobActivity('J-1048', { limit: 0 })).toThrowError(/limit/)
      expect(() => store.listJobActivity('J-1048', { limit: 101 })).toThrowError(/limit/)
      expect(() => store.listJobActivity('J-1048', { limit: 1.5 })).toThrowError(/limit/)
      expect(() => store.listJobActivity('J-1048', { cursor: 'not-a-real-cursor' })).toThrowError(/cursor/)
      expect(() => store.listJobActivity('J-1048', { cursor: 'c:99999' })).toThrowError(/cursor/)
    })

    it('does not duplicate or skip pre-existing entries when a newer activity is inserted between page fetches', () => {
      // Accumulate enough activity to span at least two pages.
      let version = 1
      store.transitionJob('J-1048', { expectedVersion: version, action: 'start' })
      version++
      for (let i = 0; i < 14; i++) {
        store.changeJobStage('J-1048', { expectedVersion: version, target: 'production' })
        version++
        store.changeJobStage('J-1048', {
          expectedVersion: version,
          target: 'preparation',
          reason: `Iteration ${i} rework reason`,
        })
        version++
      }

      const beforeInsert = store.listJobActivity('J-1048', { limit: 25 })
      const originalTotal = store.listJobActivity('J-1048', { limit: 100 }).items.length
      expect(beforeInsert.items.length).toBe(25)
      expect(beforeInsert.nextCursor).not.toBeNull()
      const page1Ids = beforeInsert.items.map((a) => a.id)

      // A newer activity is prepended (newest-first insertion order) between
      // the first and second page fetch.
      store.changeJobStage('J-1048', { expectedVersion: version, target: 'production' })
      version++

      const page2 = store.listJobActivity('J-1048', { limit: 25, cursor: beforeInsert.nextCursor! })

      // None of page 1's already-returned entries reappear on page 2, and the
      // newly inserted entry (which sorts ahead of the whole first page) is
      // not skipped — it simply was not part of the page-1 snapshot at all,
      // matching "fetch page one, insert, fetch subsequent pages: no
      // duplicate or skipped pre-existing entries."
      const page2Ids = page2.items.map((a) => a.id)
      for (const id of page2Ids) {
        expect(page1Ids.includes(id)).toBe(false)
      }

      // Walking every remaining page from the page-1 cursor still reaches
      // every pre-existing entry exactly once.
      const seen = new Set(page1Ids)
      let cursor: string | null = beforeInsert.nextCursor
      while (cursor) {
        const page = store.listJobActivity('J-1048', { limit: 25, cursor })
        for (const item of page.items) {
          expect(seen.has(item.id)).toBe(false)
          seen.add(item.id)
        }
        cursor = page.nextCursor
      }

      // The walk reaches every entry that existed at the time page one was
      // fetched, no more and no fewer — the entry inserted afterward is
      // simply outside that snapshot's continuation, not a skip.
      expect(seen.size).toBe(originalTotal)
    })

    it('rejects a cursor scoped to a different job/family or a different list operation', () => {
      store.transitionJob('J-1048', { expectedVersion: 1, action: 'start' })
      store.transitionJob('J-1047', {
        expectedVersion: 1,
        action: 'cancel',
        reason: 'Different job, unrelated activity stream',
      })

      const job1048Page = store.listJobActivity('J-1048', { limit: 1 })
      expect(job1048Page.nextCursor).not.toBeNull()

      // A cursor minted for J-1048's activity stream is rejected against a
      // different job's stream, even though both are job-activity reads.
      expect(() => store.listJobActivity('J-1047', { cursor: job1048Page.nextCursor! })).toThrowError(
        /cursor does not belong to this result set/,
      )

      // A cursor minted for a job-activity read is rejected against a
      // quotation-activity/-revisions read (different list operation), and
      // vice versa, even where the underlying subject id happens to collide.
      const input = make50ItemLinesQuotationInput()
      const quote = store.addQuotation(input)
      store.transitionQuotation(quote.id, { expectedVersion: 1, action: 'send' })
      store.transitionQuotation(quote.id, { expectedVersion: 2, action: 'decline' })
      store.createQuotationRevision(quote.id, { expectedVersion: 3 })

      const quoteActivityPage = store.listQuotationActivity(quote.familyId, { limit: 1 })
      expect(quoteActivityPage.nextCursor).not.toBeNull()

      expect(() =>
        store.listQuotationRevisions(quote.familyId, { cursor: quoteActivityPage.nextCursor! }),
      ).toThrowError(/cursor does not belong to this result set/)

      expect(() => store.listJobActivity('J-1048', { cursor: quoteActivityPage.nextCursor! })).toThrowError(
        /cursor does not belong to this result set/,
      )
    })
  })
})
