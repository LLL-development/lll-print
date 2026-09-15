import { useMemo, useRef, useState, type ReactNode } from 'react'
import { memoryStore } from '../adapters/memoryStore'
import type { T2FoundationState } from '../adapters/types'
import type { DisplayRole } from '../app/navigationTypes'
import type { Contact, InventoryItem, StockMovement } from '../domain/models'
import type { JobAction, JobView, Stage } from '../features/jobs/domain/types'
import type {
  QuotationAction,
  QuotationInput,
  QuotationView,
} from '../features/quotations/domain/types'
import { SyntheticStoreContext } from './storeContext'
import type { ModalKind } from './types'

function generateRequestKey(operation: string, targetId: string): string {
  return `${operation}-${targetId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function SyntheticStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<T2FoundationState>(() => memoryStore.getState())
  const [displayRole, setDisplayRole] = useState<DisplayRole>('Staff')
  const [modal, setModal] = useState<ModalKind>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [preselectedCustomerId, setPreselectedCustomerId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [isQuoteFormDirty, setIsQuoteFormDirtyState] = useState(false)
  const [pendingUnsavedAction, setPendingUnsavedAction] = useState<(() => void) | null>(null)

  // A same-tick "set dirty false, then immediately try to close" sequence
  // (the successful-save path) cannot rely on the isQuoteFormDirty state
  // value above being current: React does not apply a setState synchronously
  // within the same call stack, so a guard check right after would still see
  // the stale (dirty) value. This ref is updated in the same statement as
  // the state, so guardedRun's gating check is always current.
  const isDirtyRef = useRef(false)

  function setQuoteFormDirty(dirty: boolean) {
    isDirtyRef.current = dirty
    setIsQuoteFormDirtyState(dirty)
  }

  // Runs `action` immediately when the quotation form is clean; when dirty,
  // defers it behind the "Keep editing / Discard changes" prompt instead of
  // silently discarding in-progress edits (SDD "Unsaved navigation", AT-06).
  function guardedRun(action: () => void) {
    if (isDirtyRef.current) {
      setPendingUnsavedAction(() => action)
    } else {
      action()
    }
  }

  function confirmDiscard() {
    const action = pendingUnsavedAction
    setPendingUnsavedAction(null)
    setQuoteFormDirty(false)
    action?.()
  }

  function cancelDiscard() {
    setPendingUnsavedAction(null)
  }

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const selectedJob = useMemo(
    () => (selectedJobId ? state.jobs.find((j) => j.id === selectedJobId) ?? null : null),
    [state.jobs, selectedJobId],
  )

  const selectedQuotation = useMemo(
    () => (selectedQuotationId ? state.quotations.find((q) => q.id === selectedQuotationId) ?? null : null),
    [state.quotations, selectedQuotationId],
  )

  function openModal(kind: ModalKind, payload?: JobView | QuotationView | { id?: string; customerId?: string }) {
    if (kind === 'jobDetail') {
      const id = payload && 'id' in payload && payload.id ? payload.id : null
      setSelectedJobId(id)
      setSelectedQuotationId(null)
      setPreselectedCustomerId(null)
    } else if (kind === 'quoteDetail' || kind === 'quote') {
      const id = payload && 'id' in payload && payload.id ? payload.id : null
      const custId = payload && 'customerId' in payload && payload.customerId ? payload.customerId : null
      setSelectedQuotationId(id)
      setSelectedJobId(null)
      setPreselectedCustomerId(custId)
    } else {
      setSelectedJobId(null)
      setSelectedQuotationId(null)
      setPreselectedCustomerId(null)
    }
    setModal(kind)
  }

  function closeModal() {
    setModal(null)
    setPreselectedCustomerId(null)
  }

  function selectQuotationId(id: string | null) {
    setSelectedQuotationId(id)
  }

  function selectJobId(id: string | null) {
    setSelectedJobId(id)
  }

  // --- Quotation Operations ---

  function addQuotation(input: QuotationInput, requestKey?: string): QuotationView {
    const key = requestKey ?? generateRequestKey('addQuote', 'new')
    const created = memoryStore.addQuotation(input, { requestKey: key, actorLabel: displayRole })
    setState(memoryStore.getState())
    notify(`${created.number} saved as draft quotation`)
    return created
  }

  function updateQuotation(
    id: string,
    input: QuotationInput,
    expectedVersion?: number,
    requestKey?: string,
  ): QuotationView | undefined {
    const current = state.quotations.find((q) => q.id === id)
    const version = expectedVersion ?? current?.version ?? 1
    const key = requestKey ?? generateRequestKey('updateQuote', id)
    const updated = memoryStore.updateQuotation(
      id,
      { expectedVersion: version, quotation: input },
      { requestKey: key, actorLabel: displayRole },
    )
    setState(memoryStore.getState())
    if (updated) {
      notify(`${updated.number} updated successfully`)
    }
    return updated
  }

  function transitionQuotation(
    id: string,
    action: QuotationAction,
    expectedVersion?: number,
    requestKey?: string,
  ): QuotationView {
    const current = state.quotations.find((q) => q.id === id)
    const version = expectedVersion ?? current?.version ?? 1
    const key = requestKey ?? generateRequestKey('transQuote', id)
    const updated = memoryStore.transitionQuotation(
      id,
      { expectedVersion: version, action },
      { requestKey: key, actorLabel: displayRole },
    )
    setState(memoryStore.getState())
    const actionLabel = action === 'send' ? 'marked as sent' : action === 'accept' ? 'accepted' : 'declined'
    notify(`Quotation ${updated.number} ${actionLabel}`)
    return updated
  }

  function createQuotationRevision(id: string, expectedVersion?: number, requestKey?: string): QuotationView {
    const current = state.quotations.find((q) => q.id === id)
    const version = expectedVersion ?? current?.version ?? 1
    const key = requestKey ?? generateRequestKey('revQuote', id)
    const newRev = memoryStore.createQuotationRevision(
      id,
      { expectedVersion: version },
      { requestKey: key, actorLabel: displayRole },
    )
    setState(memoryStore.getState())
    setSelectedQuotationId(newRev.id)
    notify(`Created draft revision ${newRev.revision} (${newRev.number})`)
    return newRev
  }

  function convertQuotationToJob(
    id: string,
    expectedVersion?: number,
    requestKey?: string,
  ): { quotation: QuotationView; job: JobView } {
    const current = state.quotations.find((q) => q.id === id)
    const version = expectedVersion ?? current?.version ?? 1
    const key = requestKey ?? generateRequestKey('convQuote', id)
    const result = memoryStore.convertQuotationToJob(
      id,
      { expectedVersion: version },
      { requestKey: key, actorLabel: displayRole },
    )
    setState(memoryStore.getState())
    setSelectedQuotationId(result.quotation.id)
    notify(`Quotation ${result.quotation.number} converted to Job ${result.job.number}`)
    return result
  }

  // --- Job Operations ---

  function transitionJob(
    id: string,
    action: JobAction,
    reason?: string,
    expectedVersion?: number,
    requestKey?: string,
  ): JobView {
    const current = state.jobs.find((j) => j.id === id)
    const version = expectedVersion ?? current?.version ?? 1
    const key = requestKey ?? generateRequestKey('transJob', id)
    const updated = memoryStore.transitionJob(
      id,
      { expectedVersion: version, action, reason },
      { requestKey: key, actorLabel: displayRole },
    )
    setState(memoryStore.getState())
    const actionMsg =
      action === 'start'
        ? 'started into production'
        : action === 'ready'
          ? 'ready for delivery'
          : action === 'deliver'
            ? 'delivered'
            : 'cancelled'
    notify(`Job ${updated.number} ${actionMsg}`)
    return updated
  }

  function changeJobStage(
    id: string,
    target: Stage,
    reason?: string,
    expectedVersion?: number,
    requestKey?: string,
  ): JobView {
    const current = state.jobs.find((j) => j.id === id)
    const version = expectedVersion ?? current?.version ?? 1
    const key = requestKey ?? generateRequestKey('stageJob', id)
    const updated = memoryStore.changeJobStage(
      id,
      { expectedVersion: version, target, reason },
      { requestKey: key, actorLabel: displayRole },
    )
    setState(memoryStore.getState())
    notify(`Job ${updated.number} moved to ${target} stage`)
    return updated
  }

  // --- Supporting Entities ---

  function addContact(contact: Omit<Contact, 'id'>) {
    const created = memoryStore.addContact(contact)
    setState(memoryStore.getState())
    notify(`${created.name} added to contacts`)
    return created
  }

  function addInventoryItem(item: Omit<InventoryItem, 'id'>) {
    const created = memoryStore.addInventoryItem(item)
    setState(memoryStore.getState())
    notify(`${created.name} added to inventory`)
    return created
  }

  function addStockMovement(movement: Omit<StockMovement, 'id'>) {
    const created = memoryStore.addStockMovement(movement)
    setState(memoryStore.getState())
    notify('Stock movement logged')
    return created
  }

  function resetStore() {
    memoryStore.resetToFixtures()
    setState(memoryStore.getState())
    setSelectedJobId(null)
    setSelectedQuotationId(null)
    setModal(null)
    setQuoteFormDirty(false)
    setPendingUnsavedAction(null)
    notify('Demo data reset to default fixtures')
  }

  return (
    <SyntheticStoreContext.Provider
      value={{
        state,
        displayRole,
        setDisplayRole,
        modal,
        selectedJobId,
        selectedQuotationId,
        selectedJob,
        selectedQuotation,
        openModal,
        closeModal,
        preselectedCustomerId,
        selectQuotationId,
        selectJobId,
        toast,
        notify,
        isQuoteFormDirty,
        setQuoteFormDirty,
        pendingUnsavedAction,
        guardedRun,
        confirmDiscard,
        cancelDiscard,
        addQuotation,
        updateQuotation,
        transitionQuotation,
        createQuotationRevision,
        convertQuotationToJob,
        transitionJob,
        changeJobStage,
        addContact,
        addInventoryItem,
        addStockMovement,
        resetStore,
      }}
    >
      {children}
    </SyntheticStoreContext.Provider>
  )
}
