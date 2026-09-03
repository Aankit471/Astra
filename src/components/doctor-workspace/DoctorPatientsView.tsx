import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { MOCK_DOCTOR_PATIENTS, type DoctorPatient } from '@/data/doctorData'
import { DoctorPatientDetailModal } from './DoctorPatientDetailModal'

export function DoctorPatientsView() {
  const [activeTab, setActiveTab] = useState<
    'All' | 'Urgent' | 'Waiting' | 'Admitted' | 'Under Review' | 'Discharged'
  >('All')

  const [searchQuery, setSearchQuery] = useState('')
  const [acuityFilter, setAcuityFilter] = useState('ALL')
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const tabs: Array<typeof activeTab> = [
    'All',
    'Urgent',
    'Waiting',
    'Admitted',
    'Under Review',
    'Discharged',
  ]

  const filteredPatients = useMemo(() => {
    return MOCK_DOCTOR_PATIENTS.filter((p) => {
      // Tab filter
      if (activeTab === 'Urgent' && p.acuity !== 'CRITICAL' && p.status !== 'Urgent') return false
      if (activeTab === 'Waiting' && p.status !== 'Waiting') return false
      if (activeTab === 'Admitted' && p.status !== 'Admitted') return false
      if (activeTab === 'Under Review' && p.status !== 'Under Review') return false
      if (activeTab === 'Discharged' && p.status !== 'Discharged') return false

      // Acuity filter
      if (acuityFilter !== 'ALL' && p.acuity !== acuityFilter) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match = `${p.name} ${p.id} ${p.bedRoom} ${p.reasonForVisit}`.toLowerCase()
        if (!match.includes(q)) return false
      }

      return true
    })
  }, [activeTab, acuityFilter, searchQuery])

  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            CLINICAL PATIENT ROSTER
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            My Assigned Patients & Clinical Inpatients
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active physician roster, patient acuity flags, bed locations, and electronic diagnostic records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-400">Total Inpatients:</span>
          <strong className="text-teal-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {MOCK_DOCTOR_PATIENTS.length} Patients
          </strong>
        </div>
      </div>

      {/* ── 6 Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-t-lg font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800/90 text-teal-300 border-b-2 border-teal-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search by patient name, ID, location, diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#060b13] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 focus:ring-1 focus:ring-teal-400"
          />
        </div>

        <div>
          <select
            value={acuityFilter}
            onChange={(e) => setAcuityFilter(e.target.value)}
            className="w-full bg-[#060b13] border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:ring-1 focus:ring-teal-400 cursor-pointer"
          >
            <option value="ALL">All Acuities</option>
            <option value="CRITICAL">Critical (Immediate Attention)</option>
            <option value="URGENT">Urgent (Monitored)</option>
            <option value="STABLE">Stable (Step-Down / General)</option>
          </select>
        </div>
      </div>

      {/* ── Patients Roster Table ─────────────────────────────────────── */}
      <div className="card overflow-hidden border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060b13] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Patient ID</th>
                <th className="py-3 px-3.5">Patient Name</th>
                <th className="py-3 px-3.5">Age / Sex</th>
                <th className="py-3 px-3.5">Acuity</th>
                <th className="py-3 px-3.5">Bed / Room</th>
                <th className="py-3 px-3.5">Reason for Visit</th>
                <th className="py-3 px-3.5">Arrival</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Last Updated</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedPatients.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3.5 font-mono font-bold text-teal-400">
                    {p.id}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-white">
                    {p.name}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400">
                    {p.age} Yrs · {p.gender}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.acuity === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : p.acuity === 'URGENT'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {p.acuity}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-200 font-medium">
                    {p.bedRoom}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300 max-w-xs truncate">
                    {p.reasonForVisit}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">
                    {p.arrivalTime}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/20">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-500 text-[11px]">
                    {p.lastUpdated}
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={() => setSelectedPatient(p)}
                      className="btn-primary text-[11px] py-1 px-3 shadow-sm"
                    >
                      View Patient
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3.5 bg-[#060b13] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
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
            <span className="font-mono text-teal-300 font-bold">
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
        <DoctorPatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  )
}
