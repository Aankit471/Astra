import { describe, expect, it, beforeEach } from 'vitest'
import MockDatabase from './mock/mockDb'
import { referralService } from './mock/referralService'
import type { PatientBrief, RequiredCapability } from '@/types/domain'

describe('Full Emergency Referral Lifecycle Integration', () => {
  beforeEach(() => {
    MockDatabase.reset()
  })

  it('executes full end-to-end referral acceptance, operational confirmation, arrival, and completion', () => {
    const patient: PatientBrief = {
      referenceCode: 'TEST-LIFE-01',
      age: 52,
      sex: 'MALE',
      chiefComplaint: 'Acute STEMI chest pain',
      emergencyCategory: 'CARDIAC',
      urgencyLevel: 'IMMEDIATE',
    }

    const required: RequiredCapability[] = [
      { capabilityItem: 'ICU', label: 'ICU', isMandatory: true },
      { capabilityItem: 'CARDIAC_CATH_LAB', label: 'Cath Lab', isMandatory: true },
    ]

    // 1. USER creates referral
    const created = referralService.createReferral(patient, required, 'user-001')
    expect(created.status).toBe('MATCHED')
    expect(created.matchedFacilities.length).toBeGreaterThan(0)

    // 2. Contact target hospital (Hospital Operations receives referral)
    const targetHospital = created.matchedFacilities[0]
    referralService.sendReferral(created.id, targetHospital)
    const waiting = MockDatabase.getInstance().getReferralById(created.id)!
    expect(waiting.status).toBe('WAITING_FOR_RESPONSE')
    expect(waiting.sentToFacilityId).toBe(targetHospital)

    // 3. Hospital Operations routes to Clinical Team
    referralService.routeToClinical(created.id)
    const reviewing = MockDatabase.getInstance().getReferralById(created.id)!
    expect(reviewing.status).toBe('REVIEWING')

    // 4. Doctor accepts referral (with clinical override acknowledgement for self-reported telemetry)
    referralService.acceptReferral(created.id, true, 'Clinical override acknowledged by test doctor')
    const accepted = MockDatabase.getInstance().getReferralById(created.id)!
    expect(accepted.status).toBe('ACCEPTED')
    expect(accepted.decision?.type).toBe('ACCEPT')

    // 5. Hospital Operations performs operational confirmation (ACCEPTED -> CONFIRMED)
    referralService.confirmReferral(created.id)
    const confirmed = MockDatabase.getInstance().getReferralById(created.id)!
    expect(confirmed.status).toBe('CONFIRMED')
    expect(confirmed.confirmedFacilityId).toBe(targetHospital)

    // 6. Mark Arrived at Emergency Bay
    referralService.markArrived(created.id)
    const arrived = MockDatabase.getInstance().getReferralById(created.id)!
    expect(arrived.status).toBe('ARRIVED')
    expect(arrived.arrivedAt).toBeDefined()

    // 7. Complete Referral
    referralService.completeReferral(created.id)
    const completed = MockDatabase.getInstance().getReferralById(created.id)!
    expect(completed.status).toBe('COMPLETED')
  })
})
