import { useNavigate } from 'react-router-dom'
import { useSyntheticStore } from '../context/useSyntheticStore'
import Heading from '../components/ui/Heading'

export default function InventoryView() {
  const navigate = useNavigate()
  const { state, openModal } = useSyntheticStore()
  const { inventory: items } = state

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
        eyebrow="Inventory master"
        title="Items & BOM"
        text="Manage raw materials, finished goods, and production recipes."
        action="+ Add item"
        onAction={() => openModal('item')}
      />

      <section className="cards">
        {items.map((item) => (
          <article className="inventory-card" key={item.id}>
            <div className="item-top">
              <span className="item-icon">{item.category === 'Garment' ? 'T' : '◈'}</span>
              <span className={item.quantity <= item.reorderLevel ? 'stock-low' : 'stock-ok'}>
                {item.quantity <= item.reorderLevel ? 'Low stock' : 'Healthy'}
              </span>
            </div>
            <h3>{item.name}</h3>
            <p>
              {item.category} · {item.sku}
            </p>
            <div className="quantity">
              <strong>{item.quantity}</strong>
              <span>{item.unit} available</span>
            </div>
            <small>
              Reorder at {item.reorderLevel} {item.unit}
            </small>
          </article>
        ))}
      </section>
    </>
  )
}
