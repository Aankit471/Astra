import { describe, expect, it, beforeEach } from 'vitest'
import MockDatabase from './mock/mockDb'
import { referralService } from './mock/referralService'
import type { PatientBrief, RequiredCapability } from '@/types/domain'

describe('RBAC & Duplicate Action Protection', () => {
  beforeEach(() => {
    MockDatabase.reset()
  })

  it('prevents duplicate status transitions safely', () => {
    const patient: PatientBrief = {
      referenceCode: 'TEST-DUP-01',
      age: 50,
      sex: 'MALE',
      chiefComplaint: 'Chest pain',
      emergencyCategory: 'CARDIAC',
      urgencyLevel: 'IMMEDIATE',
    }

    const required: RequiredCapability[] = [
      { capabilityItem: 'ICU', label: 'ICU', isMandatory: true },
    ]

    const created = referralService.createReferral(patient, required, 'user-001')
    referralService.sendReferral(created.id, created.matchedFacilities[0])
    referralService.routeToClinical(created.id)
    referralService.acceptReferral(created.id, true)
    referralService.confirmReferral(created.id)

    // Calling confirmReferral again when already CONFIRMED throws conflict error
    expect(() => referralService.confirmReferral(created.id)).toThrow('Only clinically accepted referrals can be operationally confirmed')

    // Calling acceptReferral when already CONFIRMED throws conflict error
    expect(() => referralService.acceptReferral(created.id)).toThrow('Referral is not awaiting clinical review')
  })
})
