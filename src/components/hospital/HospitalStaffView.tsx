import { useState } from 'react'
import {
  Phone,
  Search,
  UserCheck,
} from 'lucide-react'
import { MOCK_HOSPITAL_STAFF, type HospitalStaffMember } from '@/data/hospitalOperations'

export function HospitalStaffView() {
  const [staff] = useState<HospitalStaffMember[]>(MOCK_HOSPITAL_STAFF)
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const filteredStaff = staff.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return `${s.name} ${s.role} ${s.department}`.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            HOSPITAL HUMAN RESOURCES
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Hospital Operations Staff & Duty Roster
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Charge nurses, ward clerks, bed managers, and central operations supervisors currently on duty.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">On-Duty Count:</span>
          <strong className="text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {staff.filter((s) => s.status === 'ON_DUTY').length} Staff
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

      {/* Search */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search staff by name, role, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 focus:ring-1 focus:ring-cyan-400"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((st) => (
          <div
            key={st.id}
            className="card p-5 space-y-3.5 bg-slate-900/90 border-slate-800 hover:border-slate-700 transition shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{st.name}</h3>
                  <span className="text-xs text-cyan-300 font-semibold block">
                    {st.role.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {st.department}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  st.status === 'ON_DUTY'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {st.status.replace('_', ' ')}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs text-slate-300">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Current Shift:</span>
                <strong>{st.shift} (07:00 - 15:30)</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Extension:</span>
                <strong className="text-cyan-400 font-mono">{st.extension}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">{st.phone}</span>
              <a
                href={`tel:${st.phone}`}
                className="btn-secondary text-[11px] py-1 px-3 flex items-center gap-1"
              >
                <Phone size={12} />
                <span>Call Staff</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
