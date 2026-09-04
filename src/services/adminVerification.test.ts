import { describe, expect, it, beforeEach } from 'vitest'
import MockDatabase from './mock/mockDb'
import { useAppStore } from '@/store/appStore'
import { ROLE_PERMISSIONS } from '@/types/auth'
import { hospitalRepository } from './repositories/hospitalRepository'
import { auditRepository } from './repositories/auditRepository'

describe('Admin Capability Verification, Governance & RBAC Operations', () => {
  const adminActor = {
    id: 'admin-001',
    name: 'Network Admin',
    role: 'ADMIN',
  }

  const doctorActor = {
    id: 'doc-001',
    name: 'Dr. Ramesh Sharma',
    role: 'DOCTOR',
  }

  const opsActor = {
    id: 'ops-001',
    name: 'Hospital Ops User',
    role: 'HOSPITAL_OPS',
  }

  beforeEach(() => {
    MockDatabase.reset()
    useAppStore.getState().setUser({
      id: adminActor.id,
      name: adminActor.name,
      email: 'admin@astra.health',
      role: 'ADMIN',
      avatarInitials: 'NA',
      permissions: ROLE_PERMISSIONS.ADMIN,
    })
  })

  describe('Admin Authentication & RBAC Rules', () => {
    it('verifies that ADMIN role has correct platform governance permissions', () => {
      const store = useAppStore.getState()
      expect(store.user?.role).toBe('ADMIN')
      expect(store.user?.permissions).toContain('hospital:verify')
      expect(store.user?.permissions).toContain('hospital:manage')
      expect(store.user?.permissions).toContain('admin:full')
      expect(store.user?.permissions).toContain('audit:view')
    })

    it('denies verification mutations to DOCTOR and HOSPITAL_OPS actors', async () => {
      const hospital = MockDatabase.getInstance().hospitals[0]

      // Attempt verification update by DOCTOR
      const docResult = await hospitalRepository.updateVerificationStatus(
        hospital.id,
        'STALE',
        doctorActor
      )
      expect(docResult.success).toBe(false)
      expect(docResult.error).toMatch(/Unauthorized/i)

      // Attempt capability update by HOSPITAL_OPS
      const opsCapResult = await hospitalRepository.updateCapabilityStatus(
        hospital.id,
        hospital.capabilities.capabilities[0].id,
        'VERIFIED',
        opsActor
      )
      expect(opsCapResult.success).toBe(false)
      expect(opsCapResult.error).toMatch(/Unauthorized/i)

      // Attempt hospital details update by DOCTOR
      const docDetailsResult = await hospitalRepository.updateHospitalDetails(
        hospital.id,
        { phone: '+91-9999999999' },
        doctorActor
      )
      expect(docDetailsResult.success).toBe(false)
      expect(docDetailsResult.error).toMatch(/Unauthorized/i)
    })
  })

  describe('Hospital Verification & Governance Mutations', () => {
    it('allows ADMIN to update hospital verification status and creates audit log', async () => {
      const hospital = MockDatabase.getInstance().hospitals[0]
      const previousStatus = hospital.verificationStatus
      expect(previousStatus).toBeDefined()

      const res = await hospitalRepository.updateVerificationStatus(
        hospital.id,
        'VERIFIED',
        adminActor,
        'On-site state regulatory audit completed'
      )
      expect(res.success).toBe(true)

      const updated = MockDatabase.getInstance().getHospitalById(hospital.id)
      expect(updated?.verificationStatus).toBe('VERIFIED')

      // Verify audit log record
      const logs = await auditRepository.list(hospital.id)
      const verifyLog = logs.find((l) => l.action === 'ADMIN_HOSPITAL_VERIFIED')
      expect(verifyLog).toBeDefined()
      expect(verifyLog?.actorRole).toBe('ADMIN')
      expect(verifyLog?.actorId).toBe(adminActor.id)
      expect(verifyLog?.details?.newStatus).toBe('VERIFIED')
      expect(verifyLog?.details?.reason).toContain('regulatory audit')
    })

    it('allows ADMIN to update capability verification status and telemetry', async () => {
      const hospital = MockDatabase.getInstance().hospitals[0]
      const cap = hospital.capabilities.capabilities[0]

      const res = await hospitalRepository.updateCapabilityStatus(
        hospital.id,
        cap.id,
        'SELF_REPORTED',
        adminActor,
        'Updated capability status via governance portal'
      )
      expect(res.success).toBe(true)

      const updatedHosp = MockDatabase.getInstance().getHospitalById(hospital.id)!
      const updatedCap = updatedHosp.capabilities.capabilities.find((c) => c.id === cap.id)!
      expect(updatedCap.verificationStatus).toBe('SELF_REPORTED')

      // Check audit log
      const logs = await auditRepository.list(hospital.id)
      const capLog = logs.find((l) => l.action === 'CAPABILITY_STATUS_CHANGED')
      expect(capLog).toBeDefined()
      expect(capLog?.actorRole).toBe('ADMIN')
      expect(capLog?.details?.capabilityId).toBe(cap.id)
      expect(capLog?.details?.status).toBe('SELF_REPORTED')
    })

    it('allows ADMIN to update operational details with audit tracking', async () => {
      const hospital = MockDatabase.getInstance().hospitals[0]

      const res = await hospitalRepository.updateHospitalDetails(
        hospital.id,
        {
          phone: '+91-80-49999999',
          emergencyPhone: '+91-80-49999990',
        },
        adminActor
      )
      expect(res.success).toBe(true)

      const updated = MockDatabase.getInstance().getHospitalById(hospital.id)!
      expect(updated.phone).toBe('+91-80-49999999')
      expect(updated.emergencyPhone).toBe('+91-80-49999990')

      const logs = await auditRepository.list(hospital.id)
      const detailLog = logs.find((l) => l.action === 'ADMIN_HOSPITAL_UPDATE')
      expect(detailLog).toBeDefined()
      expect(detailLog?.actorRole).toBe('ADMIN')
    })
  })

  describe('Store Legacy Integration & State Telemetry', () => {
    it('updates capability status, updates telemetry timestamp, and creates audit event in store', () => {
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
  })
})
