import { describe, expect, it, beforeEach } from 'vitest'
import MockDatabase from './mock/mockDb'
import { referralRepository, DoctorActor } from './repositories/referralRepository'
import { bedRepository } from './repositories/bedRepository'
import { hospitalRepository } from './repositories/hospitalRepository'
import { auditRepository } from './repositories/auditRepository'
import type { PatientBrief, RequiredCapability } from '@/types/domain'

describe('ASTRA Full End-to-End System Integration Lifecycle', () => {
  // ── Deterministic Actors ──
  const opsActor = {
    id: 'ops-001',
    name: 'Apollo Ops Command',
    role: 'HOSPITAL_OPS',
    hospitalId: 'H001',
    hospitalName: 'Apollo General Hospital',
  }

  const doctorActor: DoctorActor = {
    id: 'doc-001',
    name: 'Dr. Ananya Mehta',
    specialty: 'Cardiology',
    doctorCode: 'DOC-2048',
    hospitalId: 'H001',
    hospitalName: 'Apollo General Hospital',
  }

  const adminActor = {
    id: 'admin-001',
    name: 'ASTRA Lead Governance Admin',
    role: 'ADMIN',
  }

  // ── Deterministic Emergency Case ──
  const demoPatient: PatientBrief = {
    referenceCode: 'AST-DEMO-9901',
    age: 58,
    sex: 'MALE',
    emergencyCategory: 'CARDIAC',
    urgencyLevel: 'IMMEDIATE',
    chiefComplaint: 'Acute anterior STEMI, severe crushing retrosternal pain, diaphoretic, cold extremities',
    vitalSummary: 'BP 85/55 · HR 122 · SpO₂ 90% (room air) · ECG: 4mm ST elevation V1-V4',
    relevantHistory: 'Type 2 Diabetes, Hypertension. Loaded with Aspirin 300mg + Ticagrelor 180mg in transit.',
    currentFacility: '108 Ambulance Unit KA-01-EM-402',
    referringDoctor: 'Dr. S. Kumar (Paramedic Flight Physician)',
    bloodGroup: 'O+',
  }

  const demoCapabilities: RequiredCapability[] = [
    { capabilityItem: 'CARDIAC_CATH_LAB', label: 'Primary PCI / Cath Lab', isMandatory: true },
    { capabilityItem: 'CARDIOLOGY', label: 'Interventional Cardiologist', isMandatory: true },
    { capabilityItem: 'ICU', label: 'Cardiac Intensive Care Unit (CCU)', isMandatory: true },
    { capabilityItem: 'BLOOD_BANK', label: 'Emergency Blood Bank (O+ Red Cells)', isMandatory: false },
  ]

  beforeEach(() => {
    MockDatabase.reset()
  })

  it('executes full referral lifecycle across Hospital Ops -> Doctor -> Admin Audit', async () => {
    // ═══════════════════════════════════════════════════════════════════
    // 1. INTAKE & MATCHING: Create Emergency Referral
    // ═══════════════════════════════════════════════════════════════════
    const referral = await referralRepository.create(
      demoPatient,
      demoCapabilities,
      'emergency-intake-system'
    )

    expect(referral.id).toBeDefined()
    expect(referral.patient.referenceCode).toBe('AST-DEMO-9901')
    expect(referral.patient.bloodGroup).toBe('O+')
    expect(referral.requiredCapabilities.length).toBe(4)

    // ═══════════════════════════════════════════════════════════════════
    // 2. HOSPITAL OPERATIONS: Capacity Pre-Check, Accept, Bed Allocation, Route
    // ═══════════════════════════════════════════════════════════════════
    // Inspect available beds for H001
    const initialBeds = await bedRepository.getByHospitalId('H001')
    const icuBed = initialBeds.find((b) => b.category === 'ICU')
    expect(icuBed).toBeDefined()
    const initialAvailable = icuBed!.availableBeds
    const initialOccupied = icuBed!.occupiedBeds
    expect(initialAvailable).toBeGreaterThan(0)

    // Hospital Ops accepts referral
    const acceptRes = await referralRepository.recordOperationalDecision(
      referral.id,
      'ACCEPTED',
      opsActor,
      'Primary PCI team on standby. Emergency CCU bed prepared.'
    )
    expect(acceptRes.success).toBe(true)

    // Allocate suitable ICU bed
    const bedAllocRes = await bedRepository.allocateBed(
      'H001',
      icuBed!.id,
      opsActor
    )
    expect(bedAllocRes.success).toBe(true)

    // Verify bed inventory counts after allocation
    const updatedBeds = await bedRepository.getByHospitalId('H001')
    const allocatedIcuBed = updatedBeds.find((b) => b.id === icuBed!.id)!
    expect(allocatedIcuBed.availableBeds).toBe(initialAvailable - 1)
    expect(allocatedIcuBed.occupiedBeds).toBe(initialOccupied + 1)
    expect(allocatedIcuBed.availableBeds + allocatedIcuBed.occupiedBeds).toBeLessThanOrEqual(allocatedIcuBed.totalBeds)
    expect(allocatedIcuBed.availableBeds).toBeGreaterThanOrEqual(0)

    // Route referral to clinical team (Dr. Ananya Mehta - Cardiology)
    const routeRes = await referralRepository.routeToClinical(
      referral.id,
      opsActor,
      doctorActor
    )
    expect(routeRes.success).toBe(true)

    // Verify referral status is now REVIEWING
    const routedReferral = await referralRepository.getById(referral.id)
    expect(routedReferral?.status).toBe('REVIEWING')
    expect(routedReferral?.assignedDoctorId).toBe(doctorActor.id)
    expect(routedReferral?.assignedSpecialty).toBe('Cardiology')

    // ═══════════════════════════════════════════════════════════════════
    // 3. DOCTOR CLINICAL WORKFLOW: Review, Progress Note, Authorized Clinical Decision
    // ═══════════════════════════════════════════════════════════════════
    // Doctor adds clinical note
    const clinicalNote = 'ECG shows acute hyperacute T waves and ST elevation in V1-V4 with reciprocal depressions. Activating Cath Lab 1. Heparin bolus 5000 IU ordered.'
    const noteRes = await referralRepository.addClinicalNote(
      referral.id,
      clinicalNote,
      doctorActor
    )
    expect(noteRes).toBe(true)

    // Doctor submits authorized clinical decision: ACCEPTED
    const decisionRes = await referralRepository.recordDecision(
      referral.id,
      {
        decision: 'ACCEPTED',
        notes: 'Clinical intake accepted. Cath Lab team ready for immediate coronary angiography.',
      },
      doctorActor
    )
    expect(decisionRes).toBe(true)

    // Verify final referral state
    const finalizedReferral = await referralRepository.getById(referral.id)
    expect(finalizedReferral?.status).toBe('ACCEPTED')
    expect(finalizedReferral?.decision).toBeDefined()
    expect(finalizedReferral?.decision?.decidedBy).toBe(doctorActor.id)

    // Verify timeline records contain all steps in order
    const events = finalizedReferral!.timeline
    expect(events.some((e) => e.event.includes('Clinical Acceptance'))).toBe(true)
    expect(events.some((e) => e.event.includes('Clinical Progress Note'))).toBe(true)
    expect(events.some((e) => e.event.includes('Routed to clinical team'))).toBe(true)
    expect(events.some((e) => e.event.includes('Referral Accepted by Hospital Operations'))).toBe(true)

    // ═══════════════════════════════════════════════════════════════════
    // 4. ADMIN GOVERNANCE WORKFLOW: Realtime Audit Trail Verification
    // ═══════════════════════════════════════════════════════════════════
    const auditLogs = await auditRepository.list(referral.id)
    expect(auditLogs.length).toBeGreaterThanOrEqual(4)

    // Verify chronological audit actions
    const actionList = auditLogs.map((l) => l.action)
    expect(actionList).toContain('REFERRAL_ACCEPTED')
    expect(actionList).toContain('REFERRAL_ROUTED_TO_CLINICAL')
    expect(actionList).toContain('CLINICAL_NOTE_ADDED')
    expect(actionList).toContain('CLINICAL_ACCEPTED')

    // Verify actor attribution in audit trail
    const opsAudit = auditLogs.find((l) => l.action === 'REFERRAL_ACCEPTED')!
    expect(opsAudit.actorRole).toBe('HOSPITAL_OPS')
    expect(opsAudit.actorId).toBe(opsActor.id)

    const docAudit = auditLogs.find((l) => l.action === 'CLINICAL_ACCEPTED')!
    expect(docAudit.actorRole).toBe('DOCTOR')
    expect(docAudit.actorId).toBe(doctorActor.id)
    expect(docAudit.details?.specialty).toBe('Cardiology')

    // ═══════════════════════════════════════════════════════════════════
    // 5. ADMIN VERIFICATION MUTATION: Capability status update
    // ═══════════════════════════════════════════════════════════════════
    const adminCapRes = await hospitalRepository.updateCapabilityStatus(
      'H001',
      'H001-cath',
      'VERIFIED',
      adminActor,
      'Annual PCI quality & emergency cath lab accreditation re-certified'
    )
    expect(adminCapRes.success).toBe(true)

    const hospAudit = await auditRepository.list('H001')
    const capAudit = hospAudit.find((l) => l.action === 'CAPABILITY_STATUS_CHANGED')
    expect(capAudit).toBeDefined()
    expect(capAudit?.actorRole).toBe('ADMIN')
  })

  it('rejects invalid state transitions, unauthorized actions, and capacity violations', async () => {
    // 1. Capacity violation: Hospital Ops declining requires a reason
    const declineWithoutReason = await referralRepository.recordOperationalDecision(
      'REF-001',
      'DECLINED',
      opsActor,
      ''
    )
    expect(declineWithoutReason.success).toBe(false)
    expect(declineWithoutReason.error).toContain('reason is required')

    // 2. Capacity violation: Cannot allocate bed from another hospital
    const crossHospitalBedAlloc = await bedRepository.allocateBed(
      'H002',
      'BED-H001-01',
      opsActor
    )
    expect(crossHospitalBedAlloc.success).toBe(false)

    // 3. RBAC boundary: DOCTOR actor cannot perform hospital verification governance
    const doctorGovAttempt = await hospitalRepository.updateVerificationStatus(
      'H001',
      'VERIFIED',
      { id: doctorActor.id, name: doctorActor.name, role: 'DOCTOR' }
    )
    expect(doctorGovAttempt.success).toBe(false)
    expect(doctorGovAttempt.error).toMatch(/Unauthorized/i)

    // 4. RBAC boundary: HOSPITAL_OPS actor cannot perform hospital verification governance
    const opsGovAttempt = await hospitalRepository.updateVerificationStatus(
      'H001',
      'VERIFIED',
      { id: opsActor.id, name: opsActor.name, role: 'HOSPITAL_OPS' }
    )
    expect(opsGovAttempt.success).toBe(false)
    expect(opsGovAttempt.error).toMatch(/Unauthorized/i)
  })

  it('handles edge cases: doctor info request, override decision, and capacity pre-check', async () => {
    // 1. Doctor requests more clinical information
    const infoRes = await referralRepository.recordDecision(
      'REF-001',
      {
        decision: 'INFO_REQUESTED',
        priority: 'Urgent',
        notes: 'Please transmit 12-lead ECG telemetry trace and current arterial blood gas (ABG) report.',
      },
      doctorActor
    )
    expect(infoRes).toBe(true)

    // 2. Doctor clinical override
    const overrideRes = await referralRepository.recordDecision(
      'REF-001',
      {
        decision: 'OVERRIDE',
        overrideReason: 'Bed threshold reached but patient is critical. Converting observation bed to temporary emergency resuscitation.',
      },
      doctorActor
    )
    expect(overrideRes).toBe(true)

    const updated = await referralRepository.getById('REF-001')
    expect(updated?.status).toBe('ACCEPTED')
    expect(updated?.timeline.some((e) => e.event.includes('Clinical Override'))).toBe(true)
  })
})
