import { useNavigate } from 'react-router-dom'
import { useSyntheticStore } from '../context/useSyntheticStore'
import { malaysiaDateFormatter as date } from '../lib/formatters'
import Heading from '../components/ui/Heading'

export default function StockView() {
  const navigate = useNavigate()
  const { state, openModal } = useSyntheticStore()
  const { movements } = state

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
        eyebrow="Inventory movements"
        title="Stock ledger"
        text="An auditable history of every receipt, consumption, and adjustment."
        action="+ Log movement"
        onAction={() => openModal('movement')}
      />

      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Movement</th>
              <th>Quantity</th>
              <th>Reference</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((move) => (
              <tr key={move.id}>
                <td>{date.format(new Date(move.date))}</td>
                <td>
                  <b>{move.itemName}</b>
                </td>
                <td>{move.type}</td>
                <td className={move.quantity > 0 ? 'positive' : 'negative'}>
                  {move.quantity > 0 ? '+' : ''}
                  {move.quantity}
                </td>
                <td>{move.reference}</td>
                <td>{move.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
