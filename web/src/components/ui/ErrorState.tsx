export default function ErrorState({
  title = 'Operation could not be completed',
  description = 'An error occurred while loading this section.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="empty-state" role="alert">
      <div style={{ color: 'var(--red, #cf3c4e)' }}>!</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry && (
        <button className="secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
