import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryStore } from '../../adapters/memoryStore'
import { SyntheticStoreProvider } from '../../context/SyntheticStoreContext'
import JobBoard from './components/JobBoard'
import JobDetailDrawer from './components/JobDetailDrawer'

describe('Jobs Feature Interactive Journey (AT-03, AT-06)', () => {
  beforeEach(() => {
    memoryStore.resetToFixtures()
  })

  it('renders JobBoard with desktop and mobile views and supports searching/filtering', () => {
    const jobs = memoryStore.getState().jobs
    render(
      <SyntheticStoreProvider>
        <JobBoard jobs={jobs} onSelectJob={() => {}} onNavigateToQuotations={() => {}} />
      </SyntheticStoreProvider>,
    )

    // J-1048 is present
    expect(screen.getByTestId('job-row-J-1048')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-job-card-J-1048')).toBeInTheDocument()

    // Search filter
    const searchInput = screen.getByLabelText('Search jobs')
    fireEvent.change(searchInput, { target: { value: 'Northstar' } })

    // J-1047 (Northstar FC) matches, J-1048 does not
    expect(screen.getByTestId('job-row-J-1047')).toBeInTheDocument()
    expect(screen.queryByTestId('job-row-J-1048')).not.toBeInTheDocument()

    // No matching results shows empty state
    fireEvent.change(searchInput, { target: { value: 'NonexistentOrder' } })
    expect(screen.getByTestId('jobs-empty-state')).toBeInTheDocument()
    expect(screen.getByText('No jobs match your filter')).toBeInTheDocument()
  })

  it('executes interactive stage transition, rework reason prompt, packing gate and completion', () => {
    const renderDrawer = () => {
      const currentJob = memoryStore.getJob('J-1048')!
      return render(
        <SyntheticStoreProvider>
          <JobDetailDrawer job={currentJob} onClose={() => {}} />
        </SyntheticStoreProvider>,
      )
    }

    // 1. Initial pending job: click Start Production
    const { unmount: u1 } = renderDrawer()
    const startBtn = screen.getByText('Start Production')
    fireEvent.click(startBtn)
    u1()

    // Job is now in_production / preparation
    expect(memoryStore.getJob('J-1048')?.status).toBe('in_production')
    expect(memoryStore.getJob('J-1048')?.stage).toBe('preparation')

    // 2. Advance stage to quality_check
    const { unmount: u2 } = renderDrawer()
    const qcBtn = screen.getByRole('button', { name: 'quality check' })
    fireEvent.click(qcBtn)
    u2()

    expect(memoryStore.getJob('J-1048')?.stage).toBe('quality_check')

    // 3. Rollback stage backward to production (requires rework reason)
    const { unmount: u3 } = renderDrawer()
    const prodBtn = screen.getByRole('button', { name: 'production' })
    fireEvent.click(prodBtn)

    // Rework prompt is now visible
    expect(screen.getByTestId('rework-reason-form')).toBeInTheDocument()

    // Attempting submit without reason fails
    const confirmRollbackBtn = screen.getByText('Confirm Stage Rollback')
    fireEvent.click(confirmRollbackBtn)
    expect(screen.getByText(/Rework reason is required/)).toBeInTheDocument()

    // Enter valid rework reason
    const reworkTextarea = screen.getByLabelText('Rework reason')
    fireEvent.change(reworkTextarea, { target: { value: 'Thread tension misaligned on collar' } })
    fireEvent.click(confirmRollbackBtn)
    u3()

    expect(memoryStore.getJob('J-1048')?.stage).toBe('production')

    // 4. Move to packing stage
    const { unmount: u4 } = renderDrawer()
    const packingBtn = screen.getByRole('button', { name: 'packing' })
    fireEvent.click(packingBtn)
    u4()

    expect(memoryStore.getJob('J-1048')?.stage).toBe('packing')

    // 5. Mark Ready for Delivery
    const { unmount: u5 } = renderDrawer()
    const readyBtn = screen.getByText('Mark Ready for Delivery')
    fireEvent.click(readyBtn)
    u5()

    expect(memoryStore.getJob('J-1048')?.status).toBe('ready_for_delivery')
    expect(memoryStore.getJob('J-1048')?.deliveryStatus).toBe('ready')

    // 6. Deliver job
    const { unmount: u6 } = renderDrawer()
    const deliverBtn = screen.getByText('Confirm Customer Handover / Delivery')
    fireEvent.click(deliverBtn)
    u6()

    expect(memoryStore.getJob('J-1048')?.status).toBe('delivered')
    expect(memoryStore.getJob('J-1048')?.deliveryStatus).toBe('delivered')

    // 7. Terminal delivered job shows terminal notice
    renderDrawer()
    expect(screen.getByTestId('job-terminal-delivered')).toBeInTheDocument()
  })

  it('requires reason on cancellation and retains current stage', () => {
    // J-1047 is in_production / production
    const currentJob = memoryStore.getJob('J-1047')!
    render(
      <SyntheticStoreProvider>
        <JobDetailDrawer job={currentJob} onClose={() => {}} />
      </SyntheticStoreProvider>,
    )

    const cancelBtn = screen.getByText('Cancel Job')
    fireEvent.click(cancelBtn)

    expect(screen.getByTestId('cancel-reason-form')).toBeInTheDocument()

    const confirmCancelBtn = screen.getByText('Confirm Cancellation')
    fireEvent.click(confirmCancelBtn)
    expect(screen.getByText('Cancellation reason is required.')).toBeInTheDocument()

    const reasonTextarea = screen.getByLabelText('Cancellation reason')
    fireEvent.change(reasonTextarea, { target: { value: 'Client discontinued tournament event' } })
    fireEvent.click(confirmCancelBtn)

    const cancelledJob = memoryStore.getJob('J-1047')!
    expect(cancelledJob.status).toBe('cancelled')
    expect(cancelledJob.stage).toBe('production') // stage retained!
    expect(cancelledJob.deliveryStatus).toBe('not_applicable')
  })

  it('retains the cancellation reason and form after a failed attempt, then succeeds on retry (correction)', () => {
    const currentJob = memoryStore.getJob('J-1047')!
    render(
      <SyntheticStoreProvider>
        <JobDetailDrawer job={currentJob} onClose={() => {}} />
      </SyntheticStoreProvider>,
    )

    let attempt = 0
    memoryStore.setPrecommitHook(() => {
      attempt += 1
      if (attempt === 1) {
        throw new Error('Simulated transient failure')
      }
    })

    fireEvent.click(screen.getByText('Cancel Job'))
    const reasonTextarea = screen.getByLabelText('Cancellation reason')
    const reasonText = 'Client changed event date unexpectedly'
    fireEvent.change(reasonTextarea, { target: { value: reasonText } })
    fireEvent.click(screen.getByText('Confirm Cancellation'))

    // First attempt failed: the form stays open, the reason is retained, and
    // nothing changed in the store.
    expect(screen.getByTestId('cancel-reason-form')).toBeInTheDocument()
    expect(screen.getByLabelText('Cancellation reason')).toHaveValue(reasonText)
    expect(screen.getByText(/Simulated transient failure/)).toBeInTheDocument()
    expect(memoryStore.getJob('J-1047')?.status).toBe('in_production')

    // Retry without retyping: the same button click now succeeds.
    fireEvent.click(screen.getByText('Confirm Cancellation'))

    expect(memoryStore.getJob('J-1047')?.status).toBe('cancelled')
    expect(memoryStore.getJob('J-1047')?.stage).toBe('production')

    memoryStore.setPrecommitHook(undefined)
  })

  it('retains the rework target and reason after a failed backward stage attempt, then succeeds on retry (correction)', () => {
    memoryStore.transitionJob('J-1048', { expectedVersion: 1, action: 'start' })
    memoryStore.changeJobStage('J-1048', { expectedVersion: 2, target: 'quality_check' })

    const currentJob = memoryStore.getJob('J-1048')!
    render(
      <SyntheticStoreProvider>
        <JobDetailDrawer job={currentJob} onClose={() => {}} />
      </SyntheticStoreProvider>,
    )

    let attempt = 0
    memoryStore.setPrecommitHook(() => {
      attempt += 1
      if (attempt === 1) {
        throw new Error('Simulated transient failure')
      }
    })

    fireEvent.click(screen.getByRole('button', { name: 'production' }))
    expect(screen.getByTestId('rework-reason-form')).toBeInTheDocument()

    const reworkTextarea = screen.getByLabelText('Rework reason')
    const reworkText = 'Ink smudge detected during quality check'
    fireEvent.change(reworkTextarea, { target: { value: reworkText } })
    fireEvent.click(screen.getByText('Confirm Stage Rollback'))

    // First attempt failed: rework form stays open with the target and reason retained.
    expect(screen.getByTestId('rework-reason-form')).toBeInTheDocument()
    expect(screen.getByLabelText('Rework reason')).toHaveValue(reworkText)
    expect(screen.getByText(/Simulated transient failure/)).toBeInTheDocument()
    expect(memoryStore.getJob('J-1048')?.stage).toBe('quality_check')

    // Retry without retyping succeeds.
    fireEvent.click(screen.getByText('Confirm Stage Rollback'))

    expect(memoryStore.getJob('J-1048')?.stage).toBe('production')

    memoryStore.setPrecommitHook(undefined)
  })

  it('replays a committed-but-lost job cancellation using the same request key/payload/version on retry (correction)', () => {
    const currentJob = memoryStore.getJob('J-1047')!
    render(
      <SyntheticStoreProvider>
        <JobDetailDrawer job={currentJob} onClose={() => {}} />
      </SyntheticStoreProvider>,
    )

    const transitionSpy = vi.spyOn(memoryStore, 'transitionJob')

    // Postcommit hook: the store finishes the mutation (and records the
    // idempotency cache entry) before this fires, simulating a response that
    // never made it back to the UI even though the operation succeeded.
    let hookCalls = 0
    memoryStore.setPostcommitHook(() => {
      hookCalls += 1
      if (hookCalls === 1) {
        throw new Error('Simulated response lost after commit')
      }
    })

    fireEvent.click(screen.getByText('Cancel Job'))
    const reasonTextarea = screen.getByLabelText('Cancellation reason')
    const reasonText = 'Customer double-booked the venue'
    fireEvent.change(reasonTextarea, { target: { value: reasonText } })
    fireEvent.click(screen.getByText('Confirm Cancellation'))

    // The UI believes this failed (it never saw a result)...
    expect(screen.getByTestId('cancel-reason-form')).toBeInTheDocument()
    expect(screen.getByText(/Simulated response lost after commit/)).toBeInTheDocument()
    expect(transitionSpy).toHaveBeenCalledTimes(1)

    // ...but the store actually committed the cancellation already.
    expect(memoryStore.getJob('J-1047')?.status).toBe('cancelled')
    const activitiesAfterFirstAttempt = memoryStore.listJobActivity('J-1047').items.length
    const firstCallBody = transitionSpy.mock.calls[0][1]
    const firstCallMeta = transitionSpy.mock.calls[0][2]

    // Retry the unchanged intent: same button, no retyping.
    fireEvent.click(screen.getByText('Confirm Cancellation'))

    expect(transitionSpy).toHaveBeenCalledTimes(2)
    const secondCallBody = transitionSpy.mock.calls[1][1]
    const secondCallMeta = transitionSpy.mock.calls[1][2]

    // Same request key and identical payload/version resubmitted on retry.
    expect(secondCallMeta?.requestKey).toBe(firstCallMeta?.requestKey)
    expect(secondCallBody).toEqual(firstCallBody)

    // The UI obtained the replayed result this time: the form closed and no
    // error remains, without retyping the reason.
    expect(screen.queryByTestId('cancel-reason-form')).not.toBeInTheDocument()
    expect(screen.queryByText(/Simulated response lost after commit/)).not.toBeInTheDocument()

    // No duplicate record/history and no second version bump from the retry.
    expect(memoryStore.listJobActivity('J-1047').items.length).toBe(activitiesAfterFirstAttempt)
    expect(memoryStore.getJob('J-1047')?.version).toBe(2) // one commit, not two
    expect(memoryStore.getJob('J-1047')?.status).toBe('cancelled')

    memoryStore.setPostcommitHook(undefined)
    transitionSpy.mockRestore()
  })
})
