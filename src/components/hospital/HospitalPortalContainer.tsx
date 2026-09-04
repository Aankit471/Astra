import { useState } from 'react'
import type { AuthUser } from '@/types/auth'
import { HOSPITALS } from '@/data/hospitals'
import {
  HospitalPortalLayout,
  type HospitalViewTab,
} from './HospitalPortalLayout'
import { HospitalDashboard } from './HospitalDashboard'
import { HospitalReferralsView } from './HospitalReferralsView'
import { HospitalPatientsView } from './HospitalPatientsView'
import { HospitalAdmissionsView } from './HospitalAdmissionsView'
import { HospitalBedsCapacityView } from './HospitalBedsCapacityView'
import { HospitalWardsView } from './HospitalWardsView'
import { HospitalTransfersView } from './HospitalTransfersView'
import { HospitalClinicalCoordinationView } from './HospitalClinicalCoordinationView'
import { HospitalTasksView } from './HospitalTasksView'
import { HospitalEscalationsView } from './HospitalEscalationsView'
import { HospitalStaffView } from './HospitalStaffView'
import { HospitalFacilityView } from './HospitalFacilityView'
import { HospitalReportsView } from './HospitalReportsView'
import { HospitalNotificationsView } from './HospitalNotificationsView'
import { HospitalSettingsView } from './HospitalSettingsView'

interface HospitalPortalContainerProps {
  user: AuthUser
  onLogout: () => void
}

export function HospitalPortalContainer({
  user,
  onLogout,
}: HospitalPortalContainerProps) {
  const [activeView, setActiveView] = useState<HospitalViewTab>('dashboard')
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')

  // Hospital-Specific Data Isolation:
  // Hospital Operations role is strictly locked to their assigned hospitalId.
  const assignedHospitalId = user.hospitalId || 'H001'
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(assignedHospitalId)

  // Guarantee that Hospital Operations operator cannot escape their assigned hospital
  const effectiveHospitalId = user.role === 'HOSPITAL_OPS' ? assignedHospitalId : selectedHospitalId

  const currentHospital =
    HOSPITALS.find((h) => h.id === effectiveHospitalId) || HOSPITALS[0]

  return (
    <HospitalPortalLayout
      user={user}
      activeView={activeView}
      onSelectView={setActiveView}
      onLogout={onLogout}
      globalSearchQuery={globalSearchQuery}
      onGlobalSearchChange={setGlobalSearchQuery}
      selectedHospitalId={effectiveHospitalId}
      onSelectHospitalId={setSelectedHospitalId}
    >
      {activeView === 'dashboard' && (
        <HospitalDashboard
          hospital={currentHospital}
          user={user}
          onNavigate={(v) => setActiveView(v as HospitalViewTab)}
        />
      )}

      {activeView === 'referrals' && (
        <HospitalReferralsView hospitalId={effectiveHospitalId} user={user} />
      )}

      {activeView === 'patients' && <HospitalPatientsView />}

      {activeView === 'admissions' && <HospitalAdmissionsView />}

      {activeView === 'beds' && (
        <HospitalBedsCapacityView hospitalId={effectiveHospitalId} user={user} />
      )}

      {activeView === 'wards' && <HospitalWardsView />}

      {activeView === 'transfers' && <HospitalTransfersView />}

      {activeView === 'clinical' && <HospitalClinicalCoordinationView />}

      {activeView === 'tasks' && <HospitalTasksView />}

      {activeView === 'escalations' && <HospitalEscalationsView />}

      {activeView === 'staff' && <HospitalStaffView />}

      {activeView === 'facility' && <HospitalFacilityView />}

      {activeView === 'reports' && <HospitalReportsView />}

      {activeView === 'notifications' && <HospitalNotificationsView />}

      {activeView === 'settings' && <HospitalSettingsView />}
    </HospitalPortalLayout>
  )
}
