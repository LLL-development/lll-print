import type { Contact, InventoryItem, StockMovement } from '../domain/models'
import type {
  ChangeJobStageBody,
  JobStatus,
  JobView,
  TransitionJobBody,
} from '../features/jobs/domain/types'
import type {
  ConvertQuotationBody,
  CreateQuotationRevisionBody,
  QuotationInput,
  QuotationView,
  SaveDraftBody,
  TransitionQuotationBody,
} from '../features/quotations/domain/types'
import type { ActivityEntry } from './activity'
import type { Page, WriteMeta } from './requestResults'

export interface SeedInvoice {
  id: string
  jobId: string
  customerName: string
  date: string
  amount: number
  status: 'Partially paid' | 'Paid' | 'Unpaid'
}

export interface T2FoundationState {
  jobs: JobView[]
  contacts: Contact[]
  inventory: InventoryItem[]
  movements: StockMovement[]
  quotations: QuotationView[]
  invoices: SeedInvoice[]
}

export interface T2FoundationAdapter {
  getState(): T2FoundationState

  // Quotation lifecycle methods (SDD § 4/5)
  addQuotation(input: QuotationInput, meta?: WriteMeta): QuotationView
  updateQuotation(id: string, body: SaveDraftBody, meta?: WriteMeta): QuotationView
  transitionQuotation(id: string, body: TransitionQuotationBody, meta?: WriteMeta): QuotationView
  createQuotationRevision(id: string, body: CreateQuotationRevisionBody, meta?: WriteMeta): QuotationView
  convertQuotationToJob(id: string, body: ConvertQuotationBody, meta?: WriteMeta): { quotation: QuotationView; job: JobView }

  // Quotation read queries
  getQuotation(id: string): QuotationView | undefined
  listQuotations(options?: { latestOnly?: boolean }): QuotationView[]
  listQuotationRevisions(idOrFamilyId: string, page?: { limit?: number; cursor?: string }): Page<QuotationView>
  listQuotationActivity(idOrFamilyId: string, page?: { limit?: number; cursor?: string }): Page<ActivityEntry>

  // Job lifecycle methods (SDD § 4/5)
  transitionJob(id: string, body: TransitionJobBody, meta?: WriteMeta): JobView
  changeJobStage(id: string, body: ChangeJobStageBody, meta?: WriteMeta): JobView

  // Job read queries
  getJob(id: string): JobView | undefined
  listJobs(filters?: { status?: 'All' | JobStatus; query?: string }): JobView[]
  listJobActivity(id: string, page?: { limit?: number; cursor?: string }): Page<ActivityEntry>

  // Foundation supporting entity queries
  addContact(contact: Omit<Contact, 'id'>): Contact
  addInventoryItem(item: Omit<InventoryItem, 'id'>): InventoryItem
  addStockMovement(movement: Omit<StockMovement, 'id'>): StockMovement

  resetToFixtures(): void
}
