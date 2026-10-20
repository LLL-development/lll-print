import { customers as seedCustomers, inventory as seedInventory, jobs as seedJobs, movements as seedMovements } from '../data/mockData'
import type { Contact, InventoryItem, StockMovement } from '../domain/models'
import {
  applyJobStageChange,
  applyJobTransition,
} from '../features/jobs/domain/transitions'
import {
  createJobFromAcceptedQuotation,
  projectJobView,
} from '../features/jobs/domain/snapshots'
import { migrateLegacyJobs } from '../features/jobs/domain/legacyMigration'
import type {
  ChangeJobStageBody,
  JobRecord,
  JobStatus,
  JobView,
  TransitionJobBody,
} from '../features/jobs/domain/types'
import { evaluateSendReadiness } from '../features/quotations/domain/calculations'
import {
  prepareConversion,
  prepareCreateQuotation,
  prepareRevision,
  prepareTransition,
  prepareUpdateDraft,
} from '../features/quotations/domain/commands'
import type {
  ConvertQuotationBody,
  CreateQuotationRevisionBody,
  QuotationFamilyRecord,
  QuotationInput,
  QuotationView,
  SaveDraftBody,
  TransitionQuotationBody,
} from '../features/quotations/domain/types'
import { createActivityEntry, resetActivitySequence, type ActivityEntry } from './activity'
import { IdempotencyStore, OperationError, paginate, type Page, type WriteMeta } from './requestResults'
import type { SeedInvoice, T2FoundationAdapter, T2FoundationState } from './types'

export const initialQuotations: QuotationView[] = [
  {
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
    dueDate: '2026-09-05',
    sourceNote: 'WhatsApp enquiry, 27 Aug',
    lines: [
      {
        description: 'Corporate apparel polo order',
        quantity: '100',
        unit: 'pcs',
        unitPrice: '28.00',
      },
    ],
    lineTotals: ['2800.00'],
    totals: {
      subtotal: '2800.00',
      discountAmount: '0.00',
      discountedSubtotal: '2800.00',
      taxRate: '0.00',
      taxAmount: '0.00',
      grandTotal: '2800.00',
      provisional: false,
    },
    notes: 'Initial corporate draft',
    createdAt: '2026-08-27T10:00:00.000Z',
  },
]

export const initialFamilies: QuotationFamilyRecord[] = [
  {
    id: 'QF-3028',
    latestRevisionId: 'Q-3028',
    convertedJobId: null,
    version: 1,
  },
]

export const initialInvoices: SeedInvoice[] = [
  {
    id: 'INV-2041',
    jobId: 'J-1047',
    customerName: 'Northstar FC',
    date: '2026-08-27',
    amount: 1240,
    status: 'Partially paid',
  },
  {
    id: 'INV-2040',
    jobId: 'J-1045',
    customerName: 'Bina Community',
    date: '2026-08-25',
    amount: 2700,
    status: 'Paid',
  },
]

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val))
}

export function generateCollisionSafeId(
  prefix: string,
  defaultStart: number,
  existingIds: string[],
  minPad = 2,
): string {
  let maxNum = defaultStart - 1
  const pattern = new RegExp(`^${prefix}-(\\d+)$`)
  for (const id of existingIds) {
    const match = id.match(pattern)
    if (match) {
      const parsed = parseInt(match[1], 10)
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed
      }
    }
  }
  const nextNum = maxNum + 1
  const numStr = minPad > 0 ? String(nextNum).padStart(minPad, '0') : String(nextNum)
  return `${prefix}-${numStr}`
}

export function createInitialState(): T2FoundationState {
  const initialJobRecords = migrateLegacyJobs(seedJobs)
  return {
    jobs: initialJobRecords.map((j) => projectJobView(j)),
    contacts: seedCustomers.map((contact) => ({ ...contact })),
    inventory: seedInventory.map((item) => ({ ...item })),
    movements: seedMovements.map((movement) => ({ ...movement })),
    quotations: initialQuotations.map((quote) => deepClone(quote)),
    invoices: initialInvoices.map((inv) => ({ ...inv })),
  }
}

export class MemoryStore implements T2FoundationAdapter {
  private families: Map<string, QuotationFamilyRecord> = new Map()
  private quotations: QuotationView[] = []
  private jobRecords: JobRecord[] = []
  private activities: ActivityEntry[] = []
  private idempotency = new IdempotencyStore()

  private contacts: Contact[] = []
  private inventory: InventoryItem[] = []
  private movements: StockMovement[] = []
  private invoices: SeedInvoice[] = []

  private precommitFailureHook?: () => void
  // Fires after a mutation has committed (state + idempotency cache updated)
  // but before its result reaches the caller — simulates a response lost in
  // transit for a request that actually succeeded server-side, distinct from
  // precommitFailureHook's before-any-effect failure.
  private postcommitFailureHook?: () => void

  constructor() {
    this.resetToFixtures()
  }

  setPrecommitHook(hook?: () => void): void {
    this.precommitFailureHook = hook
  }

  setPostcommitHook(hook?: () => void): void {
    this.postcommitFailureHook = hook
  }

  getState(): T2FoundationState {
    return {
      jobs: this.jobRecords.map((j) => projectJobView(j)),
      contacts: this.contacts.map((c) => ({ ...c })),
      inventory: this.inventory.map((i) => ({ ...i })),
      movements: this.movements.map((m) => ({ ...m })),
      quotations: this.quotations.map((q) => deepClone(q)),
      invoices: this.invoices.map((inv) => ({ ...inv })),
    }
  }

  // --- Quotation Mutations ---

  addQuotation(input: QuotationInput, meta?: WriteMeta): QuotationView {
    const canonicalPayload = JSON.stringify(input)
    if (meta?.requestKey) {
      const replay = this.idempotency.get<QuotationView>(meta.requestKey, 'addQuotation', '', canonicalPayload)
      if (replay) return deepClone(replay.result)
    }

    const nextId = generateCollisionSafeId(
      'Q',
      3029,
      this.quotations.map((q) => q.id),
      4,
    )
    const familyId = `QF-${nextId.replace('Q-', '')}`

    const { quotation, family } = prepareCreateQuotation(input, nextId, familyId)

    if (this.precommitFailureHook) {
      this.precommitFailureHook()
    }

    this.families.set(family.id, family)
    this.quotations = [quotation, ...this.quotations]

    const activity = createActivityEntry({
      subjectType: 'quotation',
      subjectId: quotation.id,
      action: 'created',
      actorLabel: meta?.actorLabel || 'Staff',
      changedInformation: `Created initial draft quotation ${quotation.number} (Revision 1)`,
      nextStatus: 'draft',
    })
    this.activities = [activity, ...this.activities]

    if (meta?.requestKey) {
      this.idempotency.record(meta.requestKey, 'addQuotation', '', canonicalPayload, deepClone(quotation))
    }

    if (this.postcommitFailureHook) {
      this.postcommitFailureHook()
    }

    return deepClone(quotation)
  }

  updateQuotation(id: string, body: SaveDraftBody, meta?: WriteMeta): QuotationView {
    const current = this.quotations.find((q) => q.id === id)
    if (!current) {
      throw new OperationError('NOT_FOUND', `Quotation "${id}" not found.`)
    }

    const family = this.families.get(current.familyId)
    if (!family) {
      throw new OperationError('NOT_FOUND', `Quotation family "${current.familyId}" not found.`)
    }

    const canonicalPayload = JSON.stringify(body)
    if (meta?.requestKey) {
      const replay = this.idempotency.get<QuotationView>(meta.requestKey, 'updateQuotation', id, canonicalPayload)
      if (replay) return deepClone(replay.result)
    }

    const nextFamilyVersion = family.version + 1
    const updated = prepareUpdateDraft(current, family, body, nextFamilyVersion)

    if (this.precommitFailureHook) {
      this.precommitFailureHook()
    }

    this.families.set(family.id, { ...family, version: nextFamilyVersion })
    this.quotations = this.quotations.map((q) => (q.id === id ? updated : q))

    const activity = createActivityEntry({
      subjectType: 'quotation',
      subjectId: updated.id,
      action: 'updated',
      actorLabel: meta?.actorLabel || 'Staff',
      changedInformation: `Updated draft quotation ${updated.number}`,
      nextStatus: updated.status,
    })
    this.activities = [activity, ...this.activities]

    if (meta?.requestKey) {
      this.idempotency.record(meta.requestKey, 'updateQuotation', id, canonicalPayload, deepClone(updated))
    }

    if (this.postcommitFailureHook) {
      this.postcommitFailureHook()
    }

    return deepClone(updated)
  }

  transitionQuotation(id: string, body: TransitionQuotationBody, meta?: WriteMeta): QuotationView {
    const current = this.quotations.find((q) => q.id === id)
    if (!current) {
      throw new OperationError('NOT_FOUND', `Quotation "${id}" not found.`)
    }

    const family = this.families.get(current.familyId)
    if (!family) {
      throw new OperationError('NOT_FOUND', `Quotation family "${current.familyId}" not found.`)
    }

    const canonicalPayload = JSON.stringify(body)
    if (meta?.requestKey) {
      const replay = this.idempotency.get<QuotationView>(
        meta.requestKey,
        'transitionQuotation',
        id,
        canonicalPayload,
      )
      if (replay) return deepClone(replay.result)
    }

    const readiness = evaluateSendReadiness(
      {
        customerId: current.customerId,
        customerName: current.customerName,
        dueDate: current.dueDate,
        sourceNote: current.sourceNote,
        lines: current.lines,
        discountAmount: current.totals.discountAmount,
        taxRate: current.totals.taxRate,
        notes: current.notes,
      },
      current.totals,
    )

    const nextFamilyVersion = family.version + 1
    const transitioned = prepareTransition(current, family, body, readiness, nextFamilyVersion)

    if (this.precommitFailureHook) {
      this.precommitFailureHook()
    }

    this.families.set(family.id, { ...family, version: nextFamilyVersion })
    this.quotations = this.quotations.map((q) => (q.id === id ? transitioned : q))

    const actionText =
      body.action === 'send'
        ? 'Recorded externally sent decision'
        : body.action === 'accept'
          ? 'Recorded customer acceptance'
          : 'Recorded customer decline'

    const activity = createActivityEntry({
      subjectType: 'quotation',
      subjectId: transitioned.id,
      action: body.action,
      actorLabel: meta?.actorLabel || 'Staff',
      changedInformation: `${actionText} for quotation ${transitioned.number}`,
      previousStatus: current.status,
      nextStatus: transitioned.status,
    })
    this.activities = [activity, ...this.activities]

    if (meta?.requestKey) {
      this.idempotency.record(meta.requestKey, 'transitionQuotation', id, canonicalPayload, deepClone(transitioned))
    }

    if (this.postcommitFailureHook) {
      this.postcommitFailureHook()
    }

    return deepClone(transitioned)
  }

  createQuotationRevision(id: string, body: CreateQuotationRevisionBody, meta?: WriteMeta): QuotationView {
    const current = this.quotations.find((q) => q.id === id)
    if (!current) {
      throw new OperationError('NOT_FOUND', `Quotation "${id}" not found.`)
    }

    const family = this.families.get(current.familyId)
    if (!family) {
      throw new OperationError('NOT_FOUND', `Quotation family "${current.familyId}" not found.`)
    }

    const canonicalPayload = JSON.stringify(body)
    if (meta?.requestKey) {
      const replay = this.idempotency.get<QuotationView>(
        meta.requestKey,
        'createQuotationRevision',
        id,
        canonicalPayload,
      )
      if (replay) return deepClone(replay.result)
    }

    const nextRevisionId = generateCollisionSafeId(
      'Q',
      3029,
      this.quotations.map((q) => q.id),
      4,
    )
    const nextFamilyVersion = family.version + 1

    const { newRevision, updatedFamily } = prepareRevision(
      current,
      family,
      body,
      nextRevisionId,
      nextFamilyVersion,
    )

    if (this.precommitFailureHook) {
      this.precommitFailureHook()
    }

    // Previous revision becomes non-latest
    this.quotations = this.quotations.map((q) => (q.id === id ? { ...q, isLatest: false } : q))
    this.quotations = [newRevision, ...this.quotations]
    this.families.set(family.id, updatedFamily)

    const activity = createActivityEntry({
      subjectType: 'quotation',
      subjectId: newRevision.id,
      action: 'revised',
      actorLabel: meta?.actorLabel || 'Staff',
      changedInformation: `Created revision ${newRevision.revision} (${newRevision.number}) from ${current.number}`,
      previousStatus: current.status,
      nextStatus: 'draft',
      linkedQuotationId: current.id,
    })
    this.activities = [activity, ...this.activities]

    if (meta?.requestKey) {
      this.idempotency.record(
        meta.requestKey,
        'createQuotationRevision',
        id,
        canonicalPayload,
        deepClone(newRevision),
      )
    }

    if (this.postcommitFailureHook) {
      this.postcommitFailureHook()
    }

    return deepClone(newRevision)
  }

  convertQuotationToJob(
    id: string,
    body: ConvertQuotationBody,
    meta?: WriteMeta,
  ): { quotation: QuotationView; job: JobView } {
    const current = this.quotations.find((q) => q.id === id)
    if (!current) {
      throw new OperationError('NOT_FOUND', `Quotation "${id}" not found.`)
    }

    const family = this.families.get(current.familyId)
    if (!family) {
      throw new OperationError('NOT_FOUND', `Quotation family "${current.familyId}" not found.`)
    }

    const canonicalPayload = JSON.stringify(body)
    if (meta?.requestKey) {
      const replay = this.idempotency.get<{ quotation: QuotationView; job: JobView }>(
        meta.requestKey,
        'convertQuotationToJob',
        id,
        canonicalPayload,
      )
      if (replay) {
        return {
          quotation: deepClone(replay.result.quotation),
          job: deepClone(replay.result.job),
        }
      }
    }

    const nextJobId = generateCollisionSafeId(
      'J',
      1049,
      this.jobRecords.map((j) => j.id),
      4,
    )
    const nextFamilyVersion = family.version + 1

    const { updatedQuotation, updatedFamily } = prepareConversion(
      current,
      family,
      body,
      nextJobId,
      nextFamilyVersion,
    )

    const { jobRecord, jobView } = createJobFromAcceptedQuotation(current, nextJobId)

    if (this.precommitFailureHook) {
      this.precommitFailureHook()
    }

    // Atomic commit
    this.families.set(family.id, updatedFamily)
    this.quotations = this.quotations.map((q) => (q.id === id ? updatedQuotation : q))
    this.jobRecords = [jobRecord, ...this.jobRecords]

    const quoteActivity = createActivityEntry({
      subjectType: 'quotation',
      subjectId: updatedQuotation.id,
      action: 'converted_to_job',
      actorLabel: meta?.actorLabel || 'Staff',
      changedInformation: `Quotation converted to Job ${jobRecord.number}`,
      previousStatus: current.status,
      nextStatus: updatedQuotation.status,
      linkedJobId: jobRecord.id,
    })

    const jobActivity = createActivityEntry({
      subjectType: 'job',
      subjectId: jobRecord.id,
      action: 'converted_from_quotation',
      actorLabel: meta?.actorLabel || 'Staff',
      changedInformation: `Job created from accepted quotation ${updatedQuotation.number}`,
      nextStatus: 'pending',
      nextStage: 'preparation',
      linkedQuotationId: updatedQuotation.id,
    })

    this.activities = [jobActivity, quoteActivity, ...this.activities]

    const result = {
      quotation: deepClone(updatedQuotation),
      job: deepClone(jobView),
    }

    if (meta?.requestKey) {
      this.idempotency.record(meta.requestKey, 'convertQuotationToJob', id, canonicalPayload, deepClone(result))
    }

    if (this.postcommitFailureHook) {
      this.postcommitFailureHook()
    }

    return result
  }

  // --- Quotation Reads ---

  getQuotation(id: string): QuotationView | undefined {
    const quote = this.quotations.find((q) => q.id === id)
    return quote ? deepClone(quote) : undefined
  }

  listQuotations(options?: { latestOnly?: boolean }): QuotationView[] {
    const latestOnly = options?.latestOnly ?? false
    const list = latestOnly ? this.quotations.filter((q) => q.isLatest) : this.quotations
    return list.map((q) => deepClone(q))
  }

  private resolveFamilyId(idOrFamilyId: string): string {
    const matchingQuote = this.quotations.find((q) => q.id === idOrFamilyId)
    return matchingQuote ? matchingQuote.familyId : idOrFamilyId
  }

  listQuotationRevisions(
    idOrFamilyId: string,
    page?: { limit?: number; cursor?: string },
  ): Page<QuotationView> {
    const familyId = this.resolveFamilyId(idOrFamilyId)

    const items = this.quotations
      .filter((q) => q.familyId === familyId)
      .sort((a, b) => b.revision - a.revision)
      .map((q) => deepClone(q))

    return paginate(items, `quotationRevisions:${familyId}`, page)
  }

  listQuotationActivity(
    idOrFamilyId: string,
    page?: { limit?: number; cursor?: string },
  ): Page<ActivityEntry> {
    const familyId = this.resolveFamilyId(idOrFamilyId)
    const quoteIds = this.quotations.filter((q) => q.familyId === familyId).map((q) => q.id)

    const items = this.activities
      .filter((a) => a.subjectType === 'quotation' && quoteIds.includes(a.subjectId))
      .map((a) => deepClone(a))
    return paginate(items, `quotationActivity:${familyId}`, page)
  }

  // --- Job Mutations ---

  transitionJob(id: string, body: TransitionJobBody, meta?: WriteMeta): JobView {
    const jobRecord = this.jobRecords.find((j) => j.id === id)
    if (!jobRecord) {
      throw new OperationError('NOT_FOUND', `Job "${id}" not found.`)
    }

    const canonicalPayload = JSON.stringify(body)
    if (meta?.requestKey) {
      const replay = this.idempotency.get<JobView>(meta.requestKey, 'transitionJob', id, canonicalPayload)
      if (replay) return deepClone(replay.result)
    }

    const nextJobVersion = jobRecord.version + 1
    const { updatedJob, validatedReason } = applyJobTransition(jobRecord, body, nextJobVersion)

    if (this.precommitFailureHook) {
      this.precommitFailureHook()
    }

    this.jobRecords = this.jobRecords.map((j) => (j.id === id ? updatedJob : j))

    const actionText =
      body.action === 'start'
        ? 'Job production started'
        : body.action === 'ready'
          ? 'Job marked ready for delivery'
          : body.action === 'deliver'
            ? 'Job recorded as delivered'
            : 'Job cancelled'

    const activity = createActivityEntry({
      subjectType: 'job',
      subjectId: updatedJob.id,
      action: body.action,
      actorLabel: meta?.actorLabel || 'Staff',
      changedInformation: `${actionText} (${updatedJob.number})`,
      previousStatus: jobRecord.status,
      nextStatus: updatedJob.status,
      previousStage: jobRecord.stage,
      nextStage: updatedJob.stage,
      reason: validatedReason,
    })
    this.activities = [activity, ...this.activities]

    const projected = projectJobView(updatedJob)

    if (meta?.requestKey) {
      this.idempotency.record(meta.requestKey, 'transitionJob', id, canonicalPayload, deepClone(projected))
    }

    if (this.postcommitFailureHook) {
      this.postcommitFailureHook()
    }

    return deepClone(projected)
  }

  changeJobStage(id: string, body: ChangeJobStageBody, meta?: WriteMeta): JobView {
    const jobRecord = this.jobRecords.find((j) => j.id === id)
    if (!jobRecord) {
      throw new OperationError('NOT_FOUND', `Job "${id}" not found.`)
    }

    const canonicalPayload = JSON.stringify(body)
    if (meta?.requestKey) {
      const replay = this.idempotency.get<JobView>(meta.requestKey, 'changeJobStage', id, canonicalPayload)
      if (replay) return deepClone(replay.result)
    }

    const nextJobVersion = jobRecord.version + 1
    const { updatedJob, validatedReason } = applyJobStageChange(jobRecord, body, nextJobVersion)

    if (this.precommitFailureHook) {
      this.precommitFailureHook()
    }

    this.jobRecords = this.jobRecords.map((j) => (j.id === id ? updatedJob : j))

    const activity = createActivityEntry({
      subjectType: 'job',
      subjectId: updatedJob.id,
      action: 'stage_changed',
      actorLabel: meta?.actorLabel || 'Staff',
      changedInformation: `Stage changed from ${jobRecord.stage} to ${updatedJob.stage}`,
      previousStage: jobRecord.stage,
      nextStage: updatedJob.stage,
      reason: validatedReason,
    })
    this.activities = [activity, ...this.activities]

    const projected = projectJobView(updatedJob)

    if (meta?.requestKey) {
      this.idempotency.record(meta.requestKey, 'changeJobStage', id, canonicalPayload, deepClone(projected))
    }

    if (this.postcommitFailureHook) {
      this.postcommitFailureHook()
    }

    return deepClone(projected)
  }

  // --- Job Reads ---

  getJob(id: string): JobView | undefined {
    const jobRecord = this.jobRecords.find((j) => j.id === id)
    return jobRecord ? projectJobView(jobRecord) : undefined
  }

  getJobRecord(id: string): JobRecord | undefined {
    const jobRecord = this.jobRecords.find((j) => j.id === id)
    return jobRecord ? deepClone(jobRecord) : undefined
  }

  listJobs(filters?: { status?: 'All' | JobStatus; query?: string }): JobView[] {
    let list = this.jobRecords.map((j) => projectJobView(j))
    if (filters?.status && filters.status !== 'All') {
      list = list.filter((j) => j.status === filters.status)
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase()
      list = list.filter(
        (j) =>
          j.number.toLowerCase().includes(q) ||
          (j.customer?.displayName.toLowerCase().includes(q) ?? false) ||
          j.lines.some((l) => l.description.toLowerCase().includes(q)),
      )
    }
    return list
  }

  listJobActivity(id: string, page?: { limit?: number; cursor?: string }): Page<ActivityEntry> {
    const items = this.activities
      .filter((a) => a.subjectType === 'job' && a.subjectId === id)
      .map((a) => deepClone(a))
    return paginate(items, `jobActivity:${id}`, page)
  }

  // --- Supporting Entities ---

  addContact(contact: Omit<Contact, 'id'>): Contact {
    const nextId = generateCollisionSafeId(
      'C',
      3,
      this.contacts.map((c) => c.id),
      2,
    )
    const newContact: Contact = {
      ...contact,
      id: nextId,
    }
    this.contacts = [newContact, ...this.contacts]
    return { ...newContact }
  }

  addInventoryItem(item: Omit<InventoryItem, 'id'>): InventoryItem {
    const nextId = generateCollisionSafeId(
      'I',
      4,
      this.inventory.map((i) => i.id),
      2,
    )
    const newItem: InventoryItem = {
      ...item,
      id: nextId,
    }
    this.inventory = [newItem, ...this.inventory]
    return { ...newItem }
  }

  addStockMovement(movement: Omit<StockMovement, 'id'>): StockMovement {
    const nextId = generateCollisionSafeId(
      'M',
      5,
      this.movements.map((m) => m.id),
      2,
    )
    const newMovement: StockMovement = {
      ...movement,
      id: nextId,
    }
    this.movements = [newMovement, ...this.movements]
    return { ...newMovement }
  }

  resetToFixtures(): void {
    resetActivitySequence(1)
    this.idempotency.clear()
    this.precommitFailureHook = undefined
    this.postcommitFailureHook = undefined

    this.contacts = seedCustomers.map((c) => ({ ...c }))
    this.inventory = seedInventory.map((i) => ({ ...i }))
    this.movements = seedMovements.map((m) => ({ ...m }))
    this.invoices = initialInvoices.map((inv) => ({ ...inv }))

    this.quotations = initialQuotations.map((quote) => deepClone(quote))
    this.families = new Map(initialFamilies.map((f) => [f.id, { ...f }]))

    this.jobRecords = migrateLegacyJobs(seedJobs)

    this.activities = [
      createActivityEntry({
        subjectType: 'quotation',
        subjectId: 'Q-3028',
        action: 'created',
        actorLabel: 'System',
        occurredAt: '2026-08-27T10:00:00.000Z',
        changedInformation: 'Initial prototype quotation (synthetic baseline)',
        nextStatus: 'draft',
      }),
      ...this.jobRecords.map((j) =>
        createActivityEntry({
          subjectType: 'job',
          subjectId: j.id,
          action: 'migrated',
          actorLabel: 'System',
          occurredAt: j.createdAt,
          changedInformation: 'Migrated from legacy prototype fixture (synthetic baseline)',
          nextStatus: j.status,
          nextStage: j.stage,
        }),
      ),
    ]
  }
}

export const memoryStore = new MemoryStore()
