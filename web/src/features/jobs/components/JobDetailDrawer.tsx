import { useState } from 'react'
import { memoryStore } from '../../../adapters/memoryStore'
import { useSyntheticStore } from '../../../context/useSyntheticStore'
import { formatMalaysiaDate } from '../../../lib/formatters'
import { useStableRequestKey } from '../../../lib/useStableRequestKey'
import { formatDeliveryLabel, formatStageLabel } from '../domain/selectors'
import type { ActivityEntry } from '../../../adapters/activity'
import type { JobAction, JobView, Stage } from '../domain/types'
import JobActions from './JobActions'
import JobActivityHistory from './JobActivityHistory'

interface JobDetailDrawerProps {
  job: JobView
  onClose: () => void
}

const ACTIVITY_PAGE_SIZE = 25

export default function JobDetailDrawer({ job, onClose }: JobDetailDrawerProps) {
  const { transitionJob, changeJobStage } = useSyntheticStore()
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  interface ActivityPageState {
    activities: ActivityEntry[]
    activitiesCursor: string | null
  }

  function loadFirstActivityPage(): ActivityPageState {
    const first = memoryStore.listJobActivity(job.id, { limit: ACTIVITY_PAGE_SIZE })
    return { activities: first.items, activitiesCursor: first.nextCursor }
  }

  const [activityPage, setActivityPage] = useState<ActivityPageState>(loadFirstActivityPage)
  const { activities, activitiesCursor } = activityPage

  const transitionKey = useStableRequestKey(`transJob-${job.id}`)
  const stageKey = useStableRequestKey(`stageJob-${job.id}`)

  // Reload the activity trail's first page (during render, not an effect)
  // whenever a different job is shown or this job's version advances after a
  // successful mutation. This is the documented "adjusting state when a prop
  // changes" pattern rather than a setState-in-effect round trip.
  const activityKey = `${job.id}:${job.version}`
  const [loadedActivityKey, setLoadedActivityKey] = useState(activityKey)
  if (activityKey !== loadedActivityKey) {
    setLoadedActivityKey(activityKey)
    setActivityPage(loadFirstActivityPage())
  }

  function handleLoadMoreActivity() {
    if (!activitiesCursor) return
    const next = memoryStore.listJobActivity(job.id, { limit: ACTIVITY_PAGE_SIZE, cursor: activitiesCursor })
    setActivityPage((prev) => ({
      activities: [...prev.activities, ...next.items],
      activitiesCursor: next.nextCursor,
    }))
  }

  function handleTransition(action: JobAction, reason?: string): boolean {
    try {
      setIsSubmitting(true)
      setError(null)
      const key = transitionKey.getKey({ action, reason, expectedVersion: job.version })
      transitionJob(job.id, action, reason, job.version, key)
      transitionKey.reset()
      return true
    } catch (err: any) {
      setError(err.message || 'Job transition failed')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChangeStage(target: Stage, reason?: string): boolean {
    try {
      setIsSubmitting(true)
      setError(null)
      const key = stageKey.getKey({ target, reason, expectedVersion: job.version })
      changeJobStage(job.id, target, reason, job.version, key)
      stageKey.reset()
      return true
    } catch (err: any) {
      setError(err.message || 'Stage change failed')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="job-detail-drawer" data-testid="job-detail-drawer">
      <div className="segmented" style={{ marginBottom: '14px' }}>
        <button
          type="button"
          className={activeTab === 'details' ? 'active' : ''}
          onClick={() => setActiveTab('details')}
        >
          Production Details
        </button>
        <button
          type="button"
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Activity Trail ({activities.length})
        </button>
      </div>

      {activeTab === 'history' ? (
        <JobActivityHistory
          activities={activities}
          hasMore={activitiesCursor !== null}
          onLoadMore={handleLoadMoreActivity}
        />
      ) : (
        <>
          <div className="detail-meta-grid" style={{ marginBottom: '16px' }}>
            <div className="meta-card">
              <small>Customer</small>
              <strong>{job.customer?.displayName || '— (None selected)'}</strong>
            </div>
            <div className="meta-card">
              <small>Due Date</small>
              <strong>{job.dueDate ? formatMalaysiaDate(job.dueDate) : '—'}</strong>
            </div>
            <div className="meta-card">
              <small>Current Stage</small>
              <div>
                <span className={`badge badge-stage stage-${job.stage}`}>Stage: {formatStageLabel(job.stage)}</span>
              </div>
            </div>
            <div className="meta-card">
              <small>Delivery Status</small>
              <div>
                <span className={`badge badge-delivery delivery-${job.deliveryStatus}`}>
                  🚚 Delivery: {formatDeliveryLabel(job.deliveryStatus)}
                </span>
              </div>
            </div>
          </div>

          {job.sourceQuotationId && (
            <div className="source-quotation-callout" style={{ marginBottom: '14px' }}>
              <small className="text-muted">
                Converted from Quotation: <strong>{job.sourceQuotationId}</strong>
              </small>
            </div>
          )}

          {/* Non-financial lines table per SDD § 5 */}
          <div className="table-wrap detail-lines-table" style={{ marginBottom: '20px' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Production Item / Specification</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {job.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{line.description}</strong>
                    </td>
                    <td>{line.quantity}</td>
                    <td>{line.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <JobActions
            job={job}
            onTransition={handleTransition}
            onChangeStage={handleChangeStage}
            isSubmitting={isSubmitting}
            error={error}
          />
        </>
      )}

      <div className="modal-actions" style={{ marginTop: '20px' }}>
        <button type="button" className="secondary" onClick={onClose}>
          Close drawer
        </button>
      </div>
    </div>
  )
}
