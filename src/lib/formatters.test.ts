import { describe, expect, it } from 'vitest'
import { formatMalaysiaDate, formatMalaysiaDateTime, formatMYR, MALAYSIA_TIME_ZONE } from './formatters'

describe('Malaysian formatters', () => {
  it('formats currency as Malaysian ringgit with two decimals', () => {
    expect(formatMYR(1234.5)).toMatch(/RM.*1,234\.50/)
  })
  it('formats dates using Malaysian day/month/year order', () => {
    expect(formatMalaysiaDate('2026-08-29T12:15:00Z')).toBe('29/08/2026')
  })
  it('formats date-times in Asia/Kuala_Lumpur', () => {
    expect(MALAYSIA_TIME_ZONE).toBe('Asia/Kuala_Lumpur')
    expect(formatMalaysiaDateTime('2026-08-29T12:15:00Z')).toContain('20:15')
  })
})
