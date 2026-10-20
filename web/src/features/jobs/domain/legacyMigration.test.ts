import { describe, expect, it } from 'vitest'
import { jobs as seedJobs } from '../../../data/mockData'
import { mapLegacyJobStatus, migrateLegacyJobs } from './legacyMigration'

describe('Legacy job fixture migration (SDD § 4/5, T4_PLAN.md)', () => {
  it('maps all valid legacy statuses accurately', () => {
    expect(mapLegacyJobStatus('Pending')).toEqual({
      status: 'pending',
      stage: 'preparation',
      deliveryStatus: 'not_ready',
    })
    expect(mapLegacyJobStatus('In Production')).toEqual({
      status: 'in_production',
      stage: 'production',
      deliveryStatus: 'not_ready',
    })
    expect(mapLegacyJobStatus('Quality Check')).toEqual({
      status: 'in_production',
      stage: 'quality_check',
      deliveryStatus: 'not_ready',
    })
    expect(mapLegacyJobStatus('Completed')).toEqual({
      status: 'ready_for_delivery',
      stage: 'packing',
      deliveryStatus: 'ready',
    })
    expect(mapLegacyJobStatus('Cancelled')).toEqual({
      status: 'cancelled',
      stage: 'preparation',
      deliveryStatus: 'not_applicable',
    })
  })

  it('rejects unknown legacy status with VALIDATION_FAILED', () => {
    expect(() => mapLegacyJobStatus('Archived' as any)).toThrowError(/Unknown legacy job status/)
  })

  it('migrates seedJobs accurately with preserved IDs and legacy provenance', () => {
    const migrated = migrateLegacyJobs(seedJobs)

    expect(migrated).toHaveLength(4)

    // J-1048: Pending
    const j1048 = migrated.find((j) => j.id === 'J-1048')!
    expect(j1048.status).toBe('pending')
    expect(j1048.stage).toBe('preparation')
    expect(j1048.lines[0]).toEqual({ description: 'Corporate polo launch', quantity: '120', unit: 'pcs' })
    expect(j1048.customer?.displayName).toBe('Meridian Studio')
    expect(j1048.provenance).toBe('legacy_prototype')
    expect(j1048.sourceQuotationId).toBeNull()
    expect(j1048.snapshot).toBeNull()

    // J-1046: C-03 Cedar & Co. customer preserved
    const j1046 = migrated.find((j) => j.id === 'J-1046')!
    expect(j1046.customer).toEqual({ id: 'C-03', displayName: 'Cedar & Co.' })
    expect(j1046.stage).toBe('quality_check')

    // J-1045: Completed -> ready_for_delivery / packing / ready
    const j1045 = migrated.find((j) => j.id === 'J-1045')!
    expect(j1045.status).toBe('ready_for_delivery')
    expect(j1045.stage).toBe('packing')
    expect(j1045.deliveryStatus).toBe('ready')
  })
})
