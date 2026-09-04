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
    status: user.doctorStatus || 'ON_CALL',
    role: 'Authorized Clinical Reviewer',
    avatarInitials: user.avatarInitials || 'DR',
  }
}

/**
 * Checks if the logged-in doctor is authorized to access a given referral.
 * Production backend must enforce patient-level authorization.
 *
 * Supported Specialties (Prompt #22):
 * - Cardiology
 * - Neurology
 * - Trauma Surgery
 * - Critical Care
 * - Emergency Medicine
 */
export function canDoctorAccessReferral(user: AuthUser, referral: Referral): boolean {
  if (user.role === 'ADMIN') return true

  // 1. Doctor has access if directly assigned to this referral
  if (referral.assignedDoctorId === user.id) return true
  if (user.doctorCode && referral.assignedDoctorCode === user.doctorCode) return true

  // 2. Strict hospital isolation: case must be associated with the doctor's hospital
  const hospitalId = user.hospitalId || 'H001'
  const hospitalMatch =
    referral.sentToFacilityId === hospitalId ||
    referral.confirmedFacilityId === hospitalId ||
    (referral.timeline && referral.timeline.some((t) => t.facilityId === hospitalId))

  if (!hospitalMatch) return false

  // 3. Belongs to the same department / clinical team
  if (user.department && referral.assignedDepartment === user.department) return true

  // 4. Case requires or consults doctor's specialty at this facility
  const userSpecialty = (user.specialty || 'Cardiology').trim().toLowerCase()
  if (referral.requiredSpecialty && referral.requiredSpecialty.trim().toLowerCase() === userSpecialty) return true
  if (referral.assignedSpecialty && referral.assignedSpecialty.trim().toLowerCase() === userSpecialty) return true
  if (referral.consultingSpecialties && referral.consultingSpecialties.some((s) => s.trim().toLowerCase() === userSpecialty))
    return true

  // 5. Emergency specialty category and condition routing:
  const category = (referral.patient.emergencyCategory || '').toUpperCase()
  const complaint = (referral.patient.chiefComplaint || '').toLowerCase()

  // Cardiology doctor: STEMI, ACS, cardiogenic shock, cardiac emergency cases
  if (userSpecialty.includes('cardio')) {
    if (category === 'CARDIAC') return true
    if (complaint.includes('stemi') || complaint.includes('acs') || complaint.includes('cardiogenic') || complaint.includes('chest pain') || complaint.includes('infarction')) {
      return true
    }
  }

  // Neurology doctor: stroke, neuro-trauma, seizure-related emergency, neurological emergencies
  if (userSpecialty.includes('neuro')) {
    if (category === 'NEURO') return true
    if (complaint.includes('stroke') || complaint.includes('seizure') || complaint.includes('altered sensorium') || complaint.includes('paralysis') || complaint.includes('hemorrhage')) {
      return true
    }
  }

  // Trauma Surgery doctor: polytrauma, major injuries, trauma cases
  if (userSpecialty.includes('trauma') || userSpecialty.includes('ortho')) {
    if (category === 'TRAUMA') return true
    if (complaint.includes('polytrauma') || complaint.includes('fracture') || complaint.includes('injury') || complaint.includes('accident') || complaint.includes('amputation')) {
      return true
    }
  }

  // Critical Care doctor: septic shock, multi-organ failure, ICU-level critical cases
  if (userSpecialty.includes('critical') || userSpecialty.includes('icu') || userSpecialty.includes('respiratory')) {
    if (category === 'CRITICAL_CARE' || category === 'RESPIRATORY') return true
    if (complaint.includes('septic') || complaint.includes('multi-organ') || complaint.includes('ards') || complaint.includes('respiratory arrest') || complaint.includes('shock')) {
      return true
    }
  }

  // Emergency Medicine doctor: emergency triage and general emergency cases
  if (userSpecialty.includes('emergency') || userSpecialty.includes('general')) {
    return true
  }

  return false
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
