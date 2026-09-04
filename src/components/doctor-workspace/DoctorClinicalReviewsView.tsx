import { useState } from 'react'
import {
  Clock3,
  Stethoscope,
  X,
} from 'lucide-react'
import {
  MOCK_CLINICAL_REVIEWS,
  type DoctorClinicalReview,
} from '@/data/doctorData'

interface DoctorClinicalReviewsViewProps {
  user?: import('@/types/auth').AuthUser
}

export function DoctorClinicalReviewsView({ user }: DoctorClinicalReviewsViewProps) {
  const [reviews, setReviews] = useState<DoctorClinicalReview[]>(MOCK_CLINICAL_REVIEWS)
  const [selectedReview, setSelectedReview] = useState<DoctorClinicalReview | null>(null)
  const [assessmentText, setAssessmentText] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleCompleteReview = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Completed', slaMinutesRemaining: 0 } : r))
    )
    setSelectedReview(null)
    setToastMessage(`Clinical review #${id} marked as Completed & signed into EMR.`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleEscalateReview = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Escalated' } : r))
    )
    setSelectedReview(null)
    setToastMessage(`Clinical review #${id} escalated to Department Chair.`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="space-y-6">
      {/* ── MANDATORY CLINICAL BANNER ─────────────────────────────────── */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs">
        <Stethoscope size={18} className="text-amber-400 shrink-0" />
        <div className="flex-1">
          <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-400">
            Clinical Governance & Diagnostic Validation
          </span>
          <p className="leading-snug">
            <strong>Clinical decision by authorized medical professional.</strong> Algorithmic matching provides decision support only. Attending specialist retains full clinical authority and liability.
          </p>
        </div>
        <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
          {user?.doctorCode || 'DOC-REG-VERIFIED'}
        </span>
      </div>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            CLINICAL PEER REVIEW DESK
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Clinical Reviews & Emergency Evaluation SLA Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnostic clearance, admission appropriateness evaluations, and clinical time-to-decision SLAs. Scoped to {user?.name || 'Dr. Sarah Jenkins'} ({user?.specialty || 'Interventional Cardiology'}).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-400">Pending Reviews:</span>
          <strong className="text-amber-400 font-bold bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            {reviews.filter((r) => r.status === 'Pending' || r.status === 'In Review').length} Active
          </strong>
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

      {/* ── Reviews Table ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060b13] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Review ID</th>
                <th className="py-3 px-3.5">Patient Name</th>
                <th className="py-3 px-3.5">Referral ID</th>
                <th className="py-3 px-3.5">Priority</th>
                <th className="py-3 px-3.5">Required Specialty</th>
                <th className="py-3 px-3.5">Created Time</th>
                <th className="py-3 px-3.5">SLA / Due Time</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3.5 font-mono font-bold text-teal-400">
                    {r.id}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-white">
                    {r.patientName}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-cyan-300">
                    {r.referralId}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        r.priority === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : r.priority === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {r.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">
                    {r.requiredSpecialty}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">
                    {r.createdTime}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                        r.status === 'Completed'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : r.slaMinutesRemaining <= 10
                          ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30 animate-pulse'
                          : 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
                      }`}
                    >
                      <Clock3 size={11} /> {r.dueTime}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        r.status === 'Completed'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                          : r.status === 'In Review'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                          : r.status === 'Escalated'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedReview(r)
                        setAssessmentText(r.findings || '')
                      }}
                      className="btn-primary text-[11px] py-1 px-3 shadow-sm"
                    >
                      Open Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Review Workspace Sub-Modal ────────────────────────────────── */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="presentation">
          <div className="bg-[#09101d] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope size={18} className="text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  Clinical Review Workspace: {selectedReview.id}
                </h3>
              </div>
              <button onClick={() => setSelectedReview(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 block">Patient Name:</span>
                <strong className="text-white text-sm">{selectedReview.patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Referral ID:</span>
                <strong className="font-mono text-cyan-300">{selectedReview.referralId}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Required Specialty:</span>
                <span className="text-teal-300 font-medium">{selectedReview.requiredSpecialty}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Referring Facility:</span>
                <span className="text-slate-300">{selectedReview.referringFacility}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                Physician Review Assessment & Diagnostic Recommendations
              </label>
              <textarea
                rows={4}
                value={assessmentText}
                onChange={(e) => setAssessmentText(e.target.value)}
                placeholder="Enter diagnostic assessment, clinical criteria validation, or transfer protocol recommendations..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-xs focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => handleEscalateReview(selectedReview.id)}
                className="px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-semibold"
              >
                Escalate Case
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCompleteReview(selectedReview.id)}
                  className="btn-primary text-xs py-1.5 px-4 shadow-sm"
                >
                  Sign & Complete Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
