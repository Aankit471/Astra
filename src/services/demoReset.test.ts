import { describe, it, expect, beforeEach } from 'vitest'
import { executeDemoReset } from './demoResetService'
import type { AuthUser } from '@/types/auth'
import { ROLE_PERMISSIONS } from '@/types/auth'
import MockDatabase from '@/services/mock/mockDb'
import { auditRepository } from './repositories/auditRepository'

describe('Demo Reset Service & RBAC Boundary Tests', () => {
  const adminUser: AuthUser = {
    id: 'admin-001',
    name: 'Platform Administrator',
    email: 'admin@astra.demo',
    role: 'ADMIN',
    avatarInitials: 'PA',
    permissions: ROLE_PERMISSIONS.ADMIN,
  }

  const doctorUser: AuthUser = {
    id: 'doc-001',
    name: 'Dr. Ananya Mehta',
    email: 'doctor@astra.demo',
    role: 'DOCTOR',
    avatarInitials: 'AM',
    permissions: ROLE_PERMISSIONS.DOCTOR,
  }

  const opsUser: AuthUser = {
    id: 'ops-001',
    name: 'Hospital Operations Lead',
    email: 'ops@astra.demo',
    role: 'HOSPITAL_OPS',
    avatarInitials: 'HO',
    permissions: ROLE_PERMISSIONS.HOSPITAL_OPS,
  }

  beforeEach(() => {
    MockDatabase.reset()
  })

  it('allows ADMIN to successfully execute demo reset', async () => {
    const res = await executeDemoReset(adminUser)
    expect(res.success).toBe(true)
    expect(res.error).toBeUndefined()
    expect(res.message).toContain('Demo baseline successfully restored')

    // Verify MockDatabase baseline was restored
    const db = MockDatabase.getInstance()
    expect(db.referrals.length).toBeGreaterThan(0)
    const primaryRef = db.referrals.find((r) => r.patient?.referenceCode === 'AST-1042')
    expect(primaryRef).toBeDefined()
    expect(primaryRef?.patient?.emergencyCategory).toBe('CARDIAC')

    // Verify audit event was logged
    const logs = await auditRepository.list({ limit: 10 })
    const resetLog = logs.find((l) => l.action === 'DEMO_STATE_RESET')
    expect(resetLog).toBeDefined()
    expect(resetLog?.actorRole).toBe('ADMIN')
  })

  it('strictly BLOCKS DOCTOR from executing demo reset', async () => {
    const res = await executeDemoReset(doctorUser)
    expect(res.success).toBe(false)
    expect(res.error).toBe('FORBIDDEN_ROLE')
    expect(res.message).toContain('Unauthorized')
  })

  it('strictly BLOCKS HOSPITAL_OPS from executing demo reset', async () => {
    const res = await executeDemoReset(opsUser)
    expect(res.success).toBe(false)
    expect(res.error).toBe('FORBIDDEN_ROLE')
    expect(res.message).toContain('Unauthorized')
  })
})
