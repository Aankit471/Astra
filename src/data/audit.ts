import type { AuditEvent } from '@/types/domain'

const now = Date.now()
const m = (n: number) => new Date(now - n * 60_000).toISOString()
const h = (n: number) => new Date(now - n * 3600_000).toISOString()

export const AUDIT_EVENTS: AuditEvent[] = [
  { id: 'AE001', timestamp: h(8),   action: 'REFERRAL_CREATED',    actorId: 'dispatch-001', actorName: '108 Emergency Dispatch', actorRole: 'DISPATCH',         targetType: 'REFERRAL', targetId: 'REF-003', targetLabel: 'REF-003 — Trauma', details: { status: 'PENDING' } },
  { id: 'AE002', timestamp: h(7.5), action: 'FACILITY_CONTACTED',  actorId: 'system',    actorName: 'ASTRA System',     actorRole: 'SYSTEM',       targetType: 'REFERRAL', targetId: 'REF-003', targetLabel: 'REF-003', details: { facility: 'Apollo General Hospital' } },
  { id: 'AE003', timestamp: h(7),   action: 'DOCTOR_ACCEPTED',     actorId: 'doc-001',   actorName: 'Dr. Ananya Patel', actorRole: 'DOCTOR',       targetType: 'REFERRAL', targetId: 'REF-003', targetLabel: 'REF-003', details: { previousStatus: 'REVIEWING', newStatus: 'ACCEPTED' } },
  { id: 'AE004', timestamp: h(6.5), action: 'ADMIN_CONFIRMATION',  actorId: 'ops-001',   actorName: 'Rajesh Kumar',     actorRole: 'HOSPITAL_OPS', targetType: 'REFERRAL', targetId: 'REF-003', targetLabel: 'REF-003', details: { previousStatus: 'ACCEPTED', newStatus: 'CONFIRMED' } },
  { id: 'AE005', timestamp: h(3),   action: 'PATIENT_ARRIVED',     actorId: 'ops-001',   actorName: 'Rajesh Kumar',     actorRole: 'HOSPITAL_OPS', targetType: 'REFERRAL', targetId: 'REF-003', targetLabel: 'REF-003', details: { facility: 'Apollo General Hospital' } },
  { id: 'AE006', timestamp: h(3),   action: 'REFERRAL_CREATED',    actorId: 'dispatch-001', actorName: '108 Emergency Dispatch', actorRole: 'DISPATCH',         targetType: 'REFERRAL', targetId: 'REF-002', targetLabel: 'REF-002 — Obstetric' },
  { id: 'AE007', timestamp: h(2),   action: 'FACILITY_CONTACTED',  actorId: 'system',    actorName: 'ASTRA System',     actorRole: 'SYSTEM',       targetType: 'REFERRAL', targetId: 'REF-002', targetLabel: 'REF-002', details: { facility: 'Government District Hospital' } },
  { id: 'AE008', timestamp: m(45),  action: 'DOCTOR_DECLINED',     actorId: 'doc-002',   actorName: 'Dr. Suresh Menon', actorRole: 'DOCTOR',       targetType: 'REFERRAL', targetId: 'REF-002', targetLabel: 'REF-002', details: { reason: 'SPECIALIST_UNAVAILABLE', notes: 'Neonatologist not available' } },
  { id: 'AE009', timestamp: m(44),  action: 'ESCALATION_STARTED',  actorId: 'system',    actorName: 'ASTRA System',     actorRole: 'SYSTEM',       targetType: 'REFERRAL', targetId: 'REF-002', targetLabel: 'REF-002', details: { reason: 'Hospital declined', nextFacility: "St. Mary's Mission Hospital" } },
  { id: 'AE010', timestamp: m(45),  action: 'REFERRAL_CREATED',    actorId: 'dispatch-001', actorName: '108 Emergency Dispatch', actorRole: 'DISPATCH',         targetType: 'REFERRAL', targetId: 'REF-001', targetLabel: 'REF-001 — Cardiac' },
  { id: 'AE011', timestamp: m(35),  action: 'FACILITY_CONTACTED',  actorId: 'system',    actorName: 'ASTRA System',     actorRole: 'SYSTEM',       targetType: 'REFERRAL', targetId: 'REF-001', targetLabel: 'REF-001', details: { facility: 'Apollo General Hospital' } },
  { id: 'AE012', timestamp: m(33),  action: 'ROUTED_TO_CLINICAL',  actorId: 'ops-001',   actorName: 'Rajesh Kumar',     actorRole: 'HOSPITAL_OPS', targetType: 'REFERRAL', targetId: 'REF-001', targetLabel: 'REF-001', details: { doctor: 'Dr. Ananya Patel' } },
]
