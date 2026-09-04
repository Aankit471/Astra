import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Droplet,
  RefreshCw,
  Siren,
  Stethoscope,
  CheckCircle2,
} from 'lucide-react'
import type { Hospital, Referral, BedAvailability } from '@/types/domain'
import type { AuthUser } from '@/types/auth'

import { bedRepository } from '@/services/repositories/bedRepository'
import { bloodRepository, type BloodGroupStatusItem } from '@/services/repositories/bloodRepository'
import { doctorRepository, type HospitalDoctorItem } from '@/services/repositories/doctorRepository'
import { referralRepository } from '@/services/repositories/referralRepository'
import { auditRepository } from '@/services/repositories/auditRepository'
import { useSupabaseRealtime } from '@/services/supabase/useSupabaseRealtime'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { getRelativeTime } from '@/utils/freshness'

interface HospitalDashboardProps {
  hospital: Hospital
  user?: AuthUser
  onNavigate: (view: string) => void
  onOpenReferralModal?: (refId: string) => void
}

export function HospitalDashboard({
  hospital,
  user,
  onNavigate,
  onOpenReferralModal,
}: HospitalDashboardProps) {
  const hospitalId = hospital.id || 'H001'

  // State hooks for live telemetry
  const [beds, setBeds] = useState<BedAvailability[]>([])
  const [bloodTelemetry, setBloodTelemetry] = useState<BloodGroupStatusItem[]>([])
  const [specialists, setSpecialists] = useState<HospitalDoctorItem[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch all live data for this specific hospital
  const fetchLiveData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setIsRefreshing(true)
    setError(null)

    try {
      const [bedsData, bloodData, doctorsData, refData, auditData] = await Promise.all([
        bedRepository.getByHospitalId(hospitalId),
        bloodRepository.getHospitalBloodTelemetry(hospitalId),
        doctorRepository.getHospitalSpecialists(hospitalId),
        referralRepository.list({ hospitalId }),
        auditRepository.list(hospitalId),
      ])

      setBeds(bedsData || [])
      setBloodTelemetry(bloodData || [])
      setSpecialists(doctorsData || [])
      setReferrals(refData || [])
      setAuditLogs(auditData || [])
    } catch (err: any) {
      console.warn('Failed to load hospital operations live data:', err)
      setError(err?.message || 'Unable to load live hospital inventory. Displaying cached data.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [hospitalId])

  useEffect(() => {
    fetchLiveData()
  }, [fetchLiveData])

  // Realtime hook: automatically re-sync without full reload when Postgres updates occur
  const realtimeState = useSupabaseRealtime(useCallback(() => {
    fetchLiveData(true)
  }, [fetchLiveData]))

  // Bed Metrics Aggregations
  const totalBeds = useMemo(() => beds.reduce((acc, b) => acc + (b.totalBeds || 0), 0), [beds])
  const availableBeds = useMemo(() => beds.reduce((acc, b) => acc + (b.availableBeds || 0), 0), [beds])
  const occupiedBeds = useMemo(() => beds.reduce((acc, b) => acc + (b.occupiedBeds || 0), 0), [beds])
  const reservedBeds = useMemo(() => beds.reduce((acc, b) => acc + (b.reservedBeds || 0), 0), [beds])
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  // Category counts
  const icuBeds = useMemo(() => beds.filter((b) => b.category === 'ICU'), [beds])
  const emergencyBeds = useMemo(() => beds.filter((b) => b.category === 'EMERGENCY'), [beds])
  const hduBeds = useMemo(() => beds.filter((b) => b.category === 'HDU'), [beds])
  const generalBeds = useMemo(() => beds.filter((b) => b.category === 'GENERAL'), [beds])
  const privateBeds = useMemo(() => beds.filter((b) => b.category === 'PRIVATE' || b.category === 'SEMI_PRIVATE'), [beds])

  // AC vs Non-AC counts
  const acBeds = useMemo(() => beds.filter((b) => b.comfort === 'AC'), [beds])
  const nonAcBeds = useMemo(() => beds.filter((b) => b.comfort === 'NON_AC'), [beds])

  const acAvailable = useMemo(() => acBeds.reduce((acc, b) => acc + b.availableBeds, 0), [acBeds])
  const acTotal = useMemo(() => acBeds.reduce((acc, b) => acc + b.totalBeds, 0), [acBeds])
  const nonAcAvailable = useMemo(() => nonAcBeds.reduce((acc, b) => acc + b.availableBeds, 0), [nonAcBeds])
  const nonAcTotal = useMemo(() => nonAcBeds.reduce((acc, b) => acc + b.totalBeds, 0), [nonAcBeds])

  // Active incoming referrals (critical emergencies first)
  const incomingReferrals = useMemo(() => {
    return referrals.filter((r) => !['COMPLETED', 'DECLINED'].includes(r.status))
  }, [referrals])

  // On-call doctors
  const onCallSpecialists = useMemo(() => {
    return specialists.filter((d) => d.onCall || d.status === 'ON_CALL')
  }, [specialists])

  return (
    <div className="space-y-6">
      {/* ── Realtime Disconnected Warning ──────────────────────────────── */}
      {!realtimeState.isLive && isSupabaseConfigured() && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span>Realtime connection unavailable — displaying last synchronized data.</span>
          </div>
          <button
            onClick={() => fetchLiveData()}
            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium"
          >
            Reconnect / Sync
          </button>
        </div>
      )}

      {/* ── Offline Mock Fallback Notice ───────────────────────────────── */}
      {!isSupabaseConfigured() && (
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs text-blue-300">
          <span>Operating in Offline / Mock Data Fallback Mode. Supabase credentials not configured in environment.</span>
          <span className="font-mono text-[10px] bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/30">MOCK FALLBACK</span>
        </div>
      )}

      {/* ── Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a1120] to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                LIVE
              </span>
              <span className="text-xs text-slate-400">
                Facility ID: <strong className="text-slate-200 font-mono">{hospitalId}</strong>
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">
                Shift: Operations Command Desk
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {hospital.name} · {user?.name || 'Operations Command'}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Hospital Operations Command Center · Real-time Bed Inventory, Tariffs, Blood Bank & Referral Queue
            </p>

          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => fetchLiveData()}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Refresh telemetry"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
            </button>
            <button
              onClick={() => onNavigate('referrals')}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
            >
              <Siren size={14} />
              <span>Incoming Referrals ({incomingReferrals.length})</span>
            </button>
            <button
              onClick={() => onNavigate('beds')}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <BedDouble size={14} />
              <span>Manage Beds & Tariffs</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Error Banner if any ────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchLiveData()}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-white font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading Spinner State ──────────────────────────────────────── */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <RefreshCw className="animate-spin text-cyan-400 mx-auto" size={32} />
          <p className="text-sm font-semibold text-slate-300">Loading live bed availability & telemetry...</p>
          <span className="text-xs text-slate-500">Querying Supabase hospital_beds, blood_inventory, and referrals</span>
        </div>
      ) : (
        <>
          {/* ── SECTION 2 & 3: LIVE BED AVAILABILITY DASHBOARD & AC/NON-AC ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <BedDouble size={17} className="text-cyan-400" />
                  Live Bed Availability & Comfort Inventory
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronized with Supabase <code className="font-mono text-cyan-300">public.hospital_beds</code>. Real tariff pricing and operational statuses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                  {availableBeds} VACANT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                  {occupancyRate}% OCCUPIED
                </span>
              </div>
            </div>

            {/* KPI Top Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="card p-3.5 bg-slate-900/90 border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Total Beds</span>
                <strong className="text-2xl font-bold text-white block mt-1">{totalBeds}</strong>
                <span className="text-[10px] text-slate-500 block">All Registered Wings</span>
              </div>

              <div className="card p-3.5 bg-slate-900/90 border-emerald-500/30 bg-emerald-950/10">
                <span className="text-[11px] text-emerald-400 block font-medium">Available Beds</span>
                <strong className="text-2xl font-bold text-emerald-300 block mt-1">{availableBeds}</strong>
                <span className="text-[10px] text-emerald-400/80 block">Immediate intake ready</span>
              </div>

              <div className="card p-3.5 bg-slate-900/90 border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Occupied Beds</span>
                <strong className="text-2xl font-bold text-cyan-300 block mt-1">{occupiedBeds}</strong>
                <span className="text-[10px] text-slate-500 block">{occupancyRate}% occupancy</span>
              </div>

              <div className="card p-3.5 bg-slate-900/90 border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Reserved Beds</span>
                <strong className="text-2xl font-bold text-amber-400 block mt-1">{reservedBeds}</strong>
                <span className="text-[10px] text-amber-300/80 block">En-route / Transfer</span>
              </div>

              {/* AC Beds Summary */}
              <div className="card p-3.5 bg-slate-900/90 border-cyan-500/30 bg-cyan-950/10">
                <span className="text-[11px] text-cyan-300 block font-medium">❄️ AC Beds</span>
                <strong className="text-2xl font-bold text-white block mt-1">
                  {acAvailable} <span className="text-xs font-normal text-slate-400">/ {acTotal} avail</span>
                </strong>
                <span className="text-[10px] text-cyan-400 block">Climate-controlled</span>
              </div>

              {/* Non-AC Beds Summary */}
              <div className="card p-3.5 bg-slate-900/90 border-slate-800">
                <span className="text-[11px] text-slate-300 block font-medium">Non-AC Beds</span>
                <strong className="text-2xl font-bold text-white block mt-1">
                  {nonAcAvailable} <span className="text-xs font-normal text-slate-400">/ {nonAcTotal} avail</span>
                </strong>
                <span className="text-[10px] text-slate-400 block">Standard ventilation</span>
              </div>
            </div>

            {/* Specific Categories Strip (ICU, Emergency, HDU, General, Private) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">ICU BEDS</span>
                  <strong className="text-white text-sm">
                    {icuBeds.reduce((acc, b) => acc + b.availableBeds, 0)} <span className="text-[10px] text-slate-400">/ {icuBeds.reduce((acc, b) => acc + b.totalBeds, 0)}</span>
                  </strong>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/20 font-bold">
                  VENTILATED
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">EMERGENCY BAY</span>
                  <strong className="text-white text-sm">
                    {emergencyBeds.reduce((acc, b) => acc + b.availableBeds, 0)} <span className="text-[10px] text-slate-400">/ {emergencyBeds.reduce((acc, b) => acc + b.totalBeds, 0)}</span>
                  </strong>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/20 font-bold">
                  RESUS BAY
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">HDU BEDS</span>
                  <strong className="text-white text-sm">
                    {hduBeds.reduce((acc, b) => acc + b.availableBeds, 0)} <span className="text-[10px] text-slate-400">/ {hduBeds.reduce((acc, b) => acc + b.totalBeds, 0)}</span>
                  </strong>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/20 font-bold">
                  MONITORED
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">GENERAL WARD</span>
                  <strong className="text-white text-sm">
                    {generalBeds.reduce((acc, b) => acc + b.availableBeds, 0)} <span className="text-[10px] text-slate-400">/ {generalBeds.reduce((acc, b) => acc + b.totalBeds, 0)}</span>
                  </strong>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                  STANDARD
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">PRIVATE ROOMS</span>
                  <strong className="text-white text-sm">
                    {privateBeds.reduce((acc, b) => acc + b.availableBeds, 0)} <span className="text-[10px] text-slate-400">/ {privateBeds.reduce((acc, b) => acc + b.totalBeds, 0)}</span>
                  </strong>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/20 font-bold">
                  SUITES
                </span>
              </div>
            </div>


            {/* Capacity Meter Bar */}
            <div className="card p-4 space-y-2 bg-slate-900/90 border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  Overall Facility Occupancy: <strong className="text-cyan-300">{occupiedBeds}</strong> / {totalBeds} Beds ({occupancyRate}%)
                </span>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" /> Occupied ({occupiedBeds})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available ({availableBeds})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Reserved ({reservedBeds})
                  </span>
                </div>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0}%` }}
                  className="bg-cyan-500 h-full transition-all"
                  title={`Occupied: ${occupiedBeds}`}
                />
                <div
                  style={{ width: `${totalBeds > 0 ? (availableBeds / totalBeds) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Available: ${availableBeds}`}
                />
                <div
                  style={{ width: `${totalBeds > 0 ? (reservedBeds / totalBeds) * 100 : 0}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`Reserved: ${reservedBeds}`}
                />
              </div>
            </div>

            {/* Category & Ward Detail Table with Comfort (AC / Non-AC) and Tariffs */}
            <div className="card p-4 space-y-3 bg-slate-900/90 border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Bed Categories & Live Ward Inventory Breakdown
                </h3>
                <button
                  onClick={() => onNavigate('beds')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <span>Edit Capacity & Allocate Beds</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 text-[10px] uppercase tracking-wider border-b border-white/5">
                    <tr>
                      <th className="py-2.5 px-3">Category / Ward</th>
                      <th className="py-2.5 px-3">Comfort Type</th>
                      <th className="py-2.5 px-3 text-center">Total</th>
                      <th className="py-2.5 px-3 text-center text-emerald-400">Available</th>
                      <th className="py-2.5 px-3 text-center text-cyan-300">Occupied</th>
                      <th className="py-2.5 px-3 text-center text-amber-400">Reserved</th>
                      <th className="py-2.5 px-3">Daily Tariff</th>
                      <th className="py-2.5 px-3">Last Updated</th>
                      <th className="py-2.5 px-3 text-right">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {beds.map((bed) => {
                      const occ = bed.totalBeds > 0 ? Math.round((bed.occupiedBeds / bed.totalBeds) * 100) : 0
                      return (
                        <tr key={bed.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3">
                            <strong className="text-white block font-medium">
                              {bed.category === 'ICU'
                                ? 'ICU (Intensive Care)'
                                : bed.category === 'EMERGENCY'
                                ? 'Emergency Resuscitation'
                                : bed.category === 'HDU'
                                ? 'HDU (High Dependency)'
                                : bed.category === 'PRIVATE'
                                ? 'Private Room'
                                : bed.category === 'SEMI_PRIVATE'
                                ? 'Semi-Private Room'
                                : bed.category === 'ISOLATION'
                                ? 'Negative Isolation'
                                : 'General Medical Ward'}
                            </strong>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {bed.notes || bed.id} · {bed.roomType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                bed.comfort === 'AC'
                                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {bed.comfort === 'AC' ? '❄️ AC' : 'Non-AC'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-300">
                            {bed.totalBeds}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                            {bed.availableBeds}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-cyan-300">
                            {bed.occupiedBeds}
                            <span className="block text-[9px] text-slate-500 font-normal">{occ}% occ</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                            {bed.reservedBeds}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">
                            {bed.chargeFormatted || (bed.chargePerDay ? `₹${bed.chargePerDay.toLocaleString()} / day` : '₹0 / day')}
                          </td>
                          <td className="py-2.5 px-3 text-[10px] text-slate-400">
                            {getRelativeTime(bed.lastUpdatedAt)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                                bed.availableBeds > 2
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : bed.availableBeds > 0
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  bed.availableBeds > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                                }`}
                              />
                              {bed.availableBeds > 0 ? 'LIVE' : 'FULL'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── TWO COLUMN: INCOMING REFERRALS & BLOOD INVENTORY ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Incoming Referrals Queue */}
            <section className="card p-5 space-y-4 bg-slate-900/90 border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Siren size={18} className="text-rose-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Incoming Emergency Referrals ({incomingReferrals.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Scoped strictly to <strong className="text-cyan-300">{hospital.name}</strong> · Sorted critical first
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('referrals')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <span>Full Referral Desk</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {incomingReferrals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl bg-slate-950/40 border border-slate-800/60">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                  No incoming referrals awaiting review for this facility.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 text-[10px] uppercase tracking-wider border-b border-white/5">
                      <tr>
                        <th className="py-2.5 px-3">Patient / Case</th>
                        <th className="py-2.5 px-3">Acuity</th>
                        <th className="py-2.5 px-3">Specialty / Beds</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {incomingReferrals.slice(0, 5).map((ref) => {
                        const p = ref.patient
                        const isImmediate = p?.urgencyLevel === 'IMMEDIATE'
                        return (
                          <tr key={ref.id} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3">
                              <strong className="text-white block font-medium">
                                {p?.referenceCode || `Ref #${ref.id.slice(-5)}`}
                              </strong>
                              <span className="text-[10px] text-slate-400">
                                {p?.age ? `${p.age}y` : ''} {p?.sex || ''} {p?.bloodGroup ? `· ${p.bloodGroup}` : ''}
                              </span>
                              <span className="text-[10px] text-cyan-300 font-mono block">
                                {ref.id}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  isImmediate
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {p?.urgencyLevel || 'IMMEDIATE'}
                              </span>
                              <small className="text-slate-400 block text-[10px] mt-0.5 truncate max-w-[120px]">
                                {p?.chiefComplaint || p?.emergencyCategory || 'Emergency'}
                              </small>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-slate-200 block font-medium">
                                {p?.emergencyCategory || 'Trauma / Acute'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ICU / Resus Bay
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                                {ref.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  if (onOpenReferralModal) onOpenReferralModal(ref.id)
                                  else onNavigate('referrals')
                                }}
                                className="btn-secondary text-[11px] py-1 px-2.5"
                              >
                                Open Case
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Right Column: Blood Inventory (All 8 Blood Groups) */}
            <section className="card p-5 space-y-4 bg-slate-900/90 border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplet size={18} className="text-rose-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Blood Bank Inventory (All 8 Groups)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Live reserve units and critical threshold tracking from <code className="font-mono text-cyan-300">public.blood_inventory</code>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 font-bold">
                  TRANSFUSION READY
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {bloodTelemetry.map((item) => {
                  const isCritical = item.status === 'CRITICAL'
                  const isLow = item.status === 'LOW'
                  return (
                    <div
                      key={item.bloodGroup}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCritical
                          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                          : isLow
                          ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-base font-black text-white">{item.bloodGroup}</strong>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-2xl font-black tracking-tight text-white my-1">
                        {item.availableUnits}{' '}
                        <span className="text-[10px] font-normal text-slate-400">units</span>
                      </div>

                      <div className="text-[10px] text-slate-400 border-t border-white/5 pt-1 mt-1 flex items-center justify-between">
                        <span>Min: {item.minimumThreshold}</span>
                        <span className="font-mono text-[9px] text-slate-500">
                          {getRelativeTime(item.lastUpdated)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* ── TWO COLUMN: SPECIALIST AVAILABILITY & AUDIT LOGS ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Specialist & Doctor Availability (Section 9) */}
            <section className="card p-5 space-y-4 bg-slate-900/90 border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope size={18} className="text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      On-Call Specialists & Clinical Roster
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Cardiology, Neurology, Trauma Surgery, Critical Care & Emergency Medicine
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold">
                  {onCallSpecialists.length} ON-CALL
                </span>
              </div>

              <div className="space-y-2.5">
                {specialists.slice(0, 5).map((doc) => {
                  const isOnCall = doc.onCall || doc.status === 'ON_CALL'
                  return (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                        isOnCall
                          ? 'bg-cyan-950/20 border-cyan-500/30'
                          : 'bg-black/30 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isOnCall
                              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {doc.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <strong className="text-white font-bold block">{doc.name}</strong>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="text-cyan-300 font-medium">{doc.specialty}</span>
                            <span>·</span>
                            <span className="font-mono text-[10px] text-slate-400">{doc.registrationNumber}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-right shrink-0">
                        {doc.assignedCasesCount > 0 && (
                          <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                            {doc.assignedCasesCount} active case{doc.assignedCasesCount > 1 ? 's' : ''}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOnCall
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isOnCall ? 'ON-CALL' : 'STANDBY'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Recent Operations Activity Log (Section 14) */}
            <section className="card p-5 space-y-3 bg-slate-900/90 border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Recent Operational Audit Events
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Live mutation timeline logged to <code className="font-mono text-cyan-300">public.audit_logs</code>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {auditLogs.length} Events
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl bg-slate-950/40 border border-slate-800/60">
                  No recent operational events recorded yet.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <strong className="text-slate-200 font-semibold">{log.action}</strong>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5 pl-3">
                          {log.targetLabel} · Actor: <span className="text-cyan-300 font-mono">{log.actorName || log.actorId}</span>
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {getRelativeTime(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
