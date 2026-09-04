import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Droplet,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react'
import type { BloodAvailabilityStatus, BloodComponent, BloodGroup, BloodInventoryItem } from '@/types/domain'
import { useAppStore } from '@/store/appStore'
import { bloodRepository } from '@/services/repositories/bloodRepository'
import { useSupabaseRealtime } from '@/services/supabase/useSupabaseRealtime'
import { getRelativeTime } from '@/utils/freshness'

const DEFAULT_THRESHOLDS: Record<BloodGroup, number> = {
  'O+': 10,
  'O-': 5,
  'A+': 10,
  'A-': 5,
  'B+': 10,
  'B-': 5,
  'AB+': 4,
  'AB-': 3,
}

export function BloodAvailabilityView() {
  const storeInventory = useAppStore((state) => state.bloodInventory)
  const hospitals = useAppStore((state) => state.hospitals)
  const [bloodInventory, setBloodInventory] = useState<BloodInventoryItem[]>(storeInventory)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedHospital, setSelectedHospital] = useState<string>('ALL')
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>('ALL')
  const [selectedComponent, setSelectedComponent] = useState<BloodComponent | 'ALL'>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<BloodAvailabilityStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const components: { key: BloodComponent; label: string }[] = [
    { key: 'PACKED_RBC', label: 'Packed RBC' },
    { key: 'PLATELETS', label: 'Platelets' },
    { key: 'FFP', label: 'Fresh Frozen Plasma' },
    { key: 'WHOLE_BLOOD', label: 'Whole Blood' },
    { key: 'CRYOPRECIPITATE', label: 'Cryoprecipitate' },
  ]

  const loadBloodData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await bloodRepository.list()
      if (data && data.length > 0) {
        setBloodInventory(data)
      }
    } catch (err: any) {
      console.warn('Failed to load blood inventory from Supabase:', err)
      setError('Unable to load live blood inventory. Using cached repository data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBloodData()
  }, [loadBloodData])

  useSupabaseRealtime(useCallback(() => {
    loadBloodData()
  }, [loadBloodData]))

  const hospitalBloodOverview = useMemo(() => {
    const list = [
      { id: 'H001', name: 'Apollo General Hospital', type: 'Private Tertiary' },
      { id: 'H002', name: 'Government District Hospital', type: 'Public District' },
      { id: 'H003', name: "St. Mary's Mission Hospital", type: 'Charitable' },
      { id: 'H004', name: 'Sunrise Trauma Centre', type: 'Trauma Specialty' },
    ]
    const groups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

    return list.map((h) => {
      const items = bloodInventory.filter((b) => b.hospitalId === h.id)
      const groupData = groups.map((g) => {
        const match =
          items.find((b) => b.bloodGroup === g && b.component === 'PACKED_RBC') ||
          items.find((b) => b.bloodGroup === g)
        return {
          group: g,
          units: match ? match.availableUnits : 0,
          status: match ? match.status : 'FULL',
        }
      })
      const totalUnits = items.reduce((acc, curr) => acc + curr.availableUnits, 0)
      return {
        ...h,
        totalUnits,
        groups: groupData,
      }
    })
  }, [bloodInventory])

  const filteredItems = useMemo(() => {
    return bloodInventory.filter((item) => {
      if (selectedHospital !== 'ALL' && item.hospitalId !== selectedHospital) return false
      if (selectedGroup !== 'ALL' && item.bloodGroup !== selectedGroup) return false
      if (selectedComponent !== 'ALL' && item.component !== selectedComponent) return false
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match = `${item.hospitalName} ${item.bloodGroup} ${item.component} ${item.source} ${item.status}`.toLowerCase()
        if (!match.includes(q)) return false
      }

      return true
    })
  }, [bloodInventory, selectedHospital, selectedGroup, selectedComponent, selectedStatus, searchQuery])

  // Summary counts
  const totalUnits = useMemo(() => {
    return filteredItems.reduce((acc, item) => acc + item.availableUnits, 0)
  }, [filteredItems])

  const staleCount = useMemo(() => {
    return bloodInventory.filter((b) => b.freshness === 'STALE' || b.status === 'STALE').length
  }, [bloodInventory])

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Droplet className="text-rose-400" size={24} />
            Blood Availability & Inventory Visibility
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Reported blood group & component telemetry across regional network facilities.
          </p>
        </div>
        <button
          onClick={() => loadBloodData()}
          disabled={loading}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh Inventory'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => loadBloodData()} className="btn-secondary text-xs py-1 px-2.5">
            Retry
          </button>
        </div>
      )}

      {/* ── Simulated Data Disclaimer & Clinical Safeguard ───────────── */}
      <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-4 text-xs space-y-2 text-cyan-200">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-cyan-300">
          <ShieldAlert size={16} className="text-cyan-400" />
          <span>DEMO DATA / SIMULATED INVENTORY • Hospital-Reported Telemetry</span>
        </div>
        <p className="text-gray-300 leading-relaxed text-[11px]">
          ASTRA displays facility-reported blood availability for operational decision-support only.
          Reported units do not constitute an autonomous medical recommendation, cross-match
          guarantee, or reservation. Transfusion compatibility and clinical administration require
          direct physician evaluation.
        </p>
      </div>

      {staleCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Telemetry Freshness Notice:</strong>
            <p className="text-gray-300 text-[11px] mt-0.5">
              Some facility entries contain stale or self-reported blood stock data. Verify directly
              with the receiving hospital blood bank before dispatching critical patients.
            </p>
          </div>
        </div>
      )}

      {/* ── Hospital-wise Blood Groups Availability Overview ──────────── */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Droplet size={14} className="text-rose-400" />
            Hospital-by-Hospital Blood Group Availability Matrix
          </h3>
          <span className="text-[11px] text-gray-400">
            Click any hospital to filter table below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hospitalBloodOverview.map((hosp) => (
            <div
              key={hosp.id}
              onClick={() =>
                setSelectedHospital(selectedHospital === hosp.id ? 'ALL' : hosp.id)
              }
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedHospital === hosp.id
                  ? 'bg-rose-950/20 border-rose-500 shadow-md shadow-rose-500/10'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{hosp.name}</h4>
                  <span className="text-[10px] text-gray-400">{hosp.type}</span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {hosp.totalUnits} units
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {hosp.groups.map((g) => (
                  <div
                    key={g.group}
                    className={`text-center p-1 rounded border ${
                      g.units > 0
                        ? g.status === 'AVAILABLE'
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                        : 'bg-rose-950/10 border-rose-500/20 text-rose-400/60'
                    }`}
                  >
                    <span className="text-[9px] font-mono block font-bold">{g.group}</span>
                    <strong className="text-[11px] block leading-tight font-black">{g.units}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Filter Toolbar ────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
          <Filter size={14} className="text-cyan-400" />
          <span>Inventory Filters</span>
        </div>

        {/* Blood group quick pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs text-gray-400 mr-1 shrink-0 font-medium">Group:</span>
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition ${
              selectedGroup === 'ALL'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            All Groups
          </button>
          {bloodGroups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition font-mono ${
                selectedGroup === grp
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>

        {/* Dropdowns & search */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 text-xs">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Facility Target</label>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Component</label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value as BloodComponent | 'ALL')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Components</option>
              {components.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as BloodAvailabilityStatus | 'ALL')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="LIMITED">Limited</option>
              <option value="FULL">Depleted / Full (0 Units)</option>
              <option value="UNKNOWN">Unknown</option>
              <option value="STALE">Stale Data</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Search keyword</label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search facility, source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Table View of Blood Inventory ────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between text-xs">
          <span className="text-gray-400">
            Showing <strong>{filteredItems.length}</strong> reported inventory items
          </span>
          <span className="text-cyan-400 font-semibold">
            Total Reported Stock: <strong className="text-white">{totalUnits} units</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Hospital Facility</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4 text-center">Available Units</th>
                <th className="py-3 px-4 text-center">Min Threshold</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4">Freshness & Telemetry</th>
                <th className="py-3 px-4">Source / Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.length ? (
                filteredItems.map((item) => {
                  const isStale = item.freshness === 'STALE' || item.status === 'STALE'
                  const threshold = DEFAULT_THRESHOLDS[item.bloodGroup] || 5
                  const displayStatus =
                    isStale
                      ? 'STALE'
                      : item.availableUnits === 0 || item.status === 'FULL'
                      ? 'UNAVAILABLE'
                      : item.availableUnits <= threshold || item.status === 'LIMITED'
                      ? 'LOW'
                      : 'AVAILABLE'

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/[0.02] transition ${
                        isStale ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <strong className="text-white block font-medium">
                          {item.hospitalName}
                        </strong>
                        <small className="text-gray-500 font-mono">ID: {item.hospitalId}</small>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-sm text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
                          <Droplet size={12} />
                          {item.bloodGroup}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {item.component.replace('_', ' ')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <strong className="text-base font-bold text-white">
                          {item.availableUnits}
                        </strong>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {threshold} units
                      </td>

                      <td className="py-3.5 px-4">
                        {displayStatus === 'AVAILABLE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 size={12} /> AVAILABLE
                          </span>
                        )}
                        {displayStatus === 'LOW' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <AlertTriangle size={12} /> LOW
                          </span>
                        )}
                        {displayStatus === 'UNAVAILABLE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> UNAVAILABLE
                          </span>
                        )}
                        {displayStatus === 'STALE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-500/40">
                            <AlertTriangle size={12} /> STALE
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-400">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock3 size={12} className={isStale ? 'text-amber-400' : 'text-cyan-400'} />
                          <span>{getRelativeTime(item.lastUpdated)}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            isStale ? 'text-amber-400' : 'text-slate-500'
                          }`}
                        >
                          {isStale ? '⚠ Stale data' : 'Current telemetry'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 text-xs block">{item.source}</span>
                        <span
                          className={`text-[10px] font-medium ${
                            item.verificationStatus === 'VERIFIED'
                              ? 'text-cyan-400'
                              : item.verificationStatus === 'SELF_REPORTED'
                              ? 'text-amber-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {item.verificationStatus === 'VERIFIED'
                            ? '✓ Verified'
                            : item.verificationStatus === 'SELF_REPORTED'
                            ? 'Self-reported'
                            : item.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No blood inventory records match your selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
