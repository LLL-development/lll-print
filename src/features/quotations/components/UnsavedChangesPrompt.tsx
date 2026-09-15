import { useEffect, useRef } from 'react'

interface UnsavedChangesPromptProps {
  onKeepEditing: () => void
  onDiscard: () => void
}

const FOCUSABLE_SELECTOR = 'button:not([disabled])'

/**
 * Confirmation shown before an in-progress quotation draft would otherwise be
 * silently discarded (Close/Cancel, Escape, backdrop click, or an intentional
 * in-app navigation away from the form) per SDD "Unsaved navigation" (AT-06).
 *
 * This dialog is nested inside the quotation modal's own DOM subtree (so the
 * modal's existing focus trap doesn't need special-casing to include it), but
 * that means its own Tab/Shift+Tab/Escape handling must be fully
 * self-contained: it captures keydown events before the outer modal's window
 * listener sees them and stops propagation, so while this prompt is open,
 * keyboard navigation can never reach the covered form underneath it. The
 * underlying form is additionally made `inert` by the caller (ModalRoot),
 * which independently blocks pointer interaction and assistive-technology
 * navigation into it.
 */
export default function UnsavedChangesPrompt({ onKeepEditing, onDiscard }: UnsavedChangesPromptProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const keepEditingRef = useRef<HTMLButtonElement | null>(null)

  // Kept current via effect (not during render) so the capture-phase
  // listener below never holds a stale closure.
  const onKeepEditingRef = useRef(onKeepEditing)
  const onDiscardRef = useRef(onDiscard)
  useEffect(() => {
    onKeepEditingRef.current = onKeepEditing
    onDiscardRef.current = onDiscard
  })

  useEffect(() => {
    keepEditingRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onKeepEditingRef.current()
        return
      }

      if (e.key !== 'Tab') return

      const container = dialogRef.current
      if (!container) return

      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) return

      // Always take over Tab entirely while this prompt is mounted: with the
      // underlying form marked inert, native tab order would already skip
      // it, but only this explicit trap stops Tab from leaving the prompt
      // for page chrome (e.g. the sidebar) behind the modal.
      e.preventDefault()
      e.stopPropagation()

      const activeIndex = focusables.indexOf(document.activeElement as HTMLElement)
      const lastIndex = focusables.length - 1
      let nextIndex: number
      if (activeIndex === -1) {
        nextIndex = e.shiftKey ? lastIndex : 0
      } else if (e.shiftKey) {
        nextIndex = activeIndex === 0 ? lastIndex : activeIndex - 1
      } else {
        nextIndex = activeIndex === lastIndex ? 0 : activeIndex + 1
      }
      focusables[nextIndex].focus()
    }

    // Capture phase on window: runs before ModalRoot's own (bubble-phase)
    // window keydown listener, and stopPropagation prevents that outer
    // listener from also processing the same key event.
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  return (
    // Real browsers focus the nearest focusable ancestor (here, the covered
    // modal's own `tabIndex={-1}` section) when a mousedown lands on a
    // non-focusable target — without this, clicking anywhere on this overlay
    // (which fully covers the modal, since the underlying form is inert)
    // would silently steal focus off the currently-focused prompt button.
    // preventDefault on mousedown suppresses only that default focus
    // assignment; the buttons' own click handlers still fire normally.
    <div
      className="unsaved-changes-overlay"
      data-testid="unsaved-changes-prompt"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        ref={dialogRef}
        className="unsaved-changes-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-desc"
      >
        <h3 id="unsaved-changes-title">Discard unsaved changes?</h3>
        <p id="unsaved-changes-desc">
          This quotation draft has unsaved changes. Keep editing to continue, or discard to leave without saving.
        </p>
        <div className="modal-actions">
          <button
            ref={keepEditingRef}
            type="button"
            className="secondary"
            onClick={onKeepEditing}
            data-testid="keep-editing-btn"
          >
            Keep editing
          </button>
          <button type="button" className="danger" onClick={onDiscard} data-testid="discard-changes-btn">
            Discard changes
          </button>
        </div>
      </div>
    </div>
  )
}
