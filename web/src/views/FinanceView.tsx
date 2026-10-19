import { useNavigate } from 'react-router-dom'
import { myrCurrencyFormatter as money } from '../lib/formatters'
import Heading from '../components/ui/Heading'
import Metric from '../components/ui/Metric'
import PanelTitle from '../components/ui/PanelTitle'

export default function FinanceView() {
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
        eyebrow="Business performance"
        title="Finance"
        text="Operational sales, expenses, payments, and profit in MYR."
      />

      <section className="metrics">
        <Metric label="Revenue" value={money.format(18420)} note="This month" />
        <Metric label="Cost of goods" value={money.format(6910)} note="Materials and production" />
        <Metric label="Outstanding" value={money.format(2840)} note="Across 4 invoices" />
        <Metric label="Gross profit" value={money.format(11510)} note="62.5% margin" />
      </section>

      <section className="panel finance-chart">
        <PanelTitle eyebrow="Cash position" title="Income and expenses" action="Export" />
        <div className="mock-lines">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="legend">
          <span>● Income</span>
          <span>● Expenses</span>
        </div>
      </section>
    </>
  )
}
