import { useSyntheticStore } from '../../context/useSyntheticStore'

export default function DemoNotice() {
  const { resetStore } = useSyntheticStore()

  return (
    <aside className="demo-banner" aria-label="Demo notice">
      <div className="demo-banner-content">
        <span className="demo-text">
          Data is synthetic and stored in-memory. Reloading the browser restores default fixtures.
        </span>
      </div>
      <button
        type="button"
        className="ghost demo-reset-btn"
        onClick={resetStore}
        title="Reset in-memory data to seed fixtures"
      >
        Reset demo data
      </button>
    </aside>
  )
}
