import { useState } from 'react'
import {
  Bell,
  Hospital,
  Save,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

export function DoctorProfileView() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [notificationPrefs, setNotificationPrefs] = useState({
    smsAlerts: true,
    telemetryPush: true,
    criticalSlaOnly: false,
    pagerEscalations: true,
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setToastMessage('Doctor clinical credentials & notification rules saved.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            PRACTITIONER CREDENTIALS & PROFILE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Physician Clinical Profile & Licensing Record
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified medical license, clinical credentials, board certifications, and notification routing rules.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck size={16} /> Board Certified & Verified
          </span>
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

      {/* ── Doctor Bio Card ───────────────────────────────────────────── */}
      <div className="card p-6 bg-slate-900/90 border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xl">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-teal-500/20 shrink-0">
          SJ
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-white">Dr. Sarah Jenkins, MD, FACC</h2>
            <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/15 px-2 py-0.5 rounded border border-teal-500/30">
              DOC-KA-48192
            </span>
          </div>

          <p className="text-teal-300 font-medium text-xs">
            Lead Attending Interventional Cardiologist · Structural Heart Disease Director
          </p>

          <p className="text-slate-400 text-xs">
            Metro Central Hospital / Apollo General Health City · Cardiology & Cath Lab Division
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Grid Sections ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Section 1: Professional Information */}
          <div className="card p-5 bg-slate-900/90 border-slate-800 space-y-3.5 shadow-xl">
            <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-xs">
              <Stethoscope size={16} className="text-teal-400" />
              Professional Information & Credentials
            </h3>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Medical Council Reg. No.:</span>
                <strong className="font-mono text-white">KMC-849102-CARDIO</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Board Certification:</span>
                <strong className="text-white">American Board of Internal Medicine (Cardiovascular)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Primary Specialization:</span>
                <strong className="text-teal-300">Interventional Cardiology & Coronary Angioplasty</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Sub-Specialties:</span>
                <strong className="text-slate-200">Radial PCI, TAVI, Intravascular Ultrasound (IVUS)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Clinical Experience:</span>
                <strong className="text-white">16 Years (1,400+ PCI Interventions)</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Facility & Working Hours */}
          <div className="card p-5 bg-slate-900/90 border-slate-800 space-y-3.5 shadow-xl">
            <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-xs">
              <Hospital size={16} className="text-teal-400" />
              Assigned Facility & Shift Hours
            </h3>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Base Facility:</span>
                <strong className="text-white">Metro Central Hospital</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Affiliated Network:</span>
                <strong className="text-slate-200">Apollo General Health Network</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Department:</span>
                <strong className="text-teal-300">Cardiology & Emergency Cath Lab</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Standard On-Duty Shift:</span>
                <strong className="text-white">07:00 – 15:30 (Mon–Fri)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">On-Call Emergency STEMI:</span>
                <strong className="text-amber-400 font-semibold">24/7 Primary Rotation Table 1</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Notification & Paging Preferences ─────────────── */}
        <div className="card p-5 bg-slate-900/90 border-slate-800 space-y-4 shadow-xl text-xs">
          <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-xs">
            <Bell size={16} className="text-teal-400" />
            Clinical Notification & Paging Routing Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="p-3 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
              <div>
                <strong className="text-white block">Emergency STEMI Dispatch SMS</strong>
                <span className="text-slate-400 text-[11px]">Direct SMS dispatch when 108 EMS routes acute crash cases</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.smsAlerts}
                onChange={(e) =>
                  setNotificationPrefs({ ...notificationPrefs, smsAlerts: e.target.checked })
                }
                className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 bg-slate-950 border-slate-700"
              />
            </label>

            <label className="p-3 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
              <div>
                <strong className="text-white block">Continuous Telemetry Push</strong>
                <span className="text-slate-400 text-[11px]">Real-time vital threshold breaches from central monitor suite</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.telemetryPush}
                onChange={(e) =>
                  setNotificationPrefs({ ...notificationPrefs, telemetryPush: e.target.checked })
                }
                className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 bg-slate-950 border-slate-700"
              />
            </label>

            <label className="p-3 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
              <div>
                <strong className="text-white block">Critical SLA Deadline Alarms</strong>
                <span className="text-slate-400 text-[11px]">Audible chime when referral review SLA is under 5 minutes</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.criticalSlaOnly}
                onChange={(e) =>
                  setNotificationPrefs({ ...notificationPrefs, criticalSlaOnly: e.target.checked })
                }
                className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 bg-slate-950 border-slate-700"
              />
            </label>

            <label className="p-3 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
              <div>
                <strong className="text-white block">Inter-Hospital Escalation Pager</strong>
                <span className="text-slate-400 text-[11px]">Urgent physician paging from regional network command center</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.pagerEscalations}
                onChange={(e) =>
                  setNotificationPrefs({ ...notificationPrefs, pagerEscalations: e.target.checked })
                }
                className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 bg-slate-950 border-slate-700"
              />
            </label>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              <Save size={14} />
              <span>Save Clinical Profile Settings</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
