import { ArrowRight, CheckCircle2, Hospital, Siren } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function HospitalArrivals() {
  const referrals = useAppStore((state) => state.referrals)
  const markArrived = useAppStore((state) => state.markArrived)

  const confirmedList = referrals.filter((item) => item.status === 'CONFIRMED')
  const arrivedList = referrals.filter((item) => item.status === 'ARRIVED')

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
          <Hospital size={22} className="text-cyan-400" /> Hospital Patient Arrivals Management
        </h2>
        <p className="text-xs text-gray-400 mt-2">
          Track inbound ALS ambulances and record physical patient intake at the emergency bay.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Siren size={16} /> Confirmed Inbound Patients ({confirmedList.length})
            </h3>

            {confirmedList.length ? (
              <div className="space-y-3">
                {confirmedList.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-cyan-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400 font-bold">{item.patient.referenceCode}</span>
                        <strong className="text-white text-sm">{item.patient.age}Y · {item.patient.emergencyCategory}</strong>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{item.patient.chiefComplaint}</p>
                      <small className="text-gray-400 text-[11px] block mt-1">
                        Confirmed for: {item.sentToFacilityName || 'Apollo General Hospital'}
                      </small>
                    </div>

                    <button className="btn-primary text-xs py-2 px-4 whitespace-nowrap" onClick={() => markArrived(item.id)}>
                      <CheckCircle2 size={16} /> Mark Patient Arrived <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 bg-white/5 rounded-xl border border-white/5 text-xs">
                No confirmed transfers currently en route.
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} /> Recently Arrived Patients ({arrivedList.length})
            </h3>

            {arrivedList.length ? (
              <div className="space-y-3">
                {arrivedList.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-white text-sm font-bold">{item.patient.referenceCode} · {item.patient.emergencyCategory}</strong>
                      <p className="text-gray-300 mt-0.5">{item.patient.chiefComplaint}</p>
                      <small className="text-emerald-400 block mt-1 font-mono">
                        Arrived at: {item.arrivedAt ? new Date(item.arrivedAt).toLocaleTimeString() : 'Recently'}
                      </small>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
                      IN EMERGENCY BAY
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 bg-white/5 rounded-xl border border-white/5 text-xs">
                No arrival records logged today yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
