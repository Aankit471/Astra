import { useState, useMemo } from 'react'
import {
  BedDouble,
  ChevronRight,
  Filter,
  Hospital as HospitalIcon,
  MapPin,
  Phone,
  Search,
  X,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { Hospital, ComfortType } from '@/types/domain'
import { BedAvailabilityPanel } from '@/components/data-display/BedAvailabilityPanel'
import { getRelativeTime } from '@/utils/freshness'

export function UserFacilitiesView() {
  const hospitals = useAppStore((state) => state.hospitals)
  const [searchQuery, setSearchQuery] = useState('')
  const [comfortFilter, setComfortFilter] = useState<ComfortType | 'ALL'>('ALL')
  const [maxPrice, setMaxPrice] = useState<number | 'ALL'>('ALL')
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState<Hospital | null>(null)

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match = `${h.name} ${h.type} ${h.address.city} ${h.address.line1}`.toLowerCase()
        if (!match.includes(q)) return false
      }

      // Comfort filter (AC / Non-AC)
      if (comfortFilter !== 'ALL') {
        const hasComfort = h.capabilities.beds?.some(
          (b) => b.comfort === comfortFilter && b.availableBeds > 0
        )
        if (!hasComfort) return false
      }

      // Max price filter
      if (maxPrice !== 'ALL') {
        const hasUnderPrice = h.capabilities.beds?.some(
          (b) => (b.chargePerDay || 0) <= maxPrice && b.availableBeds > 0
        )
        if (!hasUnderPrice) return false
      }

      return true
    })
  }, [hospitals, searchQuery, comfortFilter, maxPrice])

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-2">
              <BedDouble size={14} /> PATIENT DECISION SUPPORT
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Hospital Facilities, Bed Availability & Tariff Guide
            </h1>
            <p className="text-sm text-gray-300 mt-1 max-w-2xl">
              Compare network hospital admission facilities, <strong className="text-cyan-300">AC vs Non-AC room types</strong>, and official <strong className="text-emerald-400">daily bed charges</strong> (₹/day) before emergency intake or scheduled transfer.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 bg-black/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg shrink-0 self-start md:self-auto">
            ASTRA Verified Telemetry
          </span>
        </div>
      </div>

      {/* ── Filter Toolbar ────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={14} className="text-cyan-400" /> Filter Facilities & Beds
          </span>
          <span className="text-xs text-cyan-400 font-medium">
            {filteredHospitals.length} of {hospitals.length} Hospitals Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search hospital name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* AC / Non-AC filter */}
          <div>
            <select
              value={comfortFilter}
              onChange={(e) => setComfortFilter(e.target.value as ComfortType | 'ALL')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Room Types (AC & Non-AC)</option>
              <option value="AC">❄️ Only Hospitals with AC Beds Available</option>
              <option value="NON_AC">Only Hospitals with Non-AC Beds Available</option>
            </select>
          </div>

          {/* Price / Tariff filter */}
          <div>
            <select
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="ALL">All Price Ranges</option>
              <option value="1000">₹ Budget: Under ₹1,000 / day</option>
              <option value="3000">₹ Standard: Under ₹3,000 / day</option>
              <option value="5000">₹ Moderate: Under ₹5,000 / day</option>
              <option value="10000">₹ Critical/ICU: Up to ₹10,000 / day</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Hospital Facilities Cards Grid ────────────────────────────── */}
      <div className="space-y-4">
        {filteredHospitals.map((hospital) => {
          const beds = hospital.capabilities.beds || []
          const acBeds = beds.filter((b) => b.comfort === 'AC')
          const nonAcBeds = beds.filter((b) => b.comfort === 'NON_AC')

          const acAvailable = acBeds.reduce((acc, b) => acc + b.availableBeds, 0)
          const nonAcAvailable = nonAcBeds.reduce((acc, b) => acc + b.availableBeds, 0)

          const minAcTariff = acBeds.length
            ? Math.min(...acBeds.map((b) => b.chargePerDay || 2800))
            : null
          const minNonAcTariff = nonAcBeds.length
            ? Math.min(...nonAcBeds.map((b) => b.chargePerDay || 850))
            : null

          return (
            <div
              key={hospital.id}
              className="card p-5 space-y-4 border border-slate-800 hover:border-cyan-500/40 transition-all bg-slate-900/90 shadow-xl"
            >
              {/* Facility Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <HospitalIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {hospital.name}
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {hospital.type}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin size={13} className="text-gray-500" />
                      {hospital.address.line1}, {hospital.address.city}, {hospital.address.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <a
                    href={`tel:${hospital.emergencyPhone || hospital.phone}`}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Phone size={13} />
                    <span>Emergency Call</span>
                  </a>
                  <button
                    onClick={() => setSelectedHospitalForModal(hospital)}
                    className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1"
                  >
                    <span>View All Bed Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* ── AC vs Non-AC Highlights Box ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* AC Beds Summary */}
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      ❄️ AC Room Accommodation
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        acAvailable > 0
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {acAvailable > 0 ? `${acAvailable} Beds Available` : 'Fully Occupied'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Includes Private Rooms, Deluxe Wards, and Climate-controlled ICU suites.
                  </p>
                  <div className="pt-1 flex items-baseline justify-between text-xs">
                    <span className="text-gray-400">Daily Room Tariff:</span>
                    <strong className="text-emerald-400 font-bold text-sm">
                      {minAcTariff ? `from ₹${minAcTariff.toLocaleString()} / day` : 'Tariff available on request'}
                    </strong>
                  </div>
                </div>

                {/* Non-AC Beds Summary */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      Non-AC Room Accommodation
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        nonAcAvailable > 0
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {nonAcAvailable > 0 ? `${nonAcAvailable} Beds Available` : 'None in this category'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Includes Shared General Wards and subsidized emergency observation units.
                  </p>
                  <div className="pt-1 flex items-baseline justify-between text-xs">
                    <span className="text-gray-400">Daily Room Tariff:</span>
                    <strong className="text-emerald-400 font-bold text-sm">
                      {minNonAcTariff
                        ? `from ₹${minNonAcTariff.toLocaleString()} / day`
                        : hospital.type === 'GOVERNMENT'
                        ? '₹250 / day (Govt Subsidized)'
                        : 'Govt / Charitable Subsidy'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Individual Bed Category & Tariff Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-gray-400 text-[10px] uppercase tracking-wider border-b border-white/5">
                    <tr>
                      <th className="py-2 px-3">Bed Category</th>
                      <th className="py-2 px-3">Room Type</th>
                      <th className="py-2 px-3">Comfort Type</th>
                      <th className="py-2 px-3 text-center">Available / Total</th>
                      <th className="py-2 px-3">Estimated Tariff</th>
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
                        <td className="py-2 px-3 text-slate-300 capitalize">
                          {b.roomType.toLowerCase()}
                        </td>
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
                          <span className="text-gray-500"> / {b.totalBeds}</span>
                        </td>
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

              {/* Card Footer Info */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                <span>
                  Telemetry reported by hospital · Updated {getRelativeTime(hospital.lastUpdated)}
                </span>
                <span className="text-cyan-400 font-medium">
                  {hospital.verificationStatus === 'VERIFIED' ? '✓ Verified by ASTRA' : 'Hospital Self-reported'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Detailed Modal when clicking View All Bed Details ─────────── */}
      {selectedHospitalForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="presentation"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedHospitalForModal.name}</h3>
                <p className="text-xs text-slate-400">
                  Detailed Operational Bed Capacity, Room Comfort & Pricing Matrix
                </p>
              </div>
              <button
                onClick={() => setSelectedHospitalForModal(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <BedAvailabilityPanel hospital={selectedHospitalForModal} />

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedHospitalForModal(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close Bed Tariff Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
