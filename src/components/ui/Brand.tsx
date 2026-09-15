export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span>LLL</span>
      {compact ? (
        <b>LLL Print</b>
      ) : (
        <div>
          <b>LLL Print</b>
          <small>Print operations</small>
        </div>
      )}
    </div>
  )
}
