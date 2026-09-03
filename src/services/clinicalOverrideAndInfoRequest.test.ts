import { describe, expect, it, beforeEach } from 'vitest'
import MockDatabase from './mock/mockDb'
import { referralService } from './mock/referralService'
import type { PatientBrief, RequiredCapability } from '@/types/domain'

describe('Doctor Request Information & Clinical Override Workflows', () => {
  beforeEach(() => {
    MockDatabase.reset()
  })

  it('handles Doctor Request More Information workflow', () => {
    const patient: PatientBrief = {
      referenceCode: 'TEST-INFO-01',
      age: 60,
      sex: 'MALE',
      chiefComplaint: 'Chest pressure with radiation',
      emergencyCategory: 'CARDIAC',
      urgencyLevel: 'IMMEDIATE',
    }

    const required: RequiredCapability[] = [
      { capabilityItem: 'CARDIOLOGY', label: 'Cardiology', isMandatory: true },
    ]

    const created = referralService.createReferral(patient, required, 'user-001')
    referralService.sendReferral(created.id, created.matchedFacilities[0])
    referralService.routeToClinical(created.id)

    // Doctor requests additional info
    const reqNote = 'Please upload 12-lead ECG and troponin T levels.'
    referralService.requestInformation(created.id, reqNote)

    const db = MockDatabase.getInstance()
    const updated = db.getReferralById(created.id)!

    expect(updated.status).toBe('REVIEWING')
    expect(updated.infoRequested).toBe(true)
    expect(updated.infoRequestedNotes).toBe(reqNote)

    // Audit event and notifications created
    const audit = db.auditEvents.find((a) => a.action === 'Doctor Requested Information')
    expect(audit).toBeDefined()
    expect(audit?.details?.notes).toBe(reqNote)
  })

  it('requires clinical override acknowledgement when receiving facility capability is unverified', () => {
    const db = MockDatabase.getInstance()
    // Make target hospital capability unverified (STALE)
    const hospital = db.hospitals[0]
    hospital.verificationStatus = 'STALE'
    hospital.capabilities.capabilities.forEach((c) => { c.verificationStatus = 'STALE' })

    const patient: PatientBrief = {
      referenceCode: 'TEST-OVR-01',
      age: 58,
      sex: 'FEMALE',
      chiefComplaint: 'Cardiac emergency',
      emergencyCategory: 'CARDIAC',
      urgencyLevel: 'IMMEDIATE',
    }

    const required: RequiredCapability[] = [
      { capabilityItem: 'CARDIOLOGY', label: 'Cardiology', isMandatory: true },
    ]

    const created = referralService.createReferral(patient, required, 'user-001')
    referralService.sendReferral(created.id, hospital.id)
    referralService.routeToClinical(created.id)

    // Attempting accept without override acknowledgement throws conflict error
    expect(() => referralService.acceptReferral(created.id, false)).toThrow('Clinical override acknowledgement required')

    // Accepting with override acknowledged succeeds and creates audit event
    referralService.acceptReferral(created.id, true, 'Doctor verified patient stability manually.')

    const updated = db.getReferralById(created.id)!
    expect(updated.status).toBe('ACCEPTED')
    expect(updated.clinicalOverride).toBe(true)

    const overrideAudit = db.auditEvents.find((a) => a.action === 'Clinical Override Acknowledged')
    expect(overrideAudit).toBeDefined()
  })
})
