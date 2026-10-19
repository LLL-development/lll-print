import type { T2FoundationState } from '../adapters/types'
import type { DisplayRole } from '../app/navigationTypes'
import type { Contact, InventoryItem, StockMovement } from '../domain/models'
import type {
  JobAction,
  JobView,
  Stage,
} from '../features/jobs/domain/types'
import type {
  QuotationAction,
  QuotationInput,
  QuotationView,
} from '../features/quotations/domain/types'

export type ModalKind =
  | 'job'
  | 'quote'
  | 'contact'
  | 'item'
  | 'movement'
  | 'jobDetail'
  | 'quoteDetail'
  | null

export interface SyntheticStoreContextValue {
  state: T2FoundationState
  displayRole: DisplayRole
  setDisplayRole: (role: DisplayRole) => void
  modal: ModalKind
  selectedJobId: string | null
  selectedQuotationId: string | null
  selectedJob: JobView | null
  selectedQuotation: QuotationView | null
  openModal: (kind: ModalKind, payload?: JobView | QuotationView | { id?: string; customerId?: string }) => void
  closeModal: () => void
  preselectedCustomerId: string | null
  selectQuotationId: (id: string | null) => void
  selectJobId: (id: string | null) => void
  toast: string
  notify: (message: string) => void

  // Unsaved-changes protection (quotation form)
  isQuoteFormDirty: boolean
  setQuoteFormDirty: (dirty: boolean) => void
  pendingUnsavedAction: (() => void) | null
  guardedRun: (action: () => void) => void
  confirmDiscard: () => void
  cancelDiscard: () => void

  // Quotation operations (T4)
  addQuotation: (input: QuotationInput, requestKey?: string) => QuotationView
  updateQuotation: (
    id: string,
    input: QuotationInput,
    expectedVersion?: number,
    requestKey?: string,
  ) => QuotationView | undefined
  transitionQuotation: (
    id: string,
    action: QuotationAction,
    expectedVersion?: number,
    requestKey?: string,
  ) => QuotationView
  createQuotationRevision: (id: string, expectedVersion?: number, requestKey?: string) => QuotationView
  convertQuotationToJob: (
    id: string,
    expectedVersion?: number,
    requestKey?: string,
  ) => { quotation: QuotationView; job: JobView }

  // Job operations (T4)
  transitionJob: (
    id: string,
    action: JobAction,
    reason?: string,
    expectedVersion?: number,
    requestKey?: string,
  ) => JobView
  changeJobStage: (
    id: string,
    target: Stage,
    reason?: string,
    expectedVersion?: number,
    requestKey?: string,
  ) => JobView

  // Supporting entities
  addContact: (contact: Omit<Contact, 'id'>) => Contact
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => InventoryItem
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => StockMovement

  resetStore: () => void
}
