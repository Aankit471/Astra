import { describe, expect, it, beforeEach } from 'vitest'
import MockDatabase from './mock/mockDb'
import { useAppStore } from '@/store/appStore'

import { ROLE_PERMISSIONS } from '@/types/auth'

describe('Admin Capability Verification & Reusable Modal Operations', () => {
  beforeEach(() => {
    MockDatabase.reset()
    useAppStore.getState().setUser({
      id: 'admin-001',
      name: 'Network Admin',
      email: 'admin@astra.health',
      role: 'ADMIN',
      avatarInitials: 'NA',
      permissions: ROLE_PERMISSIONS.ADMIN,
    })
  })

  it('updates capability status, updates telemetry timestamp, and creates audit event', () => {
    const store = useAppStore.getState()
    const hospital = store.hospitals[0]
    const capability = hospital.capabilities.capabilities[0]
    const previousStatus = capability.verificationStatus

    const success = store.updateCapability(
      hospital.id,
      capability.id,
      'VERIFIED',
      'Verified during regulatory audit on-site.'
    )

    expect(success).toBe(true)

    const db = MockDatabase.getInstance()
    const updatedHospital = db.getHospitalById(hospital.id)!
    const updatedCap = updatedHospital.capabilities.capabilities.find((c) => c.id === capability.id)!

    expect(updatedCap.verificationStatus).toBe('VERIFIED')
    expect(new Date(updatedCap.lastUpdated).getTime()).toBeGreaterThan(0)

    const audit = db.auditEvents.find((a) => a.action === 'CAPABILITY_STATUS_CHANGED')
    expect(audit).toBeDefined()
    expect(audit?.details?.capabilityId).toBe(capability.id)
    expect(audit?.details?.previousStatus).toBe(previousStatus)
    expect(audit?.details?.newStatus).toBe('VERIFIED')
  })

  it('allows target status selection among VERIFIED, SELF_REPORTED, INFERRED, and STALE', () => {
    const store = useAppStore.getState()
    const hospital = store.hospitals[0]
    const capability = hospital.capabilities.capabilities[0]

    store.updateCapability(hospital.id, capability.id, 'INFERRED', 'Inferred from regional ICU census telemetry')
    const capInferred = useAppStore.getState().hospitals[0].capabilities.capabilities.find((c) => c.id === capability.id)!
    expect(capInferred.verificationStatus).toBe('INFERRED')

    store.updateCapability(hospital.id, capability.id, 'SELF_REPORTED', 'Self reported by hospital operational director')
    const capSelf = useAppStore.getState().hospitals[0].capabilities.capabilities.find((c) => c.id === capability.id)!
    expect(capSelf.verificationStatus).toBe('SELF_REPORTED')

    store.updateCapability(hospital.id, capability.id, 'STALE', 'Revalidated dataset marked stale')
    const capStale = useAppStore.getState().hospitals[0].capabilities.capabilities.find((c) => c.id === capability.id)!
    expect(capStale.verificationStatus).toBe('STALE')
  })
})
