import { describe, it, expect, beforeEach } from 'vitest'
import type { AuthUser } from '@/types/auth'
import type { PatientBrief } from '@/types/domain'
import {
  getDoctorProfile,
  canDoctorAccessReferral,
  getScopedDoctorReferrals,
  getRelevantBloodForPatient,
  getBloodInventory,
  getHospitalSpecialists,
} from './doctorService'
import { MOCK_BLOOD_INVENTORY } from '@/data/bloodInventory'
import { MOCK_USERS } from '@/data/users'
import { REFERRALS } from '@/data/referrals'
import { referralService } from './mock/referralService'
import MockDatabase from './mock/mockDb'
import { mockApi } from '@/api/mockAdapter'

describe('Prompt #20 — Doctor Clinical Command Center & Scoping Suite', () => {
  beforeEach(() => {
    MockDatabase.reset()
  })

  // 1, 2, 3: Doctor Identity, Specialty, and Department
  it('1-3. accurately derives Doctor identity, specialty, department, and doctorCode from authenticated user', () => {
    const doctorUser = MOCK_USERS.find((u) => u.id === 'doc-001') as AuthUser
    expect(doctorUser).toBeDefined()

    const profile = getDoctorProfile(doctorUser)
    expect(profile.name).toBe('Dr. Ananya Mehta')
    expect(profile.doctorCode).toBe('DOC-2048')
    expect(profile.specialty).toBe('Cardiology')
    expect(profile.department).toBe('Emergency Cardiac Care')
    expect(profile.hospitalId).toBe('H001')
    expect(profile.hospitalName).toBe('Apollo General Hospital')
    expect(profile.status).toBe('AVAILABLE')
  })

  // 4, 5, 26, 27: RBAC Scoping & Privacy — No cross-hospital patient leakage
  it('4, 5, 26, 27. strictly scopes patient queue to doctor hospital/department and rejects unauthorized access', () => {
    const cardiologist = MOCK_USERS.find((u) => u.id === 'doc-001') as AuthUser
    const orthoDoctor = MOCK_USERS.find((u) => u.id === 'doc-002') as AuthUser

    const cardiologyCase = REFERRALS.find((r) => r.id === 'REF-001')!
    const govtHospitalCase = REFERRALS.find((r) => r.id === 'REF-002')!

    // Cardiologist at Apollo should access REF-001
    expect(canDoctorAccessReferral(cardiologist, cardiologyCase)).toBe(true)

    // Cardiologist at Apollo MUST NOT have access to patient at Govt District Hospital (REF-002)
    expect(canDoctorAccessReferral(cardiologist, govtHospitalCase)).toBe(false)

    // Ortho doctor at Govt Hospital (doc-002) should access REF-002
    expect(canDoctorAccessReferral(orthoDoctor, govtHospitalCase)).toBe(true)
    // But cannot access Apollo Hospital REF-001
    expect(canDoctorAccessReferral(orthoDoctor, cardiologyCase)).toBe(false)

    // Scoped queue for cardiologist only contains authorized cases
    const cardiologistQueue = getScopedDoctorReferrals(cardiologist, REFERRALS)
    expect(cardiologistQueue.every((r) => r.sentToFacilityId === 'H001')).toBe(true)
    expect(cardiologistQueue.some((r) => r.id === 'REF-002')).toBe(false)
  })

  // 6, 7, 8, 9: Case Specialties (Cardiology & Neurology cases)
  it('6-9. handles distinct specialty triage for Cardiology and Neurology cases at the same facility', () => {
    const cardiologist = MOCK_USERS.find((u) => u.id === 'doc-001') as AuthUser
    const neurologist = MOCK_USERS.find((u) => u.id === 'doc-003') as AuthUser

    const cardiacCase = REFERRALS.find((r) => r.id === 'REF-001')!
    const neuroCase = REFERRALS.find((r) => r.id === 'REF-004')!

    expect(cardiacCase.requiredSpecialty).toBe('Cardiology')
    expect(cardiacCase.assignedDoctorName).toBe('Dr. Ananya Mehta')

    expect(neuroCase.requiredSpecialty).toBe('Neurology')
    expect(neuroCase.assignedDoctorName).toBe('Dr. Vikram Rao')

    // Scoped access verifies specialty alignment
    expect(canDoctorAccessReferral(cardiologist, cardiacCase)).toBe(true)
    expect(canDoctorAccessReferral(neurologist, neuroCase)).toBe(true)
  })

  // 10: Multi-specialty case (Primary + Consulting)
  it('10. supports multi-specialty cases with primary and consulting specialties', () => {
    const traumaCase = REFERRALS.find((r) => r.id === 'REF-003')!
    expect(traumaCase.requiredSpecialty).toBe('Trauma')
    expect(traumaCase.consultingSpecialties).toContain('Neurosurgery')
    expect(traumaCase.consultingSpecialties).toContain('Orthopedics')
  })

  // 11-20: Blood Group Availability, Statuses, Components, Freshness & Verification
  it('11-20. supports blood groups, components, statuses, freshness, and verification across hospitals', () => {
    const allBlood = getBloodInventory()
    expect(allBlood.length).toBeGreaterThan(10)

    // Blood groups represented
    const groups = new Set(allBlood.map((b) => b.bloodGroup))
    expect(groups.has('O+')).toBe(true)
    expect(groups.has('A+')).toBe(true)
    expect(groups.has('B+')).toBe(true)
    expect(groups.has('AB+')).toBe(true)
    expect(groups.has('O-')).toBe(true)

    // Components represented
    const components = new Set(allBlood.map((b) => b.component))
    expect(components.has('PACKED_RBC')).toBe(true)
    expect(components.has('PLATELETS')).toBe(true)
    expect(components.has('FFP')).toBe(true)
    expect(components.has('WHOLE_BLOOD')).toBe(true)

    // Statuses represented
    const statuses = new Set(allBlood.map((b) => b.status))
    expect(statuses.has('AVAILABLE')).toBe(true)
    expect(statuses.has('LIMITED')).toBe(true)
    expect(statuses.has('FULL')).toBe(true)
    expect(statuses.has('UNKNOWN')).toBe(true)
    expect(statuses.has('STALE')).toBe(true)

    // Freshness & verification
    const staleEntry = allBlood.find((b) => b.freshness === 'STALE')
    expect(staleEntry).toBeDefined()
    expect(staleEntry?.verificationStatus).toBeDefined()

    const verifiedEntry = allBlood.find((b) => b.verificationStatus === 'VERIFIED')
    expect(verifiedEntry).toBeDefined()
  })

  // 21: Patient-specific Blood Group matching (strictly explicit, never inferred)
  it('21. displays patient blood group and matches stock ONLY when explicitly present in structured data', () => {
    // Patient with verified O+ blood group
    const patientWithBlood: PatientBrief = {
      referenceCode: 'AST-1042',
      age: 54,
      sex: 'MALE',
      chiefComplaint: 'Acute chest pain',
      emergencyCategory: 'CARDIAC',
      urgencyLevel: 'IMMEDIATE',
      bloodGroup: 'O+',
    }

    const matchWith = getRelevantBloodForPatient(patientWithBlood, MOCK_BLOOD_INVENTORY)
    expect(matchWith.hasVerifiedNeed).toBe(true)
    expect(matchWith.patientBloodGroup).toBe('O+')
    expect(matchWith.relevantStock.length).toBeGreaterThan(0)
    expect(matchWith.relevantStock.every((b) => b.bloodGroup === 'O+')).toBe(true)

    // Patient without blood group (must NOT infer from diagnosis)
    const patientWithoutBlood: PatientBrief = {
      referenceCode: 'AST-9999',
      age: 45,
      sex: 'FEMALE',
      chiefComplaint: 'Massive GI bleed / severe hemorrhagic shock', // symptomatic but not typed
      emergencyCategory: 'TRAUMA',
      urgencyLevel: 'IMMEDIATE',
    }

    const matchWithout = getRelevantBloodForPatient(patientWithoutBlood, MOCK_BLOOD_INVENTORY)
    expect(matchWithout.hasVerifiedNeed).toBe(false)
    expect(matchWithout.patientBloodGroup).toBeUndefined()
    expect(matchWithout.relevantStock).toHaveLength(0)
  })

  // 22-23: Specialist Availability and Bed Information
  it('22-23. reports specialist roster and hospital bed telemetry for clinical facilities', () => {
    const apolloSpecialists = getHospitalSpecialists('H001')
    expect(apolloSpecialists.length).toBeGreaterThan(0)
    expect(apolloSpecialists.some((s) => s.specialty === 'Cardiology')).toBe(true)
    expect(apolloSpecialists.some((s) => s.status === 'AVAILABLE')).toBe(true)

    const apolloHospital = MockDatabase.getInstance().getHospitalById('H001')!
    expect(apolloHospital.capabilities.beds).toBeDefined()
    expect(apolloHospital.capabilities.beds!.length).toBeGreaterThan(0)
  })

  // 24-25: Search and Filtering by Hospital / Group
  it('24-25. filters blood inventory by hospital, blood group, component, and availability status', () => {
    const apolloStock = getBloodInventory({ hospitalId: 'H001' })
    expect(apolloStock.every((b) => b.hospitalId === 'H001')).toBe(true)

    const oPositiveStock = getBloodInventory({ bloodGroup: 'O+' })
    expect(oPositiveStock.every((b) => b.bloodGroup === 'O+')).toBe(true)

    const plateletsStock = getBloodInventory({ component: 'PLATELETS' })
    expect(plateletsStock.every((b) => b.component === 'PLATELETS')).toBe(true)
  })

  // 28-30: Clinical Decision Actions, Audit Trails, and API Adapter Readiness
  it('28-30. supports structured clinical triage decisions (accept, decline, request info) with audit and API separation', async () => {
    const db = MockDatabase.getInstance()
    const referral = db.getReferralById('REF-001')!
    expect(referral.status).toBe('REVIEWING')

    // 1. Request Info via mock service
    referralService.requestInformation('REF-001', 'Please upload 12-lead ECG and troponin levels')
    const updated = db.getReferralById('REF-001')!
    expect(updated.infoRequested).toBe(true)
    expect(updated.infoRequestedNotes).toContain('12-lead ECG')

    // Audit event created
    const auditInfo = db.auditEvents.find((a) => a.action === 'Doctor Requested Information')
    expect(auditInfo).toBeDefined()
    expect(auditInfo?.targetId).toBe('REF-001')

    // 2. Accept referral with clinical override
    referralService.acceptReferral('REF-001', true, 'Authorized clinical acceptance by cardiologist')
    const accepted = db.getReferralById('REF-001')!
    expect(accepted.status).toBe('ACCEPTED')
    expect(accepted.decision?.type).toBe('ACCEPT')

    // 3. API separation: mockApi returns blood and specialist endpoints
    const apiBlood = await mockApi.blood.list('H001')
    expect(apiBlood.length).toBeGreaterThan(0)
    expect(apiBlood.every((b) => b.hospitalId === 'H001')).toBe(true)

    const apiRelevant = await mockApi.blood.getRelevant('O+')
    expect(apiRelevant.every((b) => b.bloodGroup === 'O+')).toBe(true)

    const apiSpecialists = await mockApi.specialists.list('H001')
    expect(apiSpecialists.length).toBeGreaterThan(0)
  })

  // Prompt #22: 5 Specialties Routing, Hospital Isolation, Priority Sorting, Decisions & Notes
  describe('Prompt #22 — Full Supabase Clinical Portal & Specialty Routing', () => {
    it('verifies strict specialty routing across Cardiology, Neurology, Trauma Surgery, Critical Care, and Emergency Medicine', () => {
      const apolloHospital = 'H001'
      
      const cardiologist: AuthUser = {
        id: 'doc-cardio',
        name: 'Dr. Cardio',
        email: 'cardio@astra.demo',
        role: 'DOCTOR',
        specialty: 'Cardiology',
        hospitalId: apolloHospital,
        permissions: [],
      }

      const neurologist: AuthUser = {
        id: 'doc-neuro',
        name: 'Dr. Neuro',
        email: 'neuro@astra.demo',
        role: 'DOCTOR',
        specialty: 'Neurology',
        hospitalId: apolloHospital,
        permissions: [],
      }

      const traumaSurgeon: AuthUser = {
        id: 'doc-trauma',
        name: 'Dr. Trauma',
        email: 'trauma@astra.demo',
        role: 'DOCTOR',
        specialty: 'Trauma Surgery',
        hospitalId: apolloHospital,
        permissions: [],
      }

      const criticalCareDoc: AuthUser = {
        id: 'doc-icu',
        name: 'Dr. Critical',
        email: 'icu@astra.demo',
        role: 'DOCTOR',
        specialty: 'Critical Care',
        hospitalId: apolloHospital,
        permissions: [],
      }

      const emergencyDoc: AuthUser = {
        id: 'doc-em',
        name: 'Dr. Emergency',
        email: 'emergency@astra.demo',
        role: 'DOCTOR',
        specialty: 'Emergency Medicine',
        hospitalId: apolloHospital,
        permissions: [],
      }

      // Cases for each specialty
      const cardioCase = {
        id: 'CASE-C1',
        sentToFacilityId: apolloHospital,
        requiredSpecialty: 'Cardiology',
        patient: { chiefComplaint: 'STEMI and cardiogenic shock', emergencyCategory: 'CARDIAC' },
      } as any

      const neuroCase = {
        id: 'CASE-N1',
        sentToFacilityId: apolloHospital,
        requiredSpecialty: 'Neurology',
        patient: { chiefComplaint: 'Acute ischemic stroke with hemiparesis', emergencyCategory: 'NEUROLOGICAL' },
      } as any

      const traumaCase = {
        id: 'CASE-T1',
        sentToFacilityId: apolloHospital,
        requiredSpecialty: 'Trauma Surgery',
        patient: { chiefComplaint: 'Polytrauma following high-speed MVA', emergencyCategory: 'TRAUMA' },
      } as any

      const icuCase = {
        id: 'CASE-I1',
        sentToFacilityId: apolloHospital,
        requiredSpecialty: 'Critical Care',
        patient: { chiefComplaint: 'Septic shock with multi-organ failure', emergencyCategory: 'CRITICAL_CARE' },
      } as any

      const emCase = {
        id: 'CASE-E1',
        sentToFacilityId: apolloHospital,
        requiredSpecialty: 'Emergency Medicine',
        patient: { chiefComplaint: 'Acute severe respiratory distress', emergencyCategory: 'RESPIRATORY' },
      } as any

      // Cardiology doctor can access Cardiology case, but not unassigned pure neuro case
      expect(canDoctorAccessReferral(cardiologist, cardioCase)).toBe(true)
      expect(canDoctorAccessReferral(cardiologist, neuroCase)).toBe(false)

      // Neurology doctor can access Neurology case
      expect(canDoctorAccessReferral(neurologist, neuroCase)).toBe(true)
      expect(canDoctorAccessReferral(neurologist, traumaCase)).toBe(false)

      // Trauma Surgery can access Trauma case
      expect(canDoctorAccessReferral(traumaSurgeon, traumaCase)).toBe(true)
      expect(canDoctorAccessReferral(traumaSurgeon, cardioCase)).toBe(false)

      // Critical Care can access multi-organ failure / septic shock cases
      expect(canDoctorAccessReferral(criticalCareDoc, icuCase)).toBe(true)

      // Emergency Medicine can access general emergency & triage cases
      expect(canDoctorAccessReferral(emergencyDoc, emCase)).toBe(true)
    })

    it('enforces strict hospital isolation preventing cross-hospital case access even with matching specialty', () => {
      const apolloDoctor: AuthUser = {
        id: 'doc-apollo',
        name: 'Dr. Apollo Specialist',
        email: 'doc@apollo.org',
        role: 'DOCTOR',
        specialty: 'Cardiology',
        hospitalId: 'H001',
        permissions: [],
      }

      const fortisCardiacCase = {
        id: 'CASE-FORTIS-01',
        sentToFacilityId: 'H002', // Different facility!
        requiredSpecialty: 'Cardiology',
        patient: { chiefComplaint: 'Acute coronary syndrome', emergencyCategory: 'CARDIAC' },
      } as any

      // MUST be rejected due to facility mismatch
      expect(canDoctorAccessReferral(apolloDoctor, fortisCardiacCase)).toBe(false)
    })

    it('records clinical decisions and creates audit trail via repository layer', async () => {
      const { referralRepository } = await import('./repositories/referralRepository')
      const { auditRepository } = await import('./repositories/auditRepository')

      const doctorActor = {
        id: 'doc-001',
        name: 'Dr. Ananya Mehta',
        specialty: 'Cardiology',
        doctorCode: 'DOC-2048',
        hospitalId: 'H001',
        hospitalName: 'Apollo General Hospital',
      }

      // 1. Record ACCEPT decision
      const acceptResult = await referralRepository.recordDecision(
        'REF-001',
        { decision: 'ACCEPTED', notes: 'Patient accepted for immediate Cath Lab intervention.' },
        doctorActor
      )
      expect(acceptResult).toBe(true)

      const updatedRef = await referralRepository.getById('REF-001')
      expect(updatedRef?.status).toBe('ACCEPTED')

      // Verify audit log entry was written
      const logs = await auditRepository.list({ limit: 10 })
      const decisionLog = logs.find((l) => l.action === 'CLINICAL_ACCEPTED' && l.targetId === 'REF-001')
      expect(decisionLog).toBeDefined()
      expect(decisionLog?.actorRole).toBe('DOCTOR')
      expect(decisionLog?.details?.hospitalId).toBe('H001')

      // 2. Add clinical progress note
      const noteResult = await referralRepository.addClinicalNote(
        'REF-001',
        'Heparin bolus administered. Cath lab team notified and ready.',
        doctorActor
      )
      expect(noteResult).toBe(true)

      const refWithNote = await referralRepository.getById('REF-001')
      expect(refWithNote?.timeline.some((t) => t.notes?.includes('Heparin bolus administered'))).toBe(true)

      // Verify note audit log
      const updatedLogs = await auditRepository.list({ limit: 10 })
      const noteLog = updatedLogs.find((l) => l.action === 'CLINICAL_NOTE_ADDED' && l.targetId === 'REF-001')
      expect(noteLog).toBeDefined()
    })
  })
})


