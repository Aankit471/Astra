import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_USERS } from '@/data/users'
import { HOSPITALS } from '@/data/hospitals'
import { REFERRALS } from '@/data/referrals'
import { AUDIT_EVENTS } from '@/data/audit'
import type { AuthUser } from '@/types/auth'
import type { AuditEvent, Referral, RequiredCapability, PatientBrief, ReferralStatus } from '@/types/domain'
import { referralService } from '@/services/mock/referralService'
import MockDatabase from '@/services/mock/mockDb'
import { AppError } from '@/api/errors'

interface AppState {
  user: AuthUser | null
  referrals: Referral[]
  hospitals: import('@/types/domain').Hospital[]
  auditEvents: AuditEvent[]
  notifications: import('@/types/domain').Notification[]
  bloodInventory: import('@/types/domain').BloodInventoryItem[]
  specialists: import('@/types/domain').SpecialistTeamMember[]
  isOffline: boolean
  setUser: (user: AuthUser | null) => void
  setOffline: (offline: boolean) => void
  toggleOffline: () => void
  createReferral: (patient: PatientBrief, requiredCapabilities: RequiredCapability[]) => Referral
  sendReferral: (referralId: string, hospitalId: string) => void
  routeToClinical: (referralId: string) => void
  timeoutReferral: (referralId: string) => void
  declineReferral: (referralId: string, reason: string) => void
  requestInformation: (referralId: string, notes: string) => void
  acceptReferral: (referralId: string, overrideAcknowledged?: boolean, overrideNotes?: string) => void
  confirmReferral: (referralId: string) => void
  markArrived: (referralId: string) => void
  completeReferral: (referralId: string) => void
  markNotificationRead: (notificationId: string) => void
  updateCapability: (hospitalId: string, capabilityId: string, status: import('@/types/domain').VerificationStatus, reason?: string) => boolean
  updateBedAvailability: (hospitalId: string, bedId: string, available: number, occupied: number) => boolean
  updateHospitalDetails: (hospitalId: string, updates: { phone?: string; emergencyPhone?: string; operationalStatus?: import('@/types/domain').HospitalOperationalStatus; addressLine1?: string }) => boolean
  updateHospitalBedConfig: (hospitalId: string, bedId: string, updates: { availableBeds?: number; occupiedBeds?: number; totalBeds?: number; comfort?: import('@/types/domain').ComfortType; chargePerDay?: number; chargeFormatted?: string }) => boolean
  resetDemo: () => void
  refresh: () => void
}

const users = MOCK_USERS
const db = referralService
const requireConnection = (offline: boolean): void => {
  if (offline) throw new AppError('NETWORK_ERROR', 'Connection unavailable. This action requires an active connection.')
}

export const useAppStore = create<AppState>()(persist((set, get) => ({
  user: null,
  referrals: REFERRALS,
  hospitals: MockDatabase.getInstance().hospitals,
  auditEvents: AUDIT_EVENTS,
  notifications: MockDatabase.getInstance().notifications,
  bloodInventory: MockDatabase.getInstance().bloodInventory,
  specialists: MockDatabase.getInstance().specialists,
  isOffline: false,
  setUser: (user) => set({ user }),
  setOffline: (offline) => set({ isOffline: offline }),
  toggleOffline: () => set((state) => ({ isOffline: !state.isOffline })),
  createReferral: (patient, requiredCapabilities) => {
    requireConnection(get().isOffline)
    const referral = db.createReferral(patient, requiredCapabilities, 'user-001')
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
    return referral
  },
  sendReferral: (referralId, hospitalId) => {
    requireConnection(get().isOffline)
    db.sendReferral(referralId, hospitalId)
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
  },
  routeToClinical: (referralId) => {
    db.routeToClinical(referralId)
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
  },
  timeoutReferral: (referralId) => {
    db.timeoutReferral(referralId)
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
  },
  declineReferral: (referralId, reason) => {
    requireConnection(get().isOffline)
    db.declineReferral(referralId, reason)
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
  },
  requestInformation: (referralId, notes) => {
    requireConnection(get().isOffline)
    db.requestInformation(referralId, notes)
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
  },
  acceptReferral: (referralId, overrideAcknowledged = false, overrideNotes = '') => {
    requireConnection(get().isOffline)
    db.acceptReferral(referralId, overrideAcknowledged, overrideNotes)
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
  },
  confirmReferral: (referralId) => {
    requireConnection(get().isOffline)
    db.confirmReferral(referralId)
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
  },
  markArrived: (referralId) => {
    requireConnection(get().isOffline)
    db.markArrived(referralId)
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
  },
  completeReferral: (referralId) => {
    requireConnection(get().isOffline)
    db.completeReferral(referralId)
    set({ referrals: [...db.listReferrals()], auditEvents: [...db.listAuditEvents()], notifications: [...MockDatabase.getInstance().notifications] })
  },
  markNotificationRead: (notificationId) => { MockDatabase.getInstance().markNotificationRead(notificationId); set({ notifications: [...MockDatabase.getInstance().notifications] }) },
  updateCapability: (hospitalId, capabilityId, status, reason = 'Administrative verification review') => { const database = MockDatabase.getInstance(); const hospital = database.getHospitalById(hospitalId); const capability = hospital?.capabilities.capabilities.find((item) => item.id === capabilityId); const previousStatus = capability?.verificationStatus; const updated = database.updateCapability(hospitalId, capabilityId, status); const actor = get().user; if (updated && hospital && capability && actor) database.addAuditEvent({ id: `AUD-CAP-${Date.now()}`, timestamp: new Date().toISOString(), action: 'CAPABILITY_STATUS_CHANGED', actorId: actor.id, actorName: actor.name, actorRole: actor.role, targetType: 'HOSPITAL', targetId: hospitalId, targetLabel: hospital.name, details: { capabilityId, previousStatus, newStatus: status, reason } }); set({ hospitals: [...database.hospitals], auditEvents: [...database.auditEvents], notifications: [...database.notifications] }); return updated },
  updateBedAvailability: (hospitalId, bedId, available, occupied) => {
    requireConnection(get().isOffline)
    const database = MockDatabase.getInstance()
    const updated = database.updateBedAvailability(hospitalId, bedId, available, occupied)
    if (updated) {
      set({ hospitals: [...database.hospitals], auditEvents: [...database.auditEvents], notifications: [...database.notifications] })
    }
    return updated
  },
  updateHospitalDetails: (hospitalId, updates) => {
    requireConnection(get().isOffline)
    const database = MockDatabase.getInstance()
    const updated = database.updateHospitalDetails(hospitalId, updates)
    if (updated) {
      set({ hospitals: [...database.hospitals], auditEvents: [...database.auditEvents] })
    }
    return updated
  },
  updateHospitalBedConfig: (hospitalId, bedId, updates) => {
    requireConnection(get().isOffline)
    const database = MockDatabase.getInstance()
    const updated = database.updateHospitalBedConfig(hospitalId, bedId, updates)
    if (updated) {
      set({ hospitals: [...database.hospitals], auditEvents: [...database.auditEvents] })
    }
    return updated
  },
  resetDemo: () => { MockDatabase.reset(); const database = MockDatabase.getInstance(); set({ referrals: [...database.referrals], hospitals: [...database.hospitals], auditEvents: [...database.auditEvents], notifications: [...database.notifications], bloodInventory: [...database.bloodInventory], specialists: [...database.specialists], isOffline: false }) },
  refresh: () => { const database = MockDatabase.getInstance(); set({ referrals: [...database.referrals], hospitals: [...database.hospitals], auditEvents: [...database.auditEvents], notifications: [...database.notifications], bloodInventory: [...database.bloodInventory], specialists: [...database.specialists] }) },
}), {
  name: 'astra-session',
  partialize: (state) => ({ user: state.user }),
}))

export { users, HOSPITALS }
export type { ReferralStatus }
