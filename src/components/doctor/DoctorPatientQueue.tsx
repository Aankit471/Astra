import { useState, useMemo } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Search,
  Stethoscope,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import { useAppStore } from '@/store/appStore'
import { getDoctorProfile, getScopedDoctorReferrals } from '@/services/doctorService'
import { getRelativeTime } from '@/utils/freshness'

interface DoctorPatientQueueProps {
  user: AuthUser
  onOpenReferral: (referralId: string) => void
}

type TabKey =
  | 'ALL'
  | 'CRITICAL'
  | 'AWAITING_REVIEW'
  | 'INFO_REQUESTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'COMPLETED'

export function DoctorPatientQueue({ user, onOpenReferral }: DoctorPatientQueueProps) {
  const referrals = useAppStore((state) => state.referrals)
  const doctor = useMemo(() => getDoctorProfile(user), [user])

  // RBAC Scoped patient queue: only patients for this doctor's hospital and clinical scope
  const authorizedReferrals = useMemo(
    () => getScopedDoctorReferrals(user, referrals),
    [user, referrals]
  )

  const [currentTab, setCurrentTab] = useState<TabKey>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'NORMAL'>('ALL')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('ALL')
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'MINE' | 'TEAM'>('ALL')

  // Available specialties for filter
  const specialties = useMemo(() => {
    const set = new Set<string>()
    authorizedReferrals.forEach((r) => {
      if (r.requiredSpecialty) set.add(r.requiredSpecialty)
      if (r.assignedSpecialty) set.add(r.assignedSpecialty)
    })
    return Array.from(set)
  }, [authorizedReferrals])

  // Filtered referrals based on tabs, search, and dropdowns
  const filteredReferrals = useMemo(() => {
    return authorizedReferrals.filter((r) => {
      // Tab filter
      if (currentTab === 'CRITICAL') {
        const isCrit =
          r.patient.urgencyLevel === 'IMMEDIATE' ||
          r.patient.emergencyCategory === 'CARDIAC' ||
          r.patient.emergencyCategory === 'TRAUMA'
        if (!isCrit) return false
      } else if (currentTab === 'AWAITING_REVIEW') {
        if (r.status !== 'REVIEWING') return false
      } else if (currentTab === 'INFO_REQUESTED') {
        if (!r.infoRequested && r.decision?.type !== 'INFO_REQUEST') return false
      } else if (currentTab === 'ACCEPTED') {
        if (!['ACCEPTED', 'CONFIRMED'].includes(r.status)) return false
      } else if (currentTab === 'DECLINED') {
        if (r.status !== 'DECLINED') return false
      } else if (currentTab === 'COMPLETED') {
        if (!['ARRIVED', 'COMPLETED'].includes(r.status)) return false
      }

      // Priority dropdown
      if (priorityFilter === 'CRITICAL' && r.patient.urgencyLevel !== 'IMMEDIATE') return false
      if (priorityFilter === 'HIGH' && r.patient.urgencyLevel !== 'URGENT') return false
      if (priorityFilter === 'NORMAL' && r.patient.urgencyLevel === 'IMMEDIATE') return false

      // Specialty dropdown
      if (specialtyFilter !== 'ALL') {
        const match =
          r.requiredSpecialty?.toLowerCase() === specialtyFilter.toLowerCase() ||
          r.assignedSpecialty?.toLowerCase() === specialtyFilter.toLowerCase()
        if (!match) return false
      }

      // Assignment dropdown
      if (assignmentFilter === 'MINE') {
        const isMine =
          r.assignedDoctorId === user.id ||
          (user.doctorCode && r.assignedDoctorCode === user.doctorCode)
        if (!isMine) return false
      }

      // Search query (name, reference code, complaint, department)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const text = `${r.patient.referenceCode} ${r.patient.chiefComplaint} ${
          r.assignedDepartment || ''
        } ${r.requiredSpecialty || ''} ${r.patient.emergencyCategory}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      return true
    })
  }, [
    authorizedReferrals,
    currentTab,
    priorityFilter,
    specialtyFilter,
    assignmentFilter,
    searchQuery,
    user.id,
    user.doctorCode,
  ])

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      ALL: authorizedReferrals.length,
      CRITICAL: authorizedReferrals.filter(
        (r) =>
          r.patient.urgencyLevel === 'IMMEDIATE' ||
          r.patient.emergencyCategory === 'CARDIAC' ||
          r.patient.emergencyCategory === 'TRAUMA'
      ).length,
      AWAITING_REVIEW: authorizedReferrals.filter((r) => r.status === 'REVIEWING').length,
      INFO_REQUESTED: authorizedReferrals.filter(
        (r) => r.infoRequested || r.decision?.type === 'INFO_REQUEST'
      ).length,
      ACCEPTED: authorizedReferrals.filter((r) =>
        ['ACCEPTED', 'CONFIRMED'].includes(r.status)
      ).length,
      DECLINED: authorizedReferrals.filter((r) => r.status === 'DECLINED').length,
      COMPLETED: authorizedReferrals.filter((r) =>
        ['ARRIVED', 'COMPLETED'].includes(r.status)
      ).length,
    }
  }, [authorizedReferrals])

  return (
    <div className="space-y-6">
      {/* ── Page Header & Authorization Banner ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Stethoscope className="text-cyan-400" size={24} />
            Clinical Patient Queue
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Authorized triage and case coordination for{' '}
            <strong className="text-cyan-300">{doctor.hospitalName}</strong> ·{' '}
            <span className="text-slate-300 font-medium">{doctor.specialty} Department</span>
          </p>
        </div>
        <div className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-gray-400 self-start sm:self-auto">
          Viewing as: <strong className="text-white">{doctor.name}</strong> ({doctor.doctorCode})
        </div>
      </div>

      {/* ── Queue Navigation Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-white/5 scrollbar-thin">
        {(
          [
            ['ALL', 'All Cases'],
            ['CRITICAL', 'Critical'],
            ['AWAITING_REVIEW', 'Awaiting Review'],
            ['INFO_REQUESTED', 'Info Requested'],
            ['ACCEPTED', 'Accepted'],
            ['DECLINED', 'Declined'],
            ['COMPLETED', 'Completed'],
          ] as const
        ).map(([key, label]) => {
          const count = tabCounts[key]
          const isActive = currentTab === key
          return (
            <button
              key={key}
              onClick={() => setCurrentTab(key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300'
                  : 'text-gray-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search field */}
          <div className="sm:col-span-6 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by patient code, condition, complaint, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* Priority filter */}
          <div className="sm:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as 'ALL' | 'CRITICAL' | 'HIGH' | 'NORMAL')
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Immediate</option>
              <option value="HIGH">Urgent</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>

          {/* Specialty filter */}
          <div className="sm:col-span-2">
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Specialties</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment filter */}
          <div className="sm:col-span-2">
            <select
              value={assignmentFilter}
              onChange={(e) =>
                setAssignmentFilter(e.target.value as 'ALL' | 'MINE' | 'TEAM')
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Team Cases</option>
              <option value="MINE">Assigned to Me</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Patient List / Cards ──────────────────────────────────────── */}
      {filteredReferrals.length ? (
        <div className="space-y-3.5">
          {filteredReferrals.map((referral) => {
            const isImmediate = referral.patient.urgencyLevel === 'IMMEDIATE'
            const isReviewing = referral.status === 'REVIEWING'

            return (
              <div
                key={referral.id}
                className={`card p-5 border-l-4 transition hover:border-slate-600 bg-slate-900/90 ${
                  isImmediate
                    ? 'border-l-rose-500'
                    : isReviewing
                    ? 'border-l-cyan-400'
                    : 'border-l-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        #{referral.patient.referenceCode}
                      </span>
                      <strong className="text-base text-white font-bold">
                        {referral.patient.age}Y · {referral.patient.sex}
                      </strong>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isImmediate
                            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                            : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                        }`}
                      >
                        {referral.patient.emergencyCategory} · {referral.patient.urgencyLevel}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto md:ml-0">
                        <Clock3 size={13} />
                        {getRelativeTime(referral.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-200 font-medium">
                      {referral.patient.chiefComplaint}
                    </p>

                    {referral.patient.vitalSummary && (
                      <div className="text-xs text-gray-400 font-mono bg-black/40 px-3 py-1.5 rounded border border-white/5 inline-block">
                        Vitals: <strong className="text-slate-200">{referral.patient.vitalSummary}</strong>
                      </div>
                    )}

                    {/* Specialty and Clinical Purview */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 pt-1">
                      <div>
                        <span>Required Specialty: </span>
                        <strong className="text-cyan-300">
                          {referral.requiredSpecialty || 'General'}
                        </strong>
                      </div>
                      <div>
                        <span>Assigned Specialist: </span>
                        <strong className="text-white">
                          {referral.assignedDoctorName || doctor.name}
                        </strong>
                      </div>
                      {referral.assignedDepartment && (
                        <div>
                          <span>Department: </span>
                          <strong className="text-slate-300">{referral.assignedDepartment}</strong>
                        </div>
                      )}
                      {referral.patient.bloodGroup && (
                        <div>
                          <span>Blood Group: </span>
                          <strong className="text-rose-400 font-bold">
                            {referral.patient.bloodGroup}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Capabilities badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {referral.requiredCapabilities.map((c) => (
                        <span
                          key={c.capabilityItem}
                          className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700"
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right actions & status */}
                  <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                        referral.status === 'REVIEWING'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : referral.status === 'ACCEPTED'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : referral.status === 'ESCALATED'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-gray-300'
                      }`}
                    >
                      {referral.status.replace('_', ' ')}
                    </span>

                    <button
                      onClick={() => onOpenReferral(referral.id)}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-2 shadow-sm"
                    >
                      <span>{isReviewing ? 'Open Clinical Review' : 'Open Patient'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400 space-y-3">
          <CheckCircle2 size={36} className="mx-auto text-cyan-400" />
          <h3 className="text-base font-bold text-white">No Cases Match Current Filters</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No patient referrals found under this filter criteria for your authorized queue. All
            unrelated patient files remain restricted under RBAC.
          </p>
          <button
            onClick={() => {
              setCurrentTab('ALL')
              setSearchQuery('')
              setPriorityFilter('ALL')
              setSpecialtyFilter('ALL')
              setAssignmentFilter('ALL')
            }}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}
