import { useState } from 'react'
import { UserCheck } from 'lucide-react'
import { MOCK_ADMISSIONS_QUEUE, type HospitalAdmission } from '@/data/hospitalOperations'

export function HospitalAdmissionsView() {
  const [admissions, setAdmissions] = useState<HospitalAdmission[]>(MOCK_ADMISSIONS_QUEUE)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleConfirmAdmission = (admissionId: string) => {
    setAdmissions((prev) =>
      prev.map((a) => (a.id === admissionId ? { ...a, status: 'ADMITTED' } : a))
    )
    setToastMessage(`Patient #${admissionId} admitted successfully to ward.`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleAssignBed = (admissionId: string) => {
    setAdmissions((prev) =>
      prev.map((a) =>
        a.id === admissionId
          ? { ...a, status: 'BED_ASSIGNED', assignedBed: 'SURG Bed S-04 (AC)' }
          : a
      )
    )
    setToastMessage(`Bed allocated to admission #${admissionId}`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            ADMISSIONS & INTAKE BUREAU
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Patient Admissions & Bed Allocation Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinate incoming admissions, assign beds, confirm patient arrival, and verify intake criteria.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Queue Count:</span>
          <strong className="text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {admissions.length} Cases Pending
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

      {/* Admissions Cards */}
      <div className="space-y-4">
        {admissions.map((adm) => (
          <div
            key={adm.id}
            className="card p-5 space-y-4 bg-slate-900/90 border-slate-800 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{adm.patientName}</h3>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.2 rounded">
                      {adm.patientId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                        adm.acuity === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {adm.acuity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {adm.age} Yrs · {adm.gender} · Admission Type: <strong>{adm.admissionType.replace('_', ' ')}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    adm.status === 'ADMITTED'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : adm.status === 'BED_ASSIGNED'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {adm.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Admission Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] block">Referring Facility:</span>
                <strong className="text-slate-200 block">{adm.referringFacility}</strong>
                <span className="text-[11px] text-slate-400">Intake time: {adm.intakeTime}</span>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] block">Target Clinical Ward:</span>
                <strong className="text-cyan-300 block">{adm.targetWard}</strong>
                <span className="text-[11px] text-slate-400">
                  Assigned Bed: <strong className="text-emerald-400">{adm.assignedBed || 'Awaiting Bed Allocation'}</strong>
                </span>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] block">Special Requirements:</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {adm.specialRequirements.map((req, i) => (
                    <span key={i} className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
              <span className="text-slate-400">
                {adm.etaMinutes ? `Ambulance ETA: ~${adm.etaMinutes} mins` : 'Patient in hospital queue'}
              </span>

              <div className="flex items-center gap-2">
                {adm.status === 'PENDING_BED' && (
                  <button
                    onClick={() => handleAssignBed(adm.id)}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Assign Bed Now
                  </button>
                )}

                {adm.status !== 'ADMITTED' && (
                  <button
                    onClick={() => handleConfirmAdmission(adm.id)}
                    className="text-xs font-bold py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition"
                  >
                    Confirm Inpatient Admission
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
