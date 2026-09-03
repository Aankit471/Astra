import type { AuthUser } from '@/types/auth'
import type {
  BloodGroup,
  BloodInventoryItem,
  PatientBrief,
  Referral,
  SpecialistTeamMember,
} from '@/types/domain'
import { MOCK_BLOOD_INVENTORY } from '@/data/bloodInventory'
import { MOCK_SPECIALISTS } from '@/data/specialists'

/**
 * Doctor Clinical Command Center Service
 *
 * PRIVACY & RBAC ARCHITECTURE NOTE:
 * Doctors MUST NOT have unrestricted global access to all private patients across the platform.
 * Patient lists and clinical review actions are strictly scoped to:
 * 1. The doctor's affiliated hospital (doctor.hospitalId)
 * 2. Directly assigned patients (assignedDoctorId / assignedDoctorCode)
 * 3. Authorized clinical team / department queue (assignedDepartment)
 * 4. Cases requesting or matching the doctor's specialty (requiredSpecialty / consultingSpecialties)
 *
 * CRITICAL CODE DIRECTIVE:
 * "Production backend must enforce patient-level authorization."
 */

export interface DoctorClinicalProfile {
  id: string
  name: string
  doctorCode: string
  specialty: string
  department: string
  hospitalId: string
  hospitalName: string
  status: string
  role: string
  avatarInitials: string
}

export function getDoctorProfile(user: AuthUser): DoctorClinicalProfile {
  return {
    id: user.id,
    name: user.name,
    doctorCode: user.doctorCode || 'DOC-2048',
    specialty: user.specialty || 'Cardiology',
    department: user.department || 'Emergency Cardiac Care',
    hospitalId: user.hospitalId || 'H001',
    hospitalName: user.hospitalName || 'Apollo General Hospital',
    status: user.doctorStatus || 'AVAILABLE',
    role: 'Authorized Clinical Reviewer',
    avatarInitials: user.avatarInitials || 'DR',
  }
}

/**
 * Checks if the logged-in doctor is authorized to access a given referral.
 * Production backend must enforce patient-level authorization.
 */
export function canDoctorAccessReferral(user: AuthUser, referral: Referral): boolean {
  if (user.role === 'ADMIN') return true

  // 1. Doctor has access if directly assigned to this referral
  if (referral.assignedDoctorId === user.id) return true
  if (user.doctorCode && referral.assignedDoctorCode === user.doctorCode) return true

  // 2. Case must be associated with the doctor's hospital
  const hospitalMatch =
    referral.sentToFacilityId === user.hospitalId ||
    referral.confirmedFacilityId === user.hospitalId ||
    referral.timeline.some((t) => t.facilityId === user.hospitalId)

  if (!hospitalMatch) return false

  // 3. Belongs to the same department / clinical team
  if (user.department && referral.assignedDepartment === user.department) return true

  // 4. Case requires or consults doctor's specialty at this facility
  if (user.specialty) {
    if (referral.requiredSpecialty?.toLowerCase() === user.specialty.toLowerCase()) return true
    if (referral.assignedSpecialty?.toLowerCase() === user.specialty.toLowerCase()) return true
    if (referral.consultingSpecialties?.some((s) => s.toLowerCase() === user.specialty!.toLowerCase()))
      return true
  }

  // 5. In emergency triage without explicit doctor assignment yet, matching specialty
  const hasCategoryMatch =
    (user.specialty === 'Cardiology' && referral.patient.emergencyCategory === 'CARDIAC') ||
    (user.specialty === 'Neurology' && referral.patient.emergencyCategory === 'NEURO') ||
    (user.specialty === 'Trauma' && referral.patient.emergencyCategory === 'TRAUMA') ||
    (user.specialty === 'Obstetrics & Gynecology' && referral.patient.emergencyCategory === 'OBSTETRIC') ||
    (user.specialty === 'Orthopedics' && referral.patient.emergencyCategory === 'TRAUMA')

  return Boolean(hasCategoryMatch)
}

/**
 * Filters the active referrals into the authorized doctor clinical queue.
 * Production backend must enforce patient-level authorization.
 */
export function getScopedDoctorReferrals(user: AuthUser, referrals: Referral[]): Referral[] {
  return referrals.filter((referral) => canDoctorAccessReferral(user, referral))
}

/**
 * Returns relevant blood inventory across hospitals for a patient's verified blood group.
 * SAFETY RULE: Blood group is strictly read from structured data, never inferred.
 * Transfusion indications require physician evaluation.
 */
export function getRelevantBloodForPatient(
  patient: PatientBrief,
  inventory: BloodInventoryItem[] = MOCK_BLOOD_INVENTORY
): {
  patientBloodGroup?: BloodGroup
  relevantStock: BloodInventoryItem[]
  hasVerifiedNeed: boolean
} {
  if (!patient.bloodGroup) {
    return {
      patientBloodGroup: undefined,
      relevantStock: [],
      hasVerifiedNeed: false,
    }
  }

  const bloodGroup = patient.bloodGroup
  const relevantStock = inventory.filter((item) => item.bloodGroup === bloodGroup)

  return {
    patientBloodGroup: bloodGroup,
    relevantStock,
    hasVerifiedNeed: true,
  }
}

/**
 * Returns blood inventory items with optional filtering
 */
export function getBloodInventory(
  filters?: {
    hospitalId?: string
    bloodGroup?: BloodGroup
    component?: string
    status?: string
  },
  inventory: BloodInventoryItem[] = MOCK_BLOOD_INVENTORY
): BloodInventoryItem[] {
  return inventory.filter((item) => {
    if (filters?.hospitalId && filters.hospitalId !== 'ALL' && item.hospitalId !== filters.hospitalId)
      return false
    if (filters?.bloodGroup && filters.bloodGroup !== ('ALL' as unknown) && item.bloodGroup !== filters.bloodGroup)
      return false
    if (filters?.component && filters.component !== 'ALL' && item.component !== filters.component)
      return false
    if (filters?.status && filters.status !== 'ALL' && item.status !== filters.status)
      return false
    return true
  })
}

/**
 * Returns the specialist clinical roster for a facility
 */
export function getHospitalSpecialists(
  hospitalId: string,
  roster: SpecialistTeamMember[] = MOCK_SPECIALISTS
): SpecialistTeamMember[] {
  return roster.filter((member) => member.hospitalId === hospitalId)
}
