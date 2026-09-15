import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryStore } from '../../adapters/memoryStore'
import AppShell from '../../components/layout/AppShell'
import { SyntheticStoreProvider } from '../../context/SyntheticStoreContext'
import OverviewView from '../../views/OverviewView'
import QuotationsView from '../../views/QuotationsView'
import JobsView from '../../views/JobsView'

/**
 * Unsaved quotation changes protection: docs/SDD.md "Unsaved navigation"
 * ("Ask whether to discard or stay before an intentional in-app route
 * change; browser-close protection is best effort") and AT-06.
 */
function renderApp(initialRoute = '/quotations') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <SyntheticStoreProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/overview" element={<OverviewView />} />
            <Route path="/quotations" element={<QuotationsView />} />
            <Route path="/jobs" element={<JobsView />} />
          </Route>
        </Routes>
      </SyntheticStoreProvider>
    </MemoryRouter>,
  )
}

function openNewQuotationForm() {
  fireEvent.click(screen.getByRole('button', { name: /\+ New quotation/i }))
}

describe('Unsaved quotation changes protection (SDD "Unsaved navigation", AT-06)', () => {
  beforeEach(() => {
    memoryStore.resetToFixtures()
  })

  it('closes an untouched new-quotation form immediately on Cancel (unchanged forms close normally)', () => {
    renderApp()
    openNewQuotationForm()
    expect(screen.getByRole('dialog', { name: /New draft quotation/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('unsaved-changes-prompt')).not.toBeInTheDocument()
  })

  it('prompts before discarding a dirty new-quotation form on Cancel; Keep editing preserves values and focus', () => {
    renderApp()
    openNewQuotationForm()
    const descInput = screen.getByLabelText(/Line 1 Description/i)
    fireEvent.change(descInput, { target: { value: 'Custom banner order' } })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()
    // The form dialog is still present underneath the prompt.
    expect(screen.getByRole('dialog', { name: /New draft quotation/i })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('keep-editing-btn'))

    expect(screen.queryByTestId('unsaved-changes-prompt')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Line 1 Description/i)).toHaveValue('Custom banner order')
    // Focus is restored into the form rather than left on a stray element.
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  })

  it('discarding a dirty new-quotation form performs the close and loses the entered values', () => {
    renderApp()
    openNewQuotationForm()
    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'Custom banner order' } })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByTestId('discard-changes-btn'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('unsaved-changes-prompt')).not.toBeInTheDocument()
  })

  it('guards Escape the same way as Cancel, and a second Escape while prompted means Keep editing', () => {
    renderApp()
    openNewQuotationForm()
    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'Escape test' } })

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('unsaved-changes-prompt')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Line 1 Description/i)).toHaveValue('Escape test')
  })

  it('guards a backdrop click the same way as Cancel', () => {
    renderApp()
    openNewQuotationForm()
    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'Backdrop test' } })

    const backdrop = document.querySelector('.modal-backdrop')
    expect(backdrop).not.toBeNull()
    fireEvent.mouseDown(backdrop as Element)

    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('detects a change to an existing quotation against its loaded initial values, not just non-empty fields', () => {
    renderApp()

    // Q-3028 already has real, non-empty values from fixtures — opening it
    // unmodified must not be treated as dirty.
    fireEvent.click(screen.getByTestId('quotation-row-Q-3028'))
    fireEvent.click(screen.getByRole('button', { name: /Edit draft/i }))
    const editDialog = screen.getByRole('dialog', { name: /Edit draft quotation Q-3028/i })
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('unsaved-changes-prompt')).not.toBeInTheDocument()

    // Reopen and actually change a field this time.
    fireEvent.click(screen.getByTestId('quotation-row-Q-3028'))
    fireEvent.click(screen.getByRole('button', { name: /Edit draft/i }))
    const editDialog2 = screen.getByRole('dialog', { name: /Edit draft quotation Q-3028/i })
    fireEvent.change(within(editDialog2).getByLabelText(/Order & Production Notes/i), {
      target: { value: 'Changed note' },
    })
    fireEvent.click(within(editDialog2).getByRole('button', { name: 'Cancel' }))

    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()
  })

  it('a successful save closes without ever showing the discard prompt, even though the form was dirty', () => {
    renderApp()
    openNewQuotationForm()
    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'Save success test' } })
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/Unit Price \(RM\)/i), { target: { value: '20.00' } })

    fireEvent.click(screen.getByRole('button', { name: /Save draft quotation/i }))

    expect(screen.queryByTestId('unsaved-changes-prompt')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('a failed save leaves the form dirty and still protected by the guard', () => {
    renderApp()
    openNewQuotationForm()
    // An invalid line (negative quantity) makes validateDraftQuotation reject
    // the save without ever reaching the adapter.
    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'Invalid qty test' } })
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '-3' } })
    fireEvent.change(screen.getByLabelText(/Unit Price \(RM\)/i), { target: { value: '20.00' } })

    fireEvent.click(screen.getByRole('button', { name: /Save draft quotation/i }))

    // Save was blocked; the form is still open and values are retained.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Line 1 Description/i)).toHaveValue('Invalid qty test')

    // The form remains protected: Cancel still prompts rather than discarding.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()
  })

  it('guards an intentional in-app navigation while dirty, and the navigation proceeds on discard', () => {
    renderApp()
    openNewQuotationForm()
    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'Nav guard test' } })

    const sidebar = screen.getByRole('navigation', { name: /desktop primary navigation/i })
    fireEvent.click(within(sidebar).getByRole('button', { name: /print jobs/i }))

    // Navigation was deferred: still on the quotations route with the form open.
    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Print jobs' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('discard-changes-btn'))

    expect(screen.getByRole('heading', { name: 'Print jobs' })).toBeInTheDocument()
  })

  it('an intentional in-app navigation proceeds immediately when the form is unchanged', () => {
    renderApp()
    openNewQuotationForm()

    const sidebar = screen.getByRole('navigation', { name: /desktop primary navigation/i })
    fireEvent.click(within(sidebar).getByRole('button', { name: /print jobs/i }))

    expect(screen.queryByTestId('unsaved-changes-prompt')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Print jobs' })).toBeInTheDocument()
  })

  it('marks the covered form inert while the prompt is open, and removes it once resolved', () => {
    renderApp()
    openNewQuotationForm()
    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'Inert test' } })

    const dialog = screen.getByRole('dialog', { name: /New draft quotation/i })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()

    const inertWrapper = dialog.querySelector('[inert]')
    expect(inertWrapper).not.toBeNull()
    expect(inertWrapper?.contains(screen.getByLabelText(/Line 1 Description/i))).toBe(true)

    fireEvent.click(screen.getByTestId('keep-editing-btn'))
    expect(dialog.querySelector('[inert]')).toBeNull()
  })

  it('Tab from Discard wraps to Keep editing, and Shift+Tab from Keep editing wraps to Discard', () => {
    renderApp()
    openNewQuotationForm()
    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'Tab wrap test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()

    const keepEditingBtn = screen.getByTestId('keep-editing-btn')
    const discardBtn = screen.getByTestId('discard-changes-btn')

    // Initial focus is on Keep editing.
    expect(document.activeElement).toBe(keepEditingBtn)

    // Tab from Keep editing -> Discard.
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(discardBtn)

    // Tab from Discard wraps back to Keep editing.
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(keepEditingBtn)

    // Shift+Tab from Keep editing wraps to Discard.
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(discardBtn)

    // Shift+Tab from Discard goes back to Keep editing.
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(keepEditingBtn)
  })

  it('repeated keyboard navigation while the prompt is open never reaches the underlying form fields', () => {
    renderApp()
    openNewQuotationForm()
    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'No escape test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()

    const keepEditingBtn = screen.getByTestId('keep-editing-btn')
    const discardBtn = screen.getByTestId('discard-changes-btn')
    const promptButtons = [keepEditingBtn, discardBtn]

    for (let i = 0; i < 12; i++) {
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: i % 3 === 0 })
      expect(promptButtons).toContain(document.activeElement)
    }

    // The prompt is still open and nothing underneath received focus.
    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()
  })

  it('Keep editing preserves data and restores interaction with the form', () => {
    renderApp()
    openNewQuotationForm()
    const descInput = screen.getByLabelText(/Line 1 Description/i)
    fireEvent.change(descInput, { target: { value: 'Restore interaction test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByTestId('keep-editing-btn'))

    expect(screen.queryByTestId('unsaved-changes-prompt')).not.toBeInTheDocument()
    expect(descInput).toHaveValue('Restore interaction test')

    // The field is interactive again: further edits are accepted.
    fireEvent.change(descInput, { target: { value: 'Further edit after keep editing' } })
    expect(descInput).toHaveValue('Further edit after keep editing')
  })

  it('Escape-as-keep-editing preserves data and restores interaction with the form', () => {
    renderApp()
    openNewQuotationForm()
    const descInput = screen.getByLabelText(/Line 1 Description/i)
    fireEvent.change(descInput, { target: { value: 'Escape restore test' } })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('unsaved-changes-prompt')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('unsaved-changes-prompt')).not.toBeInTheDocument()
    expect(descInput).toHaveValue('Escape restore test')

    fireEvent.change(descInput, { target: { value: 'Further edit after escape' } })
    expect(descInput).toHaveValue('Further edit after escape')
  })

  it('adds a best-effort beforeunload guard only while dirty, and removes it once clean again', () => {
    renderApp()
    openNewQuotationForm()

    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    fireEvent.change(screen.getByLabelText(/Line 1 Description/i), { target: { value: 'Beforeunload test' } })
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByTestId('discard-changes-btn'))

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
