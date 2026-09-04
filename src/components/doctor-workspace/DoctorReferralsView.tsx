import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  ArrowRight,
  Clock,
  Droplet,
  Hospital as HospitalIcon,
  MapPin,
  Search,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import type { Referral } from '@/types/domain'
import { useAppStore } from '@/store/appStore'
import { getDoctorProfile, getScopedDoctorReferrals } from '@/services/doctorService'
import { referralRepository } from '@/services/repositories/referralRepository'
import { useSupabaseRealtime } from '@/services/supabase/useSupabaseRealtime'
import { getRelativeTime } from '@/utils/freshness'
import { DoctorReferralReviewModal } from './DoctorReferralReviewModal'

interface DoctorReferralsViewProps {
  user: AuthUser
  onOpenReview?: (id: string) => void
}

const PRIORITY_RANK: Record<string, number> = {
  IMMEDIATE: 1,
  URGENT: 2,
  HIGH: 3,
  SEMI_URGENT: 3,
  ROUTINE: 4,
}

export function DoctorReferralsView({ user, onOpenReview }: DoctorReferralsViewProps) {
  const storeReferrals = useAppStore((state) => state.referrals)
  const [referrals, setReferrals] = useState<Referral[]>(storeReferrals)
  const [_loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'IMMEDIATE' | 'URGENT' | 'HIGH' | 'ROUTINE'>('ALL')
  const [stageFilter, setStageFilter] = useState<
    'ALL' | 'PENDING' | 'IN_REVIEW' | 'ACCEPTED' | 'ESCALATED'
  >('ALL')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('ALL')
  const [selectedReviewReferral, setSelectedReviewReferral] = useState<Referral | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const doctor = useMemo(() => getDoctorProfile(user), [user])

  const loadReferrals = useCallback(async () => {
    setLoading(true)
    try {
      const list = await referralRepository.list({ hospitalId: user.hospitalId })
      if (list && list.length > 0) {
        setReferrals(list)
      }
    } catch (err) {
      console.warn('Failed to load referrals from Supabase:', err)
    } finally {
      setLoading(false)
    }
  }, [user.hospitalId])

  useEffect(() => {
    loadReferrals()
  }, [loadReferrals])

  // Realtime hook
  useSupabaseRealtime(
    useCallback(() => {
      loadReferrals()
    }, [loadReferrals])
  )

  // RBAC scoped referrals
  const scopedReferrals = useMemo(
    () => getScopedDoctorReferrals(user, referrals),
    [user, referrals]
  )

  // Extract unique specialties from referrals
  const availableSpecialties = useMemo(() => {
    const s = new Set<string>()
    scopedReferrals.forEach((r) => {
      if (r.requiredSpecialty) s.add(r.requiredSpecialty)
      if (r.assignedSpecialty) s.add(r.assignedSpecialty)
    })
    return Array.from(s)
  }, [scopedReferrals])

  // Filtered and priority-sorted referrals
  const filteredReferrals = useMemo(() => {
    return scopedReferrals
      .filter((r) => {
        // Stage filter
        if (stageFilter === 'PENDING' && !['PENDING', 'CREATED', 'MATCHED'].includes(r.status)) return false
        if (stageFilter === 'IN_REVIEW' && r.status !== 'REVIEWING') return false
        if (stageFilter === 'ACCEPTED' && !['ACCEPTED', 'CONFIRMED'].includes(r.status)) return false
        if (stageFilter === 'ESCALATED' && !['ESCALATED', 'DECLINED'].includes(r.status)) return false

        // Priority filter
        if (priorityFilter === 'IMMEDIATE' && r.patient.urgencyLevel !== 'IMMEDIATE') return false
        if (priorityFilter === 'URGENT' && r.patient.urgencyLevel !== 'URGENT') return false
        if (priorityFilter === 'HIGH' && r.patient.urgencyLevel !== 'SEMI_URGENT' && (r.patient.urgencyLevel as any) !== 'HIGH') return false
        if (priorityFilter === 'ROUTINE' && (r.patient.urgencyLevel as any) !== 'ROUTINE') return false

        // Specialty filter
        if (specialtyFilter !== 'ALL') {
          const match =
            r.requiredSpecialty?.toLowerCase() === specialtyFilter.toLowerCase() ||
            r.assignedSpecialty?.toLowerCase() === specialtyFilter.toLowerCase()
          if (!match) return false
        }

        // Search by Patient reference or Referral ID
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const text = `${r.id} ${r.patient.referenceCode} ${r.patient.chiefComplaint} ${r.sentToFacilityName || ''}`.toLowerCase()
          if (!text.includes(q)) return false
        }

        return true
      })
      .sort((a, b) => {
        const rankA = PRIORITY_RANK[a.patient.urgencyLevel] || 99
        const rankB = PRIORITY_RANK[b.patient.urgencyLevel] || 99
        if (rankA !== rankB) return rankA - rankB
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      })
  }, [scopedReferrals, stageFilter, priorityFilter, specialtyFilter, searchQuery])

  const handleOpenModal = (r: Referral) => {
    if (onOpenReview) {
      onOpenReview(r.id)
    } else {
      setSelectedReviewReferral(r)
    }
  }

  const handleAccept = async (id: string, notes?: string) => {
    await referralRepository.recordDecision(
      id,
      { decision: 'ACCEPTED', notes: notes || `Clinically accepted by ${doctor.name}` },
      {
        id: user.id,
        name: user.name,
        specialty: doctor.specialty,
        doctorCode: doctor.doctorCode,
        hospitalId: user.hospitalId,
        hospitalName: doctor.hospitalName,
      }
    )
    setToastMessage(`Referral #${id} clinically accepted. Dedicated bed confirmed.`)
    loadReferrals()
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleReject = async (id: string, reason: string) => {
    await referralRepository.recordDecision(
      id,
      { decision: 'DECLINED', reason, notes: reason },
      {
        id: user.id,
        name: user.name,
        specialty: doctor.specialty,
        doctorCode: doctor.doctorCode,
        hospitalId: user.hospitalId,
        hospitalName: doctor.hospitalName,
      }
    )
    setToastMessage(`Referral #${id} declined: ${reason}`)
    loadReferrals()
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleEscalate = async (id: string, reason: string) => {
    await referralRepository.recordDecision(
      id,
      { decision: 'ESCALATED', reason, notes: reason, escalationReason: 'MANUAL' },
      {
        id: user.id,
        name: user.name,
        specialty: doctor.specialty,
        doctorCode: doctor.doctorCode,
        hospitalId: user.hospitalId,
        hospitalName: doctor.hospitalName,
      }
    )
    setToastMessage(`Referral #${id} escalated: ${reason}`)
    loadReferrals()
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleRequestInfo = async (id: string, notes: string) => {
    await referralRepository.recordDecision(
      id,
      { decision: 'INFO_REQUESTED', notes },
      {
        id: user.id,
        name: user.name,
        specialty: doctor.specialty,
        doctorCode: doctor.doctorCode,
        hospitalId: user.hospitalId,
        hospitalName: doctor.hospitalName,
      }
    )
    setToastMessage(`Information clarification requested for Referral #${id}`)
    loadReferrals()
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              PHYSICIAN CLINICAL QUEUE
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              SUPABASE BACKED
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Emergency Patient Review Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active patient transfers, urgent triage alerts, specialty routing, and diagnostic evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto text-xs">
          <span className="text-slate-400">Queue Total:</span>
          <strong className="text-teal-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {filteredReferrals.length} Cases
          </strong>
        </div>
      </div>

      {/* ── Mandatory Clinical Banner ─────────────────────────────────── */}
      <div className="card p-3.5 bg-cyan-950/20 border-cyan-500/30 flex items-center justify-between gap-3 text-xs text-cyan-300 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-cyan-400 shrink-0" />
          <span>
            <strong>Clinical decision by authorized medical professional.</strong> Algorithmic matching provides decision support only.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span>Reviewing Clinician: <strong className="text-white">{doctor.name}</strong></span>
          <span>Dept: <strong className="text-teal-300">{doctor.specialty}</strong></span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-teal-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Filters & Search Bar ──────────────────────────────────────── */}
      <div className="card p-4 space-y-3 bg-slate-900/90 border-slate-800">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search by Patient reference or Referral ID */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
              placeholder="Search by Patient Reference (e.g. CASE-1042) or Referral ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:border-teal-400 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical (Immediate)</option>
              <option value="HIGH">High (Urgent)</option>
              <option value="MEDIUM">Medium (Semi-Urgent)</option>
            </select>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:border-teal-400 focus:outline-none"
            >
              <option value="ALL">All Stages</option>
              <option value="PENDING">Pending Triage</option>
              <option value="IN_REVIEW">In Clinical Review</option>
              <option value="ACCEPTED">Accepted / Confirmed</option>
              <option value="ESCALATED">Escalated / Declined</option>
            </select>

            {/* Specialty Filter */}
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:border-teal-400 focus:outline-none"
            >
              <option value="ALL">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Trauma Surgery">Trauma Surgery</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="Critical Care">Critical Care</option>
              <option value="Neurology">Neurology</option>
              {availableSpecialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Patient Cards List ────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredReferrals.length === 0 ? (
          <div className="card p-8 text-center text-slate-400 text-xs space-y-2 border-slate-800">
            <p className="font-semibold text-slate-300 text-sm">No referrals match the selected filters.</p>
            <p>Try clearing your search query or adjusting priority and stage filters.</p>
          </div>
        ) : (
          filteredReferrals.map((r) => {
            const isCritical = r.patient.urgencyLevel === 'IMMEDIATE'

            return (
              <div
                key={r.id}
                className={`card p-5 space-y-4 border transition-all ${
                  isCritical
                    ? 'border-l-4 border-l-rose-500 border-rose-500/40 bg-rose-950/15 hover:border-rose-500/70 shadow-lg shadow-rose-950/20'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                {/* Header Row: Referral & Priority Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                      {r.id}
                    </span>
                    <strong className="text-white font-mono">Patient #{r.patient.referenceCode}</strong>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isCritical
                          ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {r.patient.urgencyLevel}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {r.status}
                    </span>
                    {r.patient.bloodGroup && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                        <Droplet size={10} />
                        {r.patient.bloodGroup}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-teal-400" />
                      Waiting: <strong className="text-slate-200">{getRelativeTime(r.createdAt)}</strong>
                    </span>
                    <span>·</span>
                    <span>Updated: {getRelativeTime(r.updatedAt || r.createdAt)}</span>
                  </div>
                </div>

                {/* Main 3-Column Structured Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Column 1: PATIENT Information */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-white/5 pb-1">
                      PATIENT IDENTIFIER & DEMOGRAPHICS
                    </span>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Patient Reference</span>
                      <strong className="text-teal-300 font-mono text-xs">{r.patient.referenceCode}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Age / Gender</span>
                      <strong className="text-white text-xs">{r.patient.age} Yrs · {r.patient.sex}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Emergency Category</span>
                      <strong className="text-cyan-300 text-xs">{r.patient.emergencyCategory}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Originating Ambulance / Facility</span>
                      <span className="text-slate-300 text-xs flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{r.sentToFacilityName || 'Indiranagar 108 Emergency EMS'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Column 2: CLINICAL Information */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-white/5 pb-1">
                      CLINICAL TRIAGE & VITALS
                    </span>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Diagnosis / Chief Complaint</span>
                      <strong className="text-white text-xs block leading-snug">{r.patient.chiefComplaint}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Vital Signs Telemetry</span>
                      <span className="text-slate-200 text-xs font-mono font-medium block">
                        {r.patient.vitalSummary || 'BP 90/60 · HR 112 bpm · SpO2 91% · Temp 37.1°C'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[10px] font-semibold">
                        {r.requiredCapabilities.length} Capabilities Needed
                      </span>
                      {r.requiredCapabilities.slice(0, 2).map((c, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-mono">
                          {c.label || c.capabilityItem}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: SPECIALTY ROUTING & ASSIGNMENT */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-white/5 pb-1">
                      SPECIALTY ROUTING & RECEIVING
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Required Clinical Specialty
                      </span>
                      <strong className="text-sm font-bold text-teal-300 block">
                        {r.requiredSpecialty || doctor.specialty}
                      </strong>
                    </div>
                    <div className="pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Assigned Attending Clinician
                      </span>
                      <strong className="text-xs text-white block">
                        {r.assignedDoctorName || doctor.name} · {r.assignedSpecialty || doctor.specialty}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Receiving Facility</span>
                      <span className="text-slate-300 text-xs font-medium">
                        {r.sentToFacilityName || doctor.hospitalName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Row: Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <HospitalIcon size={14} className="text-teal-400" />
                      Facility: <strong className="text-white">{r.sentToFacilityName || doctor.hospitalName}</strong>
                    </span>
                    <span>·</span>
                    <span>Assigned Doctor: <strong className="text-teal-300">{r.assignedDoctorName || doctor.name}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleOpenModal(r)}
                      className="btn-primary text-xs py-2 px-4 shadow-md bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center gap-1.5"
                    >
                      <Stethoscope size={15} />
                      <span>Open Clinical Review</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Referral Review Modal ─────────────────────────────────────── */}
      {selectedReviewReferral && (
        <DoctorReferralReviewModal
          referral={selectedReviewReferral}
          user={user}
          onClose={() => setSelectedReviewReferral(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          onEscalate={handleEscalate}
          onRequestInfo={handleRequestInfo}
        />
      )}
    </div>
  )
}
