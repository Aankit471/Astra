import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  BedDouble,
  RefreshCw,
  AlertTriangle,
  Plus,
  Minus,
  BookmarkCheck,
  Edit3,
  X,
  ShieldCheck,
} from 'lucide-react'
import type { BedAvailability } from '@/types/domain'
import type { AuthUser } from '@/types/auth'
import { bedRepository, type BedCountsPayload } from '@/services/repositories/bedRepository'
import { useSupabaseRealtime } from '@/services/supabase/useSupabaseRealtime'
import { getRelativeTime } from '@/utils/freshness'

interface HospitalBedsCapacityViewProps {
  hospitalId?: string
  user?: AuthUser
}

export function HospitalBedsCapacityView({
  hospitalId = 'H001',
  user,
}: HospitalBedsCapacityViewProps) {
  const [beds, setBeds] = useState<BedAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [actionError, setActionError] = useState<string | null>(null)


  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [comfortFilter, setComfortFilter] = useState<'ALL' | 'AC' | 'NON_AC'>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Edit Modal State
  const [editingBed, setEditingBed] = useState<BedAvailability | null>(null)
  const [editTotal, setEditTotal] = useState<number>(0)
  const [editAvailable, setEditAvailable] = useState<number>(0)
  const [editOccupied, setEditOccupied] = useState<number>(0)
  const [editReserved, setEditReserved] = useState<number>(0)
  const [editTariff, setEditTariff] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)

  const actor = useMemo(() => ({
    id: user?.id || 'ops-001',
    name: user?.name || 'Hospital Operations Team',
    role: user?.role || 'HOSPITAL_OPS',
  }), [user])

  // Fetch live beds
  const loadBeds = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const data = await bedRepository.getByHospitalId(hospitalId)
      setBeds(data || [])
    } catch (err: any) {
      console.warn('Failed to load live bed inventory:', err)
      setError('Unable to load hospital inventory. Please check connection and retry.')
    } finally {
      setLoading(false)
    }
  }, [hospitalId])

  useEffect(() => {
    loadBeds()
  }, [loadBeds])

  // Realtime hook
  useSupabaseRealtime(useCallback(() => {
    loadBeds(true)
  }, [loadBeds]))

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Quick Action: Allocate Bed (+1 occupied, -1 available)
  const handleAllocate = async (bed: BedAvailability) => {
    setActionError(null)
    if (bed.availableBeds <= 0) {
      setActionError(`Cannot allocate bed in ${bed.notes || bed.category}: No available beds left.`)
      return
    }

    const res = await bedRepository.allocateBed(hospitalId, bed.id, actor)
    if (res.success) {
      showToast(`✓ Bed allocated in ${bed.notes || bed.category}.`)
      loadBeds(true)
    } else {
      setActionError(res.error || 'Failed to allocate bed.')
    }
  }

  // Quick Action: Release Bed (-1 occupied, +1 available)
  const handleRelease = async (bed: BedAvailability) => {
    setActionError(null)
    if (bed.occupiedBeds <= 0) {
      setActionError(`Cannot release bed in ${bed.notes || bed.category}: No occupied beds to release.`)
      return
    }

    const res = await bedRepository.releaseBed(hospitalId, bed.id, actor)
    if (res.success) {
      showToast(`✓ Bed released in ${bed.notes || bed.category}. Now available.`)
      loadBeds(true)
    } else {
      setActionError(res.error || 'Failed to release bed.')
    }
  }

  // Quick Action: Reserve Bed (+1 reserved, -1 available)
  const handleReserve = async (bed: BedAvailability) => {
    setActionError(null)
    if (bed.availableBeds <= 0) {
      setActionError(`Cannot reserve bed in ${bed.notes || bed.category}: No available beds left to reserve.`)
      return
    }

    const res = await bedRepository.reserveBed(hospitalId, bed.id, actor)
    if (res.success) {
      showToast(`✓ Bed reserved in ${bed.notes || bed.category} for incoming referral.`)
      loadBeds(true)
    } else {
      setActionError(res.error || 'Failed to reserve bed.')
    }
  }

  // Open Edit Modal
  const openEditModal = (bed: BedAvailability) => {
    setActionError(null)
    setEditingBed(bed)
    setEditTotal(bed.totalBeds)
    setEditAvailable(bed.availableBeds)
    setEditOccupied(bed.occupiedBeds)
    setEditReserved(bed.reservedBeds || 0)
    setEditTariff(bed.chargePerDay || 0)
  }


  // Save Edit Bed Counts with Strict Validation
  const handleSaveEdit = async () => {
    if (!editingBed) return
    setActionError(null)

    // Validation: prevent negative values
    if (editTotal < 0 || editAvailable < 0 || editOccupied < 0 || editReserved < 0 || editTariff < 0) {
      setActionError('Validation Error: Bed numbers and tariff cannot be negative.')
      return
    }

    // Validation: available + occupied + reserved MUST NOT exceed total
    const sum = editAvailable + editOccupied + editReserved
    if (sum > editTotal) {
      setActionError(
        `Validation Error: Available (${editAvailable}) + Occupied (${editOccupied}) + Reserved (${editReserved}) = ${sum}, which exceeds Total (${editTotal}).`
      )
      return
    }

    setIsSaving(true)
    try {
      const payload: BedCountsPayload = {
        totalBeds: editTotal,
        availableBeds: editAvailable,
        occupiedBeds: editOccupied,
        reservedBeds: editReserved,
        pricePerDay: editTariff,
      }

      const res = await bedRepository.updateBedCounts(hospitalId, editingBed.id, payload, actor)
      if (res.success) {
        showToast(`✓ Bed counts and tariff updated for ${editingBed.notes || editingBed.category}.`)
        setEditingBed(null)
        loadBeds(true)
      } else {
        setActionError(res.error || 'Failed to update bed capacity.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Filtered beds
  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false
      if (comfortFilter !== 'ALL' && b.comfort !== comfortFilter) return false
      if (statusFilter !== 'ALL' && b.availabilityStatus !== statusFilter) return false
      return true
    })
  }, [beds, categoryFilter, comfortFilter, statusFilter])

  // AC vs Non-AC Totals
  const acBeds = useMemo(() => beds.filter((b) => b.comfort === 'AC'), [beds])
  const nonAcBeds = useMemo(() => beds.filter((b) => b.comfort === 'NON_AC'), [beds])

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              SUPABASE LIVE TELEMETRY
            </span>
            <span className="text-xs text-slate-400">
              Facility: <strong className="text-slate-200">{hospitalId}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Beds & Ward Capacity Command
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational bed count allocations, <strong className="text-cyan-300">AC vs Non-AC room inventory</strong>, daily tariffs (₹/day), and live capacity mutations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <button
            onClick={() => loadBeds()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh bed capacity"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>
          <span className="text-slate-400">Filtered:</span>
          <strong className="text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {filteredBeds.length} Categories / Wards
          </strong>
        </div>
      </div>

      {/* ── Toast and Error Banners ────────────────────────────────────── */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {(actionError || error) && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>{actionError || error}</span>
          </div>
          <button onClick={() => { setActionError(null); setError(null) }} className="text-rose-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}


      {/* ── AC vs Non-AC Inventory Overview Cards (Section 3) ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AC Beds Overview */}
        <div className="card p-4 rounded-xl bg-slate-900/90 border-cyan-500/30 bg-cyan-950/10 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>❄️ AC Room Inventory</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
              {acBeds.reduce((acc, b) => acc + b.availableBeds, 0)} AVAILABLE
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[10px] text-slate-400 block">Total AC</span>
              <strong className="text-white text-base block font-bold">
                {acBeds.reduce((acc, b) => acc + b.totalBeds, 0)}
              </strong>
            </div>
            <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 block">Available</span>
              <strong className="text-emerald-300 text-base block font-bold">
                {acBeds.reduce((acc, b) => acc + b.availableBeds, 0)}
              </strong>
            </div>
            <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/30">
              <span className="text-[10px] text-cyan-400 block">Occupied</span>
              <strong className="text-cyan-300 text-base block font-bold">
                {acBeds.reduce((acc, b) => acc + b.occupiedBeds, 0)}
              </strong>
            </div>
          </div>
        </div>

        {/* Non-AC Beds Overview */}
        <div className="card p-4 rounded-xl bg-slate-900/90 border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Non-AC Room Inventory</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
              {nonAcBeds.reduce((acc, b) => acc + b.availableBeds, 0)} AVAILABLE
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2 rounded bg-slate-950/60 border border-white/5">
              <span className="text-[10px] text-slate-400 block">Total Non-AC</span>
              <strong className="text-white text-base block font-bold">
                {nonAcBeds.reduce((acc, b) => acc + b.totalBeds, 0)}
              </strong>
            </div>
            <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 block">Available</span>
              <strong className="text-emerald-300 text-base block font-bold">
                {nonAcBeds.reduce((acc, b) => acc + b.availableBeds, 0)}
              </strong>
            </div>
            <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/30">
              <span className="text-[10px] text-cyan-400 block">Occupied</span>
              <strong className="text-cyan-300 text-base block font-bold">
                {nonAcBeds.reduce((acc, b) => acc + b.occupiedBeds, 0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
            Filter by Bed Category:
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="ICU">ICU (Intensive Care)</option>
            <option value="EMERGENCY">Emergency Resuscitation</option>
            <option value="HDU">HDU (High Dependency)</option>
            <option value="GENERAL">General Ward</option>
            <option value="PRIVATE">Private Rooms</option>
            <option value="SEMI_PRIVATE">Semi-Private Rooms</option>
            <option value="ISOLATION">Negative Isolation</option>
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
            <option value="NON_AC">Non-AC Accommodation</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
            Bed Availability Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="ALL">All Availability</option>
            <option value="AVAILABLE">Available (Vacant beds present)</option>
            <option value="LIMITED">Limited (2 or fewer vacant)</option>
            <option value="FULL">Full (0 vacant beds)</option>
          </select>
        </div>
      </div>

      {/* ── Interactive Bed Inventory Cards with Operational Actions ───── */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2 bg-slate-900/40 rounded-xl border border-slate-800">
          <RefreshCw className="animate-spin text-cyan-400 mx-auto" size={28} />
          <p className="text-sm font-semibold">Loading live bed availability...</p>
        </div>
      ) : filteredBeds.length === 0 ? (
        <div className="p-12 text-center text-slate-400 rounded-xl bg-slate-900/40 border border-slate-800">
          <BedDouble size={32} className="mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-semibold">No bed inventory matching the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBeds.map((bed) => {
            const occRate = bed.totalBeds > 0 ? Math.round((bed.occupiedBeds / bed.totalBeds) * 100) : 0
            const isAvailable = bed.availableBeds > 0

            return (
              <div
                key={bed.id}
                className={`p-4 rounded-xl border space-y-3 transition-all ${
                  isAvailable
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/60 border-rose-500/20'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 block uppercase">
                      {bed.category} · {bed.roomType}
                    </span>
                    <h4 className="text-base font-bold text-white leading-tight">
                      {bed.notes || bed.id}
                    </h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Support: {bed.clinicalSupport}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      bed.comfort === 'AC'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {bed.comfort === 'AC' ? '❄️ AC' : 'Non-AC'}
                  </span>
                </div>

                {/* Live Numbers Grid */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  <div className="p-2 rounded bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Total</span>
                    <strong className="text-white text-sm font-bold">{bed.totalBeds}</strong>
                  </div>
                  <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 block">Available</span>
                    <strong className="text-emerald-300 text-sm font-bold">{bed.availableBeds}</strong>
                  </div>
                  <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/30">
                    <span className="text-[10px] text-cyan-400 block">Occupied</span>
                    <strong className="text-cyan-300 text-sm font-bold">{bed.occupiedBeds}</strong>
                    <span className="text-[9px] text-slate-400 block font-normal">{occRate}% occ</span>
                  </div>

                  <div className="p-2 rounded bg-amber-950/20 border border-amber-500/30">
                    <span className="text-[10px] text-amber-400 block">Reserved</span>
                    <strong className="text-amber-300 text-sm font-bold">{bed.reservedBeds}</strong>
                  </div>
                </div>

                {/* Tariff & Telemetry Status */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Daily Tariff:</span>
                    <strong className="text-emerald-400 font-mono font-bold">
                      {bed.chargeFormatted || (bed.chargePerDay ? `₹${bed.chargePerDay.toLocaleString()} / day` : '₹0 / day')}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                        isAvailable
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      {isAvailable ? 'LIVE' : 'FULL'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">
                      {getRelativeTime(bed.lastUpdatedAt)}
                    </span>
                  </div>
                </div>

                {/* Operational Mutation Buttons (Section 4) */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      onClick={() => handleAllocate(bed)}
                      disabled={bed.availableBeds <= 0}
                      className="py-1.5 px-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Allocate Bed (+1 Occupied, -1 Available)"
                    >
                      <Plus size={12} />
                      <span>Allocate</span>
                    </button>

                    <button
                      onClick={() => handleRelease(bed)}
                      disabled={bed.occupiedBeds <= 0}
                      className="py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Release Bed (-1 Occupied, +1 Available)"
                    >
                      <Minus size={12} />
                      <span>Release</span>
                    </button>

                    <button
                      onClick={() => handleReserve(bed)}
                      disabled={bed.availableBeds <= 0}
                      className="py-1.5 px-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Reserve Bed (+1 Reserved, -1 Available)"
                    >
                      <BookmarkCheck size={12} />
                      <span>Reserve</span>
                    </button>
                  </div>

                  <button
                    onClick={() => openEditModal(bed)}
                    className="w-full py-1 px-2 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <Edit3 size={11} />
                    <span>Edit Capacity Numbers & Tariff</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Edit Bed Capacity & Tariff Modal ────────────────────────────── */}
      {editingBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 bg-[#0B111E] border-slate-700 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Edit Bed Capacity & Tariffs
                </h3>
                <p className="text-xs text-slate-400">
                  {editingBed.notes || editingBed.category} ({editingBed.comfort === 'AC' ? '❄️ AC' : 'Non-AC'})
                </p>
              </div>
              <button
                onClick={() => setEditingBed(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Validation Constraint Indicator */}
            {(() => {
              const currentSum = editAvailable + editOccupied + editReserved
              const isOverCapacity = currentSum > editTotal
              const hasNegative = editTotal < 0 || editAvailable < 0 || editOccupied < 0 || editReserved < 0 || editTariff < 0

              if (isOverCapacity) {
                return (
                  <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    <strong>Validation Error:</strong> Available ({editAvailable}) + Occupied ({editOccupied}) + Reserved ({editReserved}) = {currentSum}, which exceeds Total Beds ({editTotal}).
                  </div>
                )
              }

              if (hasNegative) {
                return (
                  <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    <strong>Validation Error:</strong> Numbers cannot be negative.
                  </div>
                )
              }

              return (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                  <span>Capacity sum valid: {currentSum} / {editTotal} beds allocated</span>
                  <ShieldCheck size={16} />
                </div>
              )
            })()}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Capacity Beds:</label>
                <input
                  type="number"
                  min="1"
                  value={editTotal}
                  onChange={(e) => setEditTotal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white font-mono focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-emerald-400 font-semibold mb-1">Available:</label>
                  <input
                    type="number"
                    min="0"
                    value={editAvailable}
                    onChange={(e) => setEditAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-emerald-300 font-mono focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-cyan-300 font-semibold mb-1">Occupied:</label>
                  <input
                    type="number"
                    min="0"
                    value={editOccupied}
                    onChange={(e) => setEditOccupied(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-semibold mb-1">Reserved:</label>
                  <input
                    type="number"
                    min="0"
                    value={editReserved}
                    onChange={(e) => setEditReserved(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-amber-300 font-mono focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Daily Tariff (₹ / day):</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={editTariff}
                  onChange={(e) => setEditTariff(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBed(null)}
                className="btn-secondary text-xs py-2 px-3.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={
                  isSaving ||
                  editAvailable + editOccupied + editReserved > editTotal ||
                  editTotal < 0 ||
                  editAvailable < 0 ||
                  editOccupied < 0 ||
                  editReserved < 0
                }
                className="btn-primary text-xs py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save & Record Audit Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
