import { describe, expect, it } from 'vitest'
import { getFreshnessLevel } from './freshness'

describe('capability freshness', () => {
  it('uses the 24 hour and seven day boundaries', () => {
    const now = Date.now()
    expect(getFreshnessLevel(new Date(now - 23 * 3600_000).toISOString())).toBe('FRESH')
    expect(getFreshnessLevel(new Date(now - 2 * 86400_000).toISOString())).toBe('AGING')
    expect(getFreshnessLevel(new Date(now - 8 * 86400_000).toISOString())).toBe('STALE')
    expect(getFreshnessLevel(new Date(now - 24 * 3600_000).toISOString())).toBe('AGING')
    expect(getFreshnessLevel(new Date(now - 7 * 86400_000).toISOString())).toBe('STALE')
  })
})