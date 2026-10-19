import { useNavigate } from 'react-router-dom'
import Notice from '../components/ui/Notice'
import Status from '../components/ui/Status'
import { useSyntheticStore } from '../context/useSyntheticStore'
import {
  countJobsByStage,
  formatDeliveryLabel,
  formatStageLabel,
  getActiveJobs,
  getDeliveredJobs,
  getReadyJobs,
} from '../features/jobs/domain/selectors'
import { formatMalaysiaDate, myrCurrencyFormatter as money } from '../lib/formatters'

export default function OverviewView() {
  const navigate = useNavigate()
  const { state, openModal } = useSyntheticStore()
  const { jobs, inventory: items } = state

  const lowStockCount = items.filter((item) => item.quantity <= item.reorderLevel).length
  const activeJobs = getActiveJobs(jobs)
  const readyJobs = getReadyJobs(jobs)
  const deliveredJobs = getDeliveredJobs(jobs)
  const stageCounts = countJobsByStage(jobs)

  return (
    <div className="overview-page">
      {/* 1. Cohesive Hero Header */}
      <div className="overview-hero-header">
        <div className="overview-hero-title-group">
          <div className="overview-icon-badge" aria-hidden="true">
            <span>▦</span>
          </div>
          <div>
            <div className="overview-meta-eyebrow">
              <span className="overview-date-tag">Thursday, 27 August</span>
              <span className="overview-shift-tag">● Shift A Active</span>
            </div>
            <h1 className="overview-main-title">Production overview</h1>
            <p className="overview-subtext">Real-time shopfloor status, workcenter stage queue, and urgency hub.</p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <button
            type="button"
            className="primary overview-new-quote-btn"
            onClick={() => {
              navigate('/quotations')
              openModal('quote')
            }}
          >
            <span className="btn-plus-icon">+</span>
            <span>New quotation</span>
          </button>
        </div>
      </div>

      {/* 2. Dual Hero Intelligence / Operations Cards (Inspired by Reference) */}
      <div className="overview-hero-cards-grid">
        {/* Hero Card 1: Shopfloor Stage Flow */}
        <div className="hero-feature-card hero-stage-flow-card">
          <div className="feature-card-header">
            <div className="feature-card-title-wrap">
              <span className="feature-card-icon">⚙️</span>
              <div>
                <h3>Workcenter Stage Flow</h3>
                <p>Live floor progression across active job centers</p>
              </div>
            </div>
            <button
              type="button"
              className="feature-card-action-btn"
              onClick={() => navigate('/jobs')}
            >
              View Board →
            </button>
          </div>

          <div className="stage-flow-stepper">
            {[
              { name: 'Preparation', count: stageCounts.preparation, icon: '📋' },
              { name: 'Production', count: stageCounts.production, icon: '🖨️' },
              { name: 'Quality Check', count: stageCounts.quality_check, icon: '🔍' },
              { name: 'Packing', count: stageCounts.packing, icon: '📦' },
            ].map((st, idx, arr) => (
              <div key={st.name} className="stepper-node-wrapper">
                <div className={`stepper-node ${st.count > 0 ? 'node-active' : 'node-idle'}`}>
                  <div className="node-icon-wrap">
                    <span className="node-icon">{st.icon}</span>
                    <span className="node-count-badge">{st.count}</span>
                  </div>
                  <span className="node-label">{st.name}</span>
                </div>
                {idx < arr.length - 1 && <div className="stepper-connector" />}
              </div>
            ))}
          </div>
        </div>

        {/* Hero Card 2: Urgency Hub & Action Centre */}
        <div className="hero-feature-card hero-urgency-card">
          <div className="feature-card-header">
            <div className="feature-card-title-wrap">
              <span className="feature-card-icon">⚠️</span>
              <div>
                <div className="title-with-pill">
                  <h3>Needs attention</h3>
                  <span className="urgency-counter-chip">3 items</span>
                </div>
                <p>Prioritized operational warnings requiring resolution</p>
              </div>
            </div>
          </div>

          <div className="hero-urgency-list">
            <Notice tone="warning" title="Proof waiting for approval" text="J-1048 · 2 days waiting" />
            <Notice tone="danger-bg" title="Black DTF ink is low" text="1.2 L remaining · threshold 2 L" />
            <Notice tone="info" title="Invoice balance due" text={`INV-2041 · ${money.format(840)}`} />
          </div>
        </div>
      </div>

      {/* 3. 4-Card Operational Metrics Ribbon */}
      <section className="overview-metrics-strip" aria-label="Key operational metrics">
        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-icon-square kpi-icon-blue">⚙️</span>
            <span className="kpi-card-label">Active jobs</span>
          </div>
          <div className="kpi-card-body">
            <strong className="kpi-main-number">{activeJobs.length}</strong>
            <span className="kpi-context-note">In production & ready</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-icon-square kpi-icon-green">🚚</span>
            <span className="kpi-card-label">Ready for delivery</span>
          </div>
          <div className="kpi-card-body">
            <strong className="kpi-main-number">{readyJobs.length}</strong>
            <span className="kpi-context-note">Awaiting handover</span>
          </div>
        </div>

        <div className={`kpi-metric-card ${lowStockCount > 0 ? 'kpi-metric-danger' : ''}`}>
          <div className="kpi-card-top">
            <span className="kpi-icon-square kpi-icon-amber">⚠️</span>
            <span className="kpi-card-label">Low-stock items</span>
          </div>
          <div className="kpi-card-body">
            <strong className={`kpi-main-number ${lowStockCount > 0 ? 'text-danger' : ''}`}>
              {lowStockCount}
            </strong>
            <span className="kpi-context-note">Require review</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-card-top">
            <span className="kpi-icon-square kpi-icon-emerald">✅</span>
            <span className="kpi-card-label">Delivered</span>
          </div>
          <div className="kpi-card-body">
            <strong className="kpi-main-number">{deliveredJobs.length}</strong>
            <span className="kpi-context-note">Completed handovers</span>
          </div>
        </div>
      </section>

      {/* 4. Production Queue Board (Main Floor Area) */}
      <section className="panel floor-queue-container">
        <div className="floor-queue-header">
          <div className="queue-header-left">
            <span className="queue-section-icon">🖨️</span>
            <div>
              <h2 className="queue-section-title">Today's Production Queue</h2>
              <p className="queue-section-subtitle">Real-time floor progression and stage readiness</p>
            </div>
          </div>
          <button
            type="button"
            className="ghost queue-view-all-btn"
            onClick={() => navigate('/jobs')}
          >
            View Full Job Board ({jobs.length}) →
          </button>
        </div>

        <div className="queue-cards-stream">
          {jobs.slice(0, 4).map((job) => {
            const primaryDesc = job.lines[0]?.description || 'Print job'
            const customerName = job.customer?.displayName || '—'
            const qty = job.lines[0]?.quantity || '1'
            const unit = job.lines[0]?.unit || 'pcs'

            return (
              <div
                key={job.id}
                className={`shopfloor-job-card status-border-${job.status} clickable-row`}
                tabIndex={0}
                onClick={() => openModal('jobDetail', job)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openModal('jobDetail', job)
                  }
                }}
                role="button"
                aria-label={`Job ${job.number}, ${job.customer?.displayName || 'Customer'}`}
              >
                {/* Left: Identity + Specifications */}
                <div className="job-card-col-main">
                  <div className="job-card-top-meta">
                    <span className="job-ticket-id">{job.number}</span>
                    <Status value={job.status} />
                    <span className="job-customer-tag">🏢 {customerName}</span>
                  </div>
                  <div className="job-card-spec-row">
                    <strong className="job-primary-spec">{primaryDesc}</strong>
                    <span className="spec-dot-separator">·</span>
                    <span className="spec-quantity-badge">{qty} {unit}</span>
                    {job.lines.length > 1 && (
                      <span className="spec-extra-badge">+{job.lines.length - 1} more items</span>
                    )}
                  </div>
                </div>

                {/* Middle: Stages & Delivery Logistics Badges */}
                <div className="job-card-col-badges">
                  <span className={`badge badge-stage stage-${job.stage}`}>
                    Stage: {formatStageLabel(job.stage)}
                  </span>
                  <span className={`badge badge-delivery delivery-${job.deliveryStatus}`}>
                    🚚 Delivery: {formatDeliveryLabel(job.deliveryStatus)}
                  </span>
                </div>

                {/* Right: Target Date & Action */}
                <div className="job-card-col-action">
                  <div className="job-card-due-box">
                    <small className="due-box-label">Target Due</small>
                    <time className="due-box-date">{job.dueDate ? formatMalaysiaDate(job.dueDate) : '—'}</time>
                  </div>
                  <div className="job-card-action-arrow">
                    <span>Details</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
