import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { memoryStore } from '../../adapters/memoryStore'
import { SyntheticStoreProvider } from '../../context/SyntheticStoreContext'
import { useSyntheticStore } from '../../context/useSyntheticStore'
import ModalRoot from './ModalRoot'

function ModalTestHarness() {
  const { openModal } = useSyntheticStore()
  return (
    <div>
      <button
        type="button"
        data-testid="open-contact-btn"
        onClick={() => openModal('contact')}
      >
        Open Contact Modal
      </button>
      <button
        type="button"
        data-testid="open-drawer-btn"
        onClick={() =>
          openModal('jobDetail', {
            id: 'J-1048',
          })
        }
      >
        Open Drawer
      </button>
      <ModalRoot />
    </div>
  )
}

describe('ModalRoot accessibility and focus management', () => {
  it('creation dialog: has accessible name, sets initial focus, traps focus, closes on Escape, and restores focus', () => {
    memoryStore.resetToFixtures()
    render(
      <SyntheticStoreProvider>
        <ModalTestHarness />
      </SyntheticStoreProvider>,
    )

    const triggerBtn = screen.getByTestId('open-contact-btn')
    triggerBtn.focus()
    expect(document.activeElement).toBe(triggerBtn)

    // Open creation modal
    fireEvent.click(triggerBtn)

    // 1. Accessible attributes
    const dialog = screen.getByRole('dialog', { name: /add contact/i })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'creation-dialog-title')

    // 2. Initial focus: should be on the first form control
    const typeSelect = screen.getByLabelText(/contact type/i)
    expect(document.activeElement).toBe(typeSelect)

    // 3. Focus trap: find first and last focusable elements
    const closeBtn = screen.getByRole('button', { name: /close/i })
    const submitBtn = screen.getByRole('button', { name: /add contact/i })

    // Tab from last element wraps to first
    submitBtn.focus()
    expect(document.activeElement).toBe(submitBtn)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false })
    expect(document.activeElement).toBe(closeBtn)

    // Shift+Tab from first element wraps to last
    closeBtn.focus()
    expect(document.activeElement).toBe(closeBtn)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(submitBtn)

    // 4. Escape key closes dialog
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // 5. Focus restoration back to triggering button
    expect(document.activeElement).toBe(triggerBtn)
  })

  it('job drawer: has accessible name, sets initial focus, traps focus, closes on Escape, and restores focus', () => {
    memoryStore.resetToFixtures()
    render(
      <SyntheticStoreProvider>
        <ModalTestHarness />
      </SyntheticStoreProvider>,
    )

    const drawerTrigger = screen.getByTestId('open-drawer-btn')
    drawerTrigger.focus()
    expect(document.activeElement).toBe(drawerTrigger)

    // Open drawer
    fireEvent.click(drawerTrigger)

    // 1. Accessible attributes
    const drawer = screen.getByRole('dialog', { name: /J-1048 · Meridian Studio/i })
    expect(drawer).toBeInTheDocument()
    expect(drawer).toHaveAttribute('aria-modal', 'true')
    expect(drawer).toHaveAttribute('aria-labelledby', 'job-drawer-title')

    // 2. Initial focus inside drawer
    expect(drawer.contains(document.activeElement)).toBe(true)

    // 3. Focus trap within drawer: first button is header Close (×), last button is Close drawer
    const closeHeaderBtn = screen.getByRole('button', { name: /^close$/i })
    const closeDrawerBtn = screen.getByRole('button', { name: /close drawer/i })

    closeDrawerBtn.focus()
    expect(document.activeElement).toBe(closeDrawerBtn)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false })
    expect(document.activeElement).toBe(closeHeaderBtn)

    closeHeaderBtn.focus()
    expect(document.activeElement).toBe(closeHeaderBtn)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(closeDrawerBtn)

    // 4. Escape key closes drawer
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // 5. Focus restored to trigger
    expect(document.activeElement).toBe(drawerTrigger)
  })
})
