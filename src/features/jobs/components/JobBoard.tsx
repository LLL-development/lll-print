import { useMemo, useState } from 'react'
import { formatMalaysiaDate } from '../../../lib/formatters'
import { filterJobs, formatDeliveryLabel, formatJobStatusLabel, formatStageLabel } from '../domain/selectors'
import type { JobStatus, JobView, Stage } from '../domain/types'

interface JobBoardProps {
  jobs: JobView[]
  onSelectJob: (job: JobView) => void
  onNavigateToQuotations: () => void
}

export default function JobBoard({ jobs, onSelectJob, onNavigateToQuotations }: JobBoardProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | JobStatus>('All')
  const [stageFilter, setStageFilter] = useState<'All' | Stage>('All')

  const filtered = useMemo(
    () => filterJobs(jobs, query, statusFilter, stageFilter),
    [jobs, query, statusFilter, stageFilter],
  )

  const isFiltered = query.trim() !== '' || statusFilter !== 'All' || stageFilter !== 'All'

  return (
    <div className="job-board" data-testid="job-board">
      {/* Control Bar: Unified Search & Filter Controls */}
      <div className="job-board-toolbar">
        <div className="toolbar-search-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search job number, customer, item"
            aria-label="Search jobs"
            className="search-input"
          />
        </div>

        <div className="toolbar-filter-controls">
          <div className="filter-select-group">
            <label htmlFor="filter-status-select" className="filter-select-label">Status:</label>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Filter jobs by status"
              className="filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_production">In Production</option>
              <option value="ready_for_delivery">Ready for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-select-group">
            <label htmlFor="filter-stage-select" className="filter-select-label">Stage:</label>
            <select
              id="filter-stage-select"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)}
              aria-label="Filter jobs by stage"
              className="filter-select"
            >
              <option value="All">All Stages</option>
              <option value="preparation">Preparation</option>
              <option value="production">Production</option>
              <option value="quality_check">Quality Check</option>
              <option value="packing">Packing</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" data-testid="jobs-empty-state" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
            {isFiltered ? 'No jobs match your filter' : 'No active print jobs'}
          </h3>
          <p className="text-muted" style={{ margin: '0 0 20px 0', fontSize: '13px' }}>
            {isFiltered
              ? 'Try adjusting your search query or filter settings.'
              : 'Production jobs are created by converting accepted quotations.'}
          </p>
          {isFiltered ? (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setQuery('')
                setStatusFilter('All')
                setStageFilter('All')
              }}
            >
              Clear filters
            </button>
          ) : (
            <button type="button" className="primary" onClick={onNavigateToQuotations}>
              View Quotations →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Structured Job Queue: Desktop & Tablet View */}
          <div className="structured-job-queue desktop-only-table">
            <div className="queue-list-header">
              <span>Job & Customer</span>
              <span>Workcenter & Delivery</span>
              <span style={{ textAlign: 'right' }}>Due Date & Status</span>
            </div>

            <div className="queue-list-body">
              {filtered.map((job) => {
                const primaryDesc = job.lines[0]?.description || '—'
                const totalQty = job.lines.reduce((acc, l) => acc + (parseFloat(l.quantity) || 0), 0)
                const unit = job.lines[0]?.unit || 'pcs'

                return (
                  <div
                    key={job.id}
                    className="structured-job-card clickable-row"
                    tabIndex={0}
                    onClick={() => onSelectJob(job)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectJob(job)
                      }
                    }}
                    data-testid={`job-row-${job.id}`}
                    role="button"
                    aria-label={`Job ${job.number}, ${job.customer?.displayName || 'Customer'}`}
                  >
                    {/* Left: Job Number + Identity & Specifications */}
                    <div className="queue-card-identity">
                      <div className="queue-number-badge">
                        <b>{job.number}</b>
                      </div>
                      <div className="queue-item-details">
                        <div className="queue-customer-line">
                          <strong className="queue-customer-name">{job.customer?.displayName || '—'}</strong>
                        </div>
                        <div className="queue-spec-line">
                          <span className="queue-primary-desc">{primaryDesc}</span>
                          <span className="queue-spec-divider">·</span>
                          <span className="queue-qty-pill">{totalQty} {unit}</span>
                          {job.lines.length > 1 && (
                            <span className="queue-extra-count">+{job.lines.length - 1} more items</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Stage & Delivery Logistics Badges */}
                    <div className="queue-card-badges">
                      <span className={`badge badge-stage stage-${job.stage}`}>
                        Stage: {formatStageLabel(job.stage)}
                      </span>
                      <span className={`badge badge-delivery delivery-${job.deliveryStatus}`}>
                        🚚 Delivery: {formatDeliveryLabel(job.deliveryStatus)}
                      </span>
                    </div>

                    {/* Right: Target Date, Status Pill & Action */}
                    <div className="queue-card-status-actions">
                      <div className="queue-due-info">
                        <small className="queue-due-caption">Due Date</small>
                        <time className="queue-due-val">
                          {job.dueDate ? formatMalaysiaDate(job.dueDate) : '—'}
                        </time>
                      </div>

                      <div className="queue-status-col">
                        <span className={`status status-${job.status}`}>
                          ● {formatJobStatusLabel(job.status)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="queue-view-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectJob(job)
                        }}
                        aria-label={`View details for ${job.number}`}
                      >
                        <span>Details</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile Card List View (NFR-1 / 320px responsive) */}
          <div className="mobile-cards-list">
            {filtered.map((job) => {
              const primaryDesc = job.lines[0]?.description || '—'
              const totalQty = job.lines.reduce((acc, l) => acc + (parseFloat(l.quantity) || 0), 0)

              return (
                <div
                  key={job.id}
                  className="mobile-job-card clickable"
                  tabIndex={0}
                  onClick={() => onSelectJob(job)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectJob(job)
                    }
                  }}
                  data-testid={`mobile-job-card-${job.id}`}
                >
                  <div className="card-top-row">
                    <strong>{job.number}</strong>
                    <span className={`status status-${job.status}`}>● {formatJobStatusLabel(job.status)}</span>
                  </div>
                  <div className="card-customer">{job.customer?.displayName || '— (None)'}</div>
                  <div className="card-title">
                    {primaryDesc} · {totalQty} {job.lines[0]?.unit || 'pcs'}
                  </div>
                  <div className="card-bottom-row">
                    <span className={`badge badge-stage stage-${job.stage}`}>Stage: {formatStageLabel(job.stage)}</span>
                    <span className={`badge badge-delivery delivery-${job.deliveryStatus}`}>
                      🚚 Delivery: {formatDeliveryLabel(job.deliveryStatus)}
                    </span>
                    <time className="card-due">{job.dueDate ? formatMalaysiaDate(job.dueDate) : '—'}</time>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
