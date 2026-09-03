/**
 * ASTRA Auth Types
 */

import type { DoctorOperationalStatus } from './domain'

export type UserRole =
  | 'USER'           // Patient / Referring Facility staff
  | 'HOSPITAL_OPS'   // Hospital Operations staff
  | 'DOCTOR'         // Clinical staff
  | 'ADMIN'          // ASTRA Platform Admin

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  hospitalId?: string   // set for HOSPITAL_OPS and DOCTOR
  hospitalName?: string
  avatarInitials?: string
  permissions: Permission[]
  doctorCode?: string       // e.g. 'DOC-2048'
  specialty?: string        // e.g. 'Cardiology'
  department?: string       // e.g. 'Emergency Cardiac Care'
  doctorStatus?: DoctorOperationalStatus
}

export type Permission =
  | 'referral:create'
  | 'referral:view'
  | 'referral:respond'
  | 'referral:escalate'
  | 'referral:view_all'
  | 'hospital:view'
  | 'hospital:manage'
  | 'hospital:verify'
  | 'audit:view'
  | 'admin:full'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: [
    'referral:create',
    'referral:view',
    'hospital:view',
  ],
  HOSPITAL_OPS: [
    'referral:view',
    'referral:respond',
    'hospital:view',
    'hospital:manage',
  ],
  DOCTOR: [
    'referral:view',
    'referral:respond',
    'hospital:view',
  ],
  ADMIN: [
    'referral:create',
    'referral:view',
    'referral:respond',
    'referral:escalate',
    'referral:view_all',
    'hospital:view',
    'hospital:manage',
    'hospital:verify',
    'audit:view',
    'admin:full',
  ],
}

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  USER:         '/user/emergency',
  HOSPITAL_OPS: '/hospital/dashboard',
  DOCTOR:       '/doctor/dashboard',
  ADMIN:        '/admin/dashboard',
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthSession {
  user: AuthUser
  token: string          // mock token — replace with real JWT
  expiresAt: string      // ISO 8601
}
