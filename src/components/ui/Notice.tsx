export default function Notice({
  tone,
  title,
  text,
}: {
  tone: string
  title: string
  text: string
}) {
  return (
    <div className={`notice ${tone}`}>
      <b>{title}</b>
      <span>{text}</span>
    </div>
  )
}
