import { describe, expect, it, beforeEach } from 'vitest'
import MockDatabase from './mock/mockDb'
import { referralService } from './mock/referralService'
import type { PatientBrief, RequiredCapability } from '@/types/domain'

describe('Referral Escalation & Decline Workflow', () => {
  beforeEach(() => {
    MockDatabase.reset()
  })

  it('handles clinical decline, automatic escalation to secondary facility, and fallback when exhausted', () => {
    const patient: PatientBrief = {
      referenceCode: 'TEST-ESC-01',
      age: 64,
      sex: 'FEMALE',
      chiefComplaint: 'Severe polytrauma',
      emergencyCategory: 'TRAUMA',
      urgencyLevel: 'IMMEDIATE',
    }

    const required: RequiredCapability[] = [
      { capabilityItem: 'TRAUMA_SURGERY', label: 'Trauma Surgery', isMandatory: true },
    ]

    const created = referralService.createReferral(patient, required, 'user-001')
    const firstFacility = created.matchedFacilities[0]
    referralService.sendReferral(created.id, firstFacility)
    referralService.routeToClinical(created.id)

    // Doctor declines first facility
    referralService.declineReferral(created.id, 'ICU Trauma Bay Full')

    const db = MockDatabase.getInstance()
    const updated = db.getReferralById(created.id)!

    // If a secondary facility was matched, referral escalates and contacts next facility
    if (created.matchedFacilities.length > 1) {
      expect(updated.status).toBe('WAITING_FOR_RESPONSE')
      expect(updated.sentToFacilityId).toBe(created.matchedFacilities[1])
      expect(updated.attemptedFacilityIds).toContain(firstFacility)
    } else {
      expect(updated.unresolvedExhausted).toBe(true)
      const notifications = db.notificationsFor('user-001')
      expect(notifications.some((n) => n.body.includes('112'))).toBe(true)
    }
  })

  it('handles response deadline timeout escalation', () => {
    const patient: PatientBrief = {
      referenceCode: 'TEST-TIME-01',
      age: 45,
      sex: 'MALE',
      chiefComplaint: 'Acute stroke symptoms',
      emergencyCategory: 'NEURO',
      urgencyLevel: 'IMMEDIATE',
    }

    const required: RequiredCapability[] = [
      { capabilityItem: 'CT_SCAN', label: 'CT Scan', isMandatory: true },
    ]

    const created = referralService.createReferral(patient, required, 'user-001')
    referralService.sendReferral(created.id, created.matchedFacilities[0])

    referralService.timeoutReferral(created.id)
    const updated = MockDatabase.getInstance().getReferralById(created.id)!

    if (created.matchedFacilities.length > 1) {
      expect(updated.status).toBe('WAITING_FOR_RESPONSE')
      expect(updated.escalationReason).toBe('TIMEOUT')
    } else {
      expect(updated.unresolvedExhausted).toBe(true)
    }
  })
})
