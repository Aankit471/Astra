import { Navigate } from 'react-router-dom'
import type { AuthUser } from '@/types/auth'

import { AdminSimulation } from '@/components/data-display/AdminSimulation'
import { AdminVerificationPanel } from '@/components/data-display/AdminVerificationPanel'
import { HospitalArrivals } from '@/components/data-display/HospitalArrivals'
import { BloodAvailabilityView } from '@/components/doctor/BloodAvailabilityView'

export function renderRouteView({
  view,
  role,
  user: _user,
}: {
  view: string
  role: AuthUser['role']
  user: AuthUser
}) {
  const normalizedView = view.toLowerCase().replace(/^\//, '')

  switch (normalizedView) {
    case 'simulation':
      if (role !== 'ADMIN') return <Navigate to="/unauthorized" replace />
      return <AdminSimulation />

    case 'arrivals':
    case 'incoming':
      if (role !== 'HOSPITAL_OPS' && role !== 'ADMIN') return <Navigate to="/unauthorized" replace />
      return <HospitalArrivals />

    case 'verification':
    case 'capabilities':
    case 'reliability':
      if (role !== 'ADMIN') return <Navigate to="/unauthorized" replace />
      return <AdminVerificationPanel />

    case 'blood':
    case 'blood-availability':
    case 'blood-inventory':
      return <BloodAvailabilityView />

    default:
      return null
  }
}
