import { useState } from 'react'
import { isBackwardStageMove, STAGE_ORDER } from '../domain/transitions'
import type { JobAction, JobView, Stage } from '../domain/types'

interface JobActionsProps {
  job: JobView
  onTransition: (action: JobAction, reason?: string) => boolean
  onChangeStage: (target: Stage, reason?: string) => boolean
  isSubmitting?: boolean
  error?: string | null
}

export default function JobActions({
  job,
  onTransition,
  onChangeStage,
  isSubmitting = false,
  error = null,
}: JobActionsProps) {
  const [showCancelPrompt, setShowCancelPrompt] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState<string | null>(null)

  const [reworkTarget, setReworkTarget] = useState<Stage | null>(null)
  const [reworkReason, setReworkReason] = useState('')
  const [reworkError, setReworkError] = useState<string | null>(null)

  function handleStart() {
    onTransition('start')
  }

  function handleReady() {
    onTransition('ready')
  }

  function handleDeliver() {
    onTransition('deliver')
  }

  function handleCancelSubmit() {
    const trimmed = cancelReason.trim()
    if (!trimmed) {
      setCancelError('Cancellation reason is required.')
      return
    }
    if (trimmed.length > 500) {
      setCancelError('Reason exceeds maximum of 500 characters.')
      return
    }
    setCancelError(null)
    // Retain the form (and entered reason) unless the transition is confirmed
    // to have succeeded, so a failed attempt can be retried without retyping.
    const succeeded = onTransition('cancel', trimmed)
    if (succeeded) {
      setShowCancelPrompt(false)
      setCancelReason('')
    }
  }

  function handleStageClick(target: Stage) {
    if (target === job.stage) return

    if (isBackwardStageMove(job.stage, target)) {
      setReworkTarget(target)
      setReworkReason('')
      setReworkError(null)
    } else {
      onChangeStage(target)
    }
  }

  function handleReworkSubmit() {
    if (!reworkTarget) return
    const trimmed = reworkReason.trim()
    if (!trimmed) {
      setReworkError('Rework reason is required when moving stage backward.')
      return
    }
    if (trimmed.length > 500) {
      setReworkError('Reason exceeds maximum of 500 characters.')
      return
    }
    setReworkError(null)
    // Retain the target and entered reason unless the change is confirmed to
    // have succeeded, so a failed attempt can be retried without retyping.
    const succeeded = onChangeStage(reworkTarget, trimmed)
    if (succeeded) {
      setReworkTarget(null)
      setReworkReason('')
    }
  }

  if (job.status === 'delivered') {
    return (
      <div className="job-terminal-notice" data-testid="job-terminal-delivered">
        <span className="badge badge-success">Delivered</span>
        <p className="text-muted" style={{ marginTop: '6px' }}>
          This job has been completed and handed over to the customer. Terminal state cannot be reopened.
        </p>
      </div>
    )
  }

  if (job.status === 'cancelled') {
    return (
      <div className="job-terminal-notice" data-testid="job-terminal-cancelled">
        <span className="badge badge-danger">Cancelled</span>
        <p className="text-muted" style={{ marginTop: '6px' }}>
          This job was cancelled. Terminal state cannot be reopened.
        </p>
      </div>
    )
  }

  return (
    <div className="job-actions-panel" data-testid="job-actions-panel">
      {error && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {/* Rework Reason Modal/Inline Form */}
      {reworkTarget && (
        <div className="action-dialog-inline" data-testid="rework-reason-form">
          <h4>Rework Reason Required</h4>
          <p className="text-muted">
            Moving stage backward from <strong>{job.stage}</strong> to <strong>{reworkTarget}</strong> requires a documented rework reason.
          </p>
          {reworkError && (
            <div className="alert alert-danger" role="alert">
              {reworkError}
            </div>
          )}
          <textarea
            value={reworkReason}
            onChange={(e) => setReworkReason(e.target.value)}
            placeholder="Explain why rework or rollback is needed (1–500 chars)"
            rows={3}
            maxLength={500}
            aria-label="Rework reason"
          />
          <div className="dialog-btn-row">
            <button
              type="button"
              className="secondary"
              onClick={() => setReworkTarget(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleReworkSubmit}
              disabled={isSubmitting}
            >
              Confirm Stage Rollback
            </button>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal/Inline Form */}
      {showCancelPrompt && (
        <div className="action-dialog-inline" data-testid="cancel-reason-form">
          <h4>Cancel Job {job.number}</h4>
          <p className="text-muted">
            Cancelling this job will halt all production. A clear cancellation reason is required for audit history.
          </p>
          {cancelError && (
            <div className="alert alert-danger" role="alert">
              {cancelError}
            </div>
          )}
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Explain why this job is being cancelled (1–500 chars)"
            rows={3}
            maxLength={500}
            aria-label="Cancellation reason"
          />
          <div className="dialog-btn-row">
            <button
              type="button"
              className="secondary"
              onClick={() => setShowCancelPrompt(false)}
              disabled={isSubmitting}
            >
              Back
            </button>
            <button
              type="button"
              className="danger"
              onClick={handleCancelSubmit}
              disabled={isSubmitting}
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      )}

      {!reworkTarget && !showCancelPrompt && (
        <>
          {job.status === 'pending' && (
            <div className="action-row">
              <button
                type="button"
                className="primary"
                onClick={handleStart}
                disabled={isSubmitting}
              >
                Start Production
              </button>
              <button
                type="button"
                className="secondary danger-text"
                onClick={() => setShowCancelPrompt(true)}
                disabled={isSubmitting}
              >
                Cancel Job
              </button>
            </div>
          )}

          {job.status === 'in_production' && (
            <div className="stage-controls-block">
              <label>
                <strong>Production Stage</strong>
              </label>
              <div className="stage-stepper" role="group" aria-label="Production stages">
                {STAGE_ORDER.map((stage) => {
                  const isCurrent = stage === job.stage
                  return (
                    <button
                      key={stage}
                      type="button"
                      className={`stage-step-btn ${isCurrent ? 'active' : ''}`}
                      onClick={() => handleStageClick(stage)}
                      disabled={isSubmitting}
                    >
                      {stage.replace('_', ' ')}
                    </button>
                  )
                })}
              </div>

              <div className="action-row" style={{ marginTop: '16px', flexWrap: 'wrap' }}>
                <div>
                  <button
                    type="button"
                    className="primary"
                    onClick={handleReady}
                    disabled={job.stage !== 'packing' || isSubmitting}
                  >
                    Mark Ready for Delivery
                  </button>
                  {job.stage !== 'packing' && (
                    <small className="action-helper-note">
                      ℹ Job must reach Packing stage before marking ready for delivery.
                    </small>
                  )}
                </div>
                <button
                  type="button"
                  className="secondary danger-text"
                  onClick={() => setShowCancelPrompt(true)}
                  disabled={isSubmitting}
                >
                  Cancel Job
                </button>
              </div>
            </div>
          )}

          {job.status === 'ready_for_delivery' && (
            <div className="action-row">
              <button
                type="button"
                className="primary"
                onClick={handleDeliver}
                disabled={isSubmitting}
              >
                Confirm Customer Handover / Delivery
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
