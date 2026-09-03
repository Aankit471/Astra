import { beforeEach, describe, expect, it } from 'vitest'
import MockDatabase from './mock/mockDb'
import { mockApi } from '@/api/mockAdapter'
import { matchFacilities } from './matchingService'
import type { BedAvailability, RequiredCapability } from '@/types/domain'

describe('Bed Availability & Room Type Telemetry', () => {
  beforeEach(() => {
    MockDatabase.reset()
  })

  it('evaluates bed availability status accurately (AVAILABLE, LIMITED, FULL, STALE)', () => {
    const db = MockDatabase.getInstance()
    const hospital = db.hospitals[0]
    expect(hospital.capabilities.beds).toBeDefined()

    const beds = hospital.capabilities.beds as BedAvailability[]
    const availableBed = beds.find((b) => b.availabilityStatus === 'AVAILABLE')
    expect(availableBed).toBeDefined()
    expect(availableBed?.availableBeds).toBeGreaterThan(0)

    const staleHospital = db.hospitals.find((h) => h.id === 'H004')
    const staleBed = staleHospital?.capabilities.beds?.find((b) => b.availabilityStatus === 'FULL' || b.verificationStatus === 'STALE')
    expect(staleBed).toBeDefined()
    expect(staleBed?.verificationStatus).toBe('STALE')
  })

  it('supports room type (PRIVATE/SHARED) and comfort type (AC/NON_AC) attributes', () => {
    const db = MockDatabase.getInstance()
    const hospital = db.hospitals[0]
    const beds = hospital.capabilities.beds as BedAvailability[]

    const privateAcBed = beds.find((b) => b.roomType === 'PRIVATE' && b.comfort === 'AC')
    expect(privateAcBed).toBeDefined()
    expect(privateAcBed?.category).toBe('ICU')
  })

  it('preserves capability matching as primary over bed availability', () => {
    const db = MockDatabase.getInstance()
    const cardiacReq: RequiredCapability = { capabilityItem: 'CARDIAC_CATH_LAB', label: 'Cardiac Cath Lab', isMandatory: true }

    const results = matchFacilities('CARDIAC', [cardiacReq], db.hospitals)
    expect(results.length).toBeGreaterThan(0)

    // Primary match must have required capability regardless of total general beds in non-matching hospitals
    expect(results[0].hospital.capabilities.capabilities.some((c) => c.item === 'CARDIAC_CATH_LAB')).toBe(true)
  })

  it('validates and updates bed availability via MockAdapter and logs AUDIT_EVENT', async () => {
    const db = MockDatabase.getInstance()
    const hospitalId = 'H001'
    const bedId = 'B001'

    const updatedHospital = await mockApi.hospitals.updateBedAvailability(hospitalId, bedId, 10, 2)
    const updatedBed = updatedHospital.capabilities.beds?.find((b) => b.id === bedId)

    expect(updatedBed?.availableBeds).toBe(10)
    expect(updatedBed?.occupiedBeds).toBe(2)

    const auditEvent = db.auditEvents.find((e) => e.action === 'BED_AVAILABILITY_UPDATED' && (e.details as Record<string, unknown>)?.bedId === bedId)
    expect(auditEvent).toBeDefined()
  })

  it('rejects invalid bed count updates exceeding total capacity', async () => {
    const hospitalId = 'H001'
    const bedId = 'B001' // Total beds = 12

    await expect(mockApi.hospitals.updateBedAvailability(hospitalId, bedId, 15, 5)).rejects.toThrow('Invalid bed availability update.')
  })

  it('exposes bed availability telemetry directly for suitable matched facilities', () => {
    const db = MockDatabase.getInstance()
    const cardiacReq: RequiredCapability = { capabilityItem: 'CARDIAC_CATH_LAB', label: 'Cardiac Cath Lab', isMandatory: true }
    const matches = matchFacilities('CARDIAC', [cardiacReq], db.hospitals)

    expect(matches.length).toBeGreaterThan(0)
    const hospital = matches[0].hospital
    expect(hospital.capabilities.beds).toBeDefined()

    const emergencyBeds = hospital.capabilities.beds?.find((b) => b.category === 'EMERGENCY')
    const icuBeds = hospital.capabilities.beds?.find((b) => b.category === 'ICU')
    expect(emergencyBeds).toBeDefined()
    expect(icuBeds).toBeDefined()
  })
})
