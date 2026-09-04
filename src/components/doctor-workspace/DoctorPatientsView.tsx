import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Droplet,
  ExternalLink,
  RefreshCw,
  Search,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import type { Referral } from '@/types/domain'
import { referralRepository } from '@/services/repositories/referralRepository'
import { useSupabaseRealtime } from '@/services/supabase/useSupabaseRealtime'
import { getRelativeTime, formatExactTime } from '@/utils/freshness'
import { DoctorReferralReviewModal } from './DoctorReferralReviewModal'

interface DoctorPatientsViewProps {
  user?: AuthUser
  onOpenReview?: (referral: Referral) => void
}

export function DoctorPatientsView({ user, onOpenReview }: DoctorPatientsViewProps) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'IMMEDIATE' | 'URGENT' | 'SEMI_URGENT'>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('ALL')
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [selectedReviewReferral, setSelectedReviewReferral] = useState<Referral | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch referrals filtered by doctor hospital/doctor ID according to RBAC
      const filters: { hospitalId?: string; doctorId?: string } = {}
      if (user?.hospitalId) filters.hospitalId = user.hospitalId
      if (user?.id && !user?.hospitalId) filters.doctorId = user.id

      const items = await referralRepository.list(filters)
      setReferrals(items)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to fetch doctor patient roster:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.hospitalId, user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime synchronization
  useSupabaseRealtime()

  const filteredReferrals = useMemo(() => {
    return referrals.filter((ref) => {
      // Search query (Patient Reference or Referral ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const refCode = ref.patient?.referenceCode?.toLowerCase() || ''
        const refId = ref.id.toLowerCase()
        const complaint = ref.patient?.chiefComplaint?.toLowerCase() || ''
        if (!refCode.includes(q) && !refId.includes(q) && !complaint.includes(q)) {
          return false
        }
      }

      // Priority
      if (priorityFilter !== 'ALL' && ref.patient?.urgencyLevel !== priorityFilter) {
        return false
      }

      // Status
      if (statusFilter !== 'ALL' && ref.status !== statusFilter) {
        return false
      }

      // Specialty
      if (specialtyFilter !== 'ALL') {
        const cat = ref.patient?.emergencyCategory || ''
        if (cat !== specialtyFilter) return false
      }

      return true
    })
  }, [referrals, searchQuery, priorityFilter, statusFilter, specialtyFilter])

  const totalPages = Math.ceil(filteredReferrals.length / pageSize) || 1
  const paginatedReferrals = filteredReferrals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleOpenReview = (ref: Referral) => {
    if (onOpenReview) {
      onOpenReview(ref)
    } else {
      setSelectedReviewReferral(ref)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              DOCTOR PATIENT ROSTER
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Assigned Patients & Authorized Clinical Referrals
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Scoped to {user?.name || 'Dr. Sarah Jenkins'} • {user?.hospitalName || 'Metro Central Hospital'} ({user?.specialty || 'Interventional Cardiology'})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-teal-400' : ''} />
            <span>Refresh</span>
          </button>
          <div className="text-[11px] text-slate-400 font-mono">
            {formatExactTime(lastRefreshed.toISOString())}
          </div>
        </div>
      </div>

      {/* ── Filters Bar (Prompt #20 Section 3/6) ───────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search patient ref (e.g. EM-), referral ID, or condition..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs placeholder:text-slate-500 focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
          />
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as typeof priorityFilter)
              setCurrentPage(1)
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white text-xs focus:ring-1 focus:ring-teal-400"
          >
            <option value="ALL">All Priorities</option>
            <option value="IMMEDIATE">Immediate (Critical)</option>
            <option value="URGENT">Urgent (High)</option>
            <option value="SEMI_URGENT">Semi-Urgent (Medium)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white text-xs focus:ring-1 focus:ring-teal-400"
          >
            <option value="ALL">All Referral Statuses</option>
            <option value="MATCHED">Matched</option>
            <option value="REVIEWING">In Review</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="ESCALATED">Escalated</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>

        {/* Specialty Filter */}
        <div>
          <select
            value={specialtyFilter}
            onChange={(e) => {
              setSpecialtyFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white text-xs focus:ring-1 focus:ring-teal-400"
          >
            <option value="ALL">All Specialties</option>
            <option value="CARDIAC">Cardiology</option>
            <option value="TRAUMA">Trauma Surgery</option>
            <option value="NEURO">Neurology</option>
            <option value="RESPIRATORY">Critical Care</option>
          </select>
        </div>
      </div>

      {/* ── Complete Doctor-Visible Patient Table (Prompt #20 Section 6) ─ */}
      <div className="card overflow-hidden border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060b13] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Patient Reference</th>
                <th className="py-3 px-3.5">Emergency Type</th>
                <th className="py-3 px-3.5">Priority</th>
                <th className="py-3 px-3.5">Age / Sex</th>
                <th className="py-3 px-3.5">Current Facility</th>
                <th className="py-3 px-3.5">Receiving Facility</th>
                <th className="py-3 px-3.5">Required Specialty</th>
                <th className="py-3 px-3.5">Blood Requirement</th>
                <th className="py-3 px-3.5">Referral Status</th>
                <th className="py-3 px-3.5">Assigned Doctor</th>
                <th className="py-3 px-3.5">Last Updated</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-mono">
                    <RefreshCw size={20} className="animate-spin mx-auto text-teal-400 mb-2" />
                    Loading authorized clinical roster...
                  </td>
                </tr>
              ) : paginatedReferrals.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    No clinical referrals match your criteria or authorization scope.
                  </td>
                </tr>
              ) : (
                paginatedReferrals.map((ref) => {
                  const urgency = ref.patient?.urgencyLevel || 'IMMEDIATE'
                  const bloodGrp = ref.patient?.bloodGroup || 'O+'

                  return (
                    <tr key={ref.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Patient Reference */}
                      <td className="py-3 px-3.5 font-mono font-bold text-teal-300">
                        {ref.patient?.referenceCode || ref.id}
                        <div className="text-[10px] text-slate-500 font-normal">{ref.id}</div>
                      </td>

                      {/* Emergency Type */}
                      <td className="py-3 px-3.5 text-white font-medium">
                        {ref.patient?.chiefComplaint || 'Acute Emergency'}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {ref.patient?.emergencyCategory}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            urgency === 'IMMEDIATE'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : urgency === 'URGENT'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                          }`}
                        >
                          {urgency}
                        </span>
                      </td>

                      {/* Age / Sex */}
                      <td className="py-3 px-3.5 text-slate-300 font-mono">
                        {ref.patient?.age ? `${ref.patient.age}Y` : '50Y'} / {ref.patient?.sex || 'M'}
                      </td>

                      {/* Current Facility */}
                      <td className="py-3 px-3.5 text-slate-300">
                        Indiranagar 108 ALS
                      </td>

                      {/* Receiving Facility */}
                      <td className="py-3 px-3.5 text-teal-300 font-medium">
                        {ref.sentToFacilityName || user?.hospitalName || 'Metro Central Hospital'}
                      </td>

                      {/* Required Specialty */}
                      <td className="py-3 px-3.5 text-slate-200">
                        {ref.patient?.emergencyCategory === 'CARDIAC' ? 'Interventional Cardiology' :
                         ref.patient?.emergencyCategory === 'TRAUMA' ? 'Trauma Surgery' :
                         ref.patient?.emergencyCategory === 'NEURO' ? 'Neurosurgery / Stroke' : 'Critical Care'}
                      </td>

                      {/* Blood Requirement */}
                      <td className="py-3 px-3.5">
                        <span className="font-mono text-rose-300 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1">
                          <Droplet size={10} className="text-rose-400" />
                          {bloodGrp}
                        </span>
                      </td>

                      {/* Referral Status */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            ref.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : ref.status === 'DECLINED'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : ref.status === 'ESCALATED'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          }`}
                        >
                          {ref.status}
                        </span>
                      </td>

                      {/* Assigned Doctor */}
                      <td className="py-3 px-3.5 text-slate-300">
                        {user?.name || 'Dr. Sarah Jenkins'}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-3.5 font-mono text-slate-400 text-[11px]">
                        {getRelativeTime(ref.updatedAt || ref.createdAt)}
                      </td>

                      {/* Clinical Review Action */}
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={() => handleOpenReview(ref)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 hover:bg-teal-500/25 hover:text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Open Review</span>
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#060b13] border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing {paginatedReferrals.length} of {filteredReferrals.length} referrals
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Clinical Review Modal ─────────────────────────────────────── */}
      {selectedReviewReferral && (
        <DoctorReferralReviewModal
          referral={selectedReviewReferral}
          user={user}
          onClose={() => setSelectedReviewReferral(null)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  )
}
