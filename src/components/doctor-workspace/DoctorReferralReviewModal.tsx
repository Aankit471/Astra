import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  HeartPulse,
  Hospital,
  ShieldAlert,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react'
import type { Referral } from '@/types/domain'

interface DoctorReferralReviewModalProps {
  referral: Referral
  onClose: () => void
  onAccept: (id: string, notes?: string) => void
  onReject: (id: string, reason: string) => void
  onEscalate: (id: string, reason: string) => void
  onRequestInfo: (id: string, notes: string) => void
}

export function DoctorReferralReviewModal({
  referral,
  onClose,
  onAccept,
  onReject,
  onEscalate,
  onRequestInfo,
}: DoctorReferralReviewModalProps) {
  const [activeActionModal, setActiveActionModal] = useState<
    'ACCEPT' | 'REJECT' | 'ESCALATE' | 'REQUEST_INFO' | null
  >(null)
  const [modalInputText, setModalInputText] = useState('')

  // Structured Clinical Review Form State
  const [clinicalAssessment, setClinicalAssessment] = useState(
    'Acute Coronary Syndrome with ongoing myocardial ischemia. Urgent coronary revascularization indicated.'
  )
  const [reviewFindings, setReviewFindings] = useState(
    '12-lead ECG confirms hyperacute anterior ST-elevation. Hemodynamics tenuous with impending cardiogenic shock.'
  )
  const [recommendation, setRecommendation] = useState(
    'Immediate transfer to Cath Lab Suite 1 for primary PCI. Reserve CICU Bed C-04 with ventilator backup.'
  )
  const [urgencyLevel, setUrgencyLevel] = useState<'IMMEDIATE' | 'URGENT' | 'SEMI_URGENT'>(
    (referral.patient?.urgencyLevel as 'IMMEDIATE' | 'URGENT' | 'SEMI_URGENT') || 'IMMEDIATE'
  )
  const [additionalInfoNeeded, setAdditionalInfoNeeded] = useState(
    'Confirmation of antiplatelet loading dose timing and pre-hospital IV access gauge.'
  )

  const handleActionConfirm = () => {
    if (activeActionModal === 'ACCEPT') {
      onAccept(referral.id, `${clinicalAssessment} | ${recommendation}`)
    } else if (activeActionModal === 'REJECT') {
      if (!modalInputText.trim()) return
      onReject(referral.id, modalInputText.trim())
    } else if (activeActionModal === 'ESCALATE') {
      if (!modalInputText.trim()) return
      onEscalate(referral.id, modalInputText.trim())
    } else if (activeActionModal === 'REQUEST_INFO') {
      if (!modalInputText.trim()) return
      onRequestInfo(referral.id, modalInputText.trim())
    }
    setActiveActionModal(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
      role="presentation"
    >
      <div className="bg-[#09101d] border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-slate-100">
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                {referral.id}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {urgencyLevel}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                STATUS: {referral.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Physician Clinical Review & Referral Evaluation
            </h2>
            <p className="text-xs text-slate-400">
              Patient: <strong>{referral.patient?.referenceCode || 'Emergency Inpatient'}</strong> ({referral.patient?.age || 54}Y/{referral.patient?.sex || 'M'})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── SECTION 1: REFERRAL INFO & CLINICAL SUMMARY ───────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Referral Info */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Hospital size={14} className="text-teal-400" /> Referral Information
            </h4>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Referring Facility:</span>
                <strong className="text-white">Indiranagar 108 ALS Ambulance</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referring Doctor:</span>
                <strong className="text-slate-200">Dr. K. S. Murthy (EMS Lead)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Specialty:</span>
                <strong className="text-teal-300">Interventional Cardiology</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referral Reason:</span>
                <strong className="text-rose-300">{referral.patient?.chiefComplaint || 'Acute STEMI'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created Timestamp:</span>
                <span className="font-mono text-slate-400">{referral.createdAt || '25m ago'}</span>
              </div>
            </div>
          </div>

          {/* Clinical Summary */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse size={14} className="text-teal-400" /> EMS Clinical Summary
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <div>
                <span className="text-slate-500 text-[10px] block">Chief Complaint & Symptoms:</span>
                <p className="text-slate-200 font-medium">
                  Severe retrosternal chest pain with diaphoresis and shortness of breath for 90 minutes.
                </p>
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/5 grid grid-cols-3 gap-2 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Vitals BP</span>
                  <strong className="text-rose-400 text-xs">88/54</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Vitals HR</span>
                  <strong className="text-rose-400 text-xs">114 bpm</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SpO2</span>
                  <strong className="text-amber-400 text-xs">92% O2</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: REQUIRED CAPABILITIES & DOCUMENTS ──────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-teal-400" /> Required Facility Capabilities
            </h4>
            <div className="space-y-1.5">
              <div className="p-2 rounded bg-teal-950/30 border border-teal-500/30 flex items-center justify-between text-teal-300">
                <span>✓ 24/7 Primary Angioplasty / Cath Lab</span>
                <span className="text-[10px] font-bold bg-teal-500/20 px-1.5 py-0.2 rounded">VERIFIED</span>
              </div>
              <div className="p-2 rounded bg-teal-950/30 border border-teal-500/30 flex items-center justify-between text-teal-300">
                <span>✓ Intensive Coronary Care Unit (CICU) Bed</span>
                <span className="text-[10px] font-bold bg-teal-500/20 px-1.5 py-0.2 rounded">AVAILABLE</span>
              </div>
              <div className="p-2 rounded bg-teal-950/30 border border-teal-500/30 flex items-center justify-between text-teal-300">
                <span>✓ Blood Bank Packed RBC (O-neg / B-pos)</span>
                <span className="text-[10px] font-bold bg-teal-500/20 px-1.5 py-0.2 rounded">IN STOCK</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-teal-400" /> Attached Clinical Documents
            </h4>
            <div className="space-y-1.5">
              <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-slate-300">
                <span>12-Lead Emergency ECG Trace (STE V1-V4)</span>
                <span className="text-[10px] text-teal-400 font-mono">1.4 MB</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-slate-300">
                <span>Paramedic Triage & Vitals Checklist</span>
                <span className="text-[10px] text-teal-400 font-mono">420 KB</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: STRUCTURED CLINICAL REVIEW FORM ────────────────── */}
        <div className="p-5 rounded-xl bg-[#0a1424] border border-teal-500/30 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Stethoscope size={18} className="text-teal-400" />
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">
              Attending Physician Structured Clinical Assessment
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Clinical Assessment Summary
              </label>
              <textarea
                rows={2}
                value={clinicalAssessment}
                onChange={(e) => setClinicalAssessment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Review Findings & ECG Interpretation
              </label>
              <textarea
                rows={2}
                value={reviewFindings}
                onChange={(e) => setReviewFindings(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Clinical Urgency Level
              </label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as typeof urgencyLevel)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
              >
                <option value="IMMEDIATE">Immediate (Crash / STEMI / Stroke)</option>
                <option value="URGENT">Urgent (&lt; 2 Hours)</option>
                <option value="SEMI_URGENT">Semi-Urgent (&lt; 6 Hours)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Physician Recommendation & Next Clinical Step
              </label>
              <input
                type="text"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Additional Information Required from EMS / Hospital Staff (Optional)
            </label>
            <input
              type="text"
              value={additionalInfoNeeded}
              onChange={(e) => setAdditionalInfoNeeded(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
            />
          </div>
        </div>

        {/* ── SECTION 4: ACTIONS ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveActionModal('REJECT')
                setModalInputText('')
              }}
              className="px-3 py-2 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold"
            >
              Reject Referral
            </button>
            <button
              onClick={() => {
                setActiveActionModal('ESCALATE')
                setModalInputText('Specialist shortage or delayed bed assignment escalation.')
              }}
              className="px-3 py-2 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-semibold"
            >
              Escalate
            </button>
            <button
              onClick={() => {
                setActiveActionModal('REQUEST_INFO')
                setModalInputText('Please transmit repeat 12-lead ECG and confirmation of IV cannula site.')
              }}
              className="px-3 py-2 rounded-xl border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold"
            >
              Request More Information
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-secondary text-xs py-2 px-4">
              Cancel
            </button>
            <button
              onClick={() => {
                setActiveActionModal('ACCEPT')
                setModalInputText('Immediate transfer to Cath Lab approved by Dr. Sarah Jenkins.')
              }}
              className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
            >
              <CheckCircle2 size={16} />
              <span>Accept Referral</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirmation Dialog Sub-Modal ─────────────────────────────── */}
      {activeActionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" role="presentation">
          <div className="bg-[#0b1322] border border-teal-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm">
              {activeActionModal === 'ACCEPT' && <CheckCircle2 size={20} className="text-teal-400" />}
              {activeActionModal === 'REJECT' && <XCircle size={20} className="text-rose-400" />}
              {activeActionModal === 'ESCALATE' && <AlertTriangle size={20} className="text-amber-400" />}
              {activeActionModal === 'REQUEST_INFO' && <HeartPulse size={20} className="text-cyan-400" />}
              <span>Confirm Clinical Action: {activeActionModal}</span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              {activeActionModal === 'ACCEPT' &&
                'Are you sure you want to clinically accept this referral and commit cath lab/bed resources at Metro Central Hospital?'}
              {activeActionModal === 'REJECT' &&
                'Please enter the clinical justification for declining this referral. A clinical audit log will record this decision.'}
              {activeActionModal === 'ESCALATE' &&
                'Escalate this referral to Central Facility Medical Director and Chief of Trauma Operations.'}
              {activeActionModal === 'REQUEST_INFO' &&
                'Request urgent diagnostic clarification or telemetry details from referring physician.'}
            </p>

            <textarea
              rows={3}
              value={modalInputText}
              onChange={(e) => setModalInputText(e.target.value)}
              placeholder="Enter clinical notes, reasons, or directions..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-teal-400"
              required={activeActionModal !== 'ACCEPT'}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveActionModal(null)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Back
              </button>
              <button
                onClick={handleActionConfirm}
                className="btn-primary text-xs py-1.5 px-4 shadow-sm"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
