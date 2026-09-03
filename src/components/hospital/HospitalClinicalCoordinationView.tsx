import { useState } from 'react'
import {
  MessageSquare,
  Phone,
  Stethoscope,
} from 'lucide-react'
import { MOCK_SPECIALISTS } from '@/data/specialists'

export function HospitalClinicalCoordinationView() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [pageModalDoctor, setPageModalDoctor] = useState<string | null>(null)
  const [pageNotes, setPageNotes] = useState('')

  const handlePageDoctor = (docName: string) => {
    setToastMessage(`Urgent operational page sent to ${docName}: "${pageNotes || 'Immediate bed consultation requested'}"`)
    setPageModalDoctor(null)
    setPageNotes('')
    setTimeout(() => setToastMessage(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            PHYSICIAN & SPECIALIST LIAISON
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Clinical Coordination & Doctor Liaison Desk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time on-call specialist rosters, patient bed consultations, emergency clinical handoffs, and direct physician paging.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">On-Duty Roster:</span>
          <strong className="text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {MOCK_SPECIALISTS.length} Clinicians
          </strong>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-cyan-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Specialist Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_SPECIALISTS.map((spec) => (
          <div
            key={spec.id}
            className="card p-5 space-y-3.5 bg-slate-900/90 border-slate-800 hover:border-slate-700 transition shadow-xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{spec.doctorName}</h3>
                  <span className="text-xs text-cyan-300 font-medium block">{spec.specialty}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {spec.department}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
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

            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs text-slate-300">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Hospital:</span>
                <strong>{spec.hospitalName}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Duty Location:</span>
                <span className="text-slate-200">{spec.notes || 'Acute Bay'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Doctor Code:</span>
                <span className="font-mono text-cyan-400">{spec.doctorCode}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <a
                href="tel:101"
                className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1"
              >
                <Phone size={12} />
                <span>Call Ext</span>
              </a>

              <button
                onClick={() => setPageModalDoctor(spec.doctorName)}
                className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1 shadow-sm"
              >
                <MessageSquare size={12} />
                <span>Page Doctor</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paging Modal */}
      {pageModalDoctor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="presentation"
        >
          <div className="bg-[#0B111E] border border-cyan-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Stethoscope size={18} className="text-cyan-400" />
              Page Clinical Specialist: {pageModalDoctor}
            </h3>

            <textarea
              rows={3}
              placeholder="State patient ID, clinical urgency, or required bed consultation..."
              value={pageNotes}
              onChange={(e) => setPageNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-cyan-400"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setPageModalDoctor(null)}
                className="btn-secondary py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePageDoctor(pageModalDoctor)}
                className="btn-primary py-1.5 px-4"
              >
                Dispatch Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
