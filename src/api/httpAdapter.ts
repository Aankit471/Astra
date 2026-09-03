import { apiRequest } from './client'
import type { AstraApi, ReferralFilters } from './types'
import type { PatientBrief, RequiredCapability, VerificationStatus } from '@/types/domain'

const query = (filters?: ReferralFilters) => filters ? `?${new URLSearchParams(Object.entries(filters).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))}` : ''

export const httpApi: AstraApi = {
  auth: {
    login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
    currentSession: () => apiRequest('/auth/session'),
  },
  referrals: {
    list: (filters) => apiRequest(`/referrals${query(filters)}`),
    get: (id) => apiRequest(`/referrals/${id}`),
    create: (patient: PatientBrief, capabilities: RequiredCapability[], createdBy: string) => apiRequest('/referrals', { method: 'POST', body: JSON.stringify({ patient, requiredCapabilities: capabilities, createdBy }) }),
    send: (id, hospitalId) => apiRequest(`/referrals/${id}/send`, { method: 'POST', body: JSON.stringify({ hospitalId }) }),
    routeToClinical: (id, actorId) => apiRequest(`/referrals/${id}/route-to-clinical`, { method: 'POST', body: JSON.stringify({ actorId }) }),
    requestInformation: (id, notes, actorId) => apiRequest(`/referrals/${id}/request-information`, { method: 'POST', body: JSON.stringify({ notes, actorId }) }),
    timeout: (id, actorId) => apiRequest(`/referrals/${id}/timeout`, { method: 'POST', body: JSON.stringify({ actorId }) }),
    accept: (id, overrideAcknowledged, overrideNotes, actorId) => apiRequest(`/referrals/${id}/accept`, { method: 'POST', body: JSON.stringify({ overrideAcknowledged, overrideNotes, actorId }) }),
    confirm: (id, actorId) => apiRequest(`/referrals/${id}/confirm`, { method: 'POST', body: JSON.stringify({ actorId }) }),
    decline: (id, reason, actorId) => apiRequest(`/referrals/${id}/decline`, { method: 'POST', body: JSON.stringify({ reason, actorId }) }),
    arrive: (id, actorId) => apiRequest(`/referrals/${id}/arrive`, { method: 'POST', body: JSON.stringify({ actorId }) }),
    complete: (id, actorId) => apiRequest(`/referrals/${id}/complete`, { method: 'POST', body: JSON.stringify({ actorId }) }),
  },
  hospitals: {
    list: () => apiRequest('/hospitals'),
    get: (id) => apiRequest(`/hospitals/${id}`),
    verifyCapability: (hospitalId, capabilityId, status: VerificationStatus) => apiRequest(`/hospitals/${hospitalId}/capabilities/${capabilityId}/verification`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    updateBedAvailability: (hospitalId, bedId, availableBeds, occupiedBeds) => apiRequest(`/hospitals/${hospitalId}/beds/${bedId}`, { method: 'PATCH', body: JSON.stringify({ availableBeds, occupiedBeds }) }),
  },
  blood: {
    list: (hospitalId?: string) => apiRequest(`/blood-inventory${hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : ''}`),
    getRelevant: (bloodGroup) => apiRequest(`/blood-inventory/relevant?bloodGroup=${encodeURIComponent(bloodGroup)}`),
  },
  specialists: {
    list: (hospitalId?: string) => apiRequest(`/specialists${hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : ''}`),
    getForDoctor: (doctorId: string) => apiRequest(`/specialists/doctor/${encodeURIComponent(doctorId)}`),
  },
  notifications: {
    list: (userId) => apiRequest(`/notifications?userId=${encodeURIComponent(userId)}`),
    markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  },
  audit: { list: () => apiRequest('/audit-events') },
}
