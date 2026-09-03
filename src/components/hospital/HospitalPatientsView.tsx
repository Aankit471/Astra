import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Search,
} from 'lucide-react'
import {
  MOCK_HOSPITAL_PATIENTS,
  type HospitalPatient,
} from '@/data/hospitalOperations'
import { HospitalPatientDetailModal } from './HospitalPatientDetailModal'

export function HospitalPatientsView() {
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'EMERGENCY' | 'ADMITTED' | 'WAITING' | 'IN_TRANSIT' | 'CRITICAL' | 'DISCHARGE_PENDING' | 'TRANSFERRED'
  >('ALL')

  const [searchQuery, setSearchQuery] = useState('')
  const [wardFilter, setWardFilter] = useState('ALL')
  const [acuityFilter, setAcuityFilter] = useState('ALL')
  const [selectedPatient, setSelectedPatient] = useState<HospitalPatient | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const pageSize = 6

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'ALL', label: 'All Patients' },
    { id: 'EMERGENCY', label: 'Emergency' },
    { id: 'ADMITTED', label: 'Admitted' },
    { id: 'WAITING', label: 'Waiting for Bed' },
    { id: 'IN_TRANSIT', label: 'In Transit' },
    { id: 'CRITICAL', label: 'Critical / ICU' },
    { id: 'DISCHARGE_PENDING', label: 'Discharge Pending' },
    { id: 'TRANSFERRED', label: 'Transferred' },
  ]

  const wards = [
    'ALL',
    'Emergency Resuscitation Bay',
    'Intensive Coronary & Cardiac ICU',
    'Cardiology Step-Down Ward',
    'General Medicine Ward',
    'Pediatrics Acute Ward',
    'Post-Operative Surgery Ward',
  ]

  const filteredPatients = useMemo(() => {
    return MOCK_HOSPITAL_PATIENTS.filter((p) => {
      // Tab filter
      if (activeTab === 'EMERGENCY' && p.status !== 'EMERGENCY') return false
      if (activeTab === 'ADMITTED' && p.status !== 'ADMITTED') return false
      if (activeTab === 'WAITING' && p.status !== 'WAITING') return false
      if (activeTab === 'IN_TRANSIT' && p.status !== 'IN_TRANSIT') return false
      if (activeTab === 'CRITICAL' && p.acuity !== 'CRITICAL' && p.status !== 'CRITICAL') return false
      if (activeTab === 'DISCHARGE_PENDING' && p.status !== 'DISCHARGE_PENDING') return false
      if (activeTab === 'TRANSFERRED' && p.status !== 'TRANSFERRED') return false

      // Ward filter
      if (wardFilter !== 'ALL' && p.ward !== wardFilter) return false

      // Acuity filter
      if (acuityFilter !== 'ALL' && p.acuity !== acuityFilter) return false

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match = `${p.name} ${p.id} ${p.ward} ${p.bed} ${p.assignedDoctor}`.toLowerCase()
        if (!match.includes(q)) return false
      }

      return true
    })
  }, [activeTab, wardFilter, acuityFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleContactTeam = (patient: HospitalPatient) => {
    setToastMessage(`Paging clinical team: ${patient.assignedDoctor} for Patient ${patient.name}`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            INPATIENT & EMERGENCY CENSUS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Hospital Patient Directory & Ward Census
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time facility inpatient status, ward locations, assigned clinical care teams, and bed occupancy.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-400">Current Inpatients:</span>
          <strong className="text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {MOCK_HOSPITAL_PATIENTS.length} Total Patients
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

      {/* ── 8 Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setCurrentPage(1)
              }}
              className={`px-3 py-2 rounded-t-lg font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800/90 text-cyan-300 border-b-2 border-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search patient name, ID, bed, doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <div>
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            {wards.map((w) => (
              <option key={w} value={w}>
                {w === 'ALL' ? 'All Wards' : w}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={acuityFilter}
            onChange={(e) => setAcuityFilter(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="ALL">All Acuities</option>
            <option value="CRITICAL">Critical (Tier-1)</option>
            <option value="EMERGENT">Emergent (Tier-2)</option>
            <option value="URGENT">Urgent (Tier-3)</option>
            <option value="STABLE">Stable</option>
          </select>
        </div>
      </div>

      {/* ── Patients Table ────────────────────────────────────────────── */}
      <div className="card overflow-hidden border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070b14] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Patient ID</th>
                <th className="py-3 px-3.5">Patient Name & Age</th>
                <th className="py-3 px-3.5">Acuity</th>
                <th className="py-3 px-3.5">Ward Unit</th>
                <th className="py-3 px-3.5">Assigned Bed</th>
                <th className="py-3 px-3.5">Assigned Doctor</th>
                <th className="py-3 px-3.5">Admission Time</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedPatients.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3.5 font-mono font-bold text-cyan-400">
                    {p.id}
                  </td>
                  <td className="py-3 px-3.5">
                    <strong className="text-white block font-medium">{p.name}</strong>
                    <span className="text-[10px] text-slate-400">
                      {p.age} Yrs · {p.gender}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.acuity === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : p.acuity === 'EMERGENT'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {p.acuity}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-300 font-medium">
                    {p.ward}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-mono text-emerald-400 font-semibold block">
                      {p.bed}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {p.comfort === 'AC' ? '❄️ AC Room' : 'Non-AC'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-200">
                    <span className="block font-medium">{p.assignedDoctor}</span>
                    <small className="text-[10px] text-cyan-300">
                      {p.assignedDoctorSpecialty}
                    </small>
                  </td>
                  <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">
                    {p.admissionTime}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="btn-primary text-[11px] py-1 px-2.5 shadow-sm"
                      >
                        View Patient
                      </button>
                      <button
                        onClick={() => handleContactTeam(p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                        title="Contact Clinical Team"
                      >
                        <Phone size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-3.5 bg-[#070b14] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredPatients.length)} of{' '}
            {filteredPatients.length} patients
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-cyan-300 font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <HospitalPatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onContactTeam={handleContactTeam}
        />
      )}
    </div>
  )
}
