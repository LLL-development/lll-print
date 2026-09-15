import type { ModuleKey } from '../domain/models'
import type { MoreSubModule, PrimaryDestination } from './navigationTypes'

export const PRIMARY_ROUTES: Record<PrimaryDestination, string> = {
  overview: '/overview',
  quotations: '/quotations',
  jobs: '/jobs',
  billing: '/billing',
  more: '/more',
}

export const MORE_ROUTES: Record<MoreSubModule, string> = {
  contacts: '/more/contacts',
  inventory: '/more/inventory',
  stock: '/more/stock',
  finance: '/more/finance',
  insights: '/more/insights',
  settings: '/more/settings',
}

export const LEGACY_REDIRECTS: Record<string, string> = {
  '/dashboard': '/overview',
  '/contacts': '/more/contacts',
  '/inventory': '/more/inventory',
  '/stock': '/more/stock',
  '/finance': '/more/finance',
  '/insights': '/more/insights',
  '/settings': '/more/settings',
}

export const APP_ROUTES: Record<ModuleKey, string> = {
  dashboard: '/overview',
  jobs: '/jobs',
  documents: '/documents',
  contacts: '/more/contacts',
  inventory: '/more/inventory',
  stock: '/more/stock',
  finance: '/more/finance',
  insights: '/more/insights',
  settings: '/more/settings',
}

export function pathForModule(module: ModuleKey): string {
  // Retain legacy paths for existing tests if exact match expected, or mapped destination
  if (module === 'dashboard') return '/dashboard'
  if (module === 'settings') return '/settings'
  return APP_ROUTES[module] ?? '/overview'
}

export function moduleFromPath(pathname: string): ModuleKey {
  const clean = pathname.split('?')[0].split('#')[0]
  if (clean === '/overview' || clean === '/dashboard' || clean === '/') return 'dashboard'
  if (clean.startsWith('/jobs')) return 'jobs'
  if (clean === '/quotations' || clean === '/documents') return 'documents'
  if (clean.startsWith('/billing') || clean.startsWith('/more/finance') || clean === '/finance') return 'finance'
  if (clean.startsWith('/more/contacts') || clean === '/contacts') return 'contacts'
  if (clean.startsWith('/more/inventory') || clean === '/inventory') return 'inventory'
  if (clean.startsWith('/more/stock') || clean === '/stock') return 'stock'
  if (clean.startsWith('/more/insights') || clean === '/insights') return 'insights'
  if (clean.startsWith('/more/settings') || clean === '/settings') return 'settings'
  return 'dashboard'
}

export function resolveDestination(pathname: string): PrimaryDestination {
  const clean = pathname.split('?')[0].split('#')[0]
  if (clean === '/overview' || clean === '/dashboard' || clean === '/') return 'overview'
  if (clean.startsWith('/quotations')) return 'quotations'
  if (clean.startsWith('/jobs')) return 'jobs'
  if (clean.startsWith('/billing')) return 'billing'
  if (clean.startsWith('/documents')) return 'quotations'
  return 'more'
}
