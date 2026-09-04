import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Droplet,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'

import type { Referral } from '@/types/domain'
import type { AuthUser } from '@/types/auth'
import { referralRepository } from '@/services/repositories/referralRepository'
import { bedRepository } from '@/services/repositories/bedRepository'
import { HospitalReferralDetailModal } from './HospitalReferralDetailModal'
import { useSupabaseRealtime } from '@/services/supabase/useSupabaseRealtime'
import { getRelativeTime } from '@/utils/freshness'

interface HospitalReferralsViewProps {
  hospitalId?: string
  user?: AuthUser
}

export function HospitalReferralsView({
  hospitalId = 'H001',
  user,
}: HospitalReferralsViewProps) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [availableBedCapacity, setAvailableBedCapacity] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState('ALL')
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL')

  // Selected Referral Modal
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)

  // Quick Decline Modal
  const [quickDeclineRefId, setQuickDeclineRefId] = useState<string | null>(null)
  const [quickDeclineReason, setQuickDeclineReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const actor = useMemo(() => ({
    id: user?.id || 'ops-001',
    name: user?.name || 'Hospital Operations Team',
    role: user?.role || 'HOSPITAL_OPS',
    hospitalId,
    hospitalName: user?.hospitalName || 'Apollo General Hospital',
  }), [user, hospitalId])

  // Load live referrals & bed capacity
  const loadReferralData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const [refList, beds] = await Promise.all([
        referralRepository.list({ hospitalId }),
        bedRepository.getByHospitalId(hospitalId),
      ])
      setReferrals(refList || [])
      const totalAvail = beds ? beds.reduce((sum, b) => sum + (b.availableBeds || 0), 0) : 0
      setAvailableBedCapacity(totalAvail)
    } catch (err: any) {
      console.warn('Failed to load live referrals:', err)
      setError('Unable to load incoming referrals from Supabase.')
    } finally {
      setLoading(false)
    }
  }, [hospitalId])

  useEffect(() => {
    loadReferralData()
  }, [loadReferralData])

  // Realtime hook: refresh when changes occur
  useSupabaseRealtime(useCallback(() => {
    loadReferralData(true)
  }, [loadReferralData]))

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Accept Referral Handler with Capacity Pre-Check
  const handleAcceptReferral = async (referralId: string): Promise<{ success: boolean; error?: string }> => {
    setActionError(null)

    // Pre-check capacity
    if (availableBedCapacity <= 0) {
      const msg = 'Required capacity currently unavailable.'
      setActionError(msg)
      return { success: false, error: msg }
    }

    const res = await referralRepository.recordOperationalDecision(
      referralId,
      'ACCEPTED',
      actor,
      'Bed and clinical capacity verified for acute reception.'
    )

    if (res.success) {
      showToast(`✓ Referral #${referralId} accepted successfully. Timeline and audit recorded.`)
      loadReferralData(true)
      return { success: true }
    } else {
      setActionError(res.error || 'Failed to accept referral.')
      return { success: false, error: res.error }
    }
  }

  // Decline Referral Handler
  const handleDeclineReferral = async (referralId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    setActionError(null)
    if (!reason || !reason.trim()) {
      const msg = 'A reason is required to decline an incoming referral.'
      setActionError(msg)
      return { success: false, error: msg }
    }

    setIsProcessing(true)

    try {
      const res = await referralRepository.recordOperationalDecision(
        referralId,
        'DECLINED',
        actor,
        reason.trim()
      )

      if (res.success) {
        showToast(`✓ Referral #${referralId} declined. Reason recorded in timeline and audit.`)
        setQuickDeclineRefId(null)
        setQuickDeclineReason('')
        loadReferralData(true)
        return { success: true }
      } else {
        setActionError(res.error || 'Failed to decline referral.')
        return { success: false, error: res.error }
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Route to Clinical Team Handler
  const handleRouteToClinical = async (referralId: string): Promise<{ success: boolean; error?: string }> => {
    setActionError(null)
    setIsProcessing(true)
    try {
      const res = await referralRepository.routeToClinical(referralId, actor)
      if (res.success) {
        showToast(`✓ Referral #${referralId} routed to clinical specialist team.`)
        loadReferralData(true)
        return { success: true }
      } else {
        setActionError(res.error || 'Failed to route to clinical team.')
        return { success: false, error: res.error }
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Filtered referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      const p = r.patient
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
      if (urgencyFilter !== 'ALL' && p?.urgencyLevel !== urgencyFilter) return false
      if (specialtyFilter !== 'ALL' && p?.emergencyCategory !== specialtyFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesId = r.id.toLowerCase().includes(q)
        const matchesRef = p?.referenceCode?.toLowerCase().includes(q)
        const matchesComplaint = p?.chiefComplaint?.toLowerCase().includes(q)
        const matchesCategory = p?.emergencyCategory?.toLowerCase().includes(q)
        if (!matchesId && !matchesRef && !matchesComplaint && !matchesCategory) return false
      }

      return true
    })
  }, [referrals, statusFilter, urgencyFilter, specialtyFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              EMERGENCY INTAKE COMMAND
            </span>
            <span className="text-xs text-slate-400">
              Facility Queue: <strong className="text-slate-200">{hospitalId}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Incoming Emergency Referrals
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Connected to Supabase <code className="font-mono text-cyan-300">public.referrals</code>. Automated acuity sorting (critical first), capacity validation, and auditable acceptance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <button
            onClick={() => loadReferralData()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh referral queue"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 font-bold">
            <BedDouble size={14} className="text-emerald-400" />
            <span>{availableBedCapacity} Beds Available</span>
          </div>
        </div>
      </div>

      {/* ── Toast & Action Error Alerts ────────────────────────────────── */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {(actionError || error) && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>{actionError || error}</span>
          </div>
          <button onClick={() => { setActionError(null); setError(null) }} className="text-rose-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}


      {/* ── Search & Filter Controls ───────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search ID, reference, complaint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="TRIAGED">TRIAGED</option>
              <option value="MATCHED">MATCHED</option>
              <option value="REVIEWING">REVIEWING</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="DECLINED">DECLINED</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="ALL">All Urgencies</option>
              <option value="IMMEDIATE">🔴 IMMEDIATE (Critical Acuity)</option>
              <option value="URGENT">🟡 URGENT (Acute)</option>
              <option value="SEMI_URGENT">🟢 SEMI_URGENT (Standard)</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <div>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="ALL">All Specialties</option>
              <option value="CARDIAC">Cardiology (Cardiac)</option>
              <option value="NEURO">Neurology (Stroke)</option>
              <option value="TRAUMA">Trauma & Surgery</option>
              <option value="RESPIRATORY">Respiratory Care</option>
              <option value="PAEDIATRIC">Paediatrics</option>
              <option value="BURNS">Burns & Plastic</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Referral Queue Table (Section 5) ───────────────────────────── */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2 bg-slate-900/40 rounded-xl border border-slate-800">
          <RefreshCw className="animate-spin text-cyan-400 mx-auto" size={28} />
          <p className="text-sm font-semibold">Loading incoming referrals...</p>
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className="p-12 text-center text-slate-400 rounded-xl bg-slate-900/40 border border-slate-800">
          <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
          <p className="text-sm font-semibold">No incoming referrals found.</p>
          <span className="text-xs text-slate-500">All emergency intakes have been processed.</span>
        </div>
      ) : (
        <div className="card overflow-hidden bg-slate-900/90 border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-3">Referral ID / Patient</th>
                  <th className="py-3 px-3">Age / Sex</th>
                  <th className="py-3 px-3">Emergency Condition</th>
                  <th className="py-3 px-3">Urgency / Tier</th>
                  <th className="py-3 px-3">Required Capability / Beds</th>
                  <th className="py-3 px-3">Blood Group</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Created / ETA</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReferrals.map((ref) => {
                  const p = ref.patient
                  const isImmediate = p?.urgencyLevel === 'IMMEDIATE'
                  const isAccepted = ref.status === 'ACCEPTED'
                  const isDeclined = ref.status === 'DECLINED'

                  return (
                    <tr
                      key={ref.id}
                      className={`hover:bg-white/[0.02] transition ${
                        isImmediate && !isAccepted && !isDeclined ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Referral ID & Patient Reference */}
                      <td className="py-3 px-3">
                        <strong className="text-white block font-medium">
                          {p?.referenceCode || `Ref #${ref.id.slice(-5)}`}
                        </strong>
                        <span className="text-[10px] text-cyan-300 font-mono block">
                          {ref.id}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          Origin: 108 Emergency Transit
                        </span>
                      </td>

                      {/* Age & Sex */}
                      <td className="py-3 px-3 text-slate-300">
                        {p?.age ? `${p.age}y` : '—'} · {p?.sex || '—'}
                      </td>

                      {/* Emergency Condition */}
                      <td className="py-3 px-3">
                        <strong className="text-slate-200 block">
                          {p?.emergencyCategory || 'Emergency'}
                        </strong>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {p?.chiefComplaint || 'Acute presentation'}
                        </p>
                      </td>

                      {/* Urgency / Tier */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isImmediate
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isImmediate ? 'bg-rose-400 animate-pulse' : 'bg-amber-400'
                            }`}
                          />
                          {p?.urgencyLevel || 'IMMEDIATE'}
                        </span>
                      </td>

                      {/* Required Capability & Bed Type */}
                      <td className="py-3 px-3 text-slate-300">
                        <span className="block font-medium">ICU / Resuscitation Bay</span>
                        <span className="text-[10px] text-cyan-300">❄️ AC Room Preference</span>
                      </td>

                      {/* Blood Group */}
                      <td className="py-3 px-3 font-mono font-bold text-rose-300">
                        {p?.bloodGroup ? (
                          <span className="flex items-center gap-1">
                            <Droplet size={12} className="text-rose-400" />
                            {p.bloodGroup}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">N/A</span>
                        )}
                      </td>

                      {/* Referral Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isAccepted
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : isDeclined
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {ref.status}
                        </span>
                      </td>

                      {/* Created Time / ETA */}
                      <td className="py-3 px-3 text-slate-400">
                        <span className="block text-[11px] font-mono text-slate-300">ETA ~10m</span>
                        <span className="text-[10px] text-slate-500">
                          {getRelativeTime(ref.createdAt)}
                        </span>
                      </td>

                      {/* Operational Actions (Section 6) */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReferral(ref)}
                            className="btn-secondary text-[11px] py-1 px-2.5"
                          >
                            Case View
                          </button>

                          {ref.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleRouteToClinical(ref.id)}
                              disabled={isProcessing}
                              className="py-1 px-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition"
                              title="Route accepted case to attending clinical specialist"
                            >
                              Route to Doctor
                            </button>
                          )}

                          {!isAccepted && !isDeclined && (
                            <>
                              <button
                                onClick={() => handleAcceptReferral(ref.id)}
                                className="py-1 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition shadow-sm"
                                title="Accept Referral after Capacity Check"
                              >
                                Accept
                              </button>

                              <button
                                onClick={() => setQuickDeclineRefId(ref.id)}
                                className="py-1 px-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition"
                                title="Decline Referral with Required Reason"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Case View Modal (Section 7) ────────────────────────────────── */}
      {selectedReferral && (
        <HospitalReferralDetailModal
          referral={selectedReferral}
          availableBedCapacity={availableBedCapacity}
          onClose={() => setSelectedReferral(null)}
          onAccept={handleAcceptReferral}
          onDecline={handleDeclineReferral}
          onRouteToClinical={handleRouteToClinical}
        />
      )}

      {/* ── Quick Decline Reason Modal ─────────────────────────────────── */}
      {quickDeclineRefId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card w-full max-w-md p-5 bg-[#0B111E] border-slate-700 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-rose-400" />
                Decline Referral #{quickDeclineRefId}
              </h3>
              <button
                onClick={() => {
                  setQuickDeclineRefId(null)
                  setQuickDeclineReason('')
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please enter the clinical or operational reason for declining this incoming emergency referral. This will be permanently recorded in the referral audit trail.
            </p>

            <textarea
              rows={3}
              value={quickDeclineReason}
              onChange={(e) => setQuickDeclineReason(e.target.value)}
              placeholder="e.g. Bed capacity in Intensive Care currently exhausted; emergency diverted to Regional Trauma Center."
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-rose-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setQuickDeclineRefId(null)
                  setQuickDeclineReason('')
                }}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeclineReferral(quickDeclineRefId, quickDeclineReason)}
                disabled={isProcessing || !quickDeclineReason.trim()}
                className="btn-danger text-xs py-1.5 px-3 disabled:opacity-40"
              >
                {isProcessing ? 'Recording...' : 'Decline Referral'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
