import { describe, expect, it, beforeEach } from 'vitest'
import MockDatabase from './mock/mockDb'
import { referralService } from './mock/referralService'
import type { PatientBrief, RequiredCapability } from '@/types/domain'
import { ROLE_HOME_PATHS, ROLE_PERMISSIONS, type UserRole } from '@/types/auth'
import { referralRepository } from './repositories/referralRepository'
import { bedRepository } from './repositories/bedRepository'

describe('RBAC, Role Boundaries & Duplicate Action Protection', () => {
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

    const created = referralService.createReferral(patient, required, 'ops-001')
    referralService.sendReferral(created.id, created.matchedFacilities[0])
    referralService.routeToClinical(created.id)
    referralService.acceptReferral(created.id, true)
    referralService.confirmReferral(created.id)

    // Calling confirmReferral again when already CONFIRMED throws conflict error
    expect(() => referralService.confirmReferral(created.id)).toThrow('Only clinically accepted referrals can be operationally confirmed')

    // Calling acceptReferral when already CONFIRMED throws conflict error
    expect(() => referralService.acceptReferral(created.id)).toThrow('Referral is not awaiting clinical review')
  })

  it('confirms deleted USER/PATIENT role is permanently removed and only 3 institutional roles exist', () => {
    const activeRoles = Object.keys(ROLE_HOME_PATHS) as UserRole[]
    expect(activeRoles).toEqual(['HOSPITAL_OPS', 'DOCTOR', 'ADMIN'])
    expect(activeRoles).not.toContain('USER')
    expect(activeRoles).not.toContain('PATIENT')

    const permissionRoles = Object.keys(ROLE_PERMISSIONS)
    expect(permissionRoles).toEqual(['HOSPITAL_OPS', 'DOCTOR', 'ADMIN'])
    expect(permissionRoles).not.toContain('USER')
    expect(permissionRoles).not.toContain('PATIENT')

    // Verify home paths are strictly locked to their portals
    expect(ROLE_HOME_PATHS.HOSPITAL_OPS).toBe('/hospital/dashboard')
    expect(ROLE_HOME_PATHS.DOCTOR).toBe('/doctor/dashboard')
    expect(ROLE_HOME_PATHS.ADMIN).toBe('/admin/dashboard')
  })

  it('validates offline/mock fallback resilience when cloud services are disconnected', async () => {
    // In mock/offline mode, repositories must return deterministic local data without crashing
    const localReferrals = await referralRepository.list()
    expect(localReferrals.length).toBeGreaterThan(0)

    const apolloBeds = await bedRepository.getByHospitalId('H001')
    expect(apolloBeds.length).toBeGreaterThan(0)
    const icu = apolloBeds.find((b) => b.category === 'ICU')
    expect(icu).toBeDefined()
    expect(icu!.availableBeds).toBeGreaterThanOrEqual(0)
  })
})
