export default function EmptyState({
  title = 'No records found',
  description = 'There are no records to display.',
  actionLabel,
  onAction,
}: {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="empty-state" role="region" aria-label={title}>
      <div>∅</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className="primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
