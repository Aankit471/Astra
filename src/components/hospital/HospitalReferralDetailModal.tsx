import { useState } from 'react'
import {
  AlertTriangle,
  BedDouble,
  Clock3,
  Droplet,
  HeartPulse,
  Hospital,
  Stethoscope,
  X,
} from 'lucide-react'

import type { Referral } from '@/types/domain'
import { getRelativeTime } from '@/utils/freshness'

interface HospitalReferralDetailModalProps {
  referral: Referral
  availableBedCapacity: number
  onClose: () => void
  onAccept: (id: string) => Promise<{ success: boolean; error?: string }>
  onDecline: (id: string, reason: string) => Promise<{ success: boolean; error?: string }>
  onRouteToClinical?: (id: string) => Promise<{ success: boolean; error?: string }>
  onAllocateBed?: (referralId: string) => void
}

export function HospitalReferralDetailModal({
  referral,
  availableBedCapacity,
  onClose,
  onAccept,
  onDecline,
  onRouteToClinical,
  onAllocateBed,
}: HospitalReferralDetailModalProps) {
  const [isDeclining, setIsDeclining] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const p = referral.patient || {
    referenceCode: 'CASE-1042',
    age: 54,
    sex: 'MALE',
    chiefComplaint: 'Acute chest pain with ST-elevation in V1-V4',
    emergencyCategory: 'CARDIAC',
    urgencyLevel: 'IMMEDIATE',
  }

  // Handle Accept with Capacity Pre-Check
  const handleAccept = async () => {
    setModalError(null)

    if (availableBedCapacity <= 0) {
      setModalError('Required capacity currently unavailable.')
      return
    }

    setIsProcessing(true)
    try {
      const res = await onAccept(referral.id)
      if (res.success) {
        onClose()
      } else {
        setModalError(res.error || 'Failed to accept referral.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Decline with Reason Requirement
  const handleDeclineSubmit = async () => {
    setModalError(null)
    if (!declineReason.trim()) {
      setModalError('A reason is required to decline this referral.')
      return
    }

    setIsProcessing(true)
    try {
      const res = await onDecline(referral.id, declineReason.trim())
      if (res.success) {
        onClose()
      } else {
        setModalError(res.error || 'Failed to decline referral.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-case-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="card w-full max-w-2xl bg-[#0B111E] border-slate-700 shadow-2xl relative my-8 overflow-hidden rounded-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                EMERGENCY REFERRAL CASE
              </span>
              <span className="text-xs text-slate-400 font-mono">{referral.id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  p.urgencyLevel === 'IMMEDIATE'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {p.urgencyLevel || 'IMMEDIATE'}
              </span>
            </div>
            <h2 id="referral-case-title" className="text-lg font-bold text-white">
              {p.referenceCode} · {p.emergencyCategory || 'Emergency Intake'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error / Capacity Warning Notice */}
        {modalError && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
          {/* Section 7: Patient Details & Clinical Requirements */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Age & Sex</span>
              <strong className="text-white text-sm block mt-0.5">
                {p.age} yrs · {p.sex}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Blood Group</span>
              <strong className="text-rose-300 text-sm block mt-0.5 flex items-center gap-1">
                <Droplet size={14} className="text-rose-400" />
                {p.bloodGroup || 'Not Specified'}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Required Specialty</span>
              <strong className="text-cyan-300 text-sm block mt-0.5">
                {p.emergencyCategory || 'Cardiology'}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Current Status</span>
              <strong className="text-white text-sm block mt-0.5 uppercase">
                {referral.status}
              </strong>
            </div>
          </div>

          {/* Chief Complaint & Vitals */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <HeartPulse size={15} className="text-rose-400" />
              <span>Emergency Condition / Chief Complaint:</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">
              {p.chiefComplaint || 'Acute presentation requiring immediate specialist triage.'}
            </p>
          </div>

          {/* Clinical Capabilities Required & Bed Preference */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <BedDouble size={15} className="text-cyan-400" />
                Required Capability & Bed Availability:
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                {availableBedCapacity} Hospital Beds Available
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium">
                ICU / Resuscitation Bay
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                ❄️ AC Comfort Accommodation
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                High-Flow Oxygen & Cardiac Telemetry
              </span>
            </div>
          </div>

          {/* Receiving Hospital & Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
              <Hospital size={18} className="text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Receiving Facility:</span>
                <strong className="text-white block font-medium">
                  {referral.sentToFacilityName || 'Apollo General Hospital (Assigned)'}
                </strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
              <Stethoscope size={18} className="text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Assigned Doctor:</span>
                <strong className="text-white block font-medium">
                  {referral.assignedDoctorId ? `Specialist (${referral.assignedDoctorId})` : 'On-Call Emergency Specialist'}
                </strong>
              </div>
            </div>
          </div>

          {/* Referral Timeline Events */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock3 size={14} className="text-cyan-400" />
              Referral Timeline & Audit Trail
            </h4>
            <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-white/5 max-h-36 overflow-y-auto">
              {(referral.timeline && referral.timeline.length > 0) ? (
                referral.timeline.map((evt, idx) => (
                  <div key={evt.id || idx} className="flex items-start justify-between gap-3 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shrink-0" />
                      <div>
                        <strong className="text-slate-200 block">{evt.event}</strong>
                        {evt.notes && <p className="text-slate-400 text-[10px]">{evt.notes}</p>}
                        <span className="text-[9px] text-slate-500 font-mono">Actor: {evt.actor}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {getRelativeTime(evt.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500 text-[11px]">No timeline events recorded.</span>
              )}
            </div>
          </div>

          {/* Decline Reason Input (if declining) */}
          {isDeclining && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-2">
              <label className="block text-rose-300 font-semibold text-xs">
                State reason for declining referral (Required for Audit Trail):
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Critical care beds currently at 100% capacity; patient requires ECMO support not available at facility."
                className="w-full bg-[#070b14] border border-rose-500/40 rounded-lg p-2 text-slate-100 text-xs focus:ring-1 focus:ring-rose-400"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDeclining(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeclineSubmit}
                  disabled={isProcessing || !declineReason.trim()}
                  className="btn-danger text-xs py-1.5 px-3 disabled:opacity-40"
                >
                  {isProcessing ? 'Recording...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!isDeclining && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60">
            <button
              onClick={() => setIsDeclining(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
            >
              Decline Referral
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-3.5"
              >
                Close Case
              </button>

              {referral.status === 'ACCEPTED' && onRouteToClinical && (
                <button
                  onClick={async () => {
                    setIsProcessing(true)
                    const res = await onRouteToClinical(referral.id)
                    setIsProcessing(false)
                    if (res.success) onClose()
                  }}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Stethoscope size={14} />
                  <span>{isProcessing ? 'Routing...' : 'Route to Clinical Team'}</span>
                </button>
              )}

              {onAllocateBed && (
                <button
                  onClick={() => {
                    onAllocateBed(referral.id)
                    onClose()
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <BedDouble size={14} />
                  <span>Allocate Bed</span>
                </button>
              )}

              {referral.status !== 'ACCEPTED' && referral.status !== 'REVIEWING' && (
                <button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="btn-primary text-xs py-2 px-4 shadow-lg shadow-cyan-500/20"
                >
                  {isProcessing ? 'Verifying Capacity...' : 'Accept Referral'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
