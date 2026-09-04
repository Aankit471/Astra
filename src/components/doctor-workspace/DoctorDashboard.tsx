import { useState, useMemo, useEffect } from 'react'
import {
  Activity,
  ArrowRight,
  Droplet,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import type { Referral, BloodGroup } from '@/types/domain'
import { useAppStore } from '@/store/appStore'
import { getDoctorProfile, getScopedDoctorReferrals } from '@/services/doctorService'
import { referralRepository, bloodRepository } from '@/services/repositories'
import { getRelativeTime, getFreshnessLevel } from '@/utils/freshness'
import type { DoctorPatient } from '@/data/doctorData'

interface DoctorDashboardProps {
  user: AuthUser
  onNavigate: (view: string) => void
  onOpenPatient: (patient: DoctorPatient) => void
  onOpenReviewModal: (referralId: string) => void
}

export function DoctorDashboard({
  user,
  onNavigate,
  onOpenReviewModal,
}: DoctorDashboardProps) {
  const storeReferrals = useAppStore((state) => state.referrals)
  const storeBlood = useAppStore((state) => state.bloodInventory)

  const [referrals, setReferrals] = useState<Referral[]>(storeReferrals)
  const [bloodInventory, setBloodInventory] = useState(storeBlood)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doctor = useMemo(() => getDoctorProfile(user), [user])

  // Fetch live referrals and blood inventory from Supabase on mount
  const loadDoctorData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [rList, bList] = await Promise.all([
        referralRepository.list({ hospitalId: user.hospitalId }),
        bloodRepository.list(user.hospitalId),
      ])
      if (rList && rList.length > 0) setReferrals(rList)
      if (bList && bList.length > 0) setBloodInventory(bList)
    } catch (err: any) {
      console.warn('Live doctor telemetry fetch error, using store data:', err)
      setError(err?.message || 'Sync warning: operating on cached telemetry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctorData()
  }, [user.id, user.hospitalId])

  // RBAC patient-level isolation: only referrals authorized for this clinician's scope
  const authorizedReferrals = useMemo(
    () => getScopedDoctorReferrals(user, referrals),
    [user, referrals]
  )

  // Queue statistics
  const stats = useMemo(() => {
    const critical = authorizedReferrals.filter(
      (r) =>
        r.patient.urgencyLevel === 'IMMEDIATE' ||
        r.patient.emergencyCategory === 'CARDIAC' ||
        r.patient.emergencyCategory === 'TRAUMA'
    ).length

    const high = authorizedReferrals.filter(
      (r) => r.patient.urgencyLevel === 'URGENT'
    ).length

    const medium = authorizedReferrals.filter(
      (r) => r.patient.urgencyLevel === 'SEMI_URGENT'
    ).length

    const pendingReview = authorizedReferrals.filter(
      (r) => r.status === 'REVIEWING' || r.status === 'PENDING' || r.status === 'MATCHED'
    ).length

    const accepted = authorizedReferrals.filter(
      (r) => ['ACCEPTED', 'CONFIRMED'].includes(r.status)
    ).length

    const escalated = authorizedReferrals.filter(
      (r) => r.status === 'ESCALATED' || r.status === 'DECLINED'
    ).length

    // Specialist Workload metrics
    const myActiveCases = authorizedReferrals.filter(
      (r) =>
        (r.assignedDoctorId === user.id ||
          (user.doctorCode && r.assignedDoctorCode === user.doctorCode) ||
          r.requiredSpecialty?.toLowerCase() === doctor.specialty.toLowerCase()) &&
        !['COMPLETED', 'ARRIVED'].includes(r.status)
    ).length

    const casesAwaitingReview = authorizedReferrals.filter(
      (r) => r.status === 'REVIEWING'
    ).length

    const casesReviewed = authorizedReferrals.filter(
      (r) => Boolean(r.decision)
    ).length

    const casesRequiringAction = authorizedReferrals.filter(
      (r) => r.status === 'REVIEWING' || r.infoRequested
    ).length

    return {
      critical,
      high,
      medium,
      pendingReview,
      accepted,
      escalated,
      myActiveCases,
      casesAwaitingReview,
      casesReviewed,
      casesRequiringAction,
    }
  }, [authorizedReferrals, user, doctor])

  // All 8 ABO/Rh blood groups for blood availability section
  const allBloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const hospitalBlood = useMemo(() => {
    return allBloodGroups.map((group) => {
      const match = bloodInventory.find(
        (b) => b.bloodGroup === group && (b.hospitalId === user.hospitalId || !user.hospitalId)
      )
      const lastUp = match ? match.lastUpdated : new Date().toISOString()
      const fresh = getFreshnessLevel(lastUp)
      return {
        group,
        units: match ? match.availableUnits : 0,
        minThreshold: 5,
        hospital: user.hospitalName || 'Apollo Emergency',
        lastUpdated: lastUp,
        freshness: fresh === 'FRESH' ? 'LIVE' : fresh === 'AGING' ? 'RECENT' : 'STALE',
      }
    })
  }, [bloodInventory, user])

  // Current prioritized emergency case
  const topEmergencyCase = useMemo(() => {
    return (
      authorizedReferrals.find((r) => r.status === 'REVIEWING' && r.patient.urgencyLevel === 'IMMEDIATE') ||
      authorizedReferrals.find((r) => r.status === 'REVIEWING') ||
      authorizedReferrals[0]
    )
  }, [authorizedReferrals])

  return (
    <div className="space-y-6">
      {/* ── Greeting Banner ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/15 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded">
                ACTIVE CLINICAL PURVIEW
              </span>
              <span className="text-xs text-slate-400">
                {doctor.hospitalName} · Reg: {doctor.doctorCode}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Good day, {doctor.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Clinical Command Center · <strong>{stats.critical} critical cases</strong> and <strong>{stats.casesAwaitingReview} cases awaiting your review</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => onNavigate('referrals')}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-lg shadow-teal-500/10"
            >
              <Stethoscope size={14} />
              <span>Patient Queue ({stats.casesAwaitingReview})</span>
            </button>
            <button
              onClick={() => onNavigate('reviews')}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Activity size={14} />
              <span>Clinical Reviews</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mandatory Clinical Decision Banner ──────────────────────────── */}
      <div className="card p-3.5 bg-cyan-950/20 border-cyan-500/30 flex items-center justify-between gap-3 text-xs text-cyan-300 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-cyan-400 shrink-0" />
          <span>
            <strong>MANDATORY CLINICAL PROTOCOL:</strong> Clinical decision by authorized medical professional. Algorithmic capability matching provides decision support only.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span>Specialty: <strong className="text-teal-300">{doctor.specialty}</strong></span>
          <span>Status: <strong className="text-emerald-400">AUTHORIZED</strong></span>
        </div>
      </div>

      {error && (
        <div className="card p-3.5 bg-amber-950/20 border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadDoctorData} className="underline text-amber-200 hover:text-white font-bold">
            Retry Sync
          </button>
        </div>
      )}

      {/* ── QUEUE & WORKLOAD STATISTICS ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="card p-3.5 bg-slate-900/80 border-rose-500/30 bg-rose-950/10">
          <span className="text-[11px] text-rose-400 block font-medium">Critical Priority</span>
          <strong className="text-2xl font-bold text-rose-400 block mt-1">{stats.critical}</strong>
          <span className="text-[10px] text-rose-300 block">Immediate Triage</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-amber-500/30 bg-amber-950/10">
          <span className="text-[11px] text-amber-400 block font-medium">High Urgency</span>
          <strong className="text-2xl font-bold text-amber-300 block mt-1">{stats.high}</strong>
          <span className="text-[10px] text-amber-300/80 block">Urgent Care</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Medium Urgency</span>
          <strong className="text-2xl font-bold text-slate-200 block mt-1">{stats.medium}</strong>
          <span className="text-[10px] text-slate-500 block">Semi-Urgent</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-cyan-500/30 bg-cyan-950/10">
          <span className="text-[11px] text-cyan-400 block font-medium">Pending Review</span>
          <strong className="text-2xl font-bold text-cyan-300 block mt-1">{stats.pendingReview}</strong>
          <span className="text-[10px] text-cyan-300/80 block">Awaiting Decision</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-emerald-500/30 bg-emerald-950/10">
          <span className="text-[11px] text-emerald-400 block font-medium">Accepted</span>
          <strong className="text-2xl font-bold text-emerald-300 block mt-1">{stats.accepted}</strong>
          <span className="text-[10px] text-emerald-400/80 block">Clinically Cleared</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Escalated / Other</span>
          <strong className="text-2xl font-bold text-slate-300 block mt-1">{stats.escalated}</strong>
          <span className="text-[10px] text-slate-500 block">Admin Attention</span>
        </div>
      </div>

      {/* ── SPECIALIST WORKLOAD OVERVIEW ─────────────────────────────────── */}
      <section className="card p-4 bg-slate-900/80 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users size={16} className="text-teal-400" /> Specialist Clinical Workload: {doctor.name} ({doctor.specialty})
            </h3>
            <p className="text-slate-400 text-[11px]">Cases strictly restricted to your hospital and clinical purview.</p>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {loading ? 'Refreshing Supabase...' : `Live telemetry · ${authorizedReferrals.length} Scoped Patients`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">My Active Cases</span>
            <strong className="text-lg font-bold text-white mt-0.5 block">{stats.myActiveCases}</strong>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Cases Awaiting Review</span>
            <strong className="text-lg font-bold text-amber-400 mt-0.5 block">{stats.casesAwaitingReview}</strong>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Cases Reviewed Today</span>
            <strong className="text-lg font-bold text-emerald-400 mt-0.5 block">{stats.casesReviewed}</strong>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Cases Requiring Action</span>
            <strong className="text-lg font-bold text-rose-400 mt-0.5 block">{stats.casesRequiringAction}</strong>
          </div>
        </div>
      </section>

      {/* ── ACTIVE EMERGENCY CASES TABLE ────────────────────────────────── */}
      <section className="card p-5 space-y-4 bg-slate-900/90 border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} className="text-teal-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Active Emergency Referral Queue ({authorizedReferrals.length} Cases)
            </h3>
          </div>

          <button
            onClick={() => onNavigate('referrals')}
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >
            <span>Open Clinical Queue</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {authorizedReferrals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs border border-slate-800 rounded-xl bg-slate-950/40">
            No active emergency referrals currently assigned to your clinical department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#060b13] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Patient Ref</th>
                  <th className="py-2.5 px-3">Age / Sex</th>
                  <th className="py-2.5 px-3">Category & Complaint</th>
                  <th className="py-2.5 px-3">Urgency</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Required Specialty</th>
                  <th className="py-2.5 px-3">Elapsed Time</th>
                  <th className="py-2.5 px-3">Assigned Clinician</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {authorizedReferrals.slice(0, 6).map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-400">
                      {r.patient.referenceCode}
                      <small className="block text-[10px] text-slate-500 font-normal">{r.id}</small>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-medium">
                      {r.patient.age}Y · {r.patient.sex}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs">
                      <strong className="block text-white text-xs">{r.patient.emergencyCategory}</strong>
                      <span className="truncate block text-slate-400 text-[11px]">{r.patient.chiefComplaint}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.patient.urgencyLevel === 'IMMEDIATE'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : r.patient.urgencyLevel === 'URGENT'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {r.patient.urgencyLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-teal-300 font-medium">
                      {r.requiredSpecialty || doctor.specialty}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {getRelativeTime(r.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {r.assignedDoctorName || doctor.name}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onOpenReviewModal(r.id)}
                        className="btn-primary text-[11px] py-1 px-3 shadow-sm bg-gradient-to-r from-teal-500 to-cyan-600"
                      >
                        Open Clinical Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── BLOOD INVENTORY VISIBILITY SECTION ──────────────────────────── */}
      <section className="card p-5 space-y-3 bg-slate-900/90 border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet size={18} className="text-rose-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Emergency Blood Bank Inventory · {user.hospitalName || 'Apollo Emergency'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">Live units across all 8 ABO/Rh groups</span>
        </div>

        {topEmergencyCase?.patient.bloodGroup && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs flex items-center justify-between text-rose-300">
            <span>
              <strong>Target Case Compatibility:</strong> Patient {topEmergencyCase.patient.referenceCode} requires blood group <strong>{topEmergencyCase.patient.bloodGroup}</strong>.
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              Compatible stock available
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1 text-xs">
          {hospitalBlood.map((b) => (
            <div
              key={b.group}
              className={`p-3 rounded-xl bg-slate-950 border ${
                topEmergencyCase?.patient.bloodGroup === b.group
                  ? 'border-rose-500 bg-rose-950/20 shadow-md shadow-rose-500/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-base font-bold text-white">{b.group}</strong>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                    b.freshness === 'LIVE'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : b.freshness === 'RECENT'
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  {b.freshness}
                </span>
              </div>
              <span className="text-lg font-bold text-rose-400 mt-1 block">
                {b.units} <small className="text-[10px] text-slate-400 font-normal">units</small>
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Updated {getRelativeTime(b.lastUpdated)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
