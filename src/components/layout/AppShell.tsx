import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSyntheticStore } from '../../context/useSyntheticStore'
import ModalRoot from '../modals/ModalRoot'
import Brand from '../ui/Brand'
import BottomNav from './BottomNav'
import DemoNotice from './DemoNotice'

interface SidebarItem {
  key: string
  label: string
  path: string
  icon: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'contacts', label: 'Contacts', path: '/contacts', icon: '📇' },
  { key: 'quotations', label: 'Quotations', path: '/quotations', icon: '▤' },
  { key: 'jobs', label: 'Print Jobs', path: '/jobs', icon: '▣' },
]

export default function AppShell({ children }: { children?: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast, guardedRun } = useSyntheticStore()

  function isActive(item: SidebarItem): boolean {
    if (item.key === 'quotations') {
      return location.pathname === '/quotations' || location.pathname === '/'
    }
    return location.pathname.startsWith(item.path)
  }

  // An intentional in-app route change is guarded exactly like closing the
  // quotation form: it proceeds immediately when the form is clean, or waits
  // behind "Keep editing / Discard changes" when it is dirty (SDD "Unsaved
  // navigation", AT-06).
  function guardedNavigate(path: string) {
    guardedRun(() => navigate(path))
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand-wrapper">
          <Brand />
        </div>

        <div className="sidebar-nav-section">
          <span className="nav-section-label">Workspace</span>
          <nav aria-label="Desktop primary navigation">
            {SIDEBAR_ITEMS.map((item) => {
              const active = isActive(item)
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => guardedNavigate(item.path)}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="sidebar-foot">
          <div className="workspace-badge">
            <div className="workspace-badge-dot" />
            <div className="workspace-badge-info">
              <b>LLL Print</b>
              <small>Workspace</small>
            </div>
          </div>
        </div>
      </aside>

      <header className="mobile-header">
        <Brand compact />
      </header>

      <main>
        <header className="topbar">
          <div className="topbar-left">
            <div className="system-status-indicator">
              <span className="workspace-dot" />
              <span className="workspace-name">LLL Print</span>
            </div>
          </div>
        </header>

        <DemoNotice />

        <div className="content">{children ?? <Outlet />}</div>
      </main>

      <BottomNav />
      <ModalRoot />
      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </div>
  )
}
