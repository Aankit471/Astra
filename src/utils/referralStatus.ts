import type { ReferralStatus } from '@/types/domain'

export const referralStatusConfig: Record<ReferralStatus, { label: string; description: string; tone: 'info' | 'warning' | 'danger' | 'success' | 'muted' }> = {
  CREATED: { label: 'Created', description: 'Emergency details have been captured.', tone: 'info' },
  MATCHING: { label: 'Matching', description: 'ASTRA is comparing required capabilities.', tone: 'info' },
  CONTACTING: { label: 'Contacting', description: 'A suitable facility is being contacted.', tone: 'info' },
  WAITING_FOR_RESPONSE: { label: 'Waiting for response', description: 'Awaiting hospital clinical review.', tone: 'warning' },
  PENDING: { label: 'Pending', description: 'Referral is awaiting processing.', tone: 'warning' },
  MATCHED: { label: 'Capability match', description: 'Suitable facilities have been identified.', tone: 'info' },
  SENT: { label: 'Sent', description: 'Referral request has been sent.', tone: 'info' },
  REVIEWING: { label: 'Clinical review', description: 'An authorized clinician is reviewing the referral.', tone: 'warning' },
  ACCEPTED: { label: 'Accepted', description: 'The receiving clinical team accepted the referral.', tone: 'success' },
  DECLINED: { label: 'Declined', description: 'The current facility declined the referral.', tone: 'danger' },
  ESCALATED: { label: 'Escalating', description: 'ASTRA is contacting the next suitable facility.', tone: 'danger' },
  CONFIRMED: { label: 'Confirmed', description: 'The referral has a confirmed receiving facility.', tone: 'success' },
  ARRIVED: { label: 'Arrived', description: 'Patient arrival has been recorded.', tone: 'success' },
  COMPLETED: { label: 'Completed', description: 'Referral lifecycle is complete.', tone: 'success' },
  CANCELLED: { label: 'Cancelled', description: 'Referral is no longer active.', tone: 'muted' },
}
