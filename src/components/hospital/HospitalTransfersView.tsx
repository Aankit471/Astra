import { useState } from 'react'
import {
  ArrowRightLeft,
  MapPin,
} from 'lucide-react'
import { MOCK_TRANSFERS, type HospitalTransfer } from '@/data/hospitalOperations'

export function HospitalTransfersView() {
  const [transfers, setTransfers] = useState<HospitalTransfer[]>(MOCK_TRANSFERS)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleUpdateStatus = (transferId: string, status: 'REQUESTED' | 'DISPATCHED' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED') => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status } : t))
    )
    setToastMessage(`Transfer #${transferId} status updated to ${status}`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            INTER-FACILITY & INTRA-WARD LOGISTICS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Patient Transfer Logistics Command
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinate inbound ambulance transfers, step-down ward relocations, and tertiary hospital escalations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Transfers Active:</span>
          <strong className="text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {transfers.filter((t) => t.status === 'IN_TRANSIT').length} In Transit
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

      {/* Transfers Cards */}
      <div className="space-y-4">
        {transfers.map((trf) => (
          <div
            key={trf.id}
            className="card p-5 space-y-4 bg-slate-900/90 border-slate-800 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{trf.patientName}</h3>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.2 rounded">
                      {trf.patientId}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {trf.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                        trf.direction === 'INBOUND'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : trf.direction === 'OUTBOUND'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {trf.direction.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Transport: <strong className="text-slate-200">{trf.transportMode.replace('_', ' ')}</strong> · Acuity: <strong className="text-rose-400">{trf.acuity}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    trf.status === 'COMPLETED'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : trf.status === 'IN_TRANSIT'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {trf.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Origin to Destination Bar */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-rose-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Origin:</span>
                  <strong className="text-white">{trf.origin}</strong>
                </div>
              </div>

              <ArrowRightLeft size={16} className="text-cyan-400 hidden sm:block shrink-0" />

              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Destination:</span>
                  <strong className="text-cyan-300">{trf.destination}</strong>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">ETA:</span>
                <strong className="text-amber-400 font-mono text-sm">
                  {trf.etaMinutes > 0 ? `${trf.etaMinutes} mins` : 'Arrived'}
                </strong>
              </div>
            </div>

            {/* Clinical Handover & Actions */}
            <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
              <span>
                Clinical Lead Handover: <strong className="text-slate-300">{trf.clinicalLead}</strong>
              </span>

              <div className="flex items-center gap-2">
                {trf.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => handleUpdateStatus(trf.id, 'ARRIVED')}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Confirm Arrival at Bay
                  </button>
                )}

                {trf.status === 'ARRIVED' && (
                  <button
                    onClick={() => handleUpdateStatus(trf.id, 'COMPLETED')}
                    className="text-xs font-bold py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition"
                  >
                    Complete Handover
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
