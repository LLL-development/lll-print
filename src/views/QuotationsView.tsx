import { useMemo } from 'react'
import EmptyState from '../components/ui/EmptyState'
import Heading from '../components/ui/Heading'
import Status from '../components/ui/Status'
import { useSyntheticStore } from '../context/useSyntheticStore'
import { evaluateSendReadiness } from '../features/quotations/domain/calculations'
import { formatMalaysiaDate, formatMYR } from '../lib/formatters'

export default function QuotationsView() {
  const { state, openModal } = useSyntheticStore()
  const { quotations } = state

  const latestQuotations = useMemo(() => quotations.filter((q) => q.isLatest), [quotations])

  // Commercial pipeline calculations
  const { readyCount, pipelineTotal } = useMemo(() => {
    let ready = 0
    let total = 0
    for (const q of latestQuotations) {
      const r = evaluateSendReadiness(
        {
          customerId: q.customerId,
          customerName: q.customerName,
          dueDate: q.dueDate,
          sourceNote: q.sourceNote,
          lines: q.lines,
          discountAmount: q.totals.discountAmount,
          taxRate: q.totals.taxRate,
          notes: q.notes,
        },
        q.totals,
      )
      if (r.isReady) ready++
      const gTotal = parseFloat(q.totals.grandTotal ?? '0') || 0
      total += gTotal
    }
    return { readyCount: ready, pipelineTotal: total }
  }, [latestQuotations])

  return (
    <div className="quotations-view">
      <Heading
        eyebrow="Sales & Commercial Pipeline"
        title="Quotations"
        text="Find and prepare offers. Create, review, and track customer quotation drafts."
        action="+ New quotation"
        onAction={() => openModal('quote')}
      />

      {/* Commercial Summary Ribbon */}
      <div className="quotations-summary-ribbon">
        <div className="quotation-stat-card">
          <div className="stat-card-icon">📄</div>
          <div className="stat-card-data">
            <span className="stat-card-label">Draft Offers</span>
            <strong className="stat-card-value">{latestQuotations.length}</strong>
            <small className="stat-card-sub">Active commercial quotes</small>
          </div>
        </div>

        <div className="quotation-stat-card">
          <div className="stat-card-icon">✓</div>
          <div className="stat-card-data">
            <span className="stat-card-label">Ready to Send</span>
            <strong className="stat-card-value">{readyCount}</strong>
            <small className="stat-card-sub">Gate requirements met</small>
          </div>
        </div>

        <div className="quotation-stat-card stat-card-highlight">
          <div className="stat-card-icon">💰</div>
          <div className="stat-card-data">
            <span className="stat-card-label">Total Pipeline Value</span>
            <strong className="stat-card-value">{formatMYR(pipelineTotal.toFixed(2))}</strong>
            <small className="stat-card-sub">Across all active drafts</small>
          </div>
        </div>
      </div>

      <section className="panel quotations-ledger-panel">
        <div className="quotations-panel-header">
          <div className="segmented">
            <button type="button" className="active">
              Quotations ({latestQuotations.length})
            </button>
          </div>
        </div>

        {latestQuotations.length === 0 ? (
          <EmptyState
            title="No draft quotations"
            description="Create a quotation to specify customer, item lines, pricing, and commercial terms."
            actionLabel="+ New quotation"
            onAction={() => openModal('quote')}
          />
        ) : (
          <>
            {/* Desktop Ledger Table (>= 1024px) */}
            <div className="table-wrap quotations-table-wrap desktop-only-table">
              <table className="quotations-ledger-table">
                <thead>
                  <tr>
                    <th>Quotation ID</th>
                    <th>Customer</th>
                    <th>Primary Item</th>
                    <th>Lines</th>
                    <th>Enquiry source</th>
                    <th>Subtotal</th>
                    <th>Grand Total</th>
                    <th>Readiness</th>
                    <th>Status</th>
                    <th aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {latestQuotations.map((q) => {
                    const readiness = evaluateSendReadiness(
                      {
                        customerId: q.customerId,
                        customerName: q.customerName,
                        dueDate: q.dueDate,
                        sourceNote: q.sourceNote,
                        lines: q.lines,
                        discountAmount: q.totals.discountAmount,
                        taxRate: q.totals.taxRate,
                        notes: q.notes,
                      },
                      q.totals,
                    )

                    return (
                      <tr
                        key={q.id}
                        className="clickable-row quotation-ledger-row"
                        tabIndex={0}
                        onClick={() => openModal('quoteDetail', q)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openModal('quoteDetail', q)
                          }
                        }}
                        data-testid={`quotation-row-${q.id}`}
                      >
                        <td className="quote-id-cell">
                          <span className="quote-id-badge">{q.number || q.id}</span>
                        </td>
                        <td className="quote-customer-cell">
                          <b>{q.customerName || '— (None)'}</b>
                        </td>
                        <td className="quote-item-cell">
                          <span>{q.lines[0]?.description || '—'}</span>
                          {q.lines.length > 1 && (
                            <span className="text-muted" style={{ fontSize: '11px', display: 'block' }}>
                              +{q.lines.length - 1} more items
                            </span>
                          )}
                        </td>
                        <td className="quote-lines-cell">
                          <span className="lines-count-pill">{q.lines.length}</span>
                        </td>
                        <td className="quote-source-cell">
                          <small className="source-text">{q.sourceNote || '—'}</small>
                        </td>
                        <td className="quote-subtotal-cell">{formatMYR(q.totals.subtotal)}</td>
                        <td className="quote-grandtotal-cell">
                          <strong className="grand-total-val">{formatMYR(q.totals.grandTotal)}</strong>
                        </td>
                        <td className="quote-readiness-cell">
                          <span
                            className={`badge ${readiness.isReady ? 'badge-success' : 'badge-neutral'}`}
                          >
                            {readiness.isReady ? 'Ready' : 'Draft'}
                          </span>
                        </td>
                        <td className="quote-status-cell">
                          <Status value={q.status} />
                        </td>
                        <td className="quote-action-cell">
                          <span className="row-action-arrow">→</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Tablet & Mobile Stacked Card List (< 1024px down to 320px) */}
            <div className="quotations-cards-list" aria-label="Quotations list">
              {latestQuotations.map((q) => {
                const readiness = evaluateSendReadiness(
                  {
                    customerId: q.customerId,
                    customerName: q.customerName,
                    dueDate: q.dueDate,
                    sourceNote: q.sourceNote,
                    lines: q.lines,
                    discountAmount: q.totals.discountAmount,
                    taxRate: q.totals.taxRate,
                    notes: q.notes,
                  },
                  q.totals,
                )
                const primaryItem = q.lines[0]?.description || '—'

                return (
                  <article
                    key={q.id}
                    className="mobile-quote-card"
                    tabIndex={0}
                    onClick={() => openModal('quoteDetail', q)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openModal('quoteDetail', q)
                      }
                    }}
                    data-testid={`quotation-card-${q.id}`}
                    aria-label={`Quotation ${q.number || q.id}, ${q.customerName || 'Customer'}`}
                  >
                    <div className="quote-card-header">
                      <div className="quote-card-identity">
                        <span className="quote-id-badge">{q.number || q.id}</span>
                        {q.revision > 1 && (
                          <span className="quote-revision-badge">Rev {q.revision}</span>
                        )}
                        <Status value={q.status} />
                      </div>
                      <span
                        className={`badge ${readiness.isReady ? 'badge-success' : 'badge-neutral'}`}
                      >
                        {readiness.isReady ? 'Ready to send' : 'Draft'}
                      </span>
                    </div>

                    <div className="quote-card-body">
                      <h3 className="quote-card-customer">{q.customerName || '— (None)'}</h3>
                      <p className="quote-card-item">
                        <span>{primaryItem}</span>
                        {q.lines.length > 1 && (
                          <span className="text-muted" style={{ fontSize: '12px' }}>
                            {' '}· +{q.lines.length - 1} more items
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="quote-card-meta">
                      <div className="quote-card-due">
                        <small className="meta-label">Requested Due Date</small>
                        <strong className="meta-value">
                          {q.dueDate ? formatMalaysiaDate(q.dueDate) : '—'}
                        </strong>
                      </div>
                      <div className="quote-card-total">
                        <small className="meta-label">Grand Total</small>
                        <strong className="quote-total-val">{formatMYR(q.totals.grandTotal)}</strong>
                      </div>
                    </div>

                    <div className="quote-card-actions">
                      <button
                        type="button"
                        className="btn-review-quote"
                        onClick={(e) => {
                          e.stopPropagation()
                          openModal('quoteDetail', q)
                        }}
                      >
                        Review quotation →
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
