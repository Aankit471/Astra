import type { Notification } from '@/types/domain'

const m = (n: number) => new Date(Date.now() - n * 60_000).toISOString()

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'N001', title: 'Referral Sent', body: 'Emergency referral sent to Apollo General Hospital.',
    severity: 'INFO', isRead: false, createdAt: m(35), referralId: 'REF-001',
    actionLabel: 'View Status', actionPath: '/hospital/referrals/REF-001',
  },
  {
    id: 'N002', title: 'New Referral — IMMEDIATE', body: 'Incoming cardiac emergency. STEMI suspected. Requires Cath Lab.',
    severity: 'CRITICAL', isRead: false, createdAt: m(35), referralId: 'REF-001',
    actionLabel: 'View Referral', actionPath: '/hospital/referrals/REF-001',
  },
  {
    id: 'N003', title: 'Clinical Review Required', body: 'STEMI case. Patient 58M, BP 90/60. Cath Lab required. Respond within 10 min.',
    severity: 'CRITICAL', isRead: false, createdAt: m(33), referralId: 'REF-001',
    actionLabel: 'Review Now', actionPath: '/doctor/referrals/REF-001',
  },
  {
    id: 'N004', title: 'Hospital Declined', body: 'Government District Hospital could not accept referral REF-002. Escalating to next facility.',
    severity: 'WARNING', isRead: false, createdAt: m(44), referralId: 'REF-002',
    actionLabel: 'View Referral', actionPath: '/hospital/referrals/REF-002',
  },
  {
    id: 'N005', title: 'Referral Escalated', body: "Contacting St. Mary's Mission Hospital for your referral.",
    severity: 'WARNING', isRead: false, createdAt: m(43), referralId: 'REF-002',
  },
  {
    id: 'N006', title: 'Referral Escalated', body: 'REF-002 escalated after H002 decline.',
    severity: 'WARNING', isRead: false, createdAt: m(43), referralId: 'REF-002',
    actionLabel: 'View Escalation', actionPath: '/admin/escalations',
  },
  {
    id: 'N007', title: 'Patient Arrived', body: 'Patient has arrived at Apollo General Hospital. Case REF-003 closed.',
    severity: 'INFO', isRead: true, createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(), referralId: 'REF-003',
  },
]
