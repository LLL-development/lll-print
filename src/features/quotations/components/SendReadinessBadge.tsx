import type { SendReadinessResult } from '../domain/types'

interface SendReadinessBadgeProps {
  readiness: SendReadinessResult
  showDetails?: boolean
}

export default function SendReadinessBadge({ readiness, showDetails = false }: SendReadinessBadgeProps) {
  const { isReady, issues } = readiness

  return (
    <div className="send-readiness-wrapper">
      <div className="send-readiness-header">
        <span className={`badge ${isReady ? 'badge-success' : 'badge-neutral'}`}>
          {isReady ? '✓ Ready to record as sent' : 'Draft · Incomplete'}
        </span>
      </div>

      {showDetails && !isReady && issues.length > 0 && (
        <div className="readiness-issues" role="region" aria-label="Items required before sending">
          <small className="readiness-issues-title">Required before recording as sent:</small>
          <ul>
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
