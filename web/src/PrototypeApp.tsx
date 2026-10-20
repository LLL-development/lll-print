import { useLocation } from 'react-router-dom'
import BillingView from './views/BillingView'
import ContactsView from './views/ContactsView'
import DocumentsView from './views/DocumentsView'
import FinanceView from './views/FinanceView'
import InsightsView from './views/InsightsView'
import InventoryView from './views/InventoryView'
import JobsView from './views/JobsView'
import OverviewView from './views/OverviewView'
import SettingsView from './views/SettingsView'
import StockView from './views/StockView'

/**
 * Temporary composition / backwards-compatibility component.
 * Feature page views have been extracted into `src/views/` per SDD §2 and T2 foundation architecture.
 */
export default function PrototypeApp() {
  const location = useLocation()
  const path = location.pathname

  if (path === '/overview' || path === '/dashboard' || path === '/') {
    return <OverviewView />
  }
  if (path.startsWith('/jobs')) {
    return <JobsView />
  }
  if (path.startsWith('/billing')) {
    return <BillingView />
  }
  if (path.startsWith('/quotations') || path.startsWith('/documents')) {
    return <DocumentsView />
  }
  if (path.startsWith('/more/contacts') || path === '/contacts') {
    return <ContactsView />
  }
  if (path.startsWith('/more/inventory') || path === '/inventory') {
    return <InventoryView />
  }
  if (path.startsWith('/more/stock') || path === '/stock') {
    return <StockView />
  }
  if (path.startsWith('/more/finance') || path === '/finance') {
    return <FinanceView />
  }
  if (path.startsWith('/more/insights') || path === '/insights') {
    return <InsightsView />
  }
  if (path.startsWith('/more/settings') || path === '/settings') {
    return <SettingsView />
  }

  return <OverviewView />
}

// Re-export extracted views for backwards compatibility
export {
  BillingView,
  ContactsView,
  DocumentsView,
  FinanceView,
  InsightsView,
  InventoryView,
  JobsView,
  OverviewView,
  SettingsView,
  StockView,
}
