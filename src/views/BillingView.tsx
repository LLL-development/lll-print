import { useNavigate } from 'react-router-dom'
import { useSyntheticStore } from '../context/useSyntheticStore'
import { formatMYR } from '../lib/formatters'
import Heading from '../components/ui/Heading'
import Metric from '../components/ui/Metric'

export default function BillingView() {
  const navigate = useNavigate()
  const { state } = useSyntheticStore()
  const { invoices } = state

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidInvoices = invoices.filter((inv) => inv.status === 'Paid')
  const partialInvoices = invoices.filter((inv) => inv.status === 'Partially paid')

  return (
    <>
      <Heading
        eyebrow="Finance & Billing"
        title="Invoices & Payments"
        text="Manage issued invoices, customer deposits, and payment statuses."
      />

      <section className="metrics">
        <Metric label="Total Invoiced" value={formatMYR(totalInvoiced)} note="Across active demo records" />
        <Metric label="Paid in Full" value={paidInvoices.length} note="Settled invoices" />
        <Metric label="Partially Paid" value={partialInvoices.length} note="Deposit received, balance pending" />
        <Metric label="Invoice Prefix" value="INV" note="Configured default" />
      </section>

      <section className="panel">
        <div className="segmented" style={{ marginBottom: '16px' }}>
          <button type="button" className="active">
            Invoices ({invoices.length})
          </button>
          <button type="button" onClick={() => navigate('/quotations')}>
            ← Quotations
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Job Ref</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <b>{inv.id}</b>
                  </td>
                  <td>{inv.jobId}</td>
                  <td>{inv.customerName}</td>
                  <td>{inv.date}</td>
                  <td>{formatMYR(inv.amount)}</td>
                  <td>
                    <span
                      className={`status status-${inv.status === 'Paid' ? 'completed' : 'pending'}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
