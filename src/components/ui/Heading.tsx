export default function Heading({
  eyebrow,
  title,
  text,
  action,
  onAction,
}: {
  eyebrow: string
  title: string
  text: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action && (
        <button className="primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}
