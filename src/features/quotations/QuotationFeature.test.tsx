import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SyntheticStoreProvider } from '../../context/SyntheticStoreContext'
import { SyntheticStoreContext } from '../../context/storeContext'
import { memoryStore } from '../../adapters/memoryStore'
import ModalRoot from '../../components/modals/ModalRoot'
import QuotationsView from '../../views/QuotationsView'
import DocumentsView from '../../views/DocumentsView'
import QuotationForm from './components/QuotationForm'

function FullQuotationsHarness({ initialEntries = ['/quotations'] }: { initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <SyntheticStoreProvider>
        <Routes>
          <Route path="/quotations" element={<QuotationsView />} />
          <Route path="/documents" element={<DocumentsView />} />
        </Routes>
        <ModalRoot />
      </SyntheticStoreProvider>
    </MemoryRouter>
  )
}

describe('T3 Quotation Feature Integration', () => {
  beforeEach(() => {
    memoryStore.resetToFixtures()
  })

  it('displays existing seed draft quotation in QuotationsView with formatted totals and readiness', () => {
    render(<FullQuotationsHarness />)

    expect(screen.getByRole('heading', { name: 'Quotations' })).toBeInTheDocument()
    expect(screen.getByTestId('quotation-row-Q-3028')).toBeInTheDocument()
    expect(screen.getByTestId('quotation-card-Q-3028')).toBeInTheDocument()
    expect(screen.getAllByText('Meridian Studio').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Corporate apparel polo order').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/2,800\.00/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Ready').length).toBeGreaterThanOrEqual(1)
  })

  it('opens "+ New quotation" modal, filters customer contacts, updates live line total without confirmation, and saves new draft', async () => {
    render(<FullQuotationsHarness />)

    // Open creation modal
    fireEvent.click(screen.getByRole('button', { name: /\+ New quotation/i }))

    const dialog = screen.getByRole('dialog', { name: /New draft quotation/i })
    expect(dialog).toBeInTheDocument()

    // 1. Customer picker: selects customer contact (Meridian Studio)
    const customerSelect = within(dialog).getByLabelText(/Customer \*/i)
    fireEvent.change(customerSelect, { target: { value: 'C-01' } })
    expect(within(dialog).getAllByText(/7810/).length).toBeGreaterThanOrEqual(1)

    // 2. Due date and source of enquiry (FR-4)
    const dueDateInput = within(dialog).getByLabelText(/Requested Due Date/i)
    fireEvent.change(dueDateInput, { target: { value: '2026-09-20' } })

    const sourceInput = within(dialog).getByLabelText(/Enquiry source/i)
    fireEvent.change(sourceInput, { target: { value: 'WhatsApp inquiry, 28 Aug' } })

    // 3. Line 1: description, quantity, unit, unitPrice
    const descInput = within(dialog).getByLabelText(/Line 1 Description/i)
    fireEvent.change(descInput, { target: { value: '50 Medium shirts' } })

    const qtyInput = within(dialog).getByLabelText(/Quantity/i)
    fireEvent.change(qtyInput, { target: { value: '50' } })

    const priceInput = within(dialog).getByLabelText(/Unit Price \(RM\)/i)
    fireEvent.change(priceInput, { target: { value: '18.00' } })

    // Live line total calculation: 50 * 18.00 = RM 900.00 immediately without clicking confirm
    expect(within(dialog).getAllByText(/900\.00/).length).toBeGreaterThanOrEqual(1)

    // 4. Add line 2
    fireEvent.click(within(dialog).getByRole('button', { name: /\+ Add line item/i }))
    const descInput2 = within(dialog).getByLabelText(/Line 2 Description/i)
    fireEvent.change(descInput2, { target: { value: '50 Large shirts' } })

    const qtyInputs = within(dialog).getAllByLabelText(/Quantity/i)
    fireEvent.change(qtyInputs[1], { target: { value: '50' } })

    const priceInputs = within(dialog).getAllByLabelText(/Unit Price \(RM\)/i)
    fireEvent.change(priceInputs[1], { target: { value: '18.00' } })

    // Subtotal: 900 + 900 = 1800.00
    expect(within(dialog).getAllByText(/1,800\.00/).length).toBeGreaterThanOrEqual(1)

    // 5. Commercial terms: Discount RM 100.00 -> Grand Total RM 1,700.00 (SRS worked example)
    const discountInput = within(dialog).getByLabelText(/Discount \(RM\)/i)
    fireEvent.change(discountInput, { target: { value: '100.00' } })

    expect(within(dialog).getAllByText(/1,700\.00/).length).toBeGreaterThanOrEqual(1)
    expect(within(dialog).getByText(/✓ Ready to record as sent/i)).toBeInTheDocument()

    // 6. Save draft quotation
    fireEvent.click(within(dialog).getByRole('button', { name: /Save draft quotation/i }))

    // Modal closes and new draft appears in quotations table
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('quotation-row-Q-3029')).toBeInTheDocument()
    expect(screen.getByTestId('quotation-card-Q-3029')).toBeInTheDocument()
    expect(screen.getAllByText(/1,700\.00/).length).toBeGreaterThanOrEqual(1)
  })

  it('rejects excessive discount (> subtotal) with accessible error summary and preserves entered inputs', () => {
    render(<FullQuotationsHarness />)

    fireEvent.click(screen.getByRole('button', { name: /\+ New quotation/i }))
    const dialog = screen.getByRole('dialog', { name: /New draft quotation/i })

    const descInput = within(dialog).getByLabelText(/Line 1 Description/i)
    fireEvent.change(descInput, { target: { value: 'Small batch run' } })

    const priceInput = within(dialog).getByLabelText(/Unit Price \(RM\)/i)
    fireEvent.change(priceInput, { target: { value: '50.00' } }) // 1 * 50 = RM 50.00

    // Set excessive discount: 60.00 > 50.00
    const discountInput = within(dialog).getByLabelText(/Discount \(RM\)/i)
    fireEvent.change(discountInput, { target: { value: '60.00' } })

    // Submit
    fireEvent.click(within(dialog).getByRole('button', { name: /Save draft quotation/i }))

    // Accessible error summary displays
    const errorAlerts = within(dialog).getAllByRole('alert')
    expect(errorAlerts.length).toBeGreaterThanOrEqual(1)
    expect(within(dialog).getAllByText(/Discount.*cannot exceed.*subtotal/i).length).toBeGreaterThanOrEqual(1)

    // Form remains open and entered inputs are preserved
    expect(descInput).toHaveValue('Small batch run')
    expect(discountInput).toHaveValue('60.00')
  })

  it('supports opening quotation preview dialog, reviewing details, and transitioning to edit mode', async () => {
    render(<FullQuotationsHarness />)

    // Click row Q-3028
    const row = screen.getByTestId('quotation-row-Q-3028')
    fireEvent.click(row)

    // Preview dialog opens
    const dialog = screen.getByRole('dialog', { name: /Quotation Q-3028 \(Draft\)/i })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('Corporate apparel polo order')).toBeInTheDocument()

    // Click "Edit draft"
    fireEvent.click(within(dialog).getByRole('button', { name: /Edit draft/i }))

    // Transitions to edit modal
    const editDialog = screen.getByRole('dialog', { name: /Edit draft quotation Q-3028/i })
    expect(editDialog).toBeInTheDocument()

    // Edit notes
    const notesInput = within(editDialog).getByLabelText(/Order & Production Notes/i)
    fireEvent.change(notesInput, { target: { value: 'Urgent priority processing requested' } })

    // Save changes
    fireEvent.click(within(editDialog).getByRole('button', { name: /Save draft changes/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('handles recoverable save failure via test double: keeps all entered input, displays role="alert", and succeeds on retry', () => {
    let failFirstTime = true
    const failingStoreValue = {
      state: {
        contacts: [{ id: 'C-01', name: 'Meridian Studio', type: 'Customer', phone: '012-3456789', email: 'm@example.com' }],
      },
      addQuotation: vi.fn(() => {
        if (failFirstTime) {
          failFirstTime = false
          throw new Error('Database connection failed: mock disk write error')
        }
        return {
          id: 'Q-9999',
          familyId: 'QF-9999',
          version: 1,
          revision: 1,
          number: 'Q-9999',
          previousRevisionId: null,
          isLatest: true,
          status: 'draft' as const,
          jobId: null,
          customerId: 'C-01',
          customerName: 'Meridian Studio',
          dueDate: '2026-09-15',
          sourceNote: 'Test failure recovery',
          lines: [{ description: 'Preserved order line', quantity: '10', unit: 'pcs', unitPrice: '25.00' }],
          lineTotals: ['250.00'],
          totals: {
            subtotal: '250.00',
            discountAmount: '0.00',
            discountedSubtotal: '250.00',
            taxRate: '0.00',
            taxAmount: '0.00',
            grandTotal: '250.00',
            provisional: false,
          },
          notes: 'Test recovery notes',
          createdAt: new Date().toISOString(),
        }
      }),
      updateQuotation: vi.fn(),
      setQuoteFormDirty: vi.fn(),
    }

    const onClose = vi.fn()
    const onSaveSuccess = vi.fn()

    render(
      <SyntheticStoreContext.Provider value={failingStoreValue as any}>
        <QuotationForm onClose={onClose} onSaveSuccess={onSaveSuccess} />
      </SyntheticStoreContext.Provider>,
    )

    // Enter data into form
    const descInput = screen.getByLabelText(/Line 1 Description/i)
    fireEvent.change(descInput, { target: { value: 'Preserved order line' } })

    const qtyInput = screen.getByLabelText(/Quantity/i)
    fireEvent.change(qtyInput, { target: { value: '10' } })

    const priceInput = screen.getByLabelText(/Unit Price \(RM\)/i)
    fireEvent.change(priceInput, { target: { value: '25.00' } })

    const notesInput = screen.getByLabelText(/Order & Production Notes/i)
    fireEvent.change(notesInput, { target: { value: 'Test recovery notes' } })

    // Attempt save - fails
    fireEvent.click(screen.getByRole('button', { name: /Save draft quotation/i }))

    // Assert error alert is visible (FR-1.7)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByText(/Database connection failed: mock disk write error/i)).toBeInTheDocument()

    // Assert form has NOT closed and ALL entered values are preserved
    expect(onClose).not.toHaveBeenCalled()
    expect(descInput).toHaveValue('Preserved order line')
    expect(qtyInput).toHaveValue('10')
    expect(priceInput).toHaveValue('25.00')
    expect(notesInput).toHaveValue('Test recovery notes')

    // Retry save - succeeds
    fireEvent.click(screen.getByRole('button', { name: /Save draft quotation/i }))

    expect(onSaveSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders legacy /documents view with migrated QuotationView data cleanly', () => {
    render(<FullQuotationsHarness initialEntries={['/documents']} />)

    // Switch to Quotations tab
    fireEvent.click(screen.getByRole('button', { name: /Quotations \(/i }))

    expect(screen.getByText('Q-3028')).toBeInTheDocument()
    expect(screen.getByText('Meridian Studio')).toBeInTheDocument()
    expect(screen.getByText('Corporate apparel polo order')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText(/2,800\.00/)).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('renders modal and responsive quotation layout containers in the DOM', () => {
    const { container } = render(<FullQuotationsHarness />)

    // Open creation modal
    fireEvent.click(screen.getByRole('button', { name: /\+ New quotation/i }))

    const modal = container.querySelector('.modal-wide')
    expect(modal).toBeInTheDocument()

    // Check that key mobile layout containers are present in the DOM
    expect(container.querySelector('.quotation-form-body')).toBeInTheDocument()
    expect(container.querySelector('.quotation-totals-card')).toBeInTheDocument()
  })

  it('preserves incomplete draft fields exactly when reopening: null due date remains empty and empty line array remains empty', async () => {
    // Add an incomplete draft directly to memory store
    const incompleteDraft = memoryStore.addQuotation({
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: null,
      sourceNote: 'Incomplete draft test',
      lines: [],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: 'Notes on incomplete draft',
    })

    render(<FullQuotationsHarness />)

    // Find the row for this draft and click it to open preview
    const row = screen.getByTestId(`quotation-row-${incompleteDraft.id}`)
    fireEvent.click(row)

    // Preview dialog opens
    const previewDialog = screen.getByRole('dialog', { name: new RegExp(`Quotation ${incompleteDraft.id}`, 'i') })
    expect(previewDialog).toBeInTheDocument()

    // Click "Edit draft"
    fireEvent.click(within(previewDialog).getByRole('button', { name: /Edit draft/i }))

    // Edit modal opens
    const editDialog = screen.getByRole('dialog', { name: new RegExp(`Edit draft quotation ${incompleteDraft.id}`, 'i') })
    expect(editDialog).toBeInTheDocument()

    // Due date input should be empty (no hardcoded fallback like 2026-09-15)
    const dueDateInput = within(editDialog).getByLabelText(/Requested Due Date/i)
    expect(dueDateInput).toHaveValue('')

    // Lines should be empty; empty state banner displayed
    expect(within(editDialog).getByText(/No line items in this draft/i)).toBeInTheDocument()
    expect(within(editDialog).queryByLabelText(/Line 1 Description/i)).not.toBeInTheDocument()
  })

  it('displays live validation and does not present invalid totals as final when typing excessive discount or invalid tax rate', () => {
    render(<FullQuotationsHarness />)

    fireEvent.click(screen.getByRole('button', { name: /\+ New quotation/i }))
    const dialog = screen.getByRole('dialog', { name: /New draft quotation/i })

    // Setup line: 1 qty @ RM 100.00 -> Subtotal = RM 100.00
    const descInput = within(dialog).getByLabelText(/Line 1 Description/i)
    fireEvent.change(descInput, { target: { value: 'Standard item' } })
    const priceInput = within(dialog).getByLabelText(/Unit Price \(RM\)/i)
    fireEvent.change(priceInput, { target: { value: '100.00' } })

    // Valid grand total initially: RM 100.00
    expect(within(dialog).getByText(/Grand Total \(MYR\)/i).parentElement).toHaveTextContent(/100\.00/)

    // 1. Enter excessive discount: RM 150.00 (> 100.00)
    const discountInput = within(dialog).getByLabelText(/Discount \(RM\)/i)
    fireEvent.change(discountInput, { target: { value: '150.00' } })

    // Immediate error feedback
    expect(within(dialog).getAllByText(/cannot exceed the subtotal/i).length).toBeGreaterThanOrEqual(1)
    // Grand total is NOT presented as final or negative or clamped; shows "—"
    expect(within(dialog).getByText(/Grand Total \(MYR\)/i).parentElement).toHaveTextContent('—')

    // Reset discount to 0.00
    fireEvent.change(discountInput, { target: { value: '0.00' } })
    expect(within(dialog).queryByText(/cannot exceed the subtotal/i)).not.toBeInTheDocument()
    expect(within(dialog).getByText(/Grand Total \(MYR\)/i).parentElement).toHaveTextContent(/100\.00/)

    // 2. Enter invalid tax rate: "120.00" (> 100.00)
    const taxInput = within(dialog).getByLabelText(/Tax rate \(%\)/i)
    fireEvent.change(taxInput, { target: { value: '120.00' } })

    // Immediate error feedback, grand total is "—" (not silently replaced with zero)
    expect(within(dialog).getAllByText(/Tax rate must be between 0\.00% and 100\.00%/i).length).toBeGreaterThanOrEqual(1)
    expect(within(dialog).getByText(/Grand Total \(MYR\)/i).parentElement).toHaveTextContent('—')
  })

  it('returns null line total (displays —) when description or unit is missing across form, saved record, and preview', async () => {
    render(<FullQuotationsHarness />)

    fireEvent.click(screen.getByRole('button', { name: /\+ New quotation/i }))
    const dialog = screen.getByRole('dialog', { name: /New draft quotation/i })

    // Select customer
    const customerSelect = within(dialog).getByLabelText(/Customer \*/i)
    fireEvent.change(customerSelect, { target: { value: 'C-01' } })

    // Line 1: quantity and price present, but description and unit are EMPTY
    const qtyInput = within(dialog).getByLabelText(/Quantity/i)
    fireEvent.change(qtyInput, { target: { value: '10' } })

    const priceInput = within(dialog).getByLabelText(/Unit Price \(RM\)/i)
    fireEvent.change(priceInput, { target: { value: '20.00' } })

    const unitInput = within(dialog).getByLabelText(/^Unit$/i)
    fireEvent.change(unitInput, { target: { value: '' } }) // empty unit

    const descInput = within(dialog).getByLabelText(/Line 1 Description/i)
    expect(descInput).toHaveValue('')

    // In form: line total shows "—"
    const lineTotalDisplay = within(dialog).getByText(/Line Total/i).parentElement
    expect(lineTotalDisplay).toHaveTextContent('—')

    // Save draft quotation with incomplete line
    fireEvent.click(within(dialog).getByRole('button', { name: /Save draft quotation/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // Verify in saved record in memoryStore that lineTotals[0] is null
    const savedQuotation = memoryStore.getState().quotations.find((q) => q.customerName === 'Meridian Studio' && q.lines[0]?.quantity === '10')!
    expect(savedQuotation).toBeDefined()
    expect(savedQuotation.lineTotals[0]).toBeNull()

    // Open detail preview modal for the saved draft
    const row = screen.getByTestId(`quotation-row-${savedQuotation.id}`)
    fireEvent.click(row)

    const previewDialog = screen.getByRole('dialog', { name: new RegExp(`Quotation ${savedQuotation.id}`, 'i') })
    expect(previewDialog).toBeInTheDocument()

    // In detail preview table, the line total cell displays "—"
    const table = within(previewDialog).getByRole('table')
    expect(within(table).getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('enforces SDD limits at the adapter boundary, rejecting >200 lines and excessive discounts', () => {
    // 1. Rejects > 200 lines
    const over200Lines = Array.from({ length: 201 }, (_, i) => ({
      description: `Line item ${i + 1}`,
      quantity: '1',
      unit: 'pcs',
      unitPrice: '10.00',
    }))

    expect(() => {
      memoryStore.addQuotation({
        customerId: 'C-01',
        customerName: 'Meridian Studio',
        dueDate: '2026-09-30',
        sourceNote: 'Over 200 lines',
        lines: over200Lines,
        discountAmount: '0.00',
        taxRate: '0.00',
        notes: '',
      })
    }).toThrow(/exceed maximum allowable limit of 200/i)

    // 2. Rejects excessive discount
    expect(() => {
      memoryStore.addQuotation({
        customerId: 'C-01',
        customerName: 'Meridian Studio',
        dueDate: '2026-09-30',
        sourceNote: 'Excessive discount test',
        lines: [
          { description: 'Item 1', quantity: '1', unit: 'pcs', unitPrice: '50.00' },
        ],
        discountAmount: '75.00',
        taxRate: '0.00',
        notes: '',
      })
    }).toThrow(/Discount amount .* cannot exceed the subtotal/i)

    // 3. Rejects line total exceeding 999999999999.99 even when quantity and price are individually valid
    const preCount = memoryStore.getState().quotations.length
    expect(() => {
      memoryStore.addQuotation({
        customerId: 'C-01',
        customerName: 'Meridian Studio',
        dueDate: '2026-09-30',
        sourceNote: 'Massive line item',
        lines: [
          { description: 'Massive order', quantity: '1000000', unit: 'pcs', unitPrice: '1000000.00' },
        ],
        discountAmount: '0.00',
        taxRate: '0.00',
        notes: '',
      })
    }).toThrow(/Line 1 total exceeds maximum allowable limit/i)
    // Verify store was not modified
    expect(memoryStore.getState().quotations.length).toBe(preCount)

    // 4. Rejects subtotal exceeding 999999999999.99 from sum of individually valid lines
    expect(() => {
      memoryStore.addQuotation({
        customerId: 'C-01',
        customerName: 'Meridian Studio',
        dueDate: '2026-09-30',
        sourceNote: 'Sum exceeds limit',
        lines: [
          { description: 'Batch 1', quantity: '100000', unit: 'pcs', unitPrice: '6000000.00' },
          { description: 'Batch 2', quantity: '100000', unit: 'pcs', unitPrice: '5000000.00' },
        ],
        discountAmount: '0.00',
        taxRate: '0.00',
        notes: '',
      })
    }).toThrow(/Subtotal exceeds maximum allowable limit/i)
    expect(memoryStore.getState().quotations.length).toBe(preCount)

    // 5. Rejects grand total when tax pushes total over 999999999999.99
    expect(() => {
      memoryStore.addQuotation({
        customerId: 'C-01',
        customerName: 'Meridian Studio',
        dueDate: '2026-09-30',
        sourceNote: 'Tax pushes over limit',
        lines: [
          { description: 'Batch 1', quantity: '100000', unit: 'pcs', unitPrice: '9500000.00' },
        ],
        discountAmount: '0.00',
        taxRate: '10.00',
        notes: '',
      })
    }).toThrow(/Grand total exceeds maximum allowable limit/i)
    expect(memoryStore.getState().quotations.length).toBe(preCount)

    // 6. Accepts values exactly at the permitted boundary of 999999999999.99
    const boundaryQuote = memoryStore.addQuotation({
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-30',
      sourceNote: 'Boundary test',
      lines: [
        { description: 'Boundary Item', quantity: '1000000.100', unit: 'pcs', unitPrice: '999999.90' },
      ],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    })
    expect(boundaryQuote).toBeDefined()
    expect(boundaryQuote.lineTotals[0]).toBe('999999999999.99')
    expect(boundaryQuote.totals.subtotal).toBe('999999999999.99')
    expect(boundaryQuote.totals.grandTotal).toBe('999999999999.99')
    expect(memoryStore.getState().quotations.length).toBe(preCount + 1)
  })

  it('shows clear validation error, marks readiness false, and keeps totals non-final when product exceeds 999999999999.99', () => {
    render(<FullQuotationsHarness />)

    fireEvent.click(screen.getByRole('button', { name: /\+ New quotation/i }))
    const dialog = screen.getByRole('dialog', { name: /New draft quotation/i })

    // Setup line with valid individual numbers whose product exceeds 999999999999.99
    const descInput = within(dialog).getByLabelText(/Line 1 Description/i)
    fireEvent.change(descInput, { target: { value: 'Massive order' } })

    const qtyInput = within(dialog).getByLabelText(/Quantity/i)
    fireEvent.change(qtyInput, { target: { value: '1000000' } })

    const priceInput = within(dialog).getByLabelText(/Unit Price \(RM\)/i)
    fireEvent.change(priceInput, { target: { value: '1000000.00' } })

    // Line total displays '—' instead of invalid overflow
    const lineTotalDisplay = within(dialog).getByText('Line Total').parentElement
    expect(lineTotalDisplay).toHaveTextContent('—')

    // Grand total displays '—'
    expect(within(dialog).getByText(/Grand Total \(MYR\)/i).parentElement).toHaveTextContent('—')

    // Send readiness indicates incomplete / issues
    expect(within(dialog).getByText(/Draft · Incomplete/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/Line 1: Line total exceeds maximum allowable limit/i)).toBeInTheDocument()

    // Attempt save - validation blocks and displays error summary
    fireEvent.click(within(dialog).getByRole('button', { name: /Save draft quotation/i }))

    expect(within(dialog).getAllByRole('alert').length).toBeGreaterThanOrEqual(1)
    expect(within(dialog).getAllByText(/Line 1: Line total exceeds maximum allowable limit/i).length).toBeGreaterThanOrEqual(1)
  })
})
