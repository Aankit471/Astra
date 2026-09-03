import { useState } from 'react'
import {
  Building2,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function HospitalSettingsView() {
  const hospitals = useAppStore((state) => state.hospitals)
  const hospital = hospitals[0]
  const updateHospitalDetails = useAppStore((state) => state.updateHospitalDetails)

  const [phone, setPhone] = useState(hospital.phone || '044-28190000')
  const [emergencyPhone, setEmergencyPhone] = useState(hospital.emergencyPhone || '044-28190001')
  const [addressLine, setAddressLine] = useState(hospital.address.line1 || '12 Medical Colony Road')
  const [autoAcceptEmergency, setAutoAcceptEmergency] = useState(true)
  const [notifyOnCriticalArrival, setNotifyOnCriticalArrival] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateHospitalDetails(hospital.id, {
      phone,
      emergencyPhone,
      addressLine1: addressLine,
    })
    setToastMessage('Facility profile and operational settings saved.')
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            FACILITY PROFILE & CONFIGURATION
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Facility Profile & Operational Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage hospital intake rules, operational contact numbers, dispatch hotline, and auto-notification thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Facility ID:</span>
          <strong className="text-cyan-300 font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {hospital.id}
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

      {/* Settings Form */}
      <form onSubmit={handleSave} className="card p-6 space-y-5 bg-slate-900/90 border-slate-800 shadow-xl text-xs">
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-cyan-400" />
            Facility Profile & Telephony
          </h3>
          <p className="text-slate-400 mt-0.5">
            These contact details are published to all emergency medical responders (108/EMS) in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Hospital Name</label>
            <input
              type="text"
              disabled
              value={hospital.name}
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg p-2.5 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Facility Type</label>
            <input
              type="text"
              disabled
              value="Tertiary Super-Specialty Medical Centre"
              className="w-full bg-[#070b14] border border-slate-800 rounded-lg p-2.5 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Facility General Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-400"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">24/7 Emergency Dispatch Hotline</label>
            <input
              type="text"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-400"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-300 mb-1 font-semibold">Facility Address</label>
            <input
              type="text"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-400"
              required
            />
          </div>
        </div>

        {/* Operational Automation Preferences */}
        <div className="border-t border-white/5 pt-4 space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            Operational Automation Rules
          </h4>

          <div className="space-y-2.5">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/5 cursor-pointer hover:bg-black/50">
              <input
                type="checkbox"
                checked={autoAcceptEmergency}
                onChange={(e) => setAutoAcceptEmergency(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 w-4 h-4"
              />
              <div>
                <strong className="text-white block">Auto-Reserve Bed for Confirmed Immediate Referrals</strong>
                <span className="text-[11px] text-slate-400">
                  Automatically place suitable ICU/ER bed in RESERVED state when 108 EMS is within 15 minutes.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/5 cursor-pointer hover:bg-black/50">
              <input
                type="checkbox"
                checked={notifyOnCriticalArrival}
                onChange={(e) => setNotifyOnCriticalArrival(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 w-4 h-4"
              />
              <div>
                <strong className="text-white block">Audio-Visual Alert on Critical Ambulance Arrival</strong>
                <span className="text-[11px] text-slate-400">
                  Broadcast bay arrival notification across Central Command when ETA drops below 5 minutes.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-lg shadow-cyan-500/10">
            <Save size={14} />
            <span>Save Operational Settings</span>
          </button>
        </div>
      </form>
    </div>
  )
}
