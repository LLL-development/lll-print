import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSyntheticStore } from '../../../context/useSyntheticStore'
import { useStableRequestKey } from '../../../lib/useStableRequestKey'
import { calculateLineTotal, calculateQuotationTotals, evaluateSendReadiness } from '../domain/calculations'
import type { DraftLine, QuotationInput, QuotationView } from '../domain/types'
import { validateDraftQuotation, type FieldErrors } from '../domain/validation'
import CustomerPicker from './CustomerPicker'
import QuotationLineItemRow from './QuotationLineItemRow'
import QuotationTotalsSummary from './QuotationTotalsSummary'

interface QuotationFormProps {
  initialQuotation?: QuotationView | null
  onClose: () => void
  onSaveSuccess?: (saved: QuotationView) => void
}

const DEFAULT_LINE: DraftLine = {
  description: '',
  quantity: '1',
  unit: 'pcs',
  unitPrice: '0.00',
}

export default function QuotationForm({ initialQuotation, onClose, onSaveSuccess }: QuotationFormProps) {
  const { state, addQuotation, updateQuotation, setQuoteFormDirty, preselectedCustomerId } = useSyntheticStore()

  const preselectedContact =
    !initialQuotation && preselectedCustomerId
      ? state.contacts.find((c) => c.id === preselectedCustomerId && c.type === 'Customer')
      : null

  // Form State
  const [customerId, setCustomerId] = useState<string | null>(
    initialQuotation?.customerId ?? preselectedContact?.id ?? null,
  )
  const [customerName, setCustomerName] = useState<string>(
    initialQuotation?.customerName ?? preselectedContact?.name ?? '',
  )
  const [dueDate, setDueDate] = useState<string>(initialQuotation?.dueDate ?? '')
  const [sourceNote, setSourceNote] = useState<string>(initialQuotation?.sourceNote ?? '')
  const [lines, setLines] = useState<DraftLine[]>(() => {
    if (initialQuotation) {
      return initialQuotation.lines ? initialQuotation.lines.map((l) => ({ ...l })) : []
    }
    return [{ ...DEFAULT_LINE }]
  })
  const [discountAmount, setDiscountAmount] = useState<string>(initialQuotation?.totals?.discountAmount ?? '0.00')
  const [taxRate, setTaxRate] = useState<string>(initialQuotation?.totals?.taxRate ?? '0.00')
  const [notes, setNotes] = useState<string>(initialQuotation?.notes ?? '')

  // Error States
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [summaryErrors, setSummaryErrors] = useState<string[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errorSummaryRef = useRef<HTMLDivElement | null>(null)
  const saveKey = useStableRequestKey(
    initialQuotation?.id ? `updateQuote-${initialQuotation.id}` : 'addQuote-new',
  )

  // Unsaved-changes detection: compare the current field values (including an
  // incomplete/blank draft) against a snapshot captured once at mount, so any
  // deviation from what the form opened with — not just from "empty" — counts
  // as dirty (SDD "Unsaved navigation", AT-06).
  const currentSnapshot = JSON.stringify({
    customerId,
    customerName,
    dueDate,
    sourceNote,
    lines,
    discountAmount,
    taxRate,
    notes,
  })
  // useState's lazy initializer runs exactly once, on the first render, so
  // this permanently captures the form's opening values without touching a
  // ref during render.
  const [initialSnapshot] = useState(() => currentSnapshot)
  const isDirty = currentSnapshot !== initialSnapshot

  useEffect(() => {
    setQuoteFormDirty(isDirty)
  }, [isDirty, setQuoteFormDirty])

  // Clear the dirty flag on unmount so a stale "dirty" state can never leak
  // into a later, unrelated view once this form is gone. setQuoteFormDirty is
  // the React state setter forwarded through context, which is stable for
  // the provider's lifetime, so this intentionally runs only once.
  useEffect(() => {
    return () => setQuoteFormDirty(false)
  }, [setQuoteFormDirty])

  // Best-effort protection against losing edits to a browser refresh or tab
  // close while dirty; removed as soon as the form is clean or unmounts.
  useEffect(() => {
    if (!isDirty) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Live Totals Calculation
  const totals = calculateQuotationTotals(lines, discountAmount, taxRate, {
    customerId,
    dueDate,
    sourceNote,
  })

  // Live Line Totals (requires description and unit)
  const lineTotals = lines.map((line) =>
    calculateLineTotal(line.quantity, line.unitPrice, line.description, line.unit),
  )

  // Live Send Readiness
  const readiness = evaluateSendReadiness(
    {
      customerId,
      customerName,
      dueDate,
      sourceNote,
      lines,
      discountAmount,
      taxRate,
      notes,
    },
    totals,
  )

  // Focus error summary whenever errors occur
  useEffect(() => {
    if ((summaryErrors.length > 0 || saveError) && errorSummaryRef.current) {
      errorSummaryRef.current.focus()
    }
  }, [summaryErrors, saveError])

  function handleAddLine() {
    if (lines.length >= 200) return
    setLines((prev) => [
      ...prev,
      {
        description: '',
        quantity: '1',
        unit: 'pcs',
        unitPrice: '0.00',
      },
    ])
  }

  function handleRemoveLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  function handleLineChange(index: number, updated: DraftLine) {
    setLines((prev) => {
      const copy = [...prev]
      copy[index] = updated
      return copy
    })
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaveError(null)

    const input: QuotationInput = {
      customerId,
      customerName,
      dueDate: dueDate || null,
      sourceNote,
      lines,
      discountAmount,
      taxRate,
      notes,
    }

    // 1. Validate draft constraints (excessive discount, negative numbers, overflow)
    const validation = validateDraftQuotation(input, totals.subtotal)
    if (!validation.isValid) {
      setFieldErrors(validation.fieldErrors)
      setSummaryErrors(validation.summaryErrors)
      return
    }

    setFieldErrors({})
    setSummaryErrors([])
    setIsSubmitting(true)

    try {
      let result: QuotationView | undefined
      if (initialQuotation?.id) {
        const key = saveKey.getKey({ id: initialQuotation.id, input, expectedVersion: initialQuotation.version })
        result = updateQuotation(initialQuotation.id, input, initialQuotation.version, key)
      } else {
        const key = saveKey.getKey({ input })
        result = addQuotation(input, key)
      }
      saveKey.reset()

      if (result) {
        // Clear dirty state synchronously before closing: a successful save
        // must close without the discard-changes prompt, and the isDirty
        // effect above would not have run yet within this same tick.
        setQuoteFormDirty(false)
        onSaveSuccess?.(result)
        onClose()
      }
    } catch (err: unknown) {
      // Retain all entered values in state (FR-1.7) and show recoverable error
      const message = err instanceof Error ? err.message : 'Storage failure occurred while saving draft'
      setSaveError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = Boolean(initialQuotation?.id)

  return (
    <form onSubmit={handleSubmit} className="quotation-form" noValidate>
      {/* Accessible Error Summary (FR-1.7) */}
      {(summaryErrors.length > 0 || saveError) && (
        <div
          ref={errorSummaryRef}
          className="form-error-summary"
          role="alert"
          tabIndex={-1}
          aria-live="assertive"
        >
          <h4>Please review the following issue{summaryErrors.length > 1 ? 's' : ''}:</h4>
          {saveError && <p className="save-failure-text">{saveError}</p>}
          {summaryErrors.length > 0 && (
            <ul>
              {summaryErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="quotation-form-body">
        <div className="quotation-form-main">
          <section className="form-section header-fields-section">
            <CustomerPicker
              selectedCustomerId={customerId}
              onSelectCustomer={(contact) => {
                setCustomerId(contact?.id ?? null)
                setCustomerName(contact?.name ?? '')
              }}
              error={fieldErrors.customerId}
            />

            <div className="form-row-2col">
              <div className="form-field">
                <label htmlFor="quotation-due-date">
                  Requested Due Date
                </label>
                <input
                  id="quotation-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="quotation-source-note">
                  Enquiry source
                </label>
                <input
                  id="quotation-source-note"
                  type="text"
                  placeholder="e.g. WhatsApp, 28 Aug"
                  value={sourceNote}
                  onChange={(e) => setSourceNote(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.sourceNote)}
                  maxLength={200}
                />
                {fieldErrors.sourceNote && (
                  <small className="field-error-text">{fieldErrors.sourceNote}</small>
                )}
              </div>
            </div>
          </section>

          <section className="form-section line-items-section">
            <div className="section-title-row">
              <h4>Quotation item lines {lines.length > 0 ? `(${lines.length}/200)` : ''}</h4>
              <button
                type="button"
                className="ghost add-line-btn"
                onClick={handleAddLine}
                disabled={lines.length >= 200}
                title={lines.length >= 200 ? 'Maximum 200 lines reached' : undefined}
              >
                + Add line item {lines.length > 0 ? `(${lines.length}/200)` : ''}
              </button>
            </div>

            <div className="line-items-container">
              {lines.length === 0 ? (
                <div className="empty-lines-card" style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', background: '#fff', borderRadius: '10px', border: '1px dashed var(--line)' }}>
                  <p style={{ margin: 0, fontSize: '13px' }}>No line items in this draft. Click "+ Add line item" to add a line.</p>
                </div>
              ) : (
                lines.map((line, index) => (
                  <QuotationLineItemRow
                    key={line.id || `line-${index}`}
                    index={index}
                    line={line}
                    lineTotal={lineTotals[index]}
                    onChange={handleLineChange}
                    onRemove={handleRemoveLine}
                    canRemove={true}
                    errors={fieldErrors.lines?.[index]}
                  />
                ))
              )}
            </div>
          </section>

          <section className="form-section notes-section">
            <label htmlFor="quotation-notes">Order & Production Notes</label>
            <textarea
              id="quotation-notes"
              rows={3}
              placeholder="Internal production or customer delivery notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
            />
          </section>
        </div>

        <aside className="quotation-form-sidebar">
          <QuotationTotalsSummary
            totals={totals}
            discountInput={discountAmount}
            taxRateInput={taxRate}
            onDiscountChange={setDiscountAmount}
            onTaxRateChange={setTaxRate}
            discountError={fieldErrors.discountAmount || totals.discountError}
            taxRateError={fieldErrors.taxRate || totals.taxRateError}
            readiness={readiness}
          />
        </aside>
      </div>

      <div className="modal-actions">
        <button type="button" className="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={isSubmitting}>
          {isEditing ? 'Save draft changes' : 'Save draft quotation'}
        </button>
      </div>
    </form>
  )
}
