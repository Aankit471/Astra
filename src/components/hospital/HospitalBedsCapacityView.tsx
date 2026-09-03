import { useState, useMemo } from 'react'
import { MOCK_WARDS } from '@/data/hospitalOperations'

export interface HospitalBedItem {
  id: string
  ward: string
  room: string
  bedNumber: string
  comfort: 'AC' | 'NON_AC'
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'OUT_OF_SERVICE'
  patient: string | null
  tariff: number
}

export function HospitalBedsCapacityView() {

  const [selectedWard, setSelectedWard] = useState('ALL')
  const [comfortFilter, setComfortFilter] = useState<'ALL' | 'AC' | 'NON_AC'>('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Generate 24 interactive bed cards across wards
  const [bedsState, setBedsState] = useState<HospitalBedItem[]>([
    // Emergency
    { id: 'BED-ER-01', ward: 'Emergency Resuscitation Bay', room: 'Bay 1', bedNumber: 'ER-01', comfort: 'AC' as const, status: 'OCCUPIED' as const, patient: 'Patient Rajesh Kumar', tariff: 3500 },
    { id: 'BED-ER-02', ward: 'Emergency Resuscitation Bay', room: 'Bay 2', bedNumber: 'ER-02', comfort: 'AC' as const, status: 'OCCUPIED' as const, patient: 'Patient Vikramaditya Rao', tariff: 3500 },
    { id: 'BED-ER-03', ward: 'Emergency Resuscitation Bay', room: 'Bay 3', bedNumber: 'ER-03', comfort: 'AC' as const, status: 'AVAILABLE' as const, patient: null, tariff: 3500 },
    { id: 'BED-ER-04', ward: 'Emergency Resuscitation Bay', room: 'Bay 4', bedNumber: 'ER-04', comfort: 'NON_AC' as const, status: 'RESERVED' as const, patient: 'Patient Kavita Chawla', tariff: 850 },

    // CICU
    { id: 'BED-CICU-01', ward: 'Intensive Coronary & Cardiac ICU', room: 'CICU-01', bedNumber: 'C-01', comfort: 'AC' as const, status: 'OCCUPIED' as const, patient: 'Patient Ramesh K.', tariff: 8500 },
    { id: 'BED-CICU-02', ward: 'Intensive Coronary & Cardiac ICU', room: 'CICU-02', bedNumber: 'C-02', comfort: 'AC' as const, status: 'OCCUPIED' as const, patient: 'Patient Fatima B.', tariff: 8500 },
    { id: 'BED-CICU-03', ward: 'Intensive Coronary & Cardiac ICU', room: 'CICU-03', bedNumber: 'C-03', comfort: 'AC' as const, status: 'AVAILABLE' as const, patient: null, tariff: 8500 },
    { id: 'BED-CICU-04', ward: 'Intensive Coronary & Cardiac ICU', room: 'CICU-04', bedNumber: 'C-04', comfort: 'AC' as const, status: 'AVAILABLE' as const, patient: null, tariff: 8500 },
    { id: 'BED-CICU-05', ward: 'Intensive Coronary & Cardiac ICU', room: 'CICU-05', bedNumber: 'C-05', comfort: 'AC' as const, status: 'CLEANING' as const, patient: null, tariff: 8500 },
    { id: 'BED-CICU-06', ward: 'Intensive Coronary & Cardiac ICU', room: 'CICU-06', bedNumber: 'C-06', comfort: 'AC' as const, status: 'RESERVED' as const, patient: 'Incoming Transfer Harish C.', tariff: 8500 },

    // Cardiology Step-Down
    { id: 'BED-CSD-01', ward: 'Cardiology Step-Down Ward', room: 'CSD-01', bedNumber: 'B-01', comfort: 'AC' as const, status: 'AVAILABLE' as const, patient: null, tariff: 2800 },
    { id: 'BED-CSD-02', ward: 'Cardiology Step-Down Ward', room: 'CSD-02', bedNumber: 'B-02', comfort: 'AC' as const, status: 'OCCUPIED' as const, patient: 'Patient Meena Pillai', tariff: 2800 },
    { id: 'BED-CSD-03', ward: 'Cardiology Step-Down Ward', room: 'CSD-03', bedNumber: 'B-03', comfort: 'NON_AC' as const, status: 'AVAILABLE' as const, patient: null, tariff: 850 },

    // General Medicine
    { id: 'BED-MED-01', ward: 'General Medicine Ward', room: 'MED-10', bedNumber: 'M-10', comfort: 'NON_AC' as const, status: 'OCCUPIED' as const, patient: 'Patient Someshwar Hegde', tariff: 850 },
    { id: 'BED-MED-02', ward: 'General Medicine Ward', room: 'MED-11', bedNumber: 'M-11', comfort: 'NON_AC' as const, status: 'AVAILABLE' as const, patient: null, tariff: 850 },
    { id: 'BED-MED-03', ward: 'General Medicine Ward', room: 'MED-12', bedNumber: 'M-12', comfort: 'NON_AC' as const, status: 'OUT_OF_SERVICE' as const, patient: null, tariff: 850 },

    // Pediatrics
    { id: 'BED-PED-01', ward: 'Pediatrics Acute Ward', room: 'PED-01', bedNumber: 'P-01', comfort: 'AC' as const, status: 'AVAILABLE' as const, patient: null, tariff: 2400 },
    { id: 'BED-PED-02', ward: 'Pediatrics Acute Ward', room: 'PED-02', bedNumber: 'P-02', comfort: 'AC' as const, status: 'OCCUPIED' as const, patient: 'Patient Aarav Gupta', tariff: 2400 },

    // Surgery
    { id: 'BED-SURG-01', ward: 'Post-Operative Surgery Ward', room: 'SURG-01', bedNumber: 'S-01', comfort: 'AC' as const, status: 'OCCUPIED' as const, patient: 'Patient Farida Begum', tariff: 3800 },
    { id: 'BED-SURG-02', ward: 'Post-Operative Surgery Ward', room: 'SURG-02', bedNumber: 'S-02', comfort: 'AC' as const, status: 'AVAILABLE' as const, patient: null, tariff: 3800 },
    { id: 'BED-SURG-03', ward: 'Post-Operative Surgery Ward', room: 'SURG-03', bedNumber: 'S-03', comfort: 'NON_AC' as const, status: 'AVAILABLE' as const, patient: null, tariff: 850 },
  ])

  const filteredBeds = useMemo(() => {
    return bedsState.filter((b) => {
      if (selectedWard !== 'ALL' && b.ward !== selectedWard) return false
      if (comfortFilter !== 'ALL' && b.comfort !== comfortFilter) return false
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false
      return true
    })
  }, [bedsState, selectedWard, comfortFilter, statusFilter])

  const handleStatusChange = (bedId: string, newStatus: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'OUT_OF_SERVICE') => {
    setBedsState((prev) =>
      prev.map((b) => (b.id === bedId ? { ...b, status: newStatus } : b))
    )
    setToastMessage(`Bed #${bedId} status updated to ${newStatus}`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            FACILITY CAPACITY COMMAND
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Beds & Ward Capacity Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive ward bed map, <strong className="text-cyan-300">AC vs Non-AC room types</strong>, daily tariffs (₹/day), and live bed turnarounds.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-400">Total Filtered:</span>
          <strong className="text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {filteredBeds.length} Beds
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

      {/* ── Filters Toolbar ────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
            Filter by Clinical Ward:
          </label>
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="ALL">All Wards</option>
            {MOCK_WARDS.map((w) => (
              <option key={w.id} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
            Room Comfort (AC / Non-AC):
          </label>
          <select
            value={comfortFilter}
            onChange={(e) => setComfortFilter(e.target.value as 'ALL' | 'AC' | 'NON_AC')}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="ALL">All Comfort Types</option>
            <option value="AC">❄️ AC Room Accommodation</option>
            <option value="NON_AC">Non-AC Room Accommodation</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
            Bed Operational Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available (Vacant)</option>
            <option value="OCCUPIED">Occupied (Patient Assigned)</option>
            <option value="RESERVED">Reserved (Incoming Transfer)</option>
            <option value="CLEANING">Cleaning & Sanitization</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
        </div>
      </div>

      {/* ── Interactive Bed Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filteredBeds.map((bed) => {
          return (
            <div
              key={bed.id}
              className={`p-4 rounded-xl border space-y-3 transition-all ${
                bed.status === 'AVAILABLE'
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                  : bed.status === 'OCCUPIED'
                  ? 'bg-slate-900/90 border-slate-800'
                  : bed.status === 'RESERVED'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : bed.status === 'CLEANING'
                  ? 'bg-blue-950/20 border-blue-500/30'
                  : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">{bed.room}</span>
                  <h4 className="text-base font-bold text-white leading-tight">{bed.bedNumber}</h4>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{bed.ward}</span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    bed.comfort === 'AC'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {bed.comfort === 'AC' ? '❄️ AC Room' : 'Non-AC'}
                </span>
              </div>

              {/* Status and Patient Info */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Status:</span>
                  <span
                    className={`font-bold text-[11px] ${
                      bed.status === 'AVAILABLE'
                        ? 'text-emerald-400'
                        : bed.status === 'OCCUPIED'
                        ? 'text-cyan-300'
                        : bed.status === 'RESERVED'
                        ? 'text-amber-400'
                        : bed.status === 'CLEANING'
                        ? 'text-blue-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {bed.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Daily Tariff:</span>
                  <strong className="text-emerald-400 font-mono font-bold">
                    ₹{bed.tariff.toLocaleString()} / day
                  </strong>
                </div>

                {bed.patient && (
                  <div className="p-2 rounded bg-black/40 border border-white/5 mt-1 text-[11px]">
                    <span className="text-slate-500 block text-[10px]">Current Patient:</span>
                    <strong className="text-white block truncate">{bed.patient}</strong>
                  </div>
                )}
              </div>

              {/* Quick Status Changer Dropdown */}
              <div className="pt-2 border-t border-white/5 text-xs">
                <label className="text-[10px] text-slate-500 block mb-0.5">Quick Action / Toggle:</label>
                <select
                  value={bed.status}
                  onChange={(e) => handleStatusChange(bed.id, e.target.value as 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'OUT_OF_SERVICE')}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="AVAILABLE">Mark Available (Vacant)</option>
                  <option value="OCCUPIED">Mark Occupied</option>
                  <option value="RESERVED">Mark Reserved</option>
                  <option value="CLEANING">Mark Cleaning / Sanitization</option>
                  <option value="OUT_OF_SERVICE">Mark Out of Service</option>
                </select>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
