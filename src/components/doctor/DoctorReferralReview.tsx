import { useState, useMemo, useEffect } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  Clock3,
  Droplet,
  HelpCircle,
  Hospital as HospitalIcon,
  Info,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import type { Hospital, Referral } from '@/types/domain'
import { useAppStore } from '@/store/appStore'
import {
  canDoctorAccessReferral,
  getDoctorProfile,
  getRelevantBloodForPatient,
} from '@/services/doctorService'
import { CapabilityMatchMatrix } from '@/components/data-display/CapabilityMatchMatrix'
import { ReferralMap } from '@/components/map/ReferralMap'
import { getRelativeTime } from '@/utils/freshness'

interface DoctorReferralReviewProps {
  referral: Referral
  user: AuthUser
  hospitals: Hospital[]
  onBack: () => void
}

export function DoctorReferralReview({
  referral,
  user,
  hospitals,
  onBack,
}: DoctorReferralReviewProps) {
  const doctor = useMemo(() => getDoctorProfile(user), [user])
  const accept = useAppStore((state) => state.acceptReferral)
  const decline = useAppStore((state) => state.declineReferral)
  const requestInfo = useAppStore((state) => state.requestInformation)
  const bloodInventory = useAppStore((state) => state.bloodInventory)

  const isAuthorized = useMemo(
    () => canDoctorAccessReferral(user, referral),
    [user, referral]
  )

  const facility = useMemo(
    () => hospitals.find((h) => h.id === referral.sentToFacilityId) || hospitals[0],
    [hospitals, referral.sentToFacilityId]
  )

  // Capability verification status for clinical override check
  const isUnverified = useMemo(() => {
    if (!facility) return false
    return (
      facility.verificationStatus !== 'VERIFIED' ||
      facility.capabilities.capabilities.some((c) => c.verificationStatus !== 'VERIFIED')
    )
  }, [facility])

  // Relevant blood inventory for this patient's blood group
  const bloodInfo = useMemo(() => {
    return getRelevantBloodForPatient(referral.patient, bloodInventory)
  }, [referral.patient, bloodInventory])

  // Facility bed summary
  const beds = useMemo(() => facility?.capabilities.beds || [], [facility])

  // Modals & Action States
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [requestNotes, setRequestNotes] = useState('')
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('Specialist unavailable / Clinical capacity exceeded')
  const [overrideAck, setOverrideAck] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRequestModalOpen(false)
        setDeclineModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Unauthorized Barrier
  if (!isAuthorized) {
    return (
      <div className="card p-8 text-center space-y-4 max-w-xl mx-auto my-12 border-rose-500/40 bg-slate-900/90 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">ACCESS RESTRICTED</h2>
        <p className="text-xs text-gray-300 leading-relaxed">
          You are not authorized to view or review this patient record. Patient clinical files are
          strictly scoped to the receiving facility (<strong>{referral.sentToFacilityName || 'Assigned Facility'}</strong>)
          and authorized specialty team.
        </p>
        <div className="p-3 bg-black/40 rounded border border-white/5 text-[11px] text-amber-300 font-mono">
          Production backend must enforce patient-level authorization.
        </div>
        <button onClick={onBack} className="btn-primary text-xs py-2 px-4 mx-auto">
          <ArrowLeft size={14} />
          <span>Return to Authorized Queue</span>
        </button>
      </div>
    )
  }

  const handleAccept = () => {
    accept(
      referral.id,
      overrideAck,
      isUnverified ? 'Clinical decision by authorized medical professional.' : ''
    )
    setActionSuccess('Referral clinically accepted. Operational confirmation notified.')
  }

  const handleDecline = () => {
    if (!declineReason.trim()) return
    decline(referral.id, declineReason.trim())
    setDeclineModalOpen(false)
    setActionSuccess('Referral declined by clinical team. Automatic escalation initiated.')
  }

  const handleRequestSubmit = () => {
    if (!requestNotes.trim()) return
    requestInfo(referral.id, requestNotes.trim())
    setRequestModalOpen(false)
    setRequestNotes('')
    setActionSuccess('Additional clinical information requested from originating emergency team.')
  }

  return (
    <div className="space-y-6">
      {/* ── Top Back Button & "YOU ARE VIEWING AS" Compact Banner ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={onBack}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 self-start"
        >
          <ArrowLeft size={14} />
          <span>Back to Clinical Queue</span>
        </button>

        {/* Compact "YOU ARE VIEWING AS" card */}
        <div className="bg-slate-900 border border-cyan-500/30 rounded-xl px-4 py-2 flex items-center gap-3 text-xs shadow-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              YOU ARE VIEWING AS
            </span>
            <span className="text-white font-semibold">
              {doctor.name} · <span className="text-cyan-300">{doctor.specialty}</span>
            </span>
            <span className="text-gray-400 ml-1.5 hidden md:inline">
              ({doctor.hospitalName} · Authorized Clinical Reviewer)
            </span>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ── Current Clinical Review Master Hero ──────────────────────── */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                #{referral.patient.referenceCode} · {referral.id}
              </span>
              <span className="text-xs font-semibold text-gray-400">
                Created {getRelativeTime(referral.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {referral.patient.referenceCode.replace('CASE-2024-', 'Patient ')},{' '}
              <span className="text-cyan-300">
                {referral.patient.age}Y {referral.patient.sex}
              </span>
            </h1>
            <p className="text-sm text-gray-300 mt-1 font-medium">
              {referral.patient.chiefComplaint}
            </p>
          </div>

          <div className="shrink-0 text-left md:text-right">
            <span className="text-xs text-gray-400 block mb-1">Triage Review Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                referral.status === 'REVIEWING'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                  : referral.status === 'ACCEPTED'
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border border-slate-700 text-gray-300'
              }`}
            >
              <Clock3 size={13} />
              {referral.status === 'REVIEWING'
                ? 'AWAITING CLINICAL DECISION'
                : referral.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Clinical Summary Grid: WHO, WHO IS VIEWING, WHY, REVIEW STATUS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
            <span className="text-gray-400 text-[11px] block uppercase tracking-wider font-semibold mb-1">
              PATIENT IDENTITY
            </span>
            <strong className="text-white text-sm block">
              {referral.patient.age}Y · {referral.patient.sex}
            </strong>
            <span className="text-gray-400 block mt-0.5">
              Category: <strong className="text-rose-400">{referral.patient.emergencyCategory}</strong>
            </span>
          </div>

          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
            <span className="text-gray-400 text-[11px] block uppercase tracking-wider font-semibold mb-1">
              ASSIGNED SPECIALIST
            </span>
            <strong className="text-cyan-300 text-sm block">
              {referral.assignedDoctorName || doctor.name}
            </strong>
            <span className="text-gray-400 block mt-0.5">
              {referral.assignedSpecialty || doctor.specialty} · {doctor.doctorCode}
            </span>
          </div>

          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
            <span className="text-gray-400 text-[11px] block uppercase tracking-wider font-semibold mb-1">
              RECEIVING FACILITY
            </span>
            <strong className="text-white text-sm block">{facility.name}</strong>
            <span className="text-gray-400 block mt-0.5">
              Department: {referral.assignedDepartment || doctor.department}
            </span>
          </div>

          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
            <span className="text-gray-400 text-[11px] block uppercase tracking-wider font-semibold mb-1">
              PURPOSE OF REVIEW
            </span>
            <strong className="text-amber-300 text-sm block">Clinical Intake Triage</strong>
            <span className="text-gray-400 block mt-0.5">
              Emergency transfer acceptance decision
            </span>
          </div>
        </div>

        {/* Patient Vitals & Clinical Telemetry */}
        {referral.patient.vitalSummary && (
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              <span className="text-gray-400">Reported Emergency Vitals:</span>
              <strong className="text-white font-mono">{referral.patient.vitalSummary}</strong>
            </div>
            {referral.patient.relevantHistory && (
              <span className="text-gray-400">
                History: <strong className="text-slate-200">{referral.patient.relevantHistory}</strong>
              </span>
            )}
          </div>
        )}
      </section>

      {/* ── Specialist Assignment & Multi-Specialty Consultations ──────── */}
      <section className="card p-5 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Stethoscope className="text-cyan-400" size={16} />
          Specialist Team Assignment & Consultations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-gray-400 block mb-0.5">Required Specialty:</span>
            <strong className="text-base text-cyan-300 font-bold block">
              {referral.requiredSpecialty || 'Cardiology'}
            </strong>
            <small className="text-gray-500">Based on emergency diagnosis</small>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-gray-400 block mb-0.5">Assigned Clinical Team:</span>
            <strong className="text-base text-white font-bold block">
              {referral.assignedTeam || 'Emergency Cardiology Desk'}
            </strong>
            <small className="text-gray-400">
              Lead: {referral.assignedDoctorName || doctor.name} ({referral.assignedDoctorCode || doctor.doctorCode})
            </small>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-gray-400 block mb-0.5">Consulting Specialties:</span>
            {referral.consultingSpecialties && referral.consultingSpecialties.length ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {referral.consultingSpecialties.map((spec) => (
                  <span
                    key={spec}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-[11px]"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 font-normal">No secondary consults requested</span>
            )}
          </div>
        </div>
      </section>

      {/* ── Patient-Specific Blood Need & Relevant Blood Availability ─── */}
      <section className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Droplet className="text-rose-400" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Patient Blood Group & Relevant Regional Inventory
            </h3>
          </div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Operational Visibility Only
          </span>
        </div>

        {/* Patient Blood Group Header Card */}
        {bloodInfo.hasVerifiedNeed && bloodInfo.patientBloodGroup ? (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-mono font-black text-xl">
                {bloodInfo.patientBloodGroup}
              </div>
              <div>
                <span className="text-xs text-rose-300 font-bold block">
                  Patient Blood Group: {bloodInfo.patientBloodGroup}
                </span>
                <p className="text-[11px] text-gray-300">
                  Explicitly verified in patient emergency intake telemetry.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-gray-400 bg-black/40 p-2 rounded border border-white/5">
              <span>Transfusion decision: </span>
              <strong className="text-amber-300">Direct physician evaluation required</strong>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-gray-400 flex items-center gap-2">
            <Info size={16} className="text-gray-500" />
            <span>
              No blood group explicitly verified in current telemetry. ASTRA does not infer blood
              group from symptoms or condition.
            </span>
          </div>
        )}

        {/* Relevant Stock Across Facilities */}
        {bloodInfo.hasVerifiedNeed && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-300 block">
              Reported Available {bloodInfo.patientBloodGroup} Stock by Hospital:
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                  <tr>
                    <th className="py-2.5 px-3">Hospital</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3">Component</th>
                    <th className="py-2.5 px-3 text-center">Available Units</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Telemetry Freshness</th>
                    <th className="py-2.5 px-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bloodInfo.relevantStock.map((b) => {
                    const isStale = b.freshness === 'STALE' || b.status === 'STALE'
                    const isReceiving = b.hospitalId === facility.id

                    return (
                      <tr
                        key={b.id}
                        className={`hover:bg-white/[0.02] ${
                          isReceiving ? 'bg-cyan-500/5 font-medium' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <strong className="text-white block">{b.hospitalName}</strong>
                          {isReceiving && (
                            <span className="text-[10px] text-cyan-400">
                              (Receiving Facility)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                          {b.bloodGroup}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {b.component.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-white text-sm">
                          {b.availableUnits}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'AVAILABLE'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : b.status === 'LIMITED'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                          {getRelativeTime(b.lastUpdated)} {isStale && '· ⚠ Stale'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                          {b.verificationStatus === 'VERIFIED' ? '✓ Verified' : 'Self-reported'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Facility Bed Availability ─────────────────────────────────── */}
      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BedDouble className="text-cyan-400" size={16} />
            Facility Bed Availability ({facility.name})
          </h3>
          <span className="text-xs text-gray-400">
            Updated {getRelativeTime(facility.lastUpdated)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {beds.map((b) => (
            <div key={b.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-gray-400 block text-[11px]">
                {b.category} · {b.roomType}
              </span>
              <strong className="text-lg font-bold text-white my-0.5 block">
                {b.availableBeds}{' '}
                <small className="text-[10px] font-normal text-gray-400">
                  / {b.totalBeds} beds
                </small>
              </strong>
              <span
                className={`text-[10px] font-bold px-2 py-0.2 rounded-full inline-block ${
                  b.availabilityStatus === 'AVAILABLE'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : b.availabilityStatus === 'LIMITED'
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {b.availabilityStatus}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Clinical Review Decisions & Override Action Bar ───────────── */}
      <section className="card p-6 border-2 border-cyan-500/30 bg-gradient-to-r from-slate-900 to-cyan-950/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-cyan-400" size={18} />
              Clinical Triage Decision Actions
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Decisions must be rendered by authorized clinical personnel.
            </p>
          </div>
          <span className="text-xs text-cyan-300 font-semibold font-mono bg-black/40 px-2.5 py-1 rounded border border-white/5">
            {referral.status}
          </span>
        </div>

        {/* Clinical Override Warning banner if facility capabilities contain unverified telemetry */}
        {isUnverified && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <AlertTriangle size={16} />
              <span>Clinical Override Warning: Capability Data Contains Unverified Telemetry</span>
            </div>
            <p className="text-gray-300 text-[11px]">
              Capability telemetry for {facility.name} contains self-reported or stale items. Clinical
              decision by authorized medical professional required.
            </p>
            <label className="flex items-start gap-2.5 mt-2 font-medium text-white cursor-pointer select-none bg-black/30 p-2.5 rounded border border-rose-500/20">
              <input
                type="checkbox"
                checked={overrideAck}
                onChange={(e) => setOverrideAck(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-rose-500 bg-gray-800 border-gray-600 focus:ring-rose-400"
              />
              <span className="text-xs text-slate-200">
                I acknowledge that facility telemetry may be unverified or stale, and I am rendering
                this clinical acceptance based on my professional medical evaluation.
              </span>
            </label>
          </div>
        )}

        {/* Clinical Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-[11px] text-amber-300 flex items-center gap-1">
            <ShieldCheck size={14} />
            Clinical decision by authorized medical professional.
          </span>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setRequestModalOpen(true)
                setRequestNotes('')
              }}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <HelpCircle size={15} />
              <span>Request More Information</span>
            </button>

            <button
              onClick={() => {
                setDeclineModalOpen(true)
              }}
              className="btn-danger text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <XCircle size={15} />
              <span>Decline & Escalate</span>
            </button>

            <button
              disabled={Boolean(isUnverified && !overrideAck)}
              onClick={handleAccept}
              className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-md shadow-cyan-500/10"
            >
              <CheckCircle2 size={16} />
              <span>Accept Referral</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Capability Matrix & Map ──────────────────────────────────── */}
      <section className="detail-layout">
        <div className="detail-main">
          <section className="detail-section">
            <h3>
              <HospitalIcon size={16} /> Capability Matching Breakdown
            </h3>
            <CapabilityMatchMatrix required={referral.requiredCapabilities} hospital={facility} />
          </section>

          <section className="detail-section">
            <h3>
              <Clock3 size={16} /> Clinical Referral Audit Timeline
            </h3>
            <div className="detail-timeline">
              {referral.timeline.map((event) => (
                <div key={event.id}>
                  <span />
                  <div>
                    <strong>{event.event}</strong>
                    <small>
                      {event.actor || 'ASTRA System'} · {new Date(event.timestamp).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <ReferralMap referral={referral} hospitals={hospitals} />
      </section>

      {/* ── Request Information Modal ─────────────────────────────────── */}
      {requestModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirmation-modal card p-6 border border-amber-500/40"
            role="dialog"
            aria-modal="true"
          >
            <button className="modal-close" onClick={() => setRequestModalOpen(false)}>
              <X size={18} />
            </button>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <HelpCircle className="text-amber-400" size={20} /> Request Additional Clinical Information
            </h2>
            <p className="text-xs text-gray-300 mb-4">
              Specify required tests, troponin, ECG, or vitals. Referral remains in triage queue.
            </p>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Information Requested <span className="text-amber-400">*</span>
              <textarea
                autoFocus
                rows={3}
                className="w-full mt-1.5"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="e.g. Please upload 12-lead ECG, troponin I levels, and current arterial blood gas..."
              />
            </label>
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-secondary text-xs" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-primary text-xs"
                disabled={!requestNotes.trim()}
                onClick={handleRequestSubmit}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Decline & Escalate Modal ──────────────────────────────────── */}
      {declineModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirmation-modal card p-6 border border-rose-500/40"
            role="dialog"
            aria-modal="true"
          >
            <button className="modal-close" onClick={() => setDeclineModalOpen(false)}>
              <X size={18} />
            </button>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <XCircle className="text-rose-400" size={20} /> Decline Referral Transfer
            </h2>
            <p className="text-xs text-gray-300 mb-4">
              Declining initiates immediate automated escalation to the next verified capability
              facility in the network.
            </p>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Decline Clinical Rationale <span className="text-rose-400">*</span>
              <textarea
                autoFocus
                rows={3}
                className="w-full mt-1.5"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </label>
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-secondary text-xs" onClick={() => setDeclineModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-danger text-xs"
                disabled={!declineReason.trim()}
                onClick={handleDecline}
              >
                Confirm Decline & Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
