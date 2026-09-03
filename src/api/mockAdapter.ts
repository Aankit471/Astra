import { DEMO_CREDENTIALS, MOCK_PASSWORDS, MOCK_USERS } from '@/data/users'
import MockDatabase from '@/services/mock/mockDb'
import { referralService } from '@/services/mock/referralService'
import { AppError } from './errors'
import type { AstraApi, ReferralFilters } from './types'
import type { PatientBrief, RequiredCapability, VerificationStatus } from '@/types/domain'

const getDb = () => MockDatabase.getInstance()
const findUser = (email: string, password: string) => {
  if (!DEMO_CREDENTIALS.some((credential) => credential.email === email) || MOCK_PASSWORDS[email] !== password) throw new AppError('UNAUTHORIZED', 'Invalid demo credentials.', 401)
  const user = MOCK_USERS.find((item) => item.email === email)
  if (!user) throw new AppError('UNAUTHORIZED', 'Demo account not found.', 401)
  return user
}

const filtered = (filters?: ReferralFilters) => getDb().referrals.filter((referral) => (!filters?.createdBy || referral.createdBy === filters.createdBy) && (!filters?.hospitalId || referral.sentToFacilityId === filters.hospitalId) && (!filters?.doctorId || referral.assignedDoctorId === filters.doctorId) && (!filters?.status || referral.status === filters.status))
const getReferral = (id: string) => { const referral = getDb().getReferralById(id); if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404); return referral }

export const mockApi: AstraApi = {
  auth: {
    async login(email, password) { const user = findUser(email, password); return { user, token: `demo-${user.id}`, expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString() } },
    async logout() {},
    async currentSession() { return null },
  },
  referrals: {
    async list(filters) { return filtered(filters) },
    async get(id) { return getReferral(id) },
    async create(patient: PatientBrief, capabilities: RequiredCapability[], createdBy: string) { return referralService.createReferral(patient, capabilities, createdBy) },
    async send(id, hospitalId) { referralService.sendReferral(id, hospitalId); return getReferral(id) },
    async routeToClinical(id) { referralService.routeToClinical(id); return getReferral(id) },
    async requestInformation(id, notes) { referralService.requestInformation(id, notes); return getReferral(id) },
    async timeout(id) { referralService.timeoutReferral(id); return getReferral(id) },
    async accept(id, overrideAcknowledged, overrideNotes) { referralService.acceptReferral(id, overrideAcknowledged, overrideNotes); return getReferral(id) },
    async confirm(id) { referralService.confirmReferral(id); return getReferral(id) },
    async decline(id, reason) { referralService.declineReferral(id, reason); return getReferral(id) },
    async arrive(id) { referralService.markArrived(id); return getReferral(id) },
    async complete(id) { referralService.completeReferral(id); return getReferral(id) },
  },
  hospitals: {
    async list() { return getDb().hospitals },
    async get(id) { const hospital = getDb().getHospitalById(id); if (!hospital) throw new AppError('NOT_FOUND', 'Hospital was not found.', 404); return hospital },
    async verifyCapability(hospitalId, capabilityId, status: VerificationStatus) { if (!getDb().updateCapability(hospitalId, capabilityId, status)) throw new AppError('NOT_FOUND', 'Capability was not found.', 404); const hospital = getDb().getHospitalById(hospitalId); if (!hospital) throw new AppError('NOT_FOUND', 'Hospital was not found.', 404); return hospital },
    async updateBedAvailability(hospitalId, bedId, availableBeds, occupiedBeds) {
      if (!getDb().updateBedAvailability(hospitalId, bedId, availableBeds, occupiedBeds)) throw new AppError('VALIDATION_ERROR', 'Invalid bed availability update.', 400)
      const hospital = getDb().getHospitalById(hospitalId)
      if (!hospital) throw new AppError('NOT_FOUND', 'Hospital was not found.', 404)
      return hospital
    },
  },
  blood: {
    async list(hospitalId?: string) {
      return getDb().getBloodInventory(hospitalId)
    },
    async getRelevant(bloodGroup) {
      return getDb().getBloodInventory().filter((item) => item.bloodGroup === bloodGroup)
    },
  },
  specialists: {
    async list(hospitalId?: string) {
      return getDb().getSpecialists(hospitalId)
    },
    async getForDoctor(doctorId: string) {
      return getDb().getSpecialistByDoctorId(doctorId)
    },
  },
  notifications: {
    async list(userId) { return getDb().notificationsFor(userId) },
    async markRead(id) { getDb().markNotificationRead(id) },
  },
  audit: { async list() { return getDb().auditEvents } },
}
