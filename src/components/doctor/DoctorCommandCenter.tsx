import { useState, useMemo } from 'react'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Droplet,
  ExternalLink,
  HelpCircle,
  Hospital as HospitalIcon,
  Stethoscope,
  Users,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import { useAppStore } from '@/store/appStore'
import { getDoctorProfile, getScopedDoctorReferrals, getHospitalSpecialists } from '@/services/doctorService'
import { getRelativeTime } from '@/utils/freshness'
import { MOCK_USERS } from '@/data/users'
import { MOCK_SPECIALISTS } from '@/data/specialists'

interface DoctorCommandCenterProps {
  user: AuthUser
  onOpenReferral: (referralId: string) => void
  onViewBlood: () => void
  onOpenQueue: () => void
}

export function DoctorCommandCenter({
  user,
  onOpenReferral,
  onViewBlood,
  onOpenQueue,
}: DoctorCommandCenterProps) {
  const referrals = useAppStore((state) => state.referrals)
  const hospitals = useAppStore((state) => state.hospitals)
  const auditEvents = useAppStore((state) => state.auditEvents)
  const bloodInventory = useAppStore((state) => state.bloodInventory)
  const setUser = useAppStore((state) => state.setUser)
  const accept = useAppStore((state) => state.acceptReferral)
  const decline = useAppStore((state) => state.declineReferral)
  const requestInfo = useAppStore((state) => state.requestInformation)

  const doctor = useMemo(() => getDoctorProfile(user), [user])
  const hospital = useMemo(
    () => hospitals.find((h) => h.id === doctor.hospitalId) || hospitals[0],
    [hospitals, doctor.hospitalId]
  )

  // Scoped patient queue for this doctor's hospital and clinical purview
  const authorizedReferrals = useMemo(
    () => getScopedDoctorReferrals(user, referrals),
    [user, referrals]
  )

  // Patient counts derived strictly from scoped data
  const counts = useMemo(() => {
    const active = authorizedReferrals.filter(
      (r) => !['COMPLETED', 'ARRIVED'].includes(r.status)
    ).length
    const critical = authorizedReferrals.filter(
      (r) =>
        r.patient.urgencyLevel === 'IMMEDIATE' ||
        r.patient.emergencyCategory === 'CARDIAC' ||
        r.patient.emergencyCategory === 'TRAUMA'
    ).length
    const awaitingReview = authorizedReferrals.filter(
      (r) => r.status === 'REVIEWING'
    ).length
    const infoRequested = authorizedReferrals.filter(
      (r) => r.infoRequested || r.decision?.type === 'INFO_REQUEST'
    ).length
    const accepted = authorizedReferrals.filter(
      (r) => r.status === 'ACCEPTED' || r.status === 'CONFIRMED'
    ).length

    return { active, critical, awaitingReview, infoRequested, accepted }
  }, [authorizedReferrals])

  // Current Patient Spotlight: prioritized waiting case or first authorized
  const currentPatient = useMemo(() => {
    return (
      authorizedReferrals.find((r) => r.status === 'REVIEWING') ||
      authorizedReferrals[0]
    )
  }, [authorizedReferrals])

  // Hospital Blood Inventory summary for key groups (O+, A+, B+, AB+)
  const hospitalBlood = useMemo(() => {
    const facilityStock = bloodInventory.filter((b) => b.hospitalId === doctor.hospitalId)
    const keyGroups = ['O+', 'A+', 'B+', 'AB+'] as const
    return keyGroups.map((group) => {
      const item = facilityStock.find(
        (b) => b.bloodGroup === group && b.component === 'PACKED_RBC'
      )
      return {
        group,
        units: item ? item.availableUnits : 0,
        status: item ? item.status : 'UNKNOWN',
        freshness: item ? item.freshness : 'CURRENT',
        lastUpdated: item ? item.lastUpdated : new Date().toISOString(),
      }
    })
  }, [bloodInventory, doctor.hospitalId])

  // Regional multi-hospital blood availability matrix (which hospital has which blood groups)
  const regionalHospitalsBlood = useMemo(() => {
    const list = [
      { id: 'H001', name: 'Apollo General Hospital', type: 'Private Tertiary' },
      { id: 'H002', name: 'Government District Hospital', type: 'Public District' },
      { id: 'H003', name: "St. Mary's Mission Hospital", type: 'Charitable' },
      { id: 'H004', name: 'Sunrise Trauma Centre', type: 'Trauma Specialty' },
    ]
    const targetGroups: Array<'O+' | 'A+' | 'B+' | 'AB+' | 'O-' | 'A-'> = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-']

    return list.map((h) => {
      const hospitalItems = bloodInventory.filter((b) => b.hospitalId === h.id)
      const groupStats = targetGroups.map((grp) => {
        const match =
          hospitalItems.find((b) => b.bloodGroup === grp && b.component === 'PACKED_RBC') ||
          hospitalItems.find((b) => b.bloodGroup === grp)
        return {
          group: grp,
          units: match ? match.availableUnits : 0,
          status: match ? match.status : 'FULL',
          verification: match ? match.verificationStatus : 'SELF_REPORTED',
          lastUpdated: match ? match.lastUpdated : new Date().toISOString(),
        }
      })
      const totalUnits = hospitalItems.reduce((s, i) => s + i.availableUnits, 0)
      return {
        ...h,
        totalUnits,
        groups: groupStats,
      }
    })
  }, [bloodInventory])

  // All network specialists directory
  const allNetworkDoctors = useMemo(() => {
    return MOCK_SPECIALISTS
  }, [])

  // Facility specialists roster for current doctor's hospital
  const specialists = useMemo(
    () => getHospitalSpecialists(doctor.hospitalId),
    [doctor.hospitalId]
  )

  // Recent clinical activity for this doctor/hospital
  const recentActivity = useMemo(() => {
    return auditEvents
      .filter(
        (a) =>
          a.actorRole === 'DOCTOR' ||
          a.action.includes('DOCTOR') ||
          a.action.includes('CLINICAL') ||
          a.targetId === currentPatient?.id
      )
      .slice(0, 4)
  }, [auditEvents, currentPatient?.id])

  // Clinical override and request info modal states
  const [requestModalId, setRequestModalId] = useState<string | null>(null)
  const [requestNotes, setRequestNotes] = useState('')
  const [overrideAck, setOverrideAck] = useState<Record<string, boolean>>({})

  const handleRequestSubmit = (id: string) => {
    if (!requestNotes.trim()) return
    requestInfo(id, requestNotes.trim())
    setRequestModalId(null)
    setRequestNotes('')
  }

  return (
    <div className="space-y-6">
      {/* ── Doctor Clinical Identity Header ───────────────────────────── */}
      <section className="bg-gradient-to-r from-slate-900 via-[#0d1527] to-cyan-950/50 border border-cyan-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
              <Stethoscope size={32} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/20">
                  {doctor.doctorCode}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Clinical Team Active
                </span>
                <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                  • {doctor.role}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {doctor.name}
              </h1>
              <p className="text-sm text-cyan-200/90 font-medium mt-0.5">
                {doctor.specialty} · {doctor.department}
              </p>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                <HospitalIcon size={14} className="text-cyan-400" />
                <span>{doctor.hospitalName}</span>
                <span>•</span>
                <span className="text-amber-300/90">
                  Clinical decisions by authorized medical professional only
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-start md:self-auto">
            {/* Quick Doctor Persona Switcher */}
            <div className="bg-black/50 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider mb-0.5">
                Switch Doctor Persona:
              </span>
              <select
                value={user.id}
                onChange={(e) => {
                  const targetDoc = MOCK_USERS.find((u) => u.id === e.target.value)
                  if (targetDoc) setUser(targetDoc)
                }}
                className="bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                {MOCK_USERS.filter((u) => u.role === 'DOCTOR').map((docUser) => (
                  <option key={docUser.id} value={docUser.id}>
                    {docUser.name} · {docUser.specialty} ({docUser.hospitalName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenQueue}
                className="btn-primary text-xs py-2.5 px-3.5 flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
              >
                <Stethoscope size={15} />
                <span>Patient Queue</span>
              </button>
              <button
                onClick={onViewBlood}
                className="btn-secondary text-xs py-2.5 px-3 flex items-center gap-1.5"
              >
                <Droplet size={15} className="text-rose-400" />
                <span>Blood Inventory</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notice of patient-level authorization */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
          <span>
            Queue scoped to: <strong>{doctor.hospitalName}</strong> · Authorized Specialty:{' '}
            <strong className="text-cyan-300">{doctor.specialty}</strong>
          </span>
          <span className="text-slate-500 hidden md:inline">
            Production backend enforces patient-level RBAC
          </span>
        </div>
      </section>

      {/* ── Operational Patient Counters ─────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Patients Requiring Review & purviews
          </h2>
          <span className="text-xs text-cyan-400 font-medium">
            {authorizedReferrals.length} Total Authorized Cases
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="card p-4 border-l-4 border-l-cyan-400 bg-slate-900/80">
            <span className="text-xs text-gray-400 block font-medium">Active Queue</span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-bold text-white">{counts.active}</strong>
              <small className="text-xs text-cyan-400">Active</small>
            </div>
          </div>

          <div className="card p-4 border-l-4 border-l-rose-500 bg-slate-900/80">
            <span className="text-xs text-gray-400 block font-medium">Critical Triage</span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-bold text-rose-400">{counts.critical}</strong>
              <small className="text-xs text-rose-300">Immediate</small>
            </div>
          </div>

          <div className="card p-4 border-l-4 border-l-amber-400 bg-slate-900/80">
            <span className="text-xs text-gray-400 block font-medium">Awaiting Review</span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-bold text-amber-300">{counts.awaitingReview}</strong>
              <small className="text-xs text-amber-400">Pending</small>
            </div>
          </div>

          <div className="card p-4 border-l-4 border-l-blue-400 bg-slate-900/80">
            <span className="text-xs text-gray-400 block font-medium">Info Requested</span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-bold text-blue-300">{counts.infoRequested}</strong>
              <small className="text-xs text-blue-400">Awaiting Telemetry</small>
            </div>
          </div>

          <div className="card p-4 border-l-4 border-l-emerald-400 bg-slate-900/80 col-span-2 sm:col-span-1">
            <span className="text-xs text-gray-400 block font-medium">Clinically Accepted</span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-bold text-emerald-400">{counts.accepted}</strong>
              <small className="text-xs text-emerald-300">Accepted</small>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Two-Column Operational Layout ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Current Patient Spotlight + Review Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Patient Spotlight */}
          {currentPatient && (
            <section className="card p-5 border-2 border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/90 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    CURRENT CLINICAL PATIENT SPOTLIGHT
                  </span>
                </div>
                <span className="text-xs font-mono bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 px-2.5 py-0.5 rounded">
                  #{currentPatient.patient.referenceCode} · {currentPatient.id}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>{currentPatient.patient.referenceCode.replace('CASE-2024-', 'Patient ')}</span>
                    <span className="text-sm font-normal text-gray-400">
                      ({currentPatient.patient.age}Y · {currentPatient.patient.sex})
                    </span>
                  </h3>
                  <p className="text-sm text-gray-300 mt-1 font-medium">
                    {currentPatient.patient.chiefComplaint}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <span className="text-[11px] text-gray-400 block">Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                    <Clock3 size={13} />
                    {currentPatient.status === 'REVIEWING'
                      ? 'WAITING FOR CLINICAL REVIEW'
                      : currentPatient.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Patient Vitals & Capabilities */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-400 block mb-0.5">Vitals Telemetry:</span>
                  <strong className="text-white font-mono">
                    {currentPatient.patient.vitalSummary || 'Standard monitoring'}
                  </strong>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-400 block mb-0.5">Patient Blood Group:</span>
                  <strong className="text-rose-400 font-bold flex items-center gap-1">
                    <Droplet size={14} />
                    {currentPatient.patient.bloodGroup ? (
                      `${currentPatient.patient.bloodGroup} (Verified in record)`
                    ) : (
                      <span className="text-gray-400 font-normal">Not recorded</span>
                    )}
                  </strong>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-400 block mb-0.5">Assigned Specialist:</span>
                  <strong className="text-cyan-300 font-medium">
                    {currentPatient.assignedDoctorName || doctor.name} ({currentPatient.assignedSpecialty || doctor.specialty})
                  </strong>
                </div>
              </div>

              {/* Required Capabilities tags */}
              <div className="mb-4">
                <span className="text-[11px] text-gray-400 block mb-1.5 font-medium">
                  Required Clinical Capabilities:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentPatient.requiredCapabilities.map((c) => (
                    <span
                      key={c.capabilityItem}
                      className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} className="text-cyan-400" />
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock3 size={13} />
                  Elapsed: {getRelativeTime(currentPatient.createdAt)}
                </span>
                <button
                  onClick={() => onOpenReferral(currentPatient.id)}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                >
                  <span>Open Clinical Review</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </section>
          )}

          {/* Clinical Review Queue List */}
          <section className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Stethoscope size={18} className="text-cyan-400" />
                  Clinical Decision Queue
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Triage and decision workflow for authorized incoming cases.
                </p>
              </div>
              <button
                onClick={onOpenQueue}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <span>View Full Queue</span>
                <ExternalLink size={12} />
              </button>
            </div>

            {authorizedReferrals.length ? (
              <div className="space-y-3">
                {authorizedReferrals.slice(0, 4).map((referral) => {
                  const sentHospital = hospitals.find((h) => h.id === referral.sentToFacilityId)
                  const isUnverified =
                    sentHospital &&
                    (sentHospital.verificationStatus !== 'VERIFIED' ||
                      sentHospital.capabilities.capabilities.some(
                        (c) => c.verificationStatus !== 'VERIFIED'
                      ))

                  return (
                    <div
                      key={referral.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400">
                              #{referral.patient.referenceCode}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {referral.patient.age}Y · {referral.patient.sex}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                referral.patient.urgencyLevel === 'IMMEDIATE'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {referral.patient.urgencyLevel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 mt-1 line-clamp-1">
                            {referral.patient.chiefComplaint}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => onOpenReferral(referral.id)}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <span>Review</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Request Info Banner if pending */}
                      {referral.infoRequested && (
                        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] flex items-center gap-2">
                          <HelpCircle size={14} />
                          <span>Info requested: &quot;{referral.infoRequestedNotes}&quot;</span>
                        </div>
                      )}

                      {/* Mini Action bar if in REVIEWING status */}
                      {referral.status === 'REVIEWING' && (
                        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-gray-400 text-[11px]">
                            Required Specialty:{' '}
                            <strong className="text-cyan-300">
                              {referral.requiredSpecialty || 'Clinical'}
                            </strong>
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {isUnverified && (
                              <label className="text-[11px] flex items-center gap-1.5 text-amber-300 cursor-pointer mr-2">
                                <input
                                  type="checkbox"
                                  checked={overrideAck[referral.id] || false}
                                  onChange={(e) =>
                                    setOverrideAck({ ...overrideAck, [referral.id]: e.target.checked })
                                  }
                                  className="w-3.5 h-3.5 rounded text-rose-500"
                                />
                                <span>Override unverified telemetry</span>
                              </label>
                            )}
                            <button
                              onClick={() => {
                                setRequestModalId(referral.id)
                                setRequestNotes('')
                              }}
                              className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-gray-300"
                            >
                              Request Info
                            </button>
                            <button
                              onClick={() =>
                                decline(
                                  referral.id,
                                  'Specialist capacity reached / Triage transfer'
                                )
                              }
                              className="text-[11px] px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30"
                            >
                              Decline
                            </button>
                            <button
                              disabled={Boolean(isUnverified && !overrideAck[referral.id])}
                              onClick={() =>
                                accept(
                                  referral.id,
                                  Boolean(isUnverified && overrideAck[referral.id]),
                                  isUnverified
                                    ? 'Clinical decision by authorized medical professional.'
                                    : ''
                                )
                              }
                              className="text-[11px] px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                <p>No referrals currently pending clinical triage in your queue.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column (1 col): Blood Inventory + Hospital Telemetry + Specialist Roster */}
        <div className="space-y-6">
          {/* Blood Availability Quick Glance */}
          <section className="card p-5 space-y-4 bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="text-rose-400" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Blood Availability
                </h3>
              </div>
              <span className="text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                Simulated Data
              </span>
            </div>

            <p className="text-xs text-gray-400">
              Reported inventory for <strong>{doctor.hospitalName}</strong>
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {hospitalBlood.map((b) => (
                <div
                  key={b.group}
                  className="bg-black/40 border border-slate-800 rounded-lg p-3 text-center"
                >
                  <span className="text-xs font-bold text-gray-400 block">{b.group}</span>
                  <strong className="text-xl font-bold text-white my-0.5 block">
                    {b.units} <small className="text-[10px] font-normal text-gray-400">units</small>
                  </strong>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      b.status === 'AVAILABLE'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : b.status === 'LIMITED'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-gray-400 pt-1 space-y-1">
              <div className="flex justify-between">
                <span>Source:</span>
                <strong className="text-slate-300">Hospital Blood Bank</strong>
              </div>
              <div className="flex justify-between">
                <span>Verification:</span>
                <strong className="text-cyan-400">Hospital-reported</strong>
              </div>
            </div>

            <button
              onClick={onViewBlood}
              className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-2"
            >
              <span>View Full Blood Inventory</span>
              <ArrowRight size={13} />
            </button>
          </section>

          {/* Hospital Operational Status & Specialist Team */}
          <section className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="text-cyan-400" size={18} />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Facility Specialists & Beds
              </h3>
            </div>

            {/* Bed availability summary */}
            {hospital?.capabilities.beds && (
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                <span className="text-gray-400 block font-medium">Operational Bed Capacity:</span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-900 border border-white/5">
                    <span className="text-[11px] text-gray-400 block">Emergency Bay</span>
                    <strong className="text-cyan-300 text-base">
                      {hospital.capabilities.beds.find((b) => b.category === 'EMERGENCY')
                        ?.availableBeds || 8}{' '}
                      Avail
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-white/5">
                    <span className="text-[11px] text-gray-400 block">ICU Beds</span>
                    <strong className="text-emerald-300 text-base">
                      {hospital.capabilities.beds.find((b) => b.category === 'ICU')
                        ?.availableBeds || 6}{' '}
                      Avail
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Specialist Roster for Facility */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 block">
                Specialist Team Reported Available:
              </span>
              <div className="space-y-2 text-xs">
                {specialists.slice(0, 4).map((spec) => (
                  <div
                    key={spec.id}
                    className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-white block">{spec.doctorName}</strong>
                      <small className="text-gray-400">{spec.specialty} · {spec.department}</small>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        spec.status === 'AVAILABLE'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : spec.status === 'ON_CALL'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {spec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Recent Clinical Activity */}
          <section className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock3 className="text-gray-400" size={16} />
              Recent Clinical Activity
            </h3>
            {recentActivity.length ? (
              <div className="space-y-2.5 text-xs">
                {recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="pb-2 border-b border-white/5 last:border-b-0 space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-200">{act.action}</strong>
                      <span className="text-[10px] text-gray-500">
                        {getRelativeTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {act.actorName} · Case #{act.targetLabel}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No recent clinical audit events logged.</p>
            )}
          </section>
        </div>
      </div>

      {/* ── Regional Multi-Hospital Blood Availability Matrix ─────────────── */}
      <section className="card p-6 space-y-4 border border-rose-500/20 bg-slate-900/90 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Droplet size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Regional Multi-Hospital Blood Availability Matrix
              </h3>
              <p className="text-xs text-gray-400">
                Live availability of blood groups across network facilities (Hospital-Reported Telemetry)
              </p>
            </div>
          </div>
          <button
            onClick={onViewBlood}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Open Detailed Blood Table</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {regionalHospitalsBlood.map((hosp) => (
            <div
              key={hosp.id}
              className={`p-4 rounded-xl border space-y-3 transition-all ${
                hosp.id === doctor.hospitalId
                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                  : 'bg-black/40 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{hosp.name}</h4>
                  <span className="text-[11px] text-gray-400">{hosp.type}</span>
                </div>
                {hosp.id === doctor.hospitalId && (
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                    Your Facility
                  </span>
                )}
              </div>

              {/* Blood group unit chips */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {hosp.groups.map((grp) => (
                  <div
                    key={grp.group}
                    className={`p-1.5 rounded-lg border text-center ${
                      grp.units > 0
                        ? grp.status === 'AVAILABLE'
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                        : 'bg-rose-950/20 border-rose-500/20 text-rose-400 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold block">{grp.group}</span>
                    <strong className="text-xs font-black block leading-none my-0.5">
                      {grp.units}{' '}
                      <small className="text-[9px] font-normal text-gray-400">units</small>
                    </strong>
                    <span className="text-[9px] uppercase font-semibold block scale-90">
                      {grp.units > 0 ? grp.status : 'None'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/5">
                <span>Total Units: <strong className="text-white">{hosp.totalUnits}</strong></span>
                <span className="text-cyan-400 font-medium">✓ Verified Stock</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Network Doctors & Specialists Clinical Directory ───────────── */}
      <section className="card p-6 space-y-4 border border-cyan-500/20 bg-slate-900/90 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Network Clinical Specialists & Doctors Directory ({allNetworkDoctors.length})
              </h3>
              <p className="text-xs text-gray-400">
                Department rosters, specialties, and on-call statuses across all regional facilities
              </p>
            </div>
          </div>
          <span className="text-xs text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-1 rounded font-semibold">
            Single Doctor Portal Central Hub
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {allNetworkDoctors.map((spec) => {
            const isCurrent = spec.doctorId === user.id
            const mockUserMatch = MOCK_USERS.find((u) => u.id === spec.doctorId)

            return (
              <div
                key={spec.id}
                className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/30 border-cyan-400 shadow-md shadow-cyan-500/10'
                    : 'bg-black/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{spec.doctorName}</h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-cyan-300">
                      {spec.specialty} · <span className="text-gray-400">{spec.department}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <HospitalIcon size={12} className="text-gray-500" />
                      {spec.hospitalName}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      spec.status === 'AVAILABLE'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : spec.status === 'ON_CALL'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {spec.status}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400 bg-slate-950/60 p-2 rounded border border-white/5 flex items-center justify-between">
                  <span>{spec.notes || 'Emergency on-call team'}</span>
                  <span className="text-gray-500 font-mono">{spec.doctorCode}</span>
                </div>

                {mockUserMatch && !isCurrent && (
                  <button
                    onClick={() => setUser(mockUserMatch)}
                    className="w-full text-xs py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                  >
                    <Stethoscope size={13} />
                    <span>Switch View to {spec.doctorName}</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Request Information Modal ─────────────────────────────────── */}
      {requestModalId && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirmation-modal card p-6 border border-amber-500/40"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <HelpCircle className="text-amber-400" size={20} /> Request Additional Clinical Information
            </h2>
            <p className="text-xs text-gray-300 mb-4">
              Specify required diagnostic tests or patient telemetry. Referral remains in clinical review.
            </p>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Information Requested <span className="text-amber-400">*</span>
              <textarea
                autoFocus
                rows={3}
                className="w-full mt-1.5"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="e.g. Please upload 12-lead ECG, troponin levels, and current blood pressure reading..."
              />
            </label>
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-secondary text-xs" onClick={() => setRequestModalId(null)}>
                Cancel
              </button>
              <button
                className="btn-primary text-xs"
                disabled={!requestNotes.trim()}
                onClick={() => handleRequestSubmit(requestModalId)}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
