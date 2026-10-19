import type { ActivityEntry } from '../../../adapters/activity'
import { formatMalaysiaDateTime } from '../../../lib/formatters'

interface JobActivityHistoryProps {
  activities: ActivityEntry[]
  hasMore?: boolean
  onLoadMore?: () => void
}

export default function JobActivityHistory({ activities, hasMore = false, onLoadMore }: JobActivityHistoryProps) {
  if (activities.length === 0) {
    return <p className="text-muted">No activity recorded for this job.</p>
  }

  return (
    <div className="job-activity-history" data-testid="job-activity-history">
      <h4>Synthetic Demo History ({activities.length})</h4>
      <p className="text-muted" style={{ fontSize: '12px', margin: '2px 0 10px' }}>
        In-memory activity entries recorded during this synthetic prototype session.
      </p>
      <div className="activity-timeline">
        {activities.map((act) => (
          <div key={act.id} className="activity-item">
            <div className="activity-dot" />
            <div className="activity-body">
              <div className="activity-header">
                <strong>{act.action.replace('_', ' ').toUpperCase()}</strong>
                <span className="activity-actor">by {act.actorLabel}</span>
                <time className="activity-time">{formatMalaysiaDateTime(act.occurredAt)}</time>
              </div>
              <p className="activity-desc">{act.changedInformation}</p>
              {act.previousStatus && act.nextStatus && (
                <small className="status-shift">
                  Status: {act.previousStatus} → {act.nextStatus}
                </small>
              )}
              {act.previousStage && act.nextStage && (
                <small className="stage-shift">
                  Stage: {act.previousStage} → {act.nextStage}
                </small>
              )}
              {act.reason && (
                <blockquote className="activity-reason">
                  <small>Reason: {act.reason}</small>
                </blockquote>
              )}
              {act.linkedQuotationId && (
                <small className="linked-ref">Converted from Quotation: {act.linkedQuotationId}</small>
              )}
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="activity-load-more-row">
          <button type="button" className="secondary" onClick={onLoadMore}>
            Load more activity
          </button>
        </div>
      )}
    </div>
  )
}
