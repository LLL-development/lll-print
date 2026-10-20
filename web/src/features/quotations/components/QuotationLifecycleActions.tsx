import type { QuotationAction, QuotationFamilyRecord, QuotationView, SendReadinessResult } from '../domain/types'
import {
  canConvertQuotation,
  canReviseQuotation,
  canTransitionQuotation,
} from '../domain/lifecycle'

interface QuotationLifecycleActionsProps {
  quotation: QuotationView
  family: QuotationFamilyRecord
  readiness: SendReadinessResult
  onTransition: (action: QuotationAction) => void
  onRevise: () => void
  onOpenConvertModal: () => void
  isSubmitting?: boolean
}

export default function QuotationLifecycleActions({
  quotation,
  family,
  readiness,
  onTransition,
  onRevise,
  onOpenConvertModal,
  isSubmitting = false,
}: QuotationLifecycleActionsProps) {
  const isConverted = family.convertedJobId !== null || quotation.status === 'converted_to_job'
  const isLatest = quotation.isLatest && family.latestRevisionId === quotation.id

  if (isConverted) {
    return (
      <div className="lifecycle-converted-banner" data-testid="lifecycle-converted-banner">
        <span className="badge badge-success">Converted to Job {quotation.jobId || family.convertedJobId}</span>
        <small className="text-muted">
          This quotation family has been converted to an active production job. Edits and revisions are locked.
        </small>
      </div>
    )
  }

  if (!isLatest) {
    return (
      <div className="lifecycle-historical-banner" data-testid="lifecycle-historical-banner">
        <span className="badge badge-neutral">Historical Revision {quotation.revision}</span>
        <small className="text-muted">
          Viewing an earlier snapshot. Historical revisions are read-only.
        </small>
      </div>
    )
  }

  const canSend = canTransitionQuotation(quotation, family, 'send', readiness)
  const canAccept = canTransitionQuotation(quotation, family, 'accept')
  const canDecline = canTransitionQuotation(quotation, family, 'decline')
  const canRevise = canReviseQuotation(quotation, family)
  const canConvert = canConvertQuotation(quotation, family)

  return (
    <div className="quotation-lifecycle-actions" data-testid="quotation-lifecycle-actions">
      {quotation.status === 'draft' && (
        <div className="action-group">
          <button
            type="button"
            className="primary"
            onClick={() => onTransition('send')}
            disabled={!canSend || isSubmitting}
            title={canSend ? 'Record external communication of quotation' : 'Complete required fields before sending'}
          >
            Record externally sent
          </button>
        </div>
      )}

      {quotation.status === 'sent' && (
        <div className="action-group">
          <button
            type="button"
            className="primary"
            onClick={() => onTransition('accept')}
            disabled={!canAccept || isSubmitting}
          >
            Record customer acceptance
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => onTransition('decline')}
            disabled={!canDecline || isSubmitting}
          >
            Record customer decline
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onRevise}
            disabled={!canRevise || isSubmitting}
          >
            Create Revision
          </button>
        </div>
      )}

      {quotation.status === 'accepted' && (
        <div className="action-group">
          <button
            type="button"
            className="primary"
            onClick={onOpenConvertModal}
            disabled={!canConvert || isSubmitting}
          >
            Convert to Production Job
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onRevise}
            disabled={!canRevise || isSubmitting}
          >
            Create Revision
          </button>
        </div>
      )}

      {quotation.status === 'declined' && (
        <div className="action-group">
          <span className="badge badge-danger">Customer Declined</span>
          <button
            type="button"
            className="secondary"
            onClick={onRevise}
            disabled={!canRevise || isSubmitting}
          >
            Create Revision
          </button>
        </div>
      )}
    </div>
  )
}
