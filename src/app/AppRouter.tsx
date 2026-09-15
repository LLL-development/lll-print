import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import ContactsView from '../views/ContactsView'
import JobsView from '../views/JobsView'
import QuotationsView from '../views/QuotationsView'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Core workflow preview: Quotations is the home screen */}
        <Route index element={<Navigate to="/quotations" replace />} />
        <Route path="/contacts" element={<ContactsView />} />
        <Route path="/quotations" element={<QuotationsView />} />
        <Route path="/jobs" element={<JobsView />} />

        {/* Deferred modules — routes preserved for data integrity, redirect to home */}
        <Route path="/overview" element={<Navigate to="/quotations" replace />} />
        <Route path="/billing" element={<Navigate to="/quotations" replace />} />
        <Route path="/documents" element={<Navigate to="/quotations" replace />} />
        <Route path="/more" element={<Navigate to="/quotations" replace />} />
        <Route path="/more/contacts" element={<Navigate to="/quotations" replace />} />
        <Route path="/more/inventory" element={<Navigate to="/quotations" replace />} />
        <Route path="/more/stock" element={<Navigate to="/quotations" replace />} />
        <Route path="/more/finance" element={<Navigate to="/quotations" replace />} />
        <Route path="/more/insights" element={<Navigate to="/quotations" replace />} />
        <Route path="/more/settings" element={<Navigate to="/quotations" replace />} />

        {/* Legacy redirects */}
        <Route path="/dashboard" element={<Navigate to="/quotations" replace />} />
        <Route path="/inventory" element={<Navigate to="/quotations" replace />} />
        <Route path="/stock" element={<Navigate to="/quotations" replace />} />
        <Route path="/finance" element={<Navigate to="/quotations" replace />} />
        <Route path="/insights" element={<Navigate to="/quotations" replace />} />
        <Route path="/settings" element={<Navigate to="/quotations" replace />} />

        {/* Safe fallback */}
        <Route path="*" element={<Navigate to="/quotations" replace />} />
      </Route>
    </Routes>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
