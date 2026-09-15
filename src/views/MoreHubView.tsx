import { useNavigate } from 'react-router-dom'
import Heading from '../components/ui/Heading'

interface SubModuleCard {
  title: string
  path: string
  eyebrow: string
  description: string
  icon: string
}

const MODULES: SubModuleCard[] = [
  {
    title: 'Contacts Directory',
    eyebrow: 'CRM',
    path: '/more/contacts',
    description: 'Keep customers and material suppliers in one organized directory.',
    icon: '♙',
  },
  {
    title: 'Items & BOM',
    eyebrow: 'Inventory Master',
    path: '/more/inventory',
    description: 'Manage garment blanks, inks, films, threads, and production recipes.',
    icon: '◇',
  },
  {
    title: 'Stock Ledger',
    eyebrow: 'Movements',
    path: '/more/stock',
    description: 'Auditable log of every material receipt, consumption, and manual adjustment.',
    icon: '⇄',
  },
  {
    title: 'Operational Finance',
    eyebrow: 'Performance',
    path: '/more/finance',
    description: 'Sales performance, material costs, profit margins, and cash flow overview.',
    icon: '◒',
  },
  {
    title: 'Production Insights',
    eyebrow: 'Intelligence',
    path: '/more/insights',
    description: 'Lead times, quality pass rates, defect counts, and weekly completion trends.',
    icon: '⌁',
  },
  {
    title: 'Business Settings',
    eyebrow: 'Configuration',
    path: '/more/settings',
    description: 'Configure company identity, registration, default tax rate, and payment terms.',
    icon: '⚙',
  },
]

export default function MoreHubView() {
  const navigate = useNavigate()

  return (
    <>
      <Heading
        eyebrow="Workspace Hub"
        title="More Operations"
        text="Access supporting records, inventory controls, business metrics, and workspace configuration."
      />

      <section className="cards">
        {MODULES.map((mod) => (
          <article
            key={mod.path}
            className="contact-card clickable-row"
            onClick={() => navigate(mod.path)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(mod.path)
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="avatar" style={{ fontSize: '20px', display: 'grid', placeItems: 'center' }}>
              {mod.icon}
            </div>
            <div>
              <p className="eyebrow" style={{ margin: 0, fontSize: '11px' }}>
                {mod.eyebrow}
              </p>
              <h3>{mod.title}</h3>
              <p>{mod.description}</p>
            </div>
            <button type="button" className="icon-button" aria-label={`Open ${mod.title}`}>
              →
            </button>
          </article>
        ))}
      </section>
    </>
  )
}
