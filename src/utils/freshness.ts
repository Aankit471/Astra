import { formatDistanceToNow, parseISO, differenceInMilliseconds } from 'date-fns'
import { freshnessThresholds } from '@/styles/tokens'
import type { VerificationStatus } from '@/types'

export type FreshnessLevel = 'FRESH' | 'AGING' | 'STALE'

/**
 * Determine the freshness level of a data timestamp.
 * This is the single rule for deciding when data becomes stale.
 */
export function getFreshnessLevel(lastUpdatedISO: string): FreshnessLevel {
  const age = differenceInMilliseconds(new Date(), parseISO(lastUpdatedISO))

  if (age < freshnessThresholds.FRESH_MS) return 'FRESH'
  if (age < freshnessThresholds.WARNING_MS) return 'AGING'
  return 'STALE'
}

export const getFreshnessStatus = getFreshnessLevel

/**
 * Returns a human-readable relative time string.
 * e.g. "3 hours ago", "2 days ago"
 */
export function getRelativeTime(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function formatExactTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return 'Just now'
  }
}

/**
 * If the verification status is STALE, or the data is old enough
 * to be considered stale by our freshness rules, return STALE.
 * Otherwise return the original verification status.
 */
export function resolveEffectiveVerification(
  verificationStatus: VerificationStatus,
  lastUpdatedISO: string,
): VerificationStatus {
  if (verificationStatus === 'STALE') return 'STALE'
  if (getFreshnessLevel(lastUpdatedISO) === 'STALE') return 'STALE'
  return verificationStatus
}

