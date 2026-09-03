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
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    user.hospitalId || 'H001'
  )

  const currentHospital =
    HOSPITALS.find((h) => h.id === selectedHospitalId) || HOSPITALS[0]

  return (
    <HospitalPortalLayout
      user={user}
      activeView={activeView}
      onSelectView={setActiveView}
      onLogout={onLogout}
      globalSearchQuery={globalSearchQuery}
      onGlobalSearchChange={setGlobalSearchQuery}
      selectedHospitalId={selectedHospitalId}
      onSelectHospitalId={setSelectedHospitalId}
    >
      {activeView === 'dashboard' && (
        <HospitalDashboard
          hospital={currentHospital}
          onNavigate={(v) => setActiveView(v as HospitalViewTab)}
        />
      )}

      {activeView === 'referrals' && <HospitalReferralsView />}

      {activeView === 'patients' && <HospitalPatientsView />}

      {activeView === 'admissions' && <HospitalAdmissionsView />}

      {activeView === 'beds' && <HospitalBedsCapacityView />}

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
