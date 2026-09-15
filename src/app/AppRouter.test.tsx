import { describe, expect, it } from 'vitest'
import { moduleFromPath, pathForModule, PRIMARY_ROUTES, resolveDestination } from './routes'

describe('application routes and navigation destinations', () => {
  it('defines the 5 primary destinations per SDD §5', () => {
    expect(PRIMARY_ROUTES.overview).toBe('/overview')
    expect(PRIMARY_ROUTES.quotations).toBe('/quotations')
    expect(PRIMARY_ROUTES.jobs).toBe('/jobs')
    expect(PRIMARY_ROUTES.billing).toBe('/billing')
    expect(PRIMARY_ROUTES.more).toBe('/more')
  })

  it('maps legacy modules to stable paths', () => {
    expect(pathForModule('dashboard')).toBe('/dashboard')
    expect(pathForModule('jobs')).toBe('/jobs')
    expect(pathForModule('settings')).toBe('/settings')
  })

  it('resolves primary destinations from pathnames', () => {
    expect(resolveDestination('/overview')).toBe('overview')
    expect(resolveDestination('/')).toBe('overview')
    expect(resolveDestination('/quotations')).toBe('quotations')
    expect(resolveDestination('/documents')).toBe('quotations')
    expect(resolveDestination('/jobs')).toBe('jobs')
    expect(resolveDestination('/billing')).toBe('billing')
    expect(resolveDestination('/more')).toBe('more')
    expect(resolveDestination('/more/contacts')).toBe('more')
  })

  it('resolves legacy modules and safely falls back to dashboard', () => {
    expect(moduleFromPath('/inventory')).toBe('inventory')
    expect(moduleFromPath('/more/inventory')).toBe('inventory')
    expect(moduleFromPath('/jobs/J-1047')).toBe('jobs')
    expect(moduleFromPath('/unknown')).toBe('dashboard')
  })
})
