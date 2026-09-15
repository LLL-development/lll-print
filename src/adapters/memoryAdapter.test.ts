import { describe, expect, it } from 'vitest'
import { memoryStore } from './memoryStore'

describe('Synthetic in-memory store', () => {
  it('initializes with seed fixtures', () => {
    memoryStore.resetToFixtures()
    const state = memoryStore.getState()
    expect(state.jobs.length).toBe(4)
    expect(state.contacts.length).toBe(3)
    expect(state.inventory.length).toBe(3)
    expect(state.quotations.length).toBe(1)
    expect(state.invoices.length).toBe(2)
  })

  it('generates collision-safe IDs across repeated record creations and conversions', () => {
    memoryStore.resetToFixtures()
    const createdJobIds = new Set<string>()
    const createdContactIds = new Set<string>()
    const createdQuoteIds = new Set<string>()
    const createdItemIds = new Set<string>()
    const createdMovementIds = new Set<string>()

    for (let i = 0; i < 20; i++) {
      const quote = memoryStore.addQuotation({
        customerId: 'C-01',
        customerName: 'Meridian Studio',
        dueDate: '2026-09-01',
        sourceNote: `Quotation Batch ${i}`,
        lines: [
          { description: `Batch Item ${i}`, quantity: '50', unit: 'pcs', unitPrice: '25.00' },
        ],
        discountAmount: '0.00',
        taxRate: '0.00',
        notes: '',
      })
      expect(createdQuoteIds.has(quote.id)).toBe(false)
      createdQuoteIds.add(quote.id)

      memoryStore.transitionQuotation(quote.id, { expectedVersion: 1, action: 'send' })
      memoryStore.transitionQuotation(quote.id, { expectedVersion: 2, action: 'accept' })
      const { job } = memoryStore.convertQuotationToJob(quote.id, { expectedVersion: 3 })

      expect(createdJobIds.has(job.id)).toBe(false)
      createdJobIds.add(job.id)

      const contact = memoryStore.addContact({
        name: `Supplier Contact ${i}`,
        type: 'Supplier',
        phone: `+60 12-000 ${String(i).padStart(4, '0')}`,
        email: `supp${i}@example.com`,
      })
      expect(createdContactIds.has(contact.id)).toBe(false)
      createdContactIds.add(contact.id)

      const item = memoryStore.addInventoryItem({
        sku: `SKU-${i}`,
        name: `Test Item ${i}`,
        category: 'Garment',
        quantity: 10,
        reorderLevel: 5,
        unit: 'pcs',
      })
      expect(createdItemIds.has(item.id)).toBe(false)
      createdItemIds.add(item.id)

      const movement = memoryStore.addStockMovement({
        itemId: item.id,
        itemName: item.name,
        type: 'Receipt',
        quantity: 10,
        balance: 100,
        reference: `REF-${i}`,
        date: '2026-09-01',
      })
      expect(createdMovementIds.has(movement.id)).toBe(false)
      createdMovementIds.add(movement.id)
    }

    expect(createdJobIds.size).toBe(20)
    expect(createdContactIds.size).toBe(20)
    expect(createdQuoteIds.size).toBe(20)
    expect(createdItemIds.size).toBe(20)
    expect(createdMovementIds.size).toBe(20)

    // IDs follow expected monotonic formatting
    const jobList = Array.from(createdJobIds)
    expect(jobList[0]).toBe('J-1049')
    expect(jobList[1]).toBe('J-1050')

    const contactList = Array.from(createdContactIds)
    expect(contactList[0]).toBe('C-03')
    expect(contactList[1]).toBe('C-04')

    const itemList = Array.from(createdItemIds)
    expect(itemList[0]).toBe('I-04')
    expect(itemList[1]).toBe('I-05')

    const movementList = Array.from(createdMovementIds)
    expect(movementList[0]).toBe('M-05')
    expect(movementList[1]).toBe('M-06')
  })

  it('updates only the intended job without mutating other jobs', () => {
    memoryStore.resetToFixtures()
    const stateBefore = memoryStore.getState()
    const targetJob = stateBefore.jobs.find((j) => j.id === 'J-1048')! // pending
    const otherJob = stateBefore.jobs.find((j) => j.id === 'J-1047')! // in_production

    const otherStatusBefore = otherJob.status

    const updated = memoryStore.transitionJob(targetJob.id, { expectedVersion: targetJob.version, action: 'start' })
    expect(updated).toBeDefined()
    expect(updated.id).toBe(targetJob.id)
    expect(updated.status).toBe('in_production')

    const stateAfter = memoryStore.getState()
    const refreshedTarget = stateAfter.jobs.find((j) => j.id === targetJob.id)
    const refreshedOther = stateAfter.jobs.find((j) => j.id === otherJob.id)

    expect(refreshedTarget?.status).toBe('in_production')
    expect(refreshedOther?.status).toBe(otherStatusBefore)
  })

  it('throws NOT_FOUND when attempting to update a non-existent job', () => {
    memoryStore.resetToFixtures()
    expect(() =>
      memoryStore.transitionJob('J-9999-DOES-NOT-EXIST', { expectedVersion: 1, action: 'start' }),
    ).toThrowError(/not found/)
  })

  it('resets to default fixtures completely', () => {
    memoryStore.resetToFixtures()
    const quote = memoryStore.addQuotation({
      customerId: 'C-01',
      customerName: 'Meridian Studio',
      dueDate: '2026-09-10',
      sourceNote: 'Scratch',
      lines: [{ description: 'Temporary Scratch Job', quantity: '50', unit: 'pcs', unitPrice: '10.00' }],
      discountAmount: '0.00',
      taxRate: '0.00',
      notes: '',
    })
    memoryStore.transitionQuotation(quote.id, { expectedVersion: 1, action: 'send' })
    memoryStore.transitionQuotation(quote.id, { expectedVersion: 2, action: 'accept' })
    memoryStore.convertQuotationToJob(quote.id, { expectedVersion: 3 })

    expect(memoryStore.getState().jobs.length).toBe(5)

    memoryStore.resetToFixtures()
    const state = memoryStore.getState()
    expect(state.jobs.length).toBe(4)
    expect(state.jobs.some((j) => j.lines[0]?.description === 'Temporary Scratch Job')).toBe(false)
  })
})
