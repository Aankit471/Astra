import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'

export function HospitalEscalationsView() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [escalations, setEscalations] = useState([
    {
      id: 'ESC-401',
      title: 'Delayed CICU Bed Assignment for STEMI Patient Harish Chandra',
      severity: 'CRITICAL',
      source: 'Indiranagar 108 ALS Ambulance',
      targetWard: 'Intensive Coronary & Cardiac ICU',
      elapsedMinutes: 18,
      status: 'UNDER_REVIEW',
      notes: 'Ambulance ETA 12m. Temporary transvenous pacing tray required immediately upon bay arrival.',
    },
    {
      id: 'ESC-402',
      title: 'Surgery Ward Near Critical Capacity (89% occupied)',
      severity: 'WARNING',
      source: 'Ward Head Nurse Sr. Ritu Sen',
      targetWard: 'Post-Operative Surgery Ward',
      elapsedMinutes: 45,
      status: 'ACTION_REQUIRED',
      notes: 'Need expedited step-down discharge clearance for 2 patients to make room for incoming femur fracture.',
    },
    {
      id: 'ESC-403',
      title: 'O-Negative Emergency Packed RBC Low Buffer Stock',
      severity: 'MODERATE',
      source: 'Hospital Blood Bank Officer',
      targetWard: 'Facility Blood Transfusion Service',
      elapsedMinutes: 90,
      status: 'RESOLVED',
      notes: '2 units O-neg dispatched from Govt District Blood Bank. Buffer restocked to 8 units.',
    },
  ])

  const handleResolve = (id: string) => {
    setEscalations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'RESOLVED' } : e))
    )
    setToastMessage(`Escalation #${id} marked as Resolved.`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-rose-950/30 p-5 rounded-2xl border border-rose-500/30">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            URGENT INCIDENT ESCALATIONS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <ShieldAlert size={22} className="text-rose-400" />
            <span>Facility Operational Escalations Desk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor critical capacity warnings, delayed ambulance intakes, specialist shortages, and urgent clinical overrides.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Open Incidents:</span>
          <strong className="text-rose-400 font-bold bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-500/30">
            {escalations.filter((e) => e.status !== 'RESOLVED').length} Critical
          </strong>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Escalation Cards */}
      <div className="space-y-4">
        {escalations.map((esc) => (
          <div
            key={esc.id}
            className={`card p-5 space-y-3.5 bg-slate-900/90 border shadow-xl ${
              esc.status === 'RESOLVED'
                ? 'border-slate-800 opacity-70'
                : esc.severity === 'CRITICAL'
                ? 'border-rose-500/40 shadow-rose-500/5'
                : 'border-amber-500/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-2 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.2 rounded">
                    {esc.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                      esc.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {esc.severity}
                  </span>
                  <span className="text-xs font-bold text-slate-300">{esc.targetWard}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{esc.title}</h3>
                <span className="text-xs text-slate-400">
                  Origin: <strong>{esc.source}</strong> · Elapsed:{' '}
                  <strong className="text-amber-300">{esc.elapsedMinutes} mins ago</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    esc.status === 'RESOLVED'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {esc.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed">
              {esc.notes}
            </p>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500 text-[11px]">
                Escalated to: <strong>Hospital Operations Lead & Central Network</strong>
              </span>

              <div className="flex items-center gap-2">
                {esc.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(esc.id)}
                    className="btn-primary text-xs py-1.5 px-3.5 shadow-sm"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
