import { useState } from 'react'
import { MOCK_WARDS, type HospitalWard } from '@/data/hospitalOperations'

export function HospitalWardsView() {
  const [wards, setWards] = useState<HospitalWard[]>(MOCK_WARDS)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleUpdateStatus = (wardId: string, status: 'OPTIMAL' | 'NEAR_CAPACITY' | 'CRITICAL') => {
    setWards((prev) =>
      prev.map((w) => (w.id === wardId ? { ...w, status } : w))
    )
    setToastMessage(`Ward status updated to ${status}`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            CLINICAL UNIT MANAGEMENT
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Hospital Wards & Clinical Units
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational status, head nurse contacts, nurse-to-patient ratios, and unit bed breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-400">Active Wards:</span>
          <strong className="text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {wards.length} Units Connected
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

      {/* Ward Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {wards.map((ward) => {
          const occ = Math.round((ward.occupiedBeds / ward.totalBeds) * 100)

          return (
            <div
              key={ward.id}
              className="card p-5 space-y-4 bg-slate-900/90 border-slate-800 hover:border-slate-700 transition shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">
                    {ward.code} · {ward.floor}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5 leading-tight">
                    {ward.name}
                  </h3>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Specialty: <strong className="text-slate-200">{ward.specialty}</strong>
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ward.status === 'OPTIMAL'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : ward.status === 'NEAR_CAPACITY'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {ward.status === 'OPTIMAL'
                    ? 'Optimal'
                    : ward.status === 'NEAR_CAPACITY'
                    ? 'Near Capacity'
                    : 'Critical'}
                </span>
              </div>

              {/* Occupancy bar */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Occupancy Rate</span>
                  <strong className="text-white font-mono">{occ}%</strong>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      occ > 85 ? 'bg-rose-500' : occ > 70 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${occ}%` }}
                  />
                </div>
              </div>

              {/* Bed counters */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total</span>
                  <strong className="text-white font-bold">{ward.totalBeds}</strong>
                </div>
                <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 block">Avail</span>
                  <strong className="text-emerald-300 font-bold">{ward.availableBeds}</strong>
                </div>
                <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/20">
                  <span className="text-[10px] text-cyan-400 block">Occupied</span>
                  <strong className="text-cyan-300 font-bold">{ward.occupiedBeds}</strong>
                </div>
                <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20">
                  <span className="text-[10px] text-amber-400 block">Reserved</span>
                  <strong className="text-amber-300 font-bold">{ward.reservedBeds}</strong>
                </div>
              </div>

              {/* Head Nurse & Contact */}
              <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 text-[11px]">Head Nurse:</span>
                  <strong>{ward.headNurse}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 text-[11px]">Phone Extension:</span>
                  <strong className="text-cyan-400 font-mono">{ward.phoneExt}</strong>
                </div>
              </div>

              {/* Status toggle action */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500">Unit Alert Status:</span>
                <select
                  value={ward.status}
                  onChange={(e) => handleUpdateStatus(ward.id, e.target.value as HospitalWard['status'])}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-0.5 focus:outline-none"
                >
                  <option value="OPTIMAL">Optimal</option>
                  <option value="NEAR_CAPACITY">Near Capacity</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
