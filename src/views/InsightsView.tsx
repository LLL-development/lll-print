import { useNavigate } from 'react-router-dom'
import Heading from '../components/ui/Heading'
import PanelTitle from '../components/ui/PanelTitle'

export default function InsightsView() {
  const navigate = useNavigate()

  return (
    <>
      <div style={{ marginBottom: '10px' }}>
        <button
          type="button"
          className="ghost"
          onClick={() => navigate('/more')}
          style={{ paddingLeft: 0 }}
        >
          ← Back to More
        </button>
      </div>

      <Heading
        eyebrow="Production intelligence"
        title="Insights"
        text="Understand lead time, bottlenecks, defects, and material waste."
      />

      <section className="insight-grid">
        <article className="panel">
          <p className="eyebrow">Average lead time</p>
          <strong className="big-number">3.4 days</strong>
          <p className="positive">↓ 8% from last month</p>
        </article>
        <article className="panel">
          <p className="eyebrow">First-pass quality</p>
          <strong className="big-number">96.2%</strong>
          <p>12 defects across 316 units</p>
        </article>
        <article className="panel chart-card">
          <PanelTitle eyebrow="Six-week trend" title="Jobs completed" action="View report" />
          <div className="mock-chart">
            {[42, 64, 48, 82, 68, 92].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </article>
      </section>
    </>
  )
}
