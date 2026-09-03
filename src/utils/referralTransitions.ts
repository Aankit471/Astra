import type { ReferralStatus } from '@/types/domain'
import { AppError } from '@/api/errors'

export const validReferralTransitions: Record<ReferralStatus, readonly ReferralStatus[]> = {
  CREATED: ['MATCHING'],
  MATCHING: ['MATCHED', 'CONTACTING'],
  CONTACTING: ['WAITING_FOR_RESPONSE'],
  WAITING_FOR_RESPONSE: ['REVIEWING', 'ACCEPTED', 'DECLINED', 'ESCALATED'],
  PENDING: ['MATCHED'],
  MATCHED: ['WAITING_FOR_RESPONSE'],
  SENT: ['REVIEWING'],
  REVIEWING: ['ACCEPTED', 'DECLINED'],
  ACCEPTED: ['CONFIRMED'],
  DECLINED: ['ESCALATED'],
  ESCALATED: ['WAITING_FOR_RESPONSE', 'REVIEWING'],
  CONFIRMED: ['ARRIVED'],
  ARRIVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
}

export function canTransition(from: ReferralStatus, to: ReferralStatus): boolean {
  return validReferralTransitions[from].includes(to)
}

export function assertTransition(from: ReferralStatus, to: ReferralStatus): void {
  if (!canTransition(from, to)) throw new AppError('CONFLICT', `Invalid referral transition: ${from} to ${to}.`, 409, { from, to })
}
