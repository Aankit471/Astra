import type { Hospital, RequiredCapability } from '@/types/domain'
import { getFreshnessLevel } from '@/utils/freshness'

export type MatchKind = 'FULL_MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH'

export interface FacilityMatch {
  hospital: Hospital
  kind: MatchKind
  matchedCapabilities: string[]
  missingCapabilities: string[]
  verifiedCount: number
  staleCount: number
  freshness: 'FRESH' | 'AGING' | 'STALE'
}

export function matchFacilities(category: Hospital['capabilities']['emergencyCategories'][number], required: RequiredCapability[], hospitals: Hospital[]): FacilityMatch[] {
  return hospitals.filter((hospital) => hospital.isActive).map((hospital) => {
    const matchedCapabilities: string[] = []
    const missingCapabilities: string[] = []
    let verifiedCount = 0
    let staleCount = 0
    for (const requirement of required) {
      const capability = hospital.capabilities.capabilities.find((item) => item.item === requirement.capabilityItem && item.available)
      if (!capability) { missingCapabilities.push(requirement.label); continue }
      matchedCapabilities.push(requirement.label)
      if (capability.verificationStatus === 'VERIFIED') verifiedCount += 1
      if (capability.verificationStatus === 'STALE' || getFreshnessLevel(capability.lastUpdated) === 'STALE') staleCount += 1
    }
    const categoryMatch = hospital.capabilities.emergencyCategories.includes(category)
    if (!categoryMatch && required.length > 0) missingCapabilities.unshift(`${category} emergency service`)
    const freshness: FacilityMatch['freshness'] = staleCount > 0 ? 'STALE' : matchedCapabilities.length > 0 && matchedCapabilities.length < required.length ? 'AGING' : 'FRESH'
    const kind: MatchKind = !categoryMatch || matchedCapabilities.length === 0 ? 'NO_MATCH' : missingCapabilities.length === 0 ? 'FULL_MATCH' : 'PARTIAL_MATCH'
    return { hospital, kind, matchedCapabilities, missingCapabilities, verifiedCount, staleCount, freshness }
  }).sort((left, right) => {
    const kindOrder = { FULL_MATCH: 2, PARTIAL_MATCH: 1, NO_MATCH: 0 }
    const leftScore = kindOrder[left.kind] * 100 + left.verifiedCount * 10 - left.staleCount
    const rightScore = kindOrder[right.kind] * 100 + right.verifiedCount * 10 - right.staleCount
    return rightScore - leftScore || left.hospital.id.localeCompare(right.hospital.id)
  })
}
