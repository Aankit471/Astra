import type { SpecialistTeamMember } from '@/types/domain'

const now = Date.now()
const m = (minutes: number) => new Date(now - minutes * 60_000).toISOString()
const h = (hours: number) => new Date(now - hours * 3600_000).toISOString()

/**
 * DEMO / SIMULATED SPECIALIST TEAMS
 * Operational facility-reported availability for decision-support.
 * Does not guarantee real-time bedside physical presence.
 */
export const MOCK_SPECIALISTS: SpecialistTeamMember[] = [
  // ── Apollo General Hospital (H001) ──
  {
    id: 'SPEC-001',
    doctorId: 'doc-001',
    doctorCode: 'DOC-2048',
    doctorName: 'Dr. Ananya Mehta',
    specialty: 'Cardiology',
    department: 'Emergency Cardiac Care',
    hospitalId: 'H001',
    hospitalName: 'Apollo General Hospital',
    status: 'AVAILABLE',
    lastUpdated: m(10),
    isAvailable: true,
    notes: 'On duty at Acute Cardiac Bay · Cath Lab Lead',
  },
  {
    id: 'SPEC-002',
    doctorId: 'doc-003',
    doctorCode: 'DOC-2049',
    doctorName: 'Dr. Vikram Rao',
    specialty: 'Neurology',
    department: 'Emergency Neurology Unit',
    hospitalId: 'H001',
    hospitalName: 'Apollo General Hospital',
    status: 'AVAILABLE',
    lastUpdated: m(20),
    isAvailable: true,
    notes: 'Stroke team clinical reviewer on active shift',
  },
  {
    id: 'SPEC-003',
    doctorId: 'doc-004',
    doctorCode: 'DOC-2051',
    doctorName: 'Dr. Rahul Verma',
    specialty: 'Cardiology',
    department: 'Interventional Cardiology',
    hospitalId: 'H001',
    hospitalName: 'Apollo General Hospital',
    status: 'ON_CALL',
    lastUpdated: h(1),
    isAvailable: true,
    notes: 'Cath Lab on-call backup physician',
  },
  {
    id: 'SPEC-004',
    doctorId: 'doc-005',
    doctorCode: 'DOC-2052',
    doctorName: 'Dr. Priya Nair',
    specialty: 'Trauma',
    department: 'Trauma & Critical Care',
    hospitalId: 'H001',
    hospitalName: 'Apollo General Hospital',
    status: 'BUSY',
    lastUpdated: m(35),
    isAvailable: false,
    notes: 'Currently scrubbed in Emergency OR 2',
  },

  // ── Government District Hospital (H002) ──
  {
    id: 'SPEC-010',
    doctorId: 'doc-002',
    doctorCode: 'DOC-2050',
    doctorName: 'Dr. Suresh Menon',
    specialty: 'Orthopedics',
    department: 'Orthopedic Emergency',
    hospitalId: 'H002',
    hospitalName: 'Government District Hospital',
    status: 'AVAILABLE',
    lastUpdated: m(40),
    isAvailable: true,
    notes: 'Senior Consultant · Trauma bay rotation',
  },
  {
    id: 'SPEC-011',
    doctorId: 'doc-006',
    doctorCode: 'DOC-2053',
    doctorName: 'Dr. Kavita Reddy',
    specialty: 'General Medicine',
    department: 'Emergency Medicine',
    hospitalId: 'H002',
    hospitalName: 'Government District Hospital',
    status: 'ON_CALL',
    lastUpdated: h(2),
    isAvailable: true,
  },

  // ── St. Mary's Mission Hospital (H003) ──
  {
    id: 'SPEC-020',
    doctorId: 'doc-007',
    doctorCode: 'DOC-2054',
    doctorName: 'Dr. George Mathew',
    specialty: 'Obstetrics & Gynecology',
    department: 'Maternity Unit',
    hospitalId: 'H003',
    hospitalName: "St. Mary's Mission Hospital",
    status: 'AVAILABLE',
    lastUpdated: h(1),
    isAvailable: true,
  },
  {
    id: 'SPEC-021',
    doctorId: 'doc-008',
    doctorCode: 'DOC-2055',
    doctorName: 'Dr. Sarah Joseph',
    specialty: 'Pediatrics',
    department: 'Neonatology (NICU)',
    hospitalId: 'H003',
    hospitalName: "St. Mary's Mission Hospital",
    status: 'UNAVAILABLE',
    lastUpdated: h(3),
    isAvailable: false,
    notes: 'Off shift · Escalation protocol in effect',
  },

  // ── Sunrise Trauma Centre (H004) ──
  {
    id: 'SPEC-030',
    doctorId: 'doc-009',
    doctorCode: 'DOC-2056',
    doctorName: 'Dr. Arvind Swamy',
    specialty: 'Trauma',
    department: 'Acute Trauma Bay',
    hospitalId: 'H004',
    hospitalName: 'Sunrise Trauma Centre',
    status: 'AVAILABLE',
    lastUpdated: m(15),
    isAvailable: true,
  },
]
