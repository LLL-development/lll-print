import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Heading from '../components/ui/Heading'
import Status from '../components/ui/Status'
import { useSyntheticStore } from '../context/useSyntheticStore'
import { formatMYR } from '../lib/formatters'

export default function DocumentsView() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'invoices' | 'quotations'>('invoices')
  const { state, openModal } = useSyntheticStore()
  const { invoices, quotations } = state

  const latestQuotations = useMemo(() => quotations.filter((q) => q.isLatest), [quotations])

  return (
    <>
      <Heading
        eyebrow="Sales"
        title="Documents"
        text="Create quotations, invoices, and payment records."
        action={tab === 'quotations' ? '+ New quotation' : undefined}
        onAction={() => openModal('quote')}
      />

      <section className="panel">
        <div className="segmented" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={tab === 'invoices' ? 'active' : ''}
            onClick={() => setTab('invoices')}
          >
            Invoices ({invoices.length})
          </button>
          <button
            type="button"
            className={tab === 'quotations' ? 'active' : ''}
            onClick={() => setTab('quotations')}
          >
            Quotations ({latestQuotations.length})
          </button>
        </div>

        {tab === 'invoices' ? (
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
            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => navigate('/billing')}
              >
                Go to dedicated Billing view →
              </button>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Quotation ID</th>
                  <th>Customer</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {latestQuotations.map((q) => {
                  const primaryDesc = q.lines[0]?.description || 'Quotation items'
                  const totalQty = q.lines.reduce(
                    (acc, l) => acc + (parseFloat(l.quantity || '0') || 0),
                    0,
                  )
                  return (
                    <tr key={q.id}>
                      <td>
                        <b>{q.number || q.id}</b>
                      </td>
                      <td>{q.customerName || '—'}</td>
                      <td>{primaryDesc}</td>
                      <td>{totalQty || '—'}</td>
                      <td>{formatMYR(q.totals.grandTotal)}</td>
                      <td>
                        <Status value={q.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => navigate('/quotations')}
              >
                Go to dedicated Quotations view →
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
