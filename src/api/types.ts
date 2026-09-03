import type {
  AuditEvent,
  BloodGroup,
  BloodInventoryItem,
  Hospital,
  Notification,
  PatientBrief,
  Referral,
  RequiredCapability,
  SpecialistTeamMember,
  VerificationStatus,
} from '@/types/domain'
import type { AuthUser } from '@/types/auth'

export interface ApiSession { user: AuthUser; token: string; expiresAt: string }
export interface ApiResult<T> { data: T; requestId?: string }
export interface ReferralFilters { createdBy?: string; hospitalId?: string; doctorId?: string; status?: Referral['status'] }

export interface AstraApi {
  auth: { login(email: string, password: string): Promise<ApiSession>; logout(): Promise<void>; currentSession(): Promise<ApiSession | null> }
  referrals: {
    list(filters?: ReferralFilters): Promise<Referral[]>
    get(id: string): Promise<Referral>
    create(patient: PatientBrief, capabilities: RequiredCapability[], createdBy: string): Promise<Referral>
    send(id: string, hospitalId: string): Promise<Referral>
    routeToClinical(id: string, actorId?: string): Promise<Referral>
    requestInformation(id: string, notes: string, actorId?: string): Promise<Referral>
    timeout(id: string, actorId?: string): Promise<Referral>
    accept(id: string, overrideAcknowledged?: boolean, overrideNotes?: string, actorId?: string): Promise<Referral>
    confirm(id: string, actorId?: string): Promise<Referral>
    decline(id: string, reason: string, actorId?: string): Promise<Referral>
    arrive(id: string, actorId?: string): Promise<Referral>
    complete(id: string, actorId?: string): Promise<Referral>
  }
  hospitals: {
    list(): Promise<Hospital[]>
    get(id: string): Promise<Hospital>
    verifyCapability(hospitalId: string, capabilityId: string, status: VerificationStatus): Promise<Hospital>
    updateBedAvailability(hospitalId: string, bedId: string, availableBeds: number, occupiedBeds: number): Promise<Hospital>
  }
  blood: {
    list(hospitalId?: string): Promise<BloodInventoryItem[]>
    getRelevant(bloodGroup: BloodGroup): Promise<BloodInventoryItem[]>
  }
  specialists: {
    list(hospitalId?: string): Promise<SpecialistTeamMember[]>
    getForDoctor(doctorId: string): Promise<SpecialistTeamMember | undefined>
  }
  notifications: { list(userId: string): Promise<Notification[]>; markRead(id: string): Promise<void> }
  audit: { list(): Promise<AuditEvent[]> }
}

