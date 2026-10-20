import { useLocation, useNavigate } from 'react-router-dom'
import { useSyntheticStore } from '../../context/useSyntheticStore'

interface BottomNavItem {
  key: string
  label: string
  path: string
  icon: string
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { key: 'contacts', label: 'Contacts', path: '/contacts', icon: '📇' },
  { key: 'quotations', label: 'Quotations', path: '/quotations', icon: '▤' },
  { key: 'jobs', label: 'Print Jobs', path: '/jobs', icon: '▣' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { guardedRun } = useSyntheticStore()

  function isActive(item: BottomNavItem): boolean {
    if (item.key === 'quotations') {
      return location.pathname === '/quotations' || location.pathname === '/'
    }
    return location.pathname.startsWith(item.path)
  }

  function guardedNavigate(path: string) {
    guardedRun(() => navigate(path))
  }

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = isActive(item)
        return (
          <button
            key={item.key}
            className={active ? 'active' : ''}
            onClick={() => guardedNavigate(item.path)}
            aria-current={active ? 'page' : undefined}
            type="button"
          >
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.label}</small>
          </button>
        )
      })}
    </nav>
  )
}
