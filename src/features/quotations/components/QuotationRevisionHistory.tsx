import type { ActivityEntry } from '../../../adapters/activity'
import { formatMalaysiaDate, formatMalaysiaDateTime } from '../../../lib/formatters'
import type { QuotationView } from '../domain/types'

interface QuotationRevisionHistoryProps {
  revisions: QuotationView[]
  currentQuotationId: string
  onSelectRevision: (revision: QuotationView) => void
  activities: ActivityEntry[]
  hasMoreRevisions?: boolean
  onLoadMoreRevisions?: () => void
  hasMoreActivities?: boolean
  onLoadMoreActivities?: () => void
}

export default function QuotationRevisionHistory({
  revisions,
  currentQuotationId,
  onSelectRevision,
  activities,
  hasMoreRevisions = false,
  onLoadMoreRevisions,
  hasMoreActivities = false,
  onLoadMoreActivities,
}: QuotationRevisionHistoryProps) {
  return (
    <div className="quotation-history-section" data-testid="quotation-history-section">
      <div className="history-revisions-block">
        <h4>Family Revisions ({revisions.length})</h4>
        <div className="revisions-list">
          {revisions.map((rev) => {
            const isSelected = rev.id === currentQuotationId
            return (
              <button
                key={rev.id}
                type="button"
                className={`revision-card clickable ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectRevision(rev)}
              >
                <div className="revision-card-header">
                  <strong>Revision {rev.revision}</strong>
                  <span className={`status status-${rev.status}`}>{rev.status}</span>
                </div>
                <div className="revision-card-meta">
                  <span>{rev.number}</span>
                  <small>{formatMalaysiaDate(rev.createdAt)}</small>
                </div>
                {rev.isLatest && <span className="badge badge-primary">Latest</span>}
              </button>
            )
          })}
        </div>
        {hasMoreRevisions && (
          <div className="revisions-load-more-row">
            <button type="button" className="secondary" onClick={onLoadMoreRevisions}>
              Load more revisions
            </button>
          </div>
        )}
      </div>

      <div className="history-activity-block">
        <h4>Synthetic Demo History ({activities.length})</h4>
        <p className="text-muted" style={{ fontSize: '12px', margin: '2px 0 10px' }}>
          In-memory activity entries recorded during this synthetic prototype session.
        </p>
        {activities.length === 0 ? (
          <p className="text-muted">No recorded activity yet.</p>
        ) : (
          <div className="activity-timeline">
            {activities.map((act) => (
              <div key={act.id} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-body">
                  <div className="activity-header">
                    <strong>{act.action.toUpperCase()}</strong>
                    <span className="activity-actor">by {act.actorLabel}</span>
                    <time className="activity-time">{formatMalaysiaDateTime(act.occurredAt)}</time>
                  </div>
                  <p className="activity-desc">{act.changedInformation}</p>
                  {act.previousStatus && act.nextStatus && (
                    <small className="status-shift">
                      {act.previousStatus} → {act.nextStatus}
                    </small>
                  )}
                  {act.reason && (
                    <blockquote className="activity-reason">
                      <small>Reason: {act.reason}</small>
                    </blockquote>
                  )}
                  {act.linkedJobId && (
                    <small className="linked-ref">Linked Job: {act.linkedJobId}</small>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {hasMoreActivities && (
          <div className="activity-load-more-row">
            <button type="button" className="secondary" onClick={onLoadMoreActivities}>
              Load more activity
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
