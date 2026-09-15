import { useEffect, useRef, type FormEvent } from 'react'
import { useSyntheticStore } from '../../context/useSyntheticStore'
import type { ModalKind } from '../../context/types'
import type { Contact } from '../../domain/models'
import QuotationForm from '../../features/quotations/components/QuotationForm'
import QuotationDetailModal from '../../features/quotations/components/QuotationDetailModal'
import UnsavedChangesPrompt from '../../features/quotations/components/UnsavedChangesPrompt'
import JobDetailDrawer from '../../features/jobs/components/JobDetailDrawer'

const FOCUSABLE_SELECTOR =
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'

type FieldSpec = {
  name: string
  label: string
  type?: string
  options?: string[]
  defaultValue?: string
  placeholder?: string
}

const modalConfig: Record<Exclude<ModalKind, null | 'job' | 'jobDetail' | 'quote' | 'quoteDetail'>, { title: string; submit: string; fields: FieldSpec[] }> = {
  contact: {
    title: 'Add contact',
    submit: 'Add contact',
    fields: [
      { name: 'type', label: 'Contact type', options: ['Customer', 'Supplier'] },
      { name: 'name', label: 'Business or customer name', placeholder: 'e.g. Harmoni Events' },
      { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+60 12-345 6789' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'orders@example.com' },
    ],
  },
  item: {
    title: 'Add inventory item',
    submit: 'Add item',
    fields: [
      { name: 'name', label: 'Item name', placeholder: 'e.g. White dry-fit shirt · L' },
      { name: 'sku', label: 'SKU', placeholder: 'TS-DRY-WHT-L' },
      { name: 'category', label: 'Category', options: ['Garment', 'Ink', 'Film', 'Thread', 'Packaging'] },
      { name: 'quantity', label: 'Opening quantity', type: 'number', defaultValue: '0' },
      { name: 'unit', label: 'Unit', options: ['pcs', 'L', 'kg', 'sheets', 'rolls'] },
      { name: 'reorder', label: 'Reorder level', type: 'number', defaultValue: '10' },
    ],
  },
  movement: {
    title: 'Log stock movement',
    submit: 'Record movement',
    fields: [
      { name: 'item', label: 'Inventory item', options: ['Black dry-fit shirt · M', 'DTF ink · Black', 'DTF transfer film · A3'] },
      { name: 'type', label: 'Movement', options: ['Receipt', 'Consumption', 'Adjustment'] },
      { name: 'quantity', label: 'Quantity', type: 'number', defaultValue: '10' },
      { name: 'reference', label: 'Reference', placeholder: 'PO-0833' },
    ],
  },
}

function Field({ name, label, type = 'text', options, defaultValue, placeholder }: FieldSpec) {
  return (
    <label>
      {label}
      {options ? (
        <select name={name} defaultValue={defaultValue}>
          {options.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required />
      )}
    </label>
  )
}

function ModalHeader({ id, title, close }: { id: string; title: string; close: () => void }) {
  return (
    <header className="modal-header">
      <h2 id={id}>{title}</h2>
      <button onClick={close} aria-label="Close" type="button" className="modal-close-btn">
        ×
      </button>
    </header>
  )
}

export default function ModalRoot() {
  const {
    modal,
    selectedJob,
    selectedQuotation,
    openModal,
    closeModal,
    addContact,
    addInventoryItem,
    addStockMovement,
    pendingUnsavedAction,
    guardedRun,
    confirmDiscard,
    cancelDiscard,
  } = useSyntheticStore()

  const containerRef = useRef<HTMLElement | null>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)

  // Kept current after every render (via effects, not during render itself)
  // so the persistent window keydown listener below never acts on a stale
  // closure without needing to tear down and rebind on every unrelated
  // context update.
  const modalRef = useRef(modal)
  const closeModalRef = useRef(closeModal)
  const guardedRunRef = useRef(guardedRun)

  useEffect(() => {
    modalRef.current = modal
    closeModalRef.current = closeModal
    guardedRunRef.current = guardedRun
  })

  function focusFirstField() {
    const container = containerRef.current
    if (!container) return
    const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    if (focusables.length > 0) {
      const firstField = focusables.find(
        (el) => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA',
      )
      ;(firstField || focusables[0]).focus()
    } else {
      container.focus()
    }
  }

  // Closing the quotation form always goes through the unsaved-changes guard;
  // every other modal kind closes exactly as before (guardedRun is a no-op
  // passthrough when the quotation form isn't the open/dirty one).
  function requestClose() {
    if (modal === 'quote') {
      guardedRun(closeModal)
    } else {
      closeModal()
    }
  }

  useEffect(() => {
    if (!modal) return

    triggerElementRef.current = document.activeElement as HTMLElement | null
    focusFirstField()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        // While the unsaved-changes prompt is open, its own capture-phase
        // window listener runs first (capture always precedes bubble) and
        // stops propagation, so this bubble-phase branch only ever runs when
        // no prompt is showing.
        if (modalRef.current === 'quote') {
          guardedRunRef.current(closeModalRef.current)
        } else {
          closeModalRef.current()
        }
        return
      }

      if (e.key === 'Tab') {
        const currentContainer = containerRef.current
        if (!currentContainer) return

        const focusables = Array.from(currentContainer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

        if (focusables.length === 0) {
          e.preventDefault()
          return
        }

        const firstElement = focusables[0]
        const lastElement = focusables[focusables.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !currentContainer.contains(document.activeElement)) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement || !currentContainer.contains(document.activeElement)) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus()
      }
    }
  }, [modal])

  // Restore focus into the (now interactive again) form once the
  // unsaved-changes prompt closes without closing the whole modal — i.e.
  // "Keep editing", or Escape-as-keep-editing inside the prompt itself. This
  // must run after the prompt has actually unmounted and the underlying
  // form's `inert` attribute has been removed (both happen on this same
  // render), which a plain function call from the prompt's own handler
  // cannot guarantee, since that runs before React commits the update.
  const wasPromptOpenRef = useRef(false)
  useEffect(() => {
    const wasOpen = wasPromptOpenRef.current
    wasPromptOpenRef.current = Boolean(pendingUnsavedAction)
    if (wasOpen && !pendingUnsavedAction && modal === 'quote') {
      focusFirstField()
    }
  }, [pendingUnsavedAction, modal])

  if (!modal) return null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    if (modal === 'contact') {
      addContact({
        name: String(data.get('name')),
        type: String(data.get('type')) as Contact['type'],
        phone: String(data.get('phone')),
        email: String(data.get('email')),
      })
    } else if (modal === 'item') {
      addInventoryItem({
        sku: String(data.get('sku')),
        name: String(data.get('name')),
        category: String(data.get('category')),
        quantity: Number(data.get('quantity')),
        reorderLevel: Number(data.get('reorder')),
        unit: String(data.get('unit')),
      })
    } else if (modal === 'movement') {
      addStockMovement({
        itemId: 'I-01',
        itemName: String(data.get('item')),
        type: String(data.get('type')) as 'Receipt' | 'Consumption' | 'Adjustment',
        quantity: Number(data.get('quantity')),
        balance: 100,
        reference: String(data.get('reference')),
        date: new Date().toISOString().slice(0, 10),
      })
    }
    closeModal()
  }

  // Job Detail Drawer
  if (modal === 'jobDetail' && selectedJob) {
    return (
      <div className="modal-backdrop" onMouseDown={closeModal}>
        <section
          ref={containerRef}
          className="drawer"
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-drawer-title"
          tabIndex={-1}
        >
          <ModalHeader
            id="job-drawer-title"
            title={`${selectedJob.number} · ${selectedJob.customer?.displayName || 'Print Order'}`}
            close={closeModal}
          />
          <JobDetailDrawer job={selectedJob} onClose={closeModal} />
        </section>
      </div>
    )
  }

  if (modal === 'jobDetail') return null

  // Direct Job Creation Notice (SDD § 4/5: jobs only created via conversion)
  if (modal === 'job') {
    return (
      <div className="modal-backdrop" onMouseDown={closeModal}>
        <section
          ref={containerRef}
          className="modal"
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-redirect-title"
          tabIndex={-1}
        >
          <ModalHeader id="job-redirect-title" title="Create Production Job" close={closeModal} />
          <div style={{ padding: '8px 0' }}>
            <p>
              In accordance with shop policy (SDD § 4/5), print jobs are created exclusively by converting approved, accepted quotations.
            </p>
            <p className="text-muted">
              Please create or locate a quotation and record customer acceptance before converting to a production job.
            </p>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                closeModal()
                openModal('quote')
              }}
            >
              Go to Quotations →
            </button>
          </div>
        </section>
      </div>
    )
  }

  // Quotation Edit/Create Form Modal
  if (modal === 'quote') {
    const isEditing = Boolean(selectedQuotation?.id)
    return (
      <div className="modal-backdrop" onMouseDown={requestClose}>
        <section
          ref={containerRef}
          className="modal modal-wide"
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quotation-dialog-title"
          tabIndex={-1}
        >
          {/* `inert` while the discard prompt is open: blocks pointer
              interaction, removes this subtree from the tab order, and hides
              it from assistive-technology navigation, so the covered form
              cannot be reached by any means while the nested confirmation is
              active. Keyboard trapping is handled independently by the
              prompt's own capture-phase listener (see UnsavedChangesPrompt). */}
          <div inert={pendingUnsavedAction ? true : undefined}>
            <ModalHeader
              id="quotation-dialog-title"
              title={isEditing ? `Edit draft quotation ${selectedQuotation?.number}` : 'New draft quotation'}
              close={requestClose}
            />
            <QuotationForm
              initialQuotation={selectedQuotation}
              onClose={requestClose}
            />
          </div>
          {pendingUnsavedAction && (
            <UnsavedChangesPrompt onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />
          )}
        </section>
      </div>
    )
  }

  // Quotation Detail Modal
  if (modal === 'quoteDetail' && selectedQuotation) {
    return (
      <div className="modal-backdrop" onMouseDown={closeModal}>
        <section
          ref={containerRef}
          className="modal modal-wide"
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quotation-detail-title"
          tabIndex={-1}
        >
          <ModalHeader
            id="quotation-detail-title"
            title={
              selectedQuotation.status === 'draft'
                ? `Quotation ${selectedQuotation.number} (Draft)`
                : `Quotation ${selectedQuotation.number} (Revision ${selectedQuotation.revision})`
            }
            close={closeModal}
          />
          <QuotationDetailModal
            quotation={selectedQuotation}
            onClose={closeModal}
            onEdit={(q) => openModal('quote', q)}
          />
        </section>
      </div>
    )
  }

  if (modal === 'quoteDetail') return null

  const config = modalConfig[modal as keyof typeof modalConfig]
  if (!config) return null

  return (
    <div className="modal-backdrop" onMouseDown={closeModal}>
      <section
        ref={containerRef}
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="creation-dialog-title"
        tabIndex={-1}
      >
        <ModalHeader id="creation-dialog-title" title={config.title} close={closeModal} />
        <form onSubmit={handleSubmit} className="modal-form">
          {config.fields.map((field) => (
            <Field key={field.name} {...field} />
          ))}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={closeModal}>
              Cancel
            </button>
            <button className="primary">{config.submit}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
