export default function PanelTitle({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="panel-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="ghost" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}
