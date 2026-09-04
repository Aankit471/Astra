import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  BedDouble,
  CheckCircle2,
  Droplet,
  Edit3,
  Hospital as HospitalIcon,
  Lock,
  MapPin,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { Hospital, ComfortType, HospitalOperationalStatus } from '@/types/domain'
import { getRelativeTime } from '@/utils/freshness'
import { hospitalRepository } from '@/services/repositories/hospitalRepository'
import { bedRepository } from '@/services/repositories/bedRepository'
import { useSupabaseRealtime } from '@/services/supabase/useSupabaseRealtime'

export function AdminHospitalManager() {
  const storeHospitals = useAppStore((state) => state.hospitals)
  const user = useAppStore((state) => state.user)
  const bloodInventory = useAppStore((state) => state.bloodInventory)
  const specialists = useAppStore((state) => state.specialists)
  const referrals = useAppStore((state) => state.referrals)
  const updateHospitalDetails = useAppStore((state) => state.updateHospitalDetails)
  const updateHospitalBedConfig = useAppStore((state) => state.updateHospitalBedConfig)

  const [hospitals, setHospitals] = useState<Hospital[]>(storeHospitals)
  const [_loading, setLoading] = useState(false)

  // Load live hospitals from Supabase
  const loadHospitals = useCallback(async () => {
    setLoading(true)
    try {
      const list = await hospitalRepository.list()
      if (list && list.length > 0) {
        setHospitals(list)
      }
    } catch (err) {
      console.warn('Failed to load hospitals in AdminHospitalManager:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHospitals()
  }, [loadHospitals])

  useSupabaseRealtime(
    useCallback(() => {
      loadHospitals()
    }, [loadHospitals])
  )

  // Admin Authorized Hospital Scope (default to H001 Apollo General)
  const [adminHospitalId, setAdminHospitalId] = useState<string>('H001')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  // Edit form state
  const [editForm, setEditForm] = useState<{
    phone: string
    emergencyPhone: string
    operationalStatus: HospitalOperationalStatus
    addressLine1: string
    beds: Array<{
      id: string
      category: string
      comfort: ComfortType
      availableBeds: number
      occupiedBeds: number
      totalBeds: number
      chargePerDay: number
    }>
  }>({
    phone: '',
    emergencyPhone: '',
    operationalStatus: 'OPERATIONAL',
    addressLine1: '',
    beds: [],
  })

  const adminHospital = useMemo(
    () => hospitals.find((h) => h.id === adminHospitalId) || hospitals[0],
    [hospitals, adminHospitalId]
  )

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        h.name.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q) ||
        h.address.city.toLowerCase().includes(q)
      )
    })
  }, [hospitals, searchQuery])

  // Total summary metrics
  const totalNetworkBeds = useMemo(() => {
    return hospitals.reduce((sum, h) => {
      const beds = h.capabilities.beds || []
      return sum + beds.reduce((bSum, b) => bSum + b.availableBeds, 0)
    }, 0)
  }, [hospitals])

  const totalNetworkBlood = useMemo(() => {
    return bloodInventory.reduce((sum, b) => sum + b.availableUnits, 0)
  }, [bloodInventory])

  const handleOpenEdit = (hospital: Hospital) => {
    // Strictly block if not admin's hospital
    if (hospital.id !== adminHospitalId) return

    setEditingHospital(hospital)
    setEditForm({
      phone: hospital.phone,
      emergencyPhone: hospital.emergencyPhone || hospital.phone,
      operationalStatus: hospital.operationalStatus || 'OPERATIONAL',
      addressLine1: hospital.address.line1,
      beds: (hospital.capabilities.beds || []).map((b) => ({
        id: b.id,
        category: b.category,
        comfort: b.comfort,
        availableBeds: b.availableBeds,
        occupiedBeds: b.occupiedBeds,
        totalBeds: b.totalBeds,
        chargePerDay: b.chargePerDay || (b.comfort === 'AC' ? 2800 : 850),
      })),
    })
  }

  const handleSaveHospitalDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHospital) return

    // Security verify: cannot edit non-affiliated hospital
    if (editingHospital.id !== adminHospitalId) {
      alert('Unauthorized: You are only permitted to modify details for your affiliated hospital.')
      return
    }

    const actor = {
      id: user?.id || 'admin-001',
      name: user?.name || 'Platform Admin',
      role: user?.role || 'ADMIN',
    }

    // 1. Update general hospital details in store & Supabase repository
    updateHospitalDetails(editingHospital.id, {
      phone: editForm.phone,
      emergencyPhone: editForm.emergencyPhone,
      operationalStatus: editForm.operationalStatus,
      addressLine1: editForm.addressLine1,
    })

    await hospitalRepository.updateHospitalDetails(
      editingHospital.id,
      {
        phone: editForm.phone,
        emergencyPhone: editForm.emergencyPhone,
        operationalStatus: editForm.operationalStatus,
        address: { ...editingHospital.address, line1: editForm.addressLine1 },
      },
      actor
    )

    // 2. Update each bed's capacity, comfort (AC/Non-AC), and charges
    for (const bed of editForm.beds) {
      updateHospitalBedConfig(editingHospital.id, bed.id, {
        availableBeds: Number(bed.availableBeds),
        occupiedBeds: Number(bed.occupiedBeds),
        totalBeds: Number(bed.totalBeds),
        comfort: bed.comfort,
        chargePerDay: Number(bed.chargePerDay),
        chargeFormatted: `₹${Number(bed.chargePerDay).toLocaleString()} / day`,
      })

      await bedRepository.updateBedCounts(
        editingHospital.id,
        bed.id,
        {
          totalBeds: Number(bed.totalBeds),
          availableBeds: Number(bed.availableBeds),
          occupiedBeds: Number(bed.occupiedBeds),
          reservedBeds: 0,
          pricePerDay: Number(bed.chargePerDay),
        },
        actor
      )
    }

    setSaveSuccessMessage(
      `Successfully updated facility and bed tariffs for ${editingHospital.name}. Changes persisted to Supabase and logged to audit trail.`
    )
    setEditingHospital(null)
    loadHospitals()

    setTimeout(() => {
      setSaveSuccessMessage(null)
    }, 6000)
  }

  return (
    <div className="space-y-6">
      {/* ── Admin Overview Header ──────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a101d] to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <ShieldCheck size={14} /> ASTRA REGIONAL ADMIN COMMAND
              </span>
              <span className="text-xs text-gray-400 font-mono">
                5 Facilities · Live Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Network Command & Hospital Facility Management
            </h1>
            <p className="text-sm text-gray-300 mt-1 max-w-2xl">
              Complete visibility across all network hospitals, bed inventories, and tariffs. Hospital administrators possess <strong className="text-cyan-300">scoped write access</strong> to update bed counts, room comfort (AC/Non-AC), and daily tariffs for their affiliated facility only.
            </p>
          </div>

          {/* Scoped Administrator Switcher */}
          <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-3.5 space-y-1.5 shrink-0 self-start md:self-auto min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Lock size={12} /> Your Administered Hospital:
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                WRITE PERMITTED
              </span>
            </div>
            <select
              value={adminHospitalId}
              onChange={(e) => setAdminHospitalId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-cyan-200 font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.id})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400">
              You can only modify bed tariffs and details for{' '}
              <strong className="text-white">{adminHospital.name}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Save success banner */}
      {saveSuccessMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-4 text-xs text-emerald-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-400 hover:text-white ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Operational Metric Counters (All Network) ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
        <div className="card p-4 bg-slate-900/80 border-slate-800">
          <span className="text-gray-400 block font-medium">Network Hospitals</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-bold text-white">{hospitals.length}</strong>
            <small className="text-cyan-400">All Connected</small>
          </div>
        </div>
        <div className="card p-4 bg-slate-900/80 border-slate-800">
          <span className="text-gray-400 block font-medium">Available Network Beds</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-bold text-emerald-400">{totalNetworkBeds}</strong>
            <small className="text-gray-400">AC & Non-AC</small>
          </div>
        </div>
        <div className="card p-4 bg-slate-900/80 border-slate-800">
          <span className="text-gray-400 block font-medium">Total Blood Stock</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-bold text-rose-400">{totalNetworkBlood}</strong>
            <small className="text-gray-400">Units</small>
          </div>
        </div>
        <div className="card p-4 bg-slate-900/80 border-slate-800">
          <span className="text-gray-400 block font-medium">Active Referrals</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-bold text-cyan-300">
              {referrals.filter((r) => !['ARRIVED', 'COMPLETED'].includes(r.status)).length}
            </strong>
            <small className="text-gray-400">In Pipeline</small>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Facilities ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search network hospitals by name, type, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Showing {filteredHospitals.length} network facilities</span>
        </div>
      </div>

      {/* ── Hospitals List (Full Visibility + Scoped Edit) ────────────── */}
      <div className="space-y-6">
        {filteredHospitals.map((hospital) => {
          const isMyHospital = hospital.id === adminHospitalId
          const beds = hospital.capabilities.beds || []
          const hospitalBlood = bloodInventory.filter((b) => b.hospitalId === hospital.id)
          const hospitalSpecialists = specialists.filter((s) => s.hospitalId === hospital.id)

          const acBeds = beds.filter((b) => b.comfort === 'AC')
          const nonAcBeds = beds.filter((b) => b.comfort === 'NON_AC')
          const acAvail = acBeds.reduce((s, b) => s + b.availableBeds, 0)
          const nonAcAvail = nonAcBeds.reduce((s, b) => s + b.availableBeds, 0)
          const minAcPrice = acBeds.length
            ? Math.min(...acBeds.map((b) => b.chargePerDay || 2800))
            : null
          const minNonAcPrice = nonAcBeds.length
            ? Math.min(...nonAcBeds.map((b) => b.chargePerDay || 850))
            : null

          return (
            <div
              key={hospital.id}
              className={`card p-5 space-y-4 border transition-all shadow-xl ${
                isMyHospital
                  ? 'border-cyan-500/50 bg-slate-900/95 ring-1 ring-cyan-500/20 shadow-cyan-500/5'
                  : 'border-slate-800 bg-slate-900/70'
              }`}
            >
              {/* Hospital Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isMyHospital
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-gray-400 border border-slate-700'
                    }`}
                  >
                    <HospitalIcon size={24} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{hospital.name}</h3>
                      <span className="text-[10px] font-mono font-bold bg-slate-800 text-gray-300 px-2 py-0.5 rounded border border-slate-700">
                        {hospital.id}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {hospital.type}
                      </span>

                      {/* Authorization Badge */}
                      {isMyHospital ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-400/40 animate-pulse">
                          👑 Your Affiliated Facility (Full Edit Access)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                          <Lock size={10} /> View Only (Other Hospital)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                      <MapPin size={12} className="text-gray-500" />
                      <span>
                        {hospital.address.line1}, {hospital.address.city}
                      </span>
                      <span>•</span>
                      <Phone size={12} className="text-gray-500" />
                      <span>{hospital.emergencyPhone || hospital.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Edit Button or Locked Indicator */}
                <div className="self-start sm:self-auto shrink-0">
                  {isMyHospital ? (
                    <button
                      onClick={() => handleOpenEdit(hospital)}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
                    >
                      <Edit3 size={14} />
                      <span>Edit Facility & Bed Tariffs</span>
                    </button>
                  ) : (
                    <div
                      className="flex items-center gap-1.5 text-xs text-gray-500 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-white/5 cursor-not-allowed"
                      title="You can only edit details for your affiliated hospital"
                    >
                      <Lock size={13} className="text-amber-400" />
                      <span>Edit Locked (Not Affiliated)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── AC vs Non-AC Quick Summary Pills ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-gray-400 text-[11px] block">❄️ AC Room Beds</span>
                  <strong className="text-sm font-bold text-white block mt-0.5">
                    {acAvail} available
                  </strong>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    {minAcPrice ? `from ₹${minAcPrice.toLocaleString()} / day` : 'Tariff available'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-gray-400 text-[11px] block">Non-AC Room Beds</span>
                  <strong className="text-sm font-bold text-white block mt-0.5">
                    {nonAcAvail} available
                  </strong>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    {minNonAcPrice
                      ? `from ₹${minNonAcPrice.toLocaleString()} / day`
                      : hospital.type === 'GOVERNMENT'
                      ? '₹250 / day (Govt)'
                      : 'Govt Subsidized'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-gray-400 text-[11px] block">Blood Bank Stock</span>
                  <strong className="text-sm font-bold text-rose-400 block mt-0.5">
                    {hospitalBlood.reduce((s, b) => s + b.availableUnits, 0)} units
                  </strong>
                  <span className="text-[10px] text-gray-400 block">
                    {hospitalBlood.length} blood groups
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-gray-400 text-[11px] block">Duty Specialists</span>
                  <strong className="text-sm font-bold text-cyan-300 block mt-0.5">
                    {hospitalSpecialists.length} Doctors
                  </strong>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    {hospitalSpecialists.filter((s) => s.isAvailable).length} Active On Duty
                  </span>
                </div>
              </div>

              {/* ── Bed Inventory & Tariff Table ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <BedDouble size={14} /> Operational Beds, Comfort Types & Tariffs
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Last sync: {getRelativeTime(hospital.lastUpdated)}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-gray-400 text-[10px] uppercase tracking-wider border-b border-white/5">
                      <tr>
                        <th className="py-2 px-3">Bed Category</th>
                        <th className="py-2 px-3">Room Type</th>
                        <th className="py-2 px-3">Comfort</th>
                        <th className="py-2 px-3 text-center">Available</th>
                        <th className="py-2 px-3 text-center">Occupied</th>
                        <th className="py-2 px-3 text-center">Total</th>
                        <th className="py-2 px-3">Daily Tariff</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {beds.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3">
                            <strong className="text-white block font-medium">
                              {b.category.replace('_', ' ')}
                            </strong>
                            <span className="text-[10px] text-gray-400">
                              {b.clinicalSupport.toLowerCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-300 capitalize">{b.roomType.toLowerCase()}</td>
                          <td className="py-2 px-3">
                            {b.comfort === 'AC' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                ❄️ AC Room
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                Non-AC
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <strong
                              className={`font-bold ${
                                b.availableBeds === 0 ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {b.availableBeds}
                            </strong>
                          </td>
                          <td className="py-2 px-3 text-center text-gray-300">{b.occupiedBeds}</td>
                          <td className="py-2 px-3 text-center text-gray-400">{b.totalBeds}</td>
                          <td className="py-2 px-3">
                            <strong className="text-emerald-400 font-mono font-bold">
                              {b.chargeFormatted ||
                                (b.chargePerDay ? `₹${b.chargePerDay.toLocaleString()} / day` : '₹1,500 / day')}
                            </strong>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.availabilityStatus === 'AVAILABLE'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : b.availabilityStatus === 'LIMITED'
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : 'bg-rose-500/15 text-rose-300'
                              }`}
                            >
                              {b.availabilityStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Blood Bank Stock & Specialist Roster Mini-Grid ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Blood Bank mini-summary */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <Droplet size={13} /> Blood Bank Inventory
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {hospitalBlood.reduce((s, b) => s + b.availableUnits, 0)} Units Available
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {hospitalBlood.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className="p-1 rounded bg-black/40 border border-white/5 text-center text-[10px]"
                      >
                        <span className="font-bold text-gray-400 block">{b.bloodGroup}</span>
                        <strong className="text-white block">{b.availableUnits}u</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specialists mini-summary */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Stethoscope size={13} /> Clinical Duty Specialists
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {hospitalSpecialists.length} On Roster
                    </span>
                  </div>
                  <div className="space-y-1">
                    {hospitalSpecialists.slice(0, 2).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-[11px] p-1 rounded bg-black/40 border border-white/5"
                      >
                        <span className="text-white font-medium">{s.doctorName}</span>
                        <span className="text-cyan-300 text-[10px]">{s.specialty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Edit Modal for Admin's Hospital ────────────────────────────── */}
      {editingHospital && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="presentation"
        >
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-cyan-400 tracking-wider">
                  Admin Facility Editor · {editingHospital.name}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Update Facility Info, Beds (AC/Non-AC) & Daily Tariffs
                </h3>
                <p className="text-xs text-gray-400">
                  Modifications will be immediately reflected across the User and Doctor portals.
                </p>
              </div>
              <button
                onClick={() => setEditingHospital(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveHospitalDetails} className="space-y-5">
              {/* General Hospital Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  1. Facility Contact & Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">
                      Emergency Hotline Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.emergencyPhone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, emergencyPhone: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">
                      General Reception Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">
                      Facility Address Line
                    </label>
                    <input
                      type="text"
                      value={editForm.addressLine1}
                      onChange={(e) =>
                        setEditForm({ ...editForm, addressLine1: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">
                      Operational Status
                    </label>
                    <select
                      value={editForm.operationalStatus}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          operationalStatus: e.target.value as HospitalOperationalStatus,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-cyan-400"
                    >
                      <option value="OPERATIONAL">OPERATIONAL (Normal Capacity)</option>
                      <option value="CAPACITY_WARNING">CAPACITY WARNING (High Load)</option>
                      <option value="OVERLOADED">OVERLOADED (Emergency Only)</option>
                      <option value="DIVERTING">DIVERTING (Non-Intake)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bed Inventory & Tariff Editor */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Bed Inventory, Comfort (AC / Non-AC) & Tariffs (₹/day)</span>
                  <span className="text-[11px] text-cyan-400 font-normal">
                    Real-time Patient Visibility
                  </span>
                </h4>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {editForm.beds.map((bed, index) => (
                    <div
                      key={bed.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-white font-bold">
                          {bed.category.replace('_', ' ')} Bed #{index + 1}
                        </strong>
                        <span className="text-[11px] font-mono text-gray-400">{bed.id}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {/* Comfort: AC vs Non-AC */}
                        <div>
                          <label className="block text-gray-400 text-[10px] mb-0.5">
                            Comfort Type
                          </label>
                          <select
                            value={bed.comfort}
                            onChange={(e) => {
                              const nextBeds = [...editForm.beds]
                              nextBeds[index].comfort = e.target.value as ComfortType
                              setEditForm({ ...editForm, beds: nextBeds })
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-cyan-300 font-semibold focus:ring-1 focus:ring-cyan-400"
                          >
                            <option value="AC">❄️ AC Room</option>
                            <option value="NON_AC">Non-AC Room</option>
                          </select>
                        </div>

                        {/* Available beds */}
                        <div>
                          <label className="block text-gray-400 text-[10px] mb-0.5">
                            Available Beds
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={bed.totalBeds}
                            value={bed.availableBeds}
                            onChange={(e) => {
                              const nextBeds = [...editForm.beds]
                              nextBeds[index].availableBeds = Number(e.target.value)
                              setEditForm({ ...editForm, beds: nextBeds })
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-400"
                          />
                        </div>

                        {/* Occupied beds */}
                        <div>
                          <label className="block text-gray-400 text-[10px] mb-0.5">
                            Occupied Beds
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={bed.occupiedBeds}
                            onChange={(e) => {
                              const nextBeds = [...editForm.beds]
                              nextBeds[index].occupiedBeds = Number(e.target.value)
                              setEditForm({ ...editForm, beds: nextBeds })
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-400"
                          />
                        </div>

                        {/* Total beds */}
                        <div>
                          <label className="block text-gray-400 text-[10px] mb-0.5">
                            Total Capacity
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={bed.totalBeds}
                            onChange={(e) => {
                              const nextBeds = [...editForm.beds]
                              nextBeds[index].totalBeds = Number(e.target.value)
                              setEditForm({ ...editForm, beds: nextBeds })
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-400"
                          />
                        </div>

                        {/* Daily Charge / Tariff (₹/day) */}
                        <div>
                          <label className="block text-gray-400 text-[10px] mb-0.5">
                            Tariff (₹ / day)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={50}
                            value={bed.chargePerDay}
                            onChange={(e) => {
                              const nextBeds = [...editForm.beds]
                              nextBeds[index].chargePerDay = Number(e.target.value)
                              setEditForm({ ...editForm, beds: nextBeds })
                            }}
                            className="w-full bg-slate-900 border border-emerald-500/40 rounded p-1.5 text-xs font-mono font-bold text-emerald-400 focus:ring-1 focus:ring-emerald-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[11px] text-gray-400">
                  Audit action: <code className="text-cyan-300">ADMIN_HOSPITAL_UPDATE</code>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingHospital(null)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                  >
                    <Save size={14} />
                    <span>Save Changes for {editingHospital.name}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
