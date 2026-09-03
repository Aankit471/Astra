import { useState } from 'react'
import {
  BedDouble,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Hospital,
  Phone,
  ShieldAlert,
  Stethoscope,
  User,
  X,
} from 'lucide-react'
import type { Referral } from '@/types/domain'

interface HospitalReferralDetailModalProps {
  referral: Referral
  onClose: () => void
  onAccept: (id: string) => void
  onReject: (id: string, reason: string) => void
  onAssignBed: (id: string, bedLabel: string) => void
  onEscalate: (id: string, reason: string) => void
  onRequestInfo: (id: string, notes: string) => void
}

export function HospitalReferralDetailModal({
  referral,
  onClose,
  onAccept,
  onReject,
  onAssignBed,
  onEscalate,
  onRequestInfo,
}: HospitalReferralDetailModalProps) {
  const [activeModalAction, setActiveModalAction] = useState<
    'REJECT' | 'ASSIGN_BED' | 'ESCALATE' | 'REQUEST_INFO' | null
  >(null)
  const [actionInput, setActionInput] = useState('')

  const p = referral.patient || {
    referenceCode: 'CASE-1042',
    age: 54,
    sex: 'MALE',
    chiefComplaint: 'Acute chest pain with ST-elevation in V1-V4',
    emergencyCategory: 'CARDIAC',
    urgencyLevel: 'IMMEDIATE',
  }

  const timelineSteps = [
    { title: 'Referral Created', time: '40m ago', done: true },
    { title: 'Referral Received by Hospital', time: '38m ago', done: true },
    { title: 'Clinical Review by Specialist', time: '25m ago', done: referral.status !== 'CREATED' },
    {
      title: 'Hospital Operations Decision',
      time: ['ACCEPTED', 'CONFIRMED', 'ARRIVED', 'COMPLETED'].includes(referral.status)
        ? 'Accepted'
        : 'In Review',
      done: ['ACCEPTED', 'CONFIRMED', 'ARRIVED', 'COMPLETED'].includes(referral.status),
    },
    {
      title: 'Bed Search & Allocation',
      time: ['CONFIRMED', 'ARRIVED', 'COMPLETED'].includes(referral.status) ? 'Allocated' : 'Pending',
      done: ['CONFIRMED', 'ARRIVED', 'COMPLETED'].includes(referral.status),
    },
    {
      title: 'Bed Assigned (CICU-04)',
      time: ['CONFIRMED', 'ARRIVED', 'COMPLETED'].includes(referral.status) ? 'CICU Bed C-04' : 'Pending',
      done: ['CONFIRMED', 'ARRIVED', 'COMPLETED'].includes(referral.status),
    },
    {
      title: 'Patient In Transit (108 ALS)',
      time: referral.status === 'ARRIVED' || referral.status === 'COMPLETED' ? 'Completed' : 'ETA 8m',
      done: referral.status === 'ARRIVED' || referral.status === 'COMPLETED',
    },
    {
      title: 'Patient Arrived at Hospital Bay',
      time: referral.status === 'ARRIVED' || referral.status === 'COMPLETED' ? 'Arrived' : 'Pending',
      done: referral.status === 'ARRIVED' || referral.status === 'COMPLETED',
    },
    {
      title: 'Formal Inpatient Admission',
      time: referral.status === 'COMPLETED' ? 'Admitted' : 'Pending',
      done: referral.status === 'COMPLETED',
    },
  ]

  const handleActionSubmit = () => {
    if (!actionInput.trim() && activeModalAction !== 'ASSIGN_BED') return

    if (activeModalAction === 'REJECT') onReject(referral.id, actionInput.trim())
    if (activeModalAction === 'ASSIGN_BED') onAssignBed(referral.id, actionInput.trim() || 'CICU Bed C-04 (AC)')
    if (activeModalAction === 'ESCALATE') onEscalate(referral.id, actionInput.trim())
    if (activeModalAction === 'REQUEST_INFO') onRequestInfo(referral.id, actionInput.trim())

    setActiveModalAction(null)
    setActionInput('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="presentation"
    >
      <div className="bg-[#0B111E] border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {referral.id}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                {referral.status}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {p.urgencyLevel}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Emergency Referral Dossier · {p.referenceCode || 'Incoming Emergency Patient'}
            </h2>
            <p className="text-xs text-slate-400">
              Referring Facility: <strong>Indiranagar 108 Emergency Ambulance Unit</strong> · ETA: ~8 mins
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── 4 SECTION GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Section 1: Referral Information */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-xs">
              <Hospital size={14} className="text-cyan-400" /> Referral Information
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 block">Referral ID:</span>
                <strong className="font-mono text-white">{referral.id}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Patient ID:</span>
                <strong className="font-mono text-cyan-300">PAT-1042</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Referring Facility:</span>
                <strong className="text-white">Indiranagar 108 ALS</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Referring Doctor:</span>
                <strong className="text-white">Dr. K. S. Murthy (EMS Lead)</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Required Specialty:</span>
                <strong className="text-cyan-300">Interventional Cardiology</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Required Capability:</span>
                <strong className="text-cyan-300">Cath Lab & 24/7 Primary PCI</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Patient Summary */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-xs">
              <User size={14} className="text-cyan-400" /> Patient Summary
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 block">Patient Reference:</span>
                <strong className="text-white">{p.referenceCode}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Age & Sex:</span>
                <strong className="text-white">{p.age} Yrs · {p.sex}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-500 block">Chief Complaint:</span>
                <p className="text-rose-300 font-medium text-[11px]">{p.chiefComplaint}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-500 block">Reported Symptoms & Vitals:</span>
                <p className="text-slate-400 text-[11px]">
                  BP 88/54 mmHg, HR 112 bpm, SpO2 91% on room air. Diaphoresis, severe crushing retrosternal pain radiating to left jaw.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Summary */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-xs">
              <Stethoscope size={14} className="text-cyan-400" /> Clinical Summary by Referring Facility
            </h3>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              12-lead ECG conducted at scene reveals 3.5mm ST-elevation in leads V1-V4 with reciprocal depressions in II, III, aVF. Patient administered Aspirin 325mg chewed and Clopidogrel 300mg loading dose at 07:15. IV access secured (18G right antecubital). Oxygen initiated at 4L/min via nasal cannula. Urgent coronary angiography and catheterization indicated.
            </p>
            <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Emergency Telemetry Verified:</span>
              <strong className="text-emerald-400">✓ ECG & Telemetry Uploaded</strong>
            </div>
          </div>

          {/* Section 4: Bed Requirements */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-xs">
              <BedDouble size={14} className="text-cyan-400" /> Bed & Resource Requirements
            </h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between p-1.5 rounded bg-black/40">
                <span className="text-slate-400">Required Ward:</span>
                <strong className="text-cyan-300">Coronary Intensive Care (CICU)</strong>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-black/40">
                <span className="text-slate-400">Required Bed Type:</span>
                <strong className="text-white">Monitored Climate-Controlled Bed (AC)</strong>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-black/40">
                <span className="text-slate-400">Equipment Requirements:</span>
                <strong className="text-white">Cardiac Monitor, Defibrillator, Cath Lab</strong>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-black/40">
                <span className="text-slate-400">Isolation Requirement:</span>
                <strong className="text-slate-300">Standard Isolation (No Airborne Req)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── REFERRAL OPERATIONS TIMELINE ── */}
        <section className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock3 size={14} className="text-cyan-400" /> Referral Operations Timeline
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
            {timelineSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-center text-xs space-y-1 ${
                  step.done
                    ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-black/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1 font-bold text-[10px]">
                  {step.done ? (
                    <CheckCircle2 size={12} className="text-cyan-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                  <span>Step {idx + 1}</span>
                </div>
                <strong className="block text-[11px] leading-tight text-white">{step.title}</strong>
                <span className="text-[10px] text-slate-400 block">{step.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── ACTION BUTTONS ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <a
              href="tel:108"
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Phone size={13} />
              <span>Contact Referring EMS (108)</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveModalAction('REQUEST_INFO')}
              className="px-3 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition flex items-center gap-1"
            >
              <HelpCircle size={13} />
              <span>Request Information</span>
            </button>

            <button
              onClick={() => setActiveModalAction('ESCALATE')}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition flex items-center gap-1"
            >
              <ShieldAlert size={13} />
              <span>Escalate</span>
            </button>

            <button
              onClick={() => setActiveModalAction('REJECT')}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
            >
              Reject Referral
            </button>

            <button
              onClick={() => setActiveModalAction('ASSIGN_BED')}
              className="px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 transition flex items-center gap-1"
            >
              <BedDouble size={13} />
              <span>Assign Bed</span>
            </button>

            <button
              onClick={() => {
                onAccept(referral.id)
                onClose()
              }}
              className="btn-primary text-xs py-2 px-4 shadow-lg shadow-cyan-500/20"
            >
              Accept Referral
            </button>
          </div>
        </div>

        {/* Action Prompt Dialog */}
        {activeModalAction && (
          <div className="p-4 rounded-xl bg-black/70 border border-cyan-500/40 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {activeModalAction === 'REJECT' && 'Reject Referral Transfer'}
              {activeModalAction === 'ASSIGN_BED' && 'Assign Target Bed to Patient'}
              {activeModalAction === 'ESCALATE' && 'Escalate Case to Central Network Lead'}
              {activeModalAction === 'REQUEST_INFO' && 'Request Diagnostic or Vitals Information'}
            </h4>

            {activeModalAction === 'ASSIGN_BED' ? (
              <select
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="CICU Bed C-04 (AC Monitored)">CICU Bed C-04 (AC Monitored) — Available</option>
                <option value="CICU Bed C-06 (AC Monitored)">CICU Bed C-06 (AC Monitored) — Available</option>
                <option value="Cardiology Step-Down CSD-08 (AC Private)">Cardiology Step-Down CSD-08 (AC Private)</option>
                <option value="Emergency Bay 2 (AC Monitored)">Emergency Bay 2 (AC Monitored)</option>
              </select>
            ) : (
              <textarea
                rows={2}
                placeholder={
                  activeModalAction === 'REJECT'
                    ? 'State clinical or capacity reason for rejecting referral...'
                    : activeModalAction === 'ESCALATE'
                    ? 'State escalation priority and reason...'
                    : 'Specify diagnostic tests, vitals, or imaging requested...'
                }
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModalAction(null)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Submit Action
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
