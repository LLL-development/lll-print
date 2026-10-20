import { useState } from 'react'
import { memoryStore } from '../../../adapters/memoryStore'
import { useSyntheticStore } from '../../../context/useSyntheticStore'
import { formatMalaysiaDate, formatMYR } from '../../../lib/formatters'
import { useStableRequestKey } from '../../../lib/useStableRequestKey'
import { evaluateSendReadiness } from '../domain/calculations'
import type { ActivityEntry } from '../../../adapters/activity'
import type { QuotationAction, QuotationFamilyRecord, QuotationView } from '../domain/types'
import QuotationConversionConfirm from './QuotationConversionConfirm'
import QuotationLifecycleActions from './QuotationLifecycleActions'
import QuotationRevisionHistory from './QuotationRevisionHistory'
import SendReadinessBadge from './SendReadinessBadge'

interface QuotationDetailModalProps {
  quotation: QuotationView
  onClose: () => void
  onEdit: (quotation: QuotationView) => void
}

const HISTORY_PAGE_SIZE = 25

export default function QuotationDetailModal({ quotation, onClose, onEdit }: QuotationDetailModalProps) {
  const {
    transitionQuotation,
    createQuotationRevision,
    convertQuotationToJob,
    selectQuotationId,
  } = useSyntheticStore()

  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')
  const [showConfirmConversion, setShowConfirmConversion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  interface HistoryPageState {
    revisions: QuotationView[]
    revisionsCursor: string | null
    activities: ActivityEntry[]
    activitiesCursor: string | null
  }

  function loadFirstHistoryPage(): HistoryPageState {
    const firstRevisions = memoryStore.listQuotationRevisions(quotation.familyId, { limit: HISTORY_PAGE_SIZE })
    const firstActivities = memoryStore.listQuotationActivity(quotation.familyId, { limit: HISTORY_PAGE_SIZE })
    return {
      revisions: firstRevisions.items,
      revisionsCursor: firstRevisions.nextCursor,
      activities: firstActivities.items,
      activitiesCursor: firstActivities.nextCursor,
    }
  }

  const [history, setHistory] = useState<HistoryPageState>(loadFirstHistoryPage)
  const { revisions: allRevisions, revisionsCursor, activities, activitiesCursor } = history

  const transitionKey = useStableRequestKey(`transQuote-${quotation.familyId}`)
  const reviseKey = useStableRequestKey(`revQuote-${quotation.familyId}`)
  const convertKey = useStableRequestKey(`convQuote-${quotation.familyId}`)

  // Reload the history's first page (during render, not an effect) whenever a
  // different family is shown or this family's version advances after a
  // successful mutation. This is the documented "adjusting state when a prop
  // changes" pattern rather than a setState-in-effect round trip.
  const historyKey = `${quotation.familyId}:${quotation.version}`
  const [loadedHistoryKey, setLoadedHistoryKey] = useState(historyKey)
  if (historyKey !== loadedHistoryKey) {
    setLoadedHistoryKey(historyKey)
    setHistory(loadFirstHistoryPage())
  }

  function handleLoadMoreRevisions() {
    if (!revisionsCursor) return
    const next = memoryStore.listQuotationRevisions(quotation.familyId, {
      limit: HISTORY_PAGE_SIZE,
      cursor: revisionsCursor,
    })
    setHistory((prev) => ({
      ...prev,
      revisions: [...prev.revisions, ...next.items],
      revisionsCursor: next.nextCursor,
    }))
  }

  function handleLoadMoreActivity() {
    if (!activitiesCursor) return
    const next = memoryStore.listQuotationActivity(quotation.familyId, {
      limit: HISTORY_PAGE_SIZE,
      cursor: activitiesCursor,
    })
    setHistory((prev) => ({
      ...prev,
      activities: [...prev.activities, ...next.items],
      activitiesCursor: next.nextCursor,
    }))
  }

  const latestRevision = allRevisions.find((r) => r.isLatest) || quotation
  const convertedJobId = allRevisions.find((r) => r.jobId !== null)?.jobId ?? null

  const family: QuotationFamilyRecord = {
    id: quotation.familyId,
    latestRevisionId: latestRevision.id,
    convertedJobId,
    version: quotation.version,
  }

  const readiness = evaluateSendReadiness(
    {
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      dueDate: quotation.dueDate,
      sourceNote: quotation.sourceNote,
      lines: quotation.lines,
      discountAmount: quotation.totals.discountAmount,
      taxRate: quotation.totals.taxRate,
      notes: quotation.notes,
    },
    quotation.totals,
  )

  const isEditableDraft =
    quotation.status === 'draft' &&
    quotation.isLatest &&
    family.convertedJobId === null

  function handleTransition(action: QuotationAction) {
    try {
      setIsSubmitting(true)
      setActionError(null)
      const key = transitionKey.getKey({ quotationId: quotation.id, action, expectedVersion: quotation.version })
      transitionQuotation(quotation.id, action, quotation.version, key)
      transitionKey.reset()
    } catch (err: any) {
      setActionError(err.message || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleRevise() {
    try {
      setIsSubmitting(true)
      setActionError(null)
      const key = reviseKey.getKey({ quotationId: quotation.id, expectedVersion: quotation.version })
      createQuotationRevision(quotation.id, quotation.version, key)
      reviseKey.reset()
    } catch (err: any) {
      setActionError(err.message || 'Failed to create revision')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleConfirmConversion() {
    try {
      setIsSubmitting(true)
      setActionError(null)
      const key = convertKey.getKey({ quotationId: quotation.id, expectedVersion: quotation.version })
      convertQuotationToJob(quotation.id, quotation.version, key)
      convertKey.reset()
      setShowConfirmConversion(false)
    } catch (err: any) {
      setActionError(err.message || 'Conversion failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showConfirmConversion) {
    return (
      <QuotationConversionConfirm
        quotation={quotation}
        onConfirm={handleConfirmConversion}
        onCancel={() => {
          setShowConfirmConversion(false)
          setActionError(null)
        }}
        isSubmitting={isSubmitting}
        error={actionError}
      />
    )
  }

  return (
    <div className="quotation-detail-view" data-testid="quotation-detail-modal">
      <div className="segmented" style={{ marginBottom: '14px' }}>
        <button
          type="button"
          className={activeTab === 'details' ? 'active' : ''}
          onClick={() => setActiveTab('details')}
        >
          Details & Items
        </button>
        <button
          type="button"
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Revisions & Activity ({allRevisions.length})
        </button>
      </div>

      {actionError && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: '12px' }}>
          {actionError}
        </div>
      )}

      {activeTab === 'history' ? (
        <QuotationRevisionHistory
          revisions={allRevisions}
          currentQuotationId={quotation.id}
          onSelectRevision={(rev) => selectQuotationId(rev.id)}
          hasMoreRevisions={revisionsCursor !== null}
          onLoadMoreRevisions={handleLoadMoreRevisions}
          activities={activities}
          hasMoreActivities={activitiesCursor !== null}
          onLoadMoreActivities={handleLoadMoreActivity}
        />
      ) : (
        <>
          <div className="detail-meta-grid">
            <div className="meta-card">
              <small>Customer</small>
              <strong>{quotation.customerName || '— (None selected)'}</strong>
            </div>
            <div className="meta-card">
              <small>Requested Due Date</small>
              <strong>{quotation.dueDate ? formatMalaysiaDate(quotation.dueDate) : '—'}</strong>
            </div>
            <div className="meta-card">
              <small>Enquiry source</small>
              <strong>{quotation.sourceNote || '—'}</strong>
            </div>
            <div className="meta-card">
              <small>Status & Revision</small>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className={`status status-${quotation.status}`}>{quotation.status}</span>
                <span className="badge badge-neutral">Rev {quotation.revision}</span>
              </div>
            </div>
          </div>

          <QuotationLifecycleActions
            quotation={quotation}
            family={family}
            readiness={readiness}
            onTransition={handleTransition}
            onRevise={handleRevise}
            onOpenConvertModal={() => setShowConfirmConversion(true)}
            isSubmitting={isSubmitting}
          />

          <div className="detail-readiness-banner" style={{ marginTop: '12px' }}>
            <SendReadinessBadge readiness={readiness} showDetails={quotation.status === 'draft'} />
          </div>

          <div className="table-wrap detail-lines-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.lines.map((line, idx) => (
                  <tr key={line.id || idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{line.description || '—'}</strong>
                    </td>
                    <td>{line.quantity ?? '—'}</td>
                    <td>{line.unit || 'pcs'}</td>
                    <td>{line.unitPrice ? formatMYR(line.unitPrice) : '—'}</td>
                    <td>
                      <strong>{quotation.lineTotals[idx] ? formatMYR(quotation.lineTotals[idx]!) : '—'}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="detail-totals-box">
            <div className="totals-summary-list">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>{formatMYR(quotation.totals.subtotal)}</span>
              </div>
              {quotation.totals.discountAmount !== '0.00' && (
                <div className="summary-line text-muted">
                  <span>Discount</span>
                  <span>-{formatMYR(quotation.totals.discountAmount)}</span>
                </div>
              )}
              {quotation.totals.taxRate !== '0.00' && (
                <div className="summary-line text-muted">
                  <span>Tax ({quotation.totals.taxRate}%)</span>
                  <span>+{formatMYR(quotation.totals.taxAmount)}</span>
                </div>
              )}
              <div className="summary-line grand-total-line">
                <strong>Grand Total</strong>
                <strong>{formatMYR(quotation.totals.grandTotal)}</strong>
              </div>
            </div>
          </div>

          {quotation.notes && (
            <div className="detail-notes-box">
              <small>Notes</small>
              <p>{quotation.notes}</p>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Close preview
            </button>
            {isEditableDraft && (
              <button type="button" className="primary" onClick={() => onEdit(quotation)}>
                Edit draft
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
