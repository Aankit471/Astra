import type { AuthUser } from '@/types/auth'
import { ROLE_PERMISSIONS } from '@/types/auth'

export const MOCK_USERS: AuthUser[] = [
  {
    id: 'ops-001',
    name: 'Sarah Jenkins',
    email: 'ops@astra.demo',
    role: 'HOSPITAL_OPS',
    hospitalId: 'H001',
    hospitalName: 'Apollo General Hospital',
    avatarInitials: 'SJ',
    permissions: ROLE_PERMISSIONS.HOSPITAL_OPS,
  },
  {
    id: 'doc-001',
    name: 'Dr. Ananya Mehta',
    email: 'doctor@astra.demo',
    role: 'DOCTOR',
    hospitalId: 'H001',
    hospitalName: 'Apollo General Hospital',
    doctorCode: 'DOC-2048',
    specialty: 'Cardiology',
    department: 'Emergency Cardiac Care',
    doctorStatus: 'AVAILABLE',
    avatarInitials: 'AM',
    permissions: ROLE_PERMISSIONS.DOCTOR,
  },
  {
    id: 'doc-002',
    name: 'Dr. Suresh Menon',
    email: 'doctor2@astra.demo',
    role: 'DOCTOR',
    hospitalId: 'H002',
    hospitalName: 'Government District Hospital',
    doctorCode: 'DOC-2050',
    specialty: 'Orthopedics',
    department: 'Orthopedic Emergency',
    doctorStatus: 'AVAILABLE',
    avatarInitials: 'SM',
    permissions: ROLE_PERMISSIONS.DOCTOR,
  },
  {
    id: 'doc-003',
    name: 'Dr. Vikram Rao',
    email: 'doctor3@astra.demo',
    role: 'DOCTOR',
    hospitalId: 'H001',
    hospitalName: 'Apollo General Hospital',
    doctorCode: 'DOC-2049',
    specialty: 'Neurology',
    department: 'Emergency Neurology Unit',
    doctorStatus: 'AVAILABLE',
    avatarInitials: 'VR',
    permissions: ROLE_PERMISSIONS.DOCTOR,
  },
  {
    id: 'admin-001',
    name: 'Vikram Nair',
    email: 'admin@astra.demo',
    role: 'ADMIN',
    avatarInitials: 'VN',
    permissions: ROLE_PERMISSIONS.ADMIN,
  },
]

export const MOCK_PASSWORDS: Record<string, string> = {
  'ops@astra.demo':     'ops1234',
  'doctor@astra.demo':  'doc1234',
  'doctor2@astra.demo': 'doc1234',
  'doctor3@astra.demo': 'doc1234',
  'admin@astra.demo':   'admin1234',
}

export const DEMO_CREDENTIALS = [
  { label: 'Hospital Operations',      email: 'ops@astra.demo',     password: 'ops1234',   role: 'HOSPITAL_OPS' as const },
  { label: 'Doctor / Clinical Portal', email: 'doctor@astra.demo',  password: 'doc1234',   role: 'DOCTOR' as const },
  { label: 'ASTRA Admin',              email: 'admin@astra.demo',   password: 'admin1234', role: 'ADMIN' as const },
]
