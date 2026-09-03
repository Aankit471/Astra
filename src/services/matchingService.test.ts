import { describe, expect, it } from 'vitest'
import { HOSPITALS } from '@/data/hospitals'
import type { Hospital, RequiredCapability } from '@/types/domain'
import { matchFacilities } from './matchingService'

const required: RequiredCapability[] = [
  { capabilityItem: 'ICU', label: 'Intensive Care Unit', isMandatory: true },
  { capabilityItem: 'CARDIOLOGY', label: 'Cardiology', isMandatory: true },
]

describe('capability matching', () => {
  it('returns deterministic full and partial match explanations', () => {
    const results = matchFacilities('CARDIAC', required, HOSPITALS)
    expect(results[0].kind).toBe('FULL_MATCH')
    expect(results[0].missingCapabilities).toEqual([])
    expect(results).toEqual(matchFacilities('CARDIAC', required, HOSPITALS))
  })

  it('does not treat unavailable required capabilities as a full match', () => {
    const hospital = structuredClone(HOSPITALS[0]) as Hospital
    hospital.capabilities.capabilities = hospital.capabilities.capabilities.filter((capability) => capability.item !== 'CARDIOLOGY')
    const result = matchFacilities('CARDIAC', required, [hospital])[0]
    expect(result.kind).toBe('PARTIAL_MATCH')
    expect(result.missingCapabilities).toContain('Cardiology')
  })

  it('prefers current verified coverage over stale coverage', () => {
    const stale = structuredClone(HOSPITALS[0]) as Hospital
    stale.id = 'STALE'
    stale.capabilities.capabilities.forEach((capability) => { capability.verificationStatus = 'STALE'; capability.lastUpdated = new Date(Date.now() - 10 * 86400_000).toISOString() })
    const current = structuredClone(HOSPITALS[0]) as Hospital
    current.id = 'CURRENT'
    const results = matchFacilities('CARDIAC', required, [stale, current])
    expect(results[0].hospital.id).toBe('CURRENT')
    expect(results[1].freshness).toBe('STALE')
  })

  it('returns no match when the emergency category is unsupported', () => {
    const result = matchFacilities('OBSTETRIC', required, [HOSPITALS[0]])[0]
    expect(result.kind).toBe('NO_MATCH')
  })
})