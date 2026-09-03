import type { AuthUser, UserRole } from '@/types/auth'

export type AstraPermission =
  | 'CREATE_REFERRAL' | 'VIEW_OWN_REFERRALS' | 'VIEW_INCOMING_REFERRALS'
  | 'ROUTE_TO_CLINICAL' | 'VIEW_CLINICAL_REFERRALS' | 'ACCEPT_REFERRAL'
  | 'DECLINE_REFERRAL' | 'REQUEST_MORE_INFORMATION' | 'CLINICAL_OVERRIDE'
  | 'VIEW_ALL_REFERRALS' | 'VIEW_ESCALATIONS' | 'VERIFY_CAPABILITY'
  | 'VIEW_AUDIT_LOG' | 'ADMIN_INTERVENTION' | 'MARK_ARRIVED' | 'COMPLETE_REFERRAL'

const ROLE_PERMISSIONS: Record<UserRole, readonly AstraPermission[]> = {
  USER: ['CREATE_REFERRAL', 'VIEW_OWN_REFERRALS'],
  HOSPITAL_OPS: ['VIEW_INCOMING_REFERRALS', 'ROUTE_TO_CLINICAL', 'MARK_ARRIVED', 'COMPLETE_REFERRAL'],
  DOCTOR: ['VIEW_CLINICAL_REFERRALS', 'ACCEPT_REFERRAL', 'DECLINE_REFERRAL', 'REQUEST_MORE_INFORMATION', 'CLINICAL_OVERRIDE'],
  ADMIN: ['VIEW_ALL_REFERRALS', 'VIEW_ESCALATIONS', 'VERIFY_CAPABILITY', 'VIEW_AUDIT_LOG', 'ADMIN_INTERVENTION'],
}

export function can(role: UserRole | null, permission: AstraPermission): boolean {
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false
}

export function canUser(user: AuthUser | null, permission: AstraPermission): boolean {
  return user ? can(user.role, permission) : false
}

export function assertPermission(user: AuthUser | null, permission: AstraPermission): void {
  if (!canUser(user, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}
