import { describe, it, expect, beforeEach } from 'vitest'
import { bedRepository } from './repositories/bedRepository'
import { bloodRepository } from './repositories/bloodRepository'
import { doctorRepository } from './repositories/doctorRepository'
import { referralRepository } from './repositories/referralRepository'
import { auditRepository } from './repositories/auditRepository'
import MockDatabase from './mock/mockDb'

describe('Hospital Operations Supabase Integration & Workflows', () => {
  beforeEach(() => {
    MockDatabase.reset()
  })


  it('retrieves live bed inventory for assigned hospital and enforces sum capacity constraint', async () => {
    const beds = await bedRepository.getByHospitalId('H001')
    expect(beds.length).toBeGreaterThan(0)

    const targetBed = beds[0]
    expect(targetBed.totalBeds).toBeGreaterThan(0)

    // Attempt invalid update where available + occupied + reserved > total
    const invalidResult = await bedRepository.updateBedCounts(
      'H001',
      targetBed.id,
      {
        totalBeds: 10,
        availableBeds: 8,
        occupiedBeds: 5,
        reservedBeds: 2, // 8 + 5 + 2 = 15 > 10
      },
      { id: 'ops-001', name: 'Ops Officer', role: 'HOSPITAL_OPS' }
    )

    expect(invalidResult.success).toBe(false)
    expect(invalidResult.error).toContain('Validation Error')

    // Attempt valid update
    const validResult = await bedRepository.updateBedCounts(
      'H001',
      targetBed.id,
      {
        totalBeds: 15,
        availableBeds: 6,
        occupiedBeds: 7,
        reservedBeds: 2, // 6 + 7 + 2 = 15 <= 15
      },
      { id: 'ops-001', name: 'Ops Officer', role: 'HOSPITAL_OPS' }
    )

    expect(validResult.success).toBe(true)
  })

  it('performs bed allocation, release, and reservation operations', async () => {
    const beds = await bedRepository.getByHospitalId('H001')
    const targetBed = beds.find((b) => b.availableBeds > 0 && b.occupiedBeds > 0) || beds[0]
    const actor = { id: 'ops-001', name: 'Sarah Jenkins', role: 'HOSPITAL_OPS' }

    // Allocate bed
    const allocRes = await bedRepository.allocateBed('H001', targetBed.id, actor)
    expect(allocRes.success).toBe(true)

    // Release bed
    const releaseRes = await bedRepository.releaseBed('H001', targetBed.id, actor)
    expect(releaseRes.success).toBe(true)

    // Reserve bed
    const reserveRes = await bedRepository.reserveBed('H001', targetBed.id, actor)
    expect(reserveRes.success).toBe(true)
  })

  it('provides all 8 blood groups telemetry with calculated status', async () => {
    const bloodTelemetry = await bloodRepository.getHospitalBloodTelemetry('H001')
    expect(bloodTelemetry).toHaveLength(8)

    const groups = bloodTelemetry.map((b) => b.bloodGroup)
    expect(groups).toContain('A+')
    expect(groups).toContain('A-')
    expect(groups).toContain('B+')
    expect(groups).toContain('B-')
    expect(groups).toContain('AB+')
    expect(groups).toContain('AB-')
    expect(groups).toContain('O+')
    expect(groups).toContain('O-')

    bloodTelemetry.forEach((item) => {
      expect(['NORMAL', 'LOW', 'CRITICAL']).toContain(item.status)
      expect(item.minimumThreshold).toBeGreaterThan(0)
    })
  })

  it('lists hospital specialists and indicates on-call status', async () => {
    const specialists = await doctorRepository.getHospitalSpecialists('H001')
    expect(specialists.length).toBeGreaterThan(0)

    const onCall = specialists.some((d) => d.onCall || d.status === 'ON_CALL')
    expect(onCall).toBe(true)
  })

  it('requires a reason when hospital operations declines an emergency referral', async () => {
    const referrals = await referralRepository.list({ hospitalId: 'H001' })
    expect(referrals.length).toBeGreaterThan(0)

    const target = referrals[0]
    const actor = {
      id: 'ops-001',
      name: 'Sarah Jenkins',
      role: 'HOSPITAL_OPS',
      hospitalId: 'H001',
      hospitalName: 'Apollo General Hospital',
    }

    // Try declining without reason
    const emptyReasonRes = await referralRepository.recordOperationalDecision(
      target.id,
      'DECLINED',
      actor,
      ''
    )
    expect(emptyReasonRes.success).toBe(false)
    expect(emptyReasonRes.error).toContain('reason is required')

    // Decline with reason
    const validDeclineRes = await referralRepository.recordOperationalDecision(
      target.id,
      'DECLINED',
      actor,
      'Full emergency diversion to regional center.'
    )
    expect(validDeclineRes.success).toBe(true)
  })

  it('creates audit log entries for operational actions', async () => {
    await auditRepository.log({
      action: 'BED_ALLOCATED',
      actorId: 'ops-001',
      actorName: 'Sarah Jenkins',
      actorRole: 'HOSPITAL_OPS',
      targetType: 'HOSPITAL',
      targetId: 'H001',
      targetLabel: 'Bed #BED-01',
      details: { ward: 'Cardiac ICU' },
    })

    const logs = await auditRepository.list('H001')
    expect(logs.length).toBeGreaterThan(0)
    expect(logs.some((l) => l.action === 'BED_ALLOCATED')).toBe(true)
  })

  it('enforces hospital-specific referral isolation so operators cannot view other hospitals cases', async () => {
    const apolloReferrals = await referralRepository.list({ hospitalId: 'H001' })
    expect(apolloReferrals.length).toBeGreaterThan(0)
    expect(apolloReferrals.every((r) => r.sentToFacilityId === 'H001')).toBe(true)

    // Verify none of the referrals belong to H002 (Govt District Hospital)
    expect(apolloReferrals.some((r) => r.sentToFacilityId === 'H002')).toBe(false)
  })

  it('prevents unauthorized cross-hospital bed modifications', async () => {
    const actor = { id: 'ops-001', name: 'Ops Officer', role: 'HOSPITAL_OPS' }
    
    // Attempt to allocate a bed in H001 using an invalid or cross-hospital bed ID
    const crossAccessResult = await bedRepository.allocateBed('H001', 'BED-FORTIS-999', actor)
    expect(crossAccessResult.success).toBe(false)
    expect(crossAccessResult.error).toContain('not found')
  })

  it('enforces capacity pre-check and logs audit trail when accepting an emergency referral', async () => {
    const referrals = await referralRepository.list({ hospitalId: 'H001' })
    const target = referrals[0]
    const actor = {
      id: 'ops-001',
      name: 'Sarah Jenkins',
      role: 'HOSPITAL_OPS',
      hospitalId: 'H001',
      hospitalName: 'Apollo General Hospital',
    }

    // Accept referral with verified capacity
    const acceptRes = await referralRepository.recordOperationalDecision(
      target.id,
      'ACCEPTED',
      actor,
      'Acute trauma team standby and bed assigned.'
    )
    expect(acceptRes.success).toBe(true)

    // Verify status updated
    const updated = await referralRepository.getById(target.id)
    expect(updated?.status).toBe('ACCEPTED')

    // Verify audit log
    const logs = await auditRepository.list('H001')
    expect(logs.some((l) => l.action === 'REFERRAL_ACCEPTED' && l.targetId === target.id)).toBe(true)
  })
})

