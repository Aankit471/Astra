import { useState, useEffect } from 'react'
import type { AuthUser } from '@/types/auth'
import {
  DoctorPortalLayout,
  type DoctorViewTab,
} from './DoctorPortalLayout'
import { DoctorDashboard } from './DoctorDashboard'
import { DoctorPatientsView } from './DoctorPatientsView'
import { DoctorPatientDetailModal } from './DoctorPatientDetailModal'
import { DoctorReferralsView } from './DoctorReferralsView'
import { DoctorReferralReviewModal } from './DoctorReferralReviewModal'
import { DoctorClinicalReviewsView } from './DoctorClinicalReviewsView'
import { DoctorTasksView } from './DoctorTasksView'
import { DoctorScheduleView } from './DoctorScheduleView'
import { DoctorMedicalRecordsView } from './DoctorMedicalRecordsView'
import { DoctorMessagesView } from './DoctorMessagesView'
import { DoctorNotificationsView } from './DoctorNotificationsView'
import { DoctorProfileView } from './DoctorProfileView'
import { DoctorGlobalSearchModal } from './DoctorGlobalSearchModal'
import {
  MOCK_DOCTOR_PATIENTS,
  type DoctorPatient,
} from '@/data/doctorData'
import { useAppStore } from '@/store/appStore'
import type { Referral } from '@/types/domain'

interface DoctorPortalContainerProps {
  user: AuthUser
  onLogout: () => void
}

export function DoctorPortalContainer({
  user,
  onLogout,
}: DoctorPortalContainerProps) {
  const [activeView, setActiveView] = useState<DoctorViewTab>('dashboard')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null)
  const [selectedReviewReferral, setSelectedReviewReferral] = useState<Referral | null>(null)

  const referrals = useAppStore((state) => state.referrals)
  const acceptReferral = useAppStore((state) => state.acceptReferral)
  const declineReferral = useAppStore((state) => state.declineReferral)
  const requestInformation = useAppStore((state) => state.requestInformation)

  // Global keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOpenPatientDetail = (patient: DoctorPatient) => {
    setSelectedPatient(patient)
  }

  const handleOpenReviewModal = (_reviewId: string) => {
    const foundRef = referrals[0]
    if (foundRef) {
      setSelectedReviewReferral(foundRef)
    } else {
      setActiveView('reviews')
    }
  }

  const handleAcceptReview = (id: string, notes?: string) => {
    acceptReferral(id, true, notes || 'Accepted by Dr. Sarah Jenkins')
  }

  const handleRejectReview = (id: string, _reason: string) => {
    declineReferral(id, 'CAPACITY_FULL')
  }

  const handleEscalateReview = (_id: string, _reason: string) => {
    // Escalation logged
  }

  const handleRequestInfoReview = (id: string, notes: string) => {
    requestInformation(id, notes)
  }

  return (
    <DoctorPortalLayout
      user={user}
      activeView={activeView}
      onSelectView={setActiveView}
      onLogout={onLogout}
      onOpenGlobalSearch={() => setIsSearchOpen(true)}
    >
      {/* ── View Router ──────────────────────────────────────────────── */}
      {activeView === 'dashboard' && (
        <DoctorDashboard
          onNavigate={(view) => setActiveView(view as DoctorViewTab)}
          onOpenPatient={handleOpenPatientDetail}
          onOpenReviewModal={handleOpenReviewModal}
        />
      )}

      {activeView === 'patients' && <DoctorPatientsView />}

      {activeView === 'referrals' && <DoctorReferralsView />}

      {activeView === 'reviews' && <DoctorClinicalReviewsView />}

      {activeView === 'tasks' && (
        <DoctorTasksView
          onNavigateToPatient={(_id) => {
            const p = MOCK_DOCTOR_PATIENTS[0]
            if (p) setSelectedPatient(p)
          }}
          onNavigateToReferral={(_id) => {
            setActiveView('referrals')
          }}
        />
      )}

      {activeView === 'schedule' && <DoctorScheduleView />}

      {activeView === 'records' && <DoctorMedicalRecordsView />}

      {activeView === 'messages' && <DoctorMessagesView />}

      {activeView === 'notifications' && <DoctorNotificationsView />}

      {activeView === 'profile' && <DoctorProfileView />}

      {/* ── Global Modals ────────────────────────────────────────────── */}
      <DoctorGlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPatient={(p) => {
          setSelectedPatient(p)
        }}
        onSelectReview={(revId) => {
          handleOpenReviewModal(revId)
        }}
        onNavigateView={(view) => {
          setActiveView(view as DoctorViewTab)
        }}
      />

      {selectedPatient && (
        <DoctorPatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {selectedReviewReferral && (
        <DoctorReferralReviewModal
          referral={selectedReviewReferral}
          onClose={() => setSelectedReviewReferral(null)}
          onAccept={handleAcceptReview}
          onReject={handleRejectReview}
          onEscalate={handleEscalateReview}
          onRequestInfo={handleRequestInfoReview}
        />
      )}
    </DoctorPortalLayout>
  )
}
