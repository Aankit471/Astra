/**
 * ASTRA Domain Types
 * All core data models. These are the contracts between
 * the UI and the service layer (mock or real).
 */

// ── Enums ──────────────────────────────────────────────────────────────────

export type VerificationStatus =
  | 'VERIFIED'
  | 'SELF_REPORTED'
  | 'INFERRED'
  | 'STALE'

export type ReferralStatus =
  | 'CREATED'
  | 'MATCHING'
  | 'CONTACTING'
  | 'WAITING_FOR_RESPONSE'
  | 'PENDING'
  | 'MATCHED'
  | 'SENT'
  | 'REVIEWING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'ESCALATED'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED'

export type EscalationReason =
  | 'NO_RESPONSE'
  | 'DECLINED_ALL'
  | 'TIMEOUT'
  | 'MANUAL'

export type DeclineReason =
  | 'NO_CAPACITY'
  | 'CAPABILITY_UNAVAILABLE'
  | 'SPECIALIST_UNAVAILABLE'
  | 'ICU_FULL'
  | 'EQUIPMENT_UNAVAILABLE'
  | 'OTHER'

export type EmergencyCategory =
  | 'CARDIAC'
  | 'TRAUMA'
  | 'NEURO'
  | 'RESPIRATORY'
  | 'OBSTETRIC'
  | 'PAEDIATRIC'
  | 'BURNS'
  | 'TOXICOLOGY'
  | 'RENAL'
  | 'ONCOLOGY'
  | 'ORTHOPAEDIC'
  | 'VASCULAR'
  | 'OTHER'

export type CapabilityCategory =
  | 'EMERGENCY'
  | 'SPECIALIZATION'
  | 'CLINICAL_SERVICES'
  | 'EQUIPMENT'
  | 'CRITICAL_CARE'
  | 'DIAGNOSTICS'
  | 'BLOOD_TRANSFUSION'
  | 'DRUGS'
  | 'INFRASTRUCTURE'

export type HospitalType =
  | 'GOVERNMENT'
  | 'PRIVATE'
  | 'TRUST'
  | 'MISSION'

export type PatientSex = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'

export type UrgencyLevel = 'IMMEDIATE' | 'URGENT' | 'SEMI_URGENT'

// ── Location ───────────────────────────────────────────────────────────────

export interface GeoLocation {
  lat: number
  lng: number
}

export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

// ── Capability ─────────────────────────────────────────────────────────────

export interface CapabilityRecord {
  id: string
  category: CapabilityCategory
  item: string
  label: string
  available: boolean
  quantity?: number
  notes?: string
  verificationStatus: VerificationStatus
  verifiedBy?: string
  dataSource?: string
  lastUpdated: string // ISO 8601
}

export interface HospitalCapabilities {
  emergencyCategories: EmergencyCategory[]
  capabilities: CapabilityRecord[]
  icuBeds?: {
    total: number
    available: number
    verificationStatus: VerificationStatus
    lastUpdated: string
  }
  ventilators?: {
    total: number
    available: number
    verificationStatus: VerificationStatus
    lastUpdated: string
  }
  overallVerificationStatus: VerificationStatus
  lastAuditDate?: string
  beds?: BedAvailability[]
}

// ── Bed Availability ─────────────────────────────────────────────────────────

export type BedCategory =
  | 'GENERAL'
  | 'EMERGENCY'
  | 'ICU'
  | 'HDU'
  | 'CRITICAL_CARE'
  | 'ISOLATION'
  | 'MATERNITY'
  | 'PEDIATRIC'
  | 'TRAUMA'
  | 'PRIVATE'
  | 'SEMI_PRIVATE'
  | 'OTHER'

export type RoomType = 'PRIVATE' | 'SHARED'
export type ComfortType = 'AC' | 'NON_AC'
export type ClinicalSupportType = 'STANDARD' | 'MONITORED' | 'VENTILATOR_SUPPORTED'

export type AvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNKNOWN' | 'STALE'

export interface BedAvailability {
  id: string
  hospitalId: string
  category: BedCategory
  roomType: RoomType
  comfort: ComfortType
  clinicalSupport: ClinicalSupportType
  totalBeds: number
  occupiedBeds: number
  availableBeds: number
  reservedBeds?: number
  availabilityStatus: AvailabilityStatus
  verificationStatus: VerificationStatus
  lastUpdatedAt: string // ISO 8601
  source: string
  notes?: string
  chargePerDay?: number // in INR (₹)
  chargeFormatted?: string // e.g. "₹3,500 / day"
}


// ── Hospital ───────────────────────────────────────────────────────────────

export interface Hospital {
  id: string
  name: string
  shortName?: string
  type: HospitalType
  location: GeoLocation
  address: Address
  phone: string
  emergencyPhone?: string
  email?: string
  capabilities: HospitalCapabilities
  verificationStatus: VerificationStatus
  lastUpdated: string // ISO 8601
  isActive: boolean
  operationalStatus?: HospitalOperationalStatus
  registeredAt: string
}

export type HospitalOperationalStatus = 'OPERATIONAL' | 'CAPACITY_WARNING' | 'OVERLOADED' | 'DIVERTING'

// ── Personnel & Clinical Specialists ────────────────────────────────────────

export type DoctorOperationalStatus = 'AVAILABLE' | 'ON_CALL' | 'BUSY' | 'UNAVAILABLE' | 'UNKNOWN'

export interface Doctor {
  id: string
  name: string
  specialization: string[]
  qualifications: string[]
  hospitalId: string
  isAvailable: boolean
  contactPhone?: string
  doctorCode?: string
  department?: string
  status?: DoctorOperationalStatus
}

export interface SpecialistTeamMember {
  id: string
  doctorId: string
  doctorCode: string
  doctorName: string
  specialty: string
  department: string
  hospitalId: string
  hospitalName: string
  status: DoctorOperationalStatus
  lastUpdated: string
  isAvailable: boolean
  notes?: string
}

// ── Blood Inventory ─────────────────────────────────────────────────────────

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export type BloodComponent =
  | 'WHOLE_BLOOD'
  | 'PACKED_RBC'
  | 'FFP'
  | 'PLATELETS'
  | 'CRYOPRECIPITATE'

export type BloodAvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNKNOWN' | 'STALE'

export interface BloodInventoryItem {
  id: string
  hospitalId: string
  hospitalName: string
  bloodGroup: BloodGroup
  component: BloodComponent
  availableUnits: number
  status: BloodAvailabilityStatus
  lastUpdated: string
  freshness: 'CURRENT' | 'RECENT' | 'STALE' | 'UNKNOWN'
  source: string
  verificationStatus: VerificationStatus
  notes?: string
}

// ── Referral ───────────────────────────────────────────────────────────────

export interface PatientBrief {
  /** Never store real PII in mock data — use anonymised identifiers */
  referenceCode: string
  age: number
  sex: PatientSex
  chiefComplaint: string
  emergencyCategory: EmergencyCategory
  urgencyLevel: UrgencyLevel
  vitalSummary?: string
  relevantHistory?: string
  currentFacility?: string
  referringDoctor?: string
  /** Strictly explicit, never inferred automatically from diagnosis or symptoms */
  bloodGroup?: BloodGroup
}

export interface RequiredCapability {
  capabilityItem: string
  label: string
  isMandatory: boolean
  notes?: string
}

export interface ReferralTimelineEvent {
  id: string
  timestamp: string // ISO 8601
  event: string
  actor?: string
  actorRole?: string
  facilityId?: string
  facilityName?: string
  notes?: string
  isSystemEvent: boolean
}

export interface ReferralDecision {
  type: 'ACCEPT' | 'DECLINE' | 'INFO_REQUEST'
  decidedBy: string
  decidedAt: string
  declineReason?: DeclineReason
  declineNotes?: string
  infoRequest?: string
}

export interface Referral {
  id: string
  status: ReferralStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  patient: PatientBrief
  requiredCapabilities: RequiredCapability[]
  matchedFacilities: string[] // Hospital IDs
  attemptedFacilityIds?: string[]
  sentToFacilityId?: string
  sentToFacilityName?: string
  confirmedFacilityId?: string
  confirmedFacilityName?: string
  decision?: ReferralDecision
  escalationReason?: EscalationReason
  escalatedAt?: string
  responseDeadline: string // ISO 8601 — when escalation triggers
  arrivedAt?: string
  timeline: ReferralTimelineEvent[]
  assignedDoctorId?: string
  notes?: string
  unresolvedExhausted?: boolean
  infoRequested?: boolean
  infoRequestedNotes?: string
  clinicalOverride?: boolean
  clinicalOverrideNotes?: string
  // Prompt #20 Clinical Command Center fields:
  requiredSpecialty?: string
  assignedSpecialty?: string
  assignedDepartment?: string
  assignedDoctorName?: string
  assignedDoctorCode?: string
  assignedTeam?: string
  consultingSpecialties?: string[]
}

// ── Notifications ──────────────────────────────────────────────────────────

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS'
export type NotificationType =
  | 'NEW_REFERRAL' | 'CLINICAL_REVIEW_REQUIRED' | 'REFERRAL_DECLINED'
  | 'REFERRAL_ESCALATED' | 'REFERRAL_ACCEPTED' | 'REFERRAL_CONFIRMED'
  | 'PATIENT_ARRIVED' | 'CAPABILITY_VERIFICATION_REQUIRED'
  | 'CAPABILITY_DATA_STALE' | 'SYSTEM_ALERT'

export interface Notification {
  id: string
  type?: NotificationType
  title: string
  body: string
  severity: NotificationSeverity
  isRead: boolean
  readAt?: string
  recipientRole?: string
  recipientId?: string
  createdAt: string
  referralId?: string
  hospitalId?: string
  actionLabel?: string
  actionPath?: string
}

// ── Audit ──────────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string
  timestamp: string
  action: string
  actorId: string
  actorName: string
  actorRole: string
  targetType: 'REFERRAL' | 'HOSPITAL' | 'USER' | 'SYSTEM'
  targetId: string
  targetLabel: string
  details?: Record<string, unknown>
  ipAddress?: string
}

// ── Escalation ─────────────────────────────────────────────────────────────

export interface Escalation {
  id: string
  referralId: string
  reason: EscalationReason
  escalatedAt: string
  resolvedAt?: string
  isResolved: boolean
  attemptedFacilities: Array<{
    facilityId: string
    facilityName: string
    declinedAt?: string
    declineReason?: DeclineReason
  }>
  adminNotes?: string
}
