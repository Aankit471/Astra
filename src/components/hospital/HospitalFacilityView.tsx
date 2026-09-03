import {
  Droplet,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function HospitalFacilityView() {
  const hospitals = useAppStore((state) => state.hospitals)
  const bloodInventory = useAppStore((state) => state.bloodInventory)
  const hospital = hospitals[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            REGIONAL NETWORK REGISTRY
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Facility Profile & Capability Registry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified emergency services, trauma surgery capabilities, blood bank stock, and clinical equipment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Network Status:</span>
          <strong className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            ✓ ASTRA Verified
          </strong>
        </div>
      </div>

      {/* Facility Identity Card */}
      <div className="card p-6 bg-slate-900/90 border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">{hospital.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <MapPin size={13} className="text-cyan-400" />
              <span>
                {hospital.address.line1}, {hospital.address.city}, {hospital.address.state} — {hospital.address.pincode}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              Hotline: {hospital.emergencyPhone || hospital.phone}
            </span>
          </div>
        </div>

        {/* Emergency Categories */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Emergency Intake Capabilities:
          </span>
          <div className="flex flex-wrap gap-2">
            {hospital.capabilities.emergencyCategories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-semibold text-cyan-300"
              >
                ✓ {cat} EMERGENCY
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Verified Capabilities Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={16} className="text-cyan-400" />
          Verified Clinical Equipment & Specialized Services
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {hospital.capabilities.capabilities.map((cap) => (
            <div
              key={cap.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">{cap.id}</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {cap.verificationStatus}
                </span>
              </div>
              <strong className="text-white block font-semibold">{cap.label}</strong>
              <span className="text-[11px] text-slate-400 block">{cap.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Blood Bank Stock Summary */}
      <div className="card p-5 space-y-3.5 bg-slate-900/90 border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Droplet size={16} className="text-rose-400" />
            Facility Blood Bank Inventory
          </h3>
          <span className="text-xs text-slate-400">24/7 Transfusion Certified</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 text-center">
          {bloodInventory.slice(0, 8).map((b) => (
            <div
              key={b.id}
              className="p-2.5 rounded-xl bg-black/40 border border-slate-800 space-y-1"
            >
              <span className="text-xs font-bold text-rose-400 font-mono block">
                {b.bloodGroup}
              </span>
              <strong className="text-base font-bold text-white block">
                {b.availableUnits}
              </strong>
              <span className="text-[10px] text-slate-500 block">units</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
