export default function LoadingState({
  message = 'Loading workspace records...',
}: {
  message?: string
}) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div>⟳</div>
      <h3>Please wait</h3>
      <p>{message}</p>
    </div>
  )
}
