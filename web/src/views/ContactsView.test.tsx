import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { SyntheticStoreProvider } from '../context/SyntheticStoreContext'
import { memoryStore } from '../adapters/memoryStore'
import ContactsView from './ContactsView'
import ModalRoot from '../components/modals/ModalRoot'

describe('ContactsView customer directory', () => {
  beforeEach(() => {
    memoryStore.resetToFixtures()
  })

  function renderContactsView() {
    return render(
      <MemoryRouter initialEntries={['/contacts']}>
        <SyntheticStoreProvider>
          <Routes>
            <Route path="/contacts" element={<ContactsView />} />
            <Route path="/quotations" element={<div>Quotations Page</div>} />
          </Routes>
          <ModalRoot />
        </SyntheticStoreProvider>
      </MemoryRouter>,
    )
  }

  it('renders customer contacts and excludes supplier contacts', () => {
    renderContactsView()

    // Meridian Studio (Customer) and Northstar FC (Customer) should appear
    expect(screen.getByRole('heading', { name: 'Meridian Studio' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Northstar FC' })).toBeInTheDocument()

    // Textile Source MY (Supplier) should NOT appear in the customer directory
    expect(screen.queryByRole('heading', { name: 'Textile Source MY' })).not.toBeInTheDocument()

    // Displays customer count badge
    expect(screen.getByText('2 customers')).toBeInTheDocument()
  })

  it('filters customers dynamically via instant search', () => {
    renderContactsView()

    const searchInput = screen.getByRole('searchbox', { name: /search customers/i })
    fireEvent.change(searchInput, { target: { value: 'northstar' } })

    // Only Northstar FC should be visible
    expect(screen.getByRole('heading', { name: 'Northstar FC' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Meridian Studio' })).not.toBeInTheDocument()
    expect(screen.getByText('1 of 2 customers')).toBeInTheDocument()

    // Clear search button restores all customers
    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    fireEvent.click(clearBtn)
    expect(screen.getByRole('heading', { name: 'Meridian Studio' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Northstar FC' })).toBeInTheDocument()
  })

  it('shows no-results empty state when search query matches nothing', () => {
    renderContactsView()

    const searchInput = screen.getByRole('searchbox', { name: /search customers/i })
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Customer' } })

    expect(screen.getByText(/no customers matching "Nonexistent Customer"/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Meridian Studio' })).not.toBeInTheDocument()

    // Clear search button in empty state restores list
    const clearBtn = screen.getByRole('button', { name: 'Clear search' })
    fireEvent.click(clearBtn)
    expect(screen.getByRole('heading', { name: 'Meridian Studio' })).toBeInTheDocument()
  })

  it('opens add customer modal when clicking "+ Add customer"', () => {
    renderContactsView()

    const addBtn = screen.getByRole('button', { name: /\+ add customer/i })
    fireEvent.click(addBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /add contact/i })).toBeInTheDocument()
  })

  it('opens quotation form with pre-selected customer when clicking "+ New quotation"', () => {
    renderContactsView()

    const meridianCard = screen.getByRole('heading', { name: 'Meridian Studio' }).closest('article')!
    const quoteBtn = within(meridianCard).getByRole('button', { name: /\+ new quotation/i })
    fireEvent.click(quoteBtn)

    // Quotation dialog opens
    const dialog = screen.getByRole('dialog', { name: /new draft quotation/i })
    expect(dialog).toBeInTheDocument()

    // Customer is pre-selected in customer picker
    const customerSelect = within(dialog).getByLabelText(/customer \*/i) as HTMLSelectElement
    expect(customerSelect.value).toBe('C-01')

    // Customer field remains changeable (not disabled / locked)
    expect(customerSelect).not.toBeDisabled()
  })
})
