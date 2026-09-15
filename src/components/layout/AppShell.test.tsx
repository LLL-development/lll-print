import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SyntheticStoreProvider } from '../../context/SyntheticStoreContext'
import AppShell from './AppShell'
import JobsView from '../../views/JobsView'
import OverviewView from '../../views/OverviewView'
import { memoryStore } from '../../adapters/memoryStore'

function NavigatingHarness() {
  const navigate = useNavigate()
  return (
    <div>
      <button type="button" onClick={() => navigate('/jobs')} data-testid="nav-jobs">
        Navigate to Jobs
      </button>
      <button type="button" onClick={() => navigate('/overview')} data-testid="nav-overview">
        Navigate to Overview
      </button>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/overview" element={<OverviewView />} />
          <Route path="/jobs" element={<JobsView />} />
        </Route>
      </Routes>
    </div>
  )
}

describe('AppShell layout component', () => {
  function renderAppShell(initialRoute = '/overview') {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <SyntheticStoreProvider>
          <AppShell>
            <div data-testid="test-content">Test content inside shell</div>
          </AppShell>
        </SyntheticStoreProvider>
      </MemoryRouter>,
    )
  }

  it('renders child content inside shell', () => {
    renderAppShell()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('renders primary navigation destinations in desktop sidebar for focused preview', () => {
    renderAppShell()
    const nav = screen.getByRole('navigation', { name: /desktop primary navigation/i })
    expect(nav).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /contacts/i })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /quotations/i })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /print jobs/i })).toBeInTheDocument()
  })

  it('renders the 3-item mobile bottom navigation bar', () => {
    renderAppShell()
    const bottomNav = screen.getByRole('navigation', { name: /bottom navigation/i })
    expect(bottomNav).toBeInTheDocument()
    const buttons = bottomNav.querySelectorAll('button')
    expect(buttons.length).toBe(3)
    expect(within(bottomNav).getByRole('button', { name: /contacts/i })).toBeInTheDocument()
  })

  it('renders the reset-on-refresh demo notice banner', () => {
    renderAppShell()
    const banner = screen.getByRole('complementary', { name: /demo notice/i })
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveTextContent(/data is synthetic and stored in-memory/i)
  })

  it('renders the system status indicator in the topbar without demo badges', () => {
    renderAppShell()
    expect(screen.queryByText('Interactive prototype')).not.toBeInTheDocument()
    expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Staff' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('persists synthetic state when navigating away and back', () => {
    memoryStore.resetToFixtures()
    const quote = memoryStore.addQuotation({
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-12',
      sourceNote: 'Test',
      lines: [{ description: 'State Survival Test Job', quantity: '99', unit: 'pcs', unitPrice: '10.00' }],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    })
    memoryStore.transitionQuotation(quote.id, { expectedVersion: 1, action: 'send' })
    memoryStore.transitionQuotation(quote.id, { expectedVersion: 2, action: 'accept' })
    const { job: newJob } = memoryStore.convertQuotationToJob(quote.id, { expectedVersion: 3 })

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <SyntheticStoreProvider>
          <NavigatingHarness />
        </SyntheticStoreProvider>
      </MemoryRouter>,
    )

    // Verify job exists on /jobs
    expect(screen.getByText('State Survival Test Job')).toBeInTheDocument()
    expect(screen.getByText('Plan, track, and complete every customer order.')).toBeInTheDocument()

    // Navigate to /overview
    fireEvent.click(screen.getByTestId('nav-overview'))
    expect(screen.getByText('Production overview')).toBeInTheDocument()
    expect(screen.queryByText('Plan, track, and complete every customer order.')).not.toBeInTheDocument()

    // Navigate back to /jobs
    fireEvent.click(screen.getByTestId('nav-jobs'))
    expect(screen.getByText('State Survival Test Job')).toBeInTheDocument()
    expect(screen.getByText('Plan, track, and complete every customer order.')).toBeInTheDocument()

    // Resetting memory restores default fixtures
    memoryStore.resetToFixtures()
    expect(memoryStore.getState().jobs.some((j) => j.id === newJob.id)).toBe(false)
  })
})
