import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { memoryStore } from '../adapters/memoryStore'
import { SyntheticStoreProvider } from '../context/SyntheticStoreContext'
import { AppRoutes } from './AppRouter'

describe('End-to-end user journey: record creation, route persistence, and demo reset (T4)', () => {
  it('creates a job through quotation conversion, navigates away and back, and resets via demo reset button', async () => {
    memoryStore.resetToFixtures()

    // 1. Set up and convert a quotation to job in synthetic store
    const quote = memoryStore.addQuotation({
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-15',
      sourceNote: 'Direct inquiry',
      lines: [{ description: 'Custom Team Tracksuits', quantity: '75', unit: 'pcs', unitPrice: '40.00' }],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    })
    memoryStore.transitionQuotation(quote.id, { expectedVersion: 1, action: 'send' })
    memoryStore.transitionQuotation(quote.id, { expectedVersion: 2, action: 'accept' })
    memoryStore.convertQuotationToJob(quote.id, { expectedVersion: 3 })

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <SyntheticStoreProvider>
          <AppRoutes />
        </SyntheticStoreProvider>
      </MemoryRouter>,
    )

    // 2. Initial jobs list on /jobs includes converted job
    expect(screen.getByText('Print jobs')).toBeInTheDocument()
    expect(screen.getByText('Corporate polo launch')).toBeInTheDocument()
    expect(screen.getByText('Custom Team Tracksuits')).toBeInTheDocument()

    // 3. Navigate away to /quotations via desktop sidebar
    const sidebarNav = screen.getByRole('navigation', { name: /desktop primary navigation/i })
    const quotationsNavBtn = within(sidebarNav).getByRole('button', { name: /quotations/i })
    fireEvent.click(quotationsNavBtn)

    expect(screen.getByRole('heading', { name: 'Quotations' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Print jobs' })).not.toBeInTheDocument()

    // 4. Navigate back to /jobs via desktop sidebar
    const jobsNavBtn = within(sidebarNav).getByRole('button', { name: /print jobs/i })
    fireEvent.click(jobsNavBtn)

    // Verify back on Jobs page and converted job is visible
    expect(screen.getByRole('heading', { name: 'Print jobs' })).toBeInTheDocument()
    expect(screen.getByText('Custom Team Tracksuits')).toBeInTheDocument()

    // 5. Click demo reset button on the demo notice banner
    const demoBanner = screen.getByRole('complementary', { name: /demo notice/i })
    const resetBtn = within(demoBanner).getByRole('button', { name: /reset demo data/i })
    fireEvent.click(resetBtn)

    // Verify notification of reset
    expect(screen.getByRole('status')).toHaveTextContent(/demo data reset to default fixtures/i)

    // Verify converted job is removed and default fixtures are restored
    expect(screen.queryByText('Custom Team Tracksuits')).not.toBeInTheDocument()
    expect(screen.getByText('Corporate polo launch')).toBeInTheDocument()
  })

  it('updates job stage via drawer, persists status change across routes, and restores on demo reset', async () => {
    memoryStore.resetToFixtures()

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <SyntheticStoreProvider>
          <AppRoutes />
        </SyntheticStoreProvider>
      </MemoryRouter>,
    )

    // Initial state: J-1048 is Pending
    const jobRow = screen.getByTestId('job-row-J-1048')
    expect(jobRow).toBeInTheDocument()
    expect(within(jobRow).getByText(/Pending/)).toBeInTheDocument()

    // 1. Click row to open drawer
    fireEvent.click(jobRow)
    const drawer = screen.getByRole('dialog', { name: /J-1048 · Meridian Studio/i })
    expect(drawer).toBeInTheDocument()

    // 2. Click "Start Production" button
    const startBtn = within(drawer).getByRole('button', { name: /start production/i })
    fireEvent.click(startBtn)

    // Status toast appears
    expect(screen.getByRole('status')).toHaveTextContent(/started into production/i)

    // Close drawer
    const closeBtn = within(drawer).getByRole('button', { name: /close drawer/i })
    fireEvent.click(closeBtn)

    // Table now shows "In Production" for J-1048
    const updatedRow = screen.getByTestId('job-row-J-1048')
    expect(within(updatedRow).getByText(/In Production/)).toBeInTheDocument()

    // 3. Navigate away to /quotations
    const sidebarNav = screen.getByRole('navigation', { name: /desktop primary navigation/i })
    const quotationsNavBtn = within(sidebarNav).getByRole('button', { name: /quotations/i })
    fireEvent.click(quotationsNavBtn)
    expect(screen.getByRole('heading', { name: 'Quotations' })).toBeInTheDocument()

    // 4. Navigate back to /jobs
    const jobsNavBtn = within(sidebarNav).getByRole('button', { name: /print jobs/i })
    fireEvent.click(jobsNavBtn)

    // Verify status persists as "In Production"
    const rowAfterNav = screen.getByTestId('job-row-J-1048')
    expect(within(rowAfterNav).getByText(/In Production/)).toBeInTheDocument()

    // 5. Reset demo data
    const demoBanner = screen.getByRole('complementary', { name: /demo notice/i })
    const resetBtn = within(demoBanner).getByRole('button', { name: /reset demo data/i })
    fireEvent.click(resetBtn)

    // Verify J-1048 is restored to "Pending"
    const rowAfterReset = screen.getByTestId('job-row-J-1048')
    expect(within(rowAfterReset).getByText(/Pending/)).toBeInTheDocument()
  })
})
