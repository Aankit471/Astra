/**
 * MockDatabase — shared in-memory singleton.
 * All mock services read/write from this so state is consistent across portals.
 */
import type { Referral, Hospital, Notification, AuditEvent, BloodInventoryItem, SpecialistTeamMember } from '@/types/domain'
import type { AuthUser } from '@/types/auth'
import { HOSPITALS } from '@/data/hospitals'
import { REFERRALS } from '@/data/referrals'
import { MOCK_USERS } from '@/data/users'
import { AUDIT_EVENTS } from '@/data/audit'
import { NOTIFICATIONS } from '@/data/notifications'
import { MOCK_BLOOD_INVENTORY } from '@/data/bloodInventory'
import { MOCK_SPECIALISTS } from '@/data/specialists'

class MockDatabase {
  private static _instance: MockDatabase

  referrals: Referral[]
  hospitals: Hospital[]
  users: AuthUser[]
  auditEvents: AuditEvent[]
  notifications: Notification[]
  bloodInventory: BloodInventoryItem[]
  specialists: SpecialistTeamMember[]

  private constructor() {
    const saved = MockDatabase.readPersisted()
    this.referrals      = saved?.referrals ?? JSON.parse(JSON.stringify(REFERRALS))
    this.hospitals      = saved?.hospitals ?? JSON.parse(JSON.stringify(HOSPITALS))
    this.users          = JSON.parse(JSON.stringify(MOCK_USERS))
    this.auditEvents    = saved?.auditEvents ?? JSON.parse(JSON.stringify(AUDIT_EVENTS))
    this.notifications  = saved?.notifications ?? JSON.parse(JSON.stringify(NOTIFICATIONS))
    this.bloodInventory = saved?.bloodInventory ?? JSON.parse(JSON.stringify(MOCK_BLOOD_INVENTORY))
    this.specialists    = JSON.parse(JSON.stringify(MOCK_SPECIALISTS))
    this.hospitals.forEach((hospital) => hospital.capabilities.capabilities.forEach((capability) => {
      if (Date.now() - new Date(capability.lastUpdated).getTime() > 7 * 86400_000 && !this.notifications.some((item) => item.id === `STALE-${hospital.id}-${capability.id}`)) {
        this.notifications.push({ id: `STALE-${hospital.id}-${capability.id}`, type: 'CAPABILITY_DATA_STALE', title: 'Capability data stale', body: `${hospital.name} — ${capability.label} requires revalidation.`, severity: 'WARNING', isRead: false, createdAt: new Date().toISOString(), hospitalId: hospital.id, recipientRole: 'ADMIN' })
      }
    }))
    this.persist()
  }

  private static readPersisted(): Pick<MockDatabase, 'referrals' | 'hospitals' | 'auditEvents' | 'notifications' | 'bloodInventory'> | null {
    if (typeof localStorage === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('astra-demo-data') || 'null') } catch { return null }
  }

  private persist(): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem('astra-demo-data', JSON.stringify({ referrals: this.referrals, hospitals: this.hospitals, auditEvents: this.auditEvents, notifications: this.notifications, bloodInventory: this.bloodInventory }))
  }

  static getInstance(): MockDatabase {
    if (!MockDatabase._instance) MockDatabase._instance = new MockDatabase()
    return MockDatabase._instance
  }

  static reset(): void {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('astra-demo-data')
    MockDatabase._instance = new MockDatabase()
  }

  getReferralById(id: string): Referral | undefined {
    return this.referrals.find(r => r.id === id)
  }

  upsertReferral(r: Referral): void {
    const idx = this.referrals.findIndex(x => x.id === r.id)
    if (idx >= 0) this.referrals[idx] = r
    else this.referrals.unshift(r)
    this.persist()
  }

  getHospitalById(id: string): Hospital | undefined {
    return this.hospitals.find(h => h.id === id)
  }

  addAuditEvent(e: AuditEvent): void { this.auditEvents.unshift(e); this.persist() }

  addNotification(n: Notification): void { if (!this.notifications.some((item) => item.id === n.id)) { this.notifications.unshift(n); this.persist() } }

  markNotificationRead(id: string): void { const notification = this.notifications.find((item) => item.id === id); if (notification) { notification.isRead = true; notification.readAt = new Date().toISOString(); this.persist() } }

  updateCapability(hospitalId: string, capabilityId: string, status: Hospital['verificationStatus']): boolean {
    const hospital = this.getHospitalById(hospitalId); const capability = hospital?.capabilities.capabilities.find((item) => item.id === capabilityId)
    if (!hospital || !capability) return false
    capability.verificationStatus = status; capability.lastUpdated = new Date().toISOString(); hospital.lastUpdated = capability.lastUpdated; this.persist(); return true
  }

  updateBedAvailability(hospitalId: string, bedId: string, availableBeds: number, occupiedBeds: number): boolean {
    const hospital = this.getHospitalById(hospitalId)
    const bed = hospital?.capabilities.beds?.find((item) => item.id === bedId)
    if (!hospital || !bed) return false
    if (availableBeds < 0 || occupiedBeds < 0 || availableBeds + occupiedBeds > bed.totalBeds) return false

    bed.availableBeds = availableBeds
    bed.occupiedBeds = occupiedBeds
    bed.availabilityStatus = availableBeds === 0 ? 'FULL' : availableBeds <= 3 ? 'LIMITED' : 'AVAILABLE'
    bed.lastUpdatedAt = new Date().toISOString()
    hospital.lastUpdated = bed.lastUpdatedAt

    this.addAuditEvent({
      id: `AE-BED-${Date.now()}`,
      timestamp: bed.lastUpdatedAt,
      action: 'BED_AVAILABILITY_UPDATED',
      actorRole: 'HOSPITAL_OPS',
      actorId: 'ops-user',
      actorName: 'Hospital Operations',
      targetType: 'HOSPITAL',
      targetId: hospitalId,
      targetLabel: hospital.name,
      details: {
        hospitalId,
        bedId,
        category: bed.category,
        availableBeds,
        occupiedBeds,
        totalBeds: bed.totalBeds,
        status: bed.availabilityStatus,
      },
    })

    this.persist()
    return true
  }

  updateHospitalDetails(hospitalId: string, updates: { phone?: string; emergencyPhone?: string; operationalStatus?: import('@/types/domain').HospitalOperationalStatus; addressLine1?: string }): boolean {
    const hospital = this.getHospitalById(hospitalId)
    if (!hospital) return false
    if (updates.phone) hospital.phone = updates.phone
    if (updates.emergencyPhone) hospital.emergencyPhone = updates.emergencyPhone
    if (updates.operationalStatus) hospital.operationalStatus = updates.operationalStatus
    if (updates.addressLine1) hospital.address.line1 = updates.addressLine1
    hospital.lastUpdated = new Date().toISOString()
    this.addAuditEvent({
      id: `AE-HOSP-${Date.now()}`,
      timestamp: hospital.lastUpdated,
      action: 'HOSPITAL_DETAILS_UPDATED',
      actorRole: 'ADMIN',
      actorId: 'admin-001',
      actorName: 'ASTRA Administrator',
      targetType: 'HOSPITAL',
      targetId: hospitalId,
      targetLabel: hospital.name,
      details: { updates },
    })
    this.persist()
    return true
  }

  updateHospitalBedConfig(
    hospitalId: string,
    bedId: string,
    updates: {
      availableBeds?: number
      occupiedBeds?: number
      totalBeds?: number
      comfort?: import('@/types/domain').ComfortType
      chargePerDay?: number
      chargeFormatted?: string
    }
  ): boolean {
    const hospital = this.getHospitalById(hospitalId)
    const bed = hospital?.capabilities.beds?.find((item) => item.id === bedId)
    if (!hospital || !bed) return false

    if (updates.totalBeds !== undefined && updates.totalBeds > 0) bed.totalBeds = updates.totalBeds
    if (updates.availableBeds !== undefined) bed.availableBeds = updates.availableBeds
    if (updates.occupiedBeds !== undefined) bed.occupiedBeds = updates.occupiedBeds
    if (updates.comfort) bed.comfort = updates.comfort
    if (updates.chargePerDay !== undefined) {
      bed.chargePerDay = updates.chargePerDay
      bed.chargeFormatted = updates.chargeFormatted || `₹${updates.chargePerDay.toLocaleString()} / day`
    }
    bed.availabilityStatus = bed.availableBeds === 0 ? 'FULL' : bed.availableBeds <= 3 ? 'LIMITED' : 'AVAILABLE'
    bed.lastUpdatedAt = new Date().toISOString()
    hospital.lastUpdated = bed.lastUpdatedAt

    this.addAuditEvent({
      id: `AE-BED-CONFIG-${Date.now()}`,
      timestamp: bed.lastUpdatedAt,
      action: 'BED_CONFIG_UPDATED',
      actorRole: 'ADMIN',
      actorId: 'admin-001',
      actorName: 'ASTRA Administrator',
      targetType: 'HOSPITAL',
      targetId: hospitalId,
      targetLabel: hospital.name,
      details: { hospitalId, bedId, updates },
    })
    this.persist()
    return true
  }

  notificationsFor(userId: string): Notification[] {
    const user = this.users.find((item) => item.id === userId)
    return this.notifications.filter((notification) =>
      (!notification.recipientId || notification.recipientId === userId) &&
      (!notification.recipientRole || notification.recipientRole === user?.role),
    )
  }

  getBloodInventory(hospitalId?: string): BloodInventoryItem[] {
    if (hospitalId && hospitalId !== 'ALL') {
      return this.bloodInventory.filter((item) => item.hospitalId === hospitalId)
    }
    return this.bloodInventory
  }

  getSpecialists(hospitalId?: string): SpecialistTeamMember[] {
    if (hospitalId && hospitalId !== 'ALL') {
      return this.specialists.filter((item) => item.hospitalId === hospitalId)
    }
    return this.specialists
  }

  getSpecialistByDoctorId(doctorId: string): SpecialistTeamMember | undefined {
    return this.specialists.find((item) => item.doctorId === doctorId)
  }
}

export default MockDatabase
