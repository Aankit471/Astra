import { useMemo, useState } from 'react'
import { AlertTriangle, BedDouble, CheckCircle2, Filter, Info, ShieldAlert, Zap } from 'lucide-react'
import type { AvailabilityStatus, BedAvailability, BedCategory, ComfortType, Hospital, RoomType } from '@/types/domain'
import { getFreshnessLevel, getRelativeTime } from '@/utils/freshness'

interface BedAvailabilityPanelProps {
  hospital: Hospital
  allowUpdates?: boolean
  onUpdateBed?: (bedId: string, available: number, occupied: number) => void
}

export function BedAvailabilityPanel({ hospital, allowUpdates, onUpdateBed }: BedAvailabilityPanelProps) {
  const beds = useMemo(() => hospital.capabilities.beds || [], [hospital.capabilities.beds])

  const [categoryFilter, setCategoryFilter] = useState<BedCategory | 'ALL'>('ALL')
  const [roomFilter, setRoomFilter] = useState<RoomType | 'ALL'>('ALL')
  const [comfortFilter, setComfortFilter] = useState<ComfortType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | 'ALL'>('ALL')

  const [editingBed, setEditingBed] = useState<BedAvailability | null>(null)
  const [editAvailable, setEditAvailable] = useState<number>(0)
  const [editOccupied, setEditOccupied] = useState<number>(0)
  const [editError, setEditError] = useState<string | null>(null)

  const filteredBeds = useMemo(() => {
    return beds.filter((bed) => {
      if (categoryFilter !== 'ALL' && bed.category !== categoryFilter) return false
      if (roomFilter !== 'ALL' && bed.roomType !== roomFilter) return false
      if (comfortFilter !== 'ALL' && bed.comfort !== comfortFilter) return false
      if (statusFilter !== 'ALL' && bed.availabilityStatus !== statusFilter) return false
      return true
    })
  }, [beds, categoryFilter, roomFilter, comfortFilter, statusFilter])

  const totalReportedAvailable = useMemo(() => {
    return beds.reduce((sum, b) => sum + b.availableBeds, 0)
  }, [beds])

  const handleEditClick = (bed: BedAvailability) => {
    setEditingBed(bed)
    setEditAvailable(bed.availableBeds)
    setEditOccupied(bed.occupiedBeds)
    setEditError(null)
  }

  const handleSaveEdit = () => {
    if (!editingBed || !onUpdateBed) return
    if (editAvailable < 0 || editOccupied < 0) {
      setEditError('Bed counts cannot be negative.')
      return
    }
    if (editAvailable + editOccupied > editingBed.totalBeds) {
      setEditError(`Total beds (${editingBed.totalBeds}) exceeded. Available + Occupied = ${editAvailable + editOccupied}.`)
      return
    }
    onUpdateBed(editingBed.id, editAvailable, editOccupied)
    setEditingBed(null)
    setEditError(null)
  }

  return (
    <div className="bed-availability-panel space-y-4">
      {/* Demo / Simulated Indicator Banner */}
      <div className="flex flex-wrap items-center justify-between bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3.5 text-xs text-cyan-200">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold uppercase tracking-wide">DEMO / SIMULATED AVAILABILITY</span>
          <span className="text-cyan-400/80 hidden sm:inline">• Operational Telemetry Simulation</span>
        </div>
        <div className="text-cyan-400 font-semibold mt-1 sm:mt-0">
          Total Reported Available: <strong className="text-white text-sm ml-1">{totalReportedAvailable} beds</strong>
        </div>
      </div>

      {/* Operational Disclaimer */}
      <div className="flex items-start gap-2 bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          Reported bed availability is operational decision-support data and does not guarantee admission or bed reservation. Final acceptance and bed allocation are determined by the receiving hospital clinical team upon intake.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Operational Bed Filters</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as BedCategory | 'ALL')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Categories</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="ICU">ICU</option>
              <option value="GENERAL">General Ward</option>
              <option value="TRAUMA">Trauma</option>
              <option value="PEDIATRIC">Pediatric</option>
              <option value="CRITICAL_CARE">Critical Care</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Room Type</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value as RoomType | 'ALL')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Rooms</option>
              <option value="PRIVATE">Private</option>
              <option value="SHARED">Shared</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Comfort</label>
            <select
              value={comfortFilter}
              onChange={(e) => setComfortFilter(e.target.value as ComfortType | 'ALL')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Types</option>
              <option value="AC">Air Conditioned (AC)</option>
              <option value="NON_AC">Non-AC</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AvailabilityStatus | 'ALL')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="LIMITED">Limited</option>
              <option value="FULL">Full</option>
              <option value="STALE">Stale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bed Cards Grid */}
      {filteredBeds.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredBeds.map((bed) => {
            const freshness = getFreshnessLevel(bed.lastUpdatedAt)
            const isStale = bed.availabilityStatus === 'STALE' || freshness === 'STALE'
            const relativeTime = getRelativeTime(bed.lastUpdatedAt)

            return (
              <div
                key={bed.id}
                className={`bg-slate-900/80 rounded-xl border p-4 transition-all ${
                  isStale
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : bed.availabilityStatus === 'FULL'
                    ? 'border-red-500/30 bg-red-950/10'
                    : 'border-slate-800 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-bold text-white capitalize">{bed.category.toLowerCase().replace('_', ' ')}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {bed.roomType} • {bed.clinicalSupport.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
                      isStale
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : bed.availabilityStatus === 'AVAILABLE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : bed.availabilityStatus === 'LIMITED'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {isStale ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>⚠ STALE DATA</span>
                      </>
                    ) : bed.availabilityStatus === 'AVAILABLE' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>✓ AVAILABLE</span>
                      </>
                    ) : bed.availabilityStatus === 'LIMITED' ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>⚠ LIMITED</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3 h-3 text-red-400" />
                        <span>● FULL</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Comfort (AC / Non-AC) & Charges Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  {bed.comfort === 'AC' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      ❄️ AC Room
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Non-AC Room
                    </span>
                  )}

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block uppercase">Bed Tariff</span>
                    <strong className="text-xs font-bold text-emerald-400">
                      {bed.chargeFormatted || (bed.chargePerDay ? `₹${bed.chargePerDay.toLocaleString()} / day` : '₹1,500 / day')}
                    </strong>
                  </div>
                </div>

                {/* Counts Summary */}
                <div className="flex items-baseline justify-between bg-slate-950/60 rounded-lg p-2.5 mb-3 border border-slate-800/80">
                  <div>
                    <span className="text-xs text-slate-400">Available Beds: </span>
                    <strong className={`text-base font-bold ml-1 ${bed.availableBeds === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {bed.availableBeds}
                    </strong>
                    <span className="text-xs text-slate-500"> / {bed.totalBeds} total</span>
                  </div>
                  <span className="text-xs text-slate-400">Occupied: {bed.occupiedBeds}</span>
                </div>

                {/* Source & Freshness Metadata */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>Source: {bed.source} ({bed.verificationStatus})</span>
                  <span>Updated: {relativeTime}</span>
                </div>

                {/* Optional Hospital Operations Edit Action */}
                {allowUpdates && onUpdateBed && (
                  <button
                    onClick={() => handleEditClick(bed)}
                    className="mt-3 w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Update Bed Counts
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-900/60 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400">No beds match the selected operational filters.</p>
        </div>
      )}

      {/* Hospital Operations Bed Edit Modal */}
      {editingBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Update Bed Inventory</h3>
            <p className="text-xs text-slate-400">
              {editingBed.category} ({editingBed.roomType} • {editingBed.comfort}) — Total Capacity: {editingBed.totalBeds} beds
            </p>

            {editError && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300">
                {editError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-semibold">Available Beds</label>
                <input
                  type="number"
                  min="0"
                  max={editingBed.totalBeds}
                  value={editAvailable}
                  onChange={(e) => setEditAvailable(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-semibold">Occupied Beds</label>
                <input
                  type="number"
                  min="0"
                  max={editingBed.totalBeds}
                  value={editOccupied}
                  onChange={(e) => setEditOccupied(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingBed(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs"
              >
                Save Bed Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
