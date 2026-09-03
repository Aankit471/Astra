import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  Filter,
  Search,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { HospitalReferralDetailModal } from './HospitalReferralDetailModal'

export function HospitalReferralsView() {
  const referrals = useAppStore((state) => state.referrals)
  const accept = useAppStore((state) => state.acceptReferral)
  const decline = useAppStore((state) => state.declineReferral)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [acuityFilter, setAcuityFilter] = useState('ALL')
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL')
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Status mapping
  const statuses = [
    'ALL',
    'NEW',
    'PENDING_REVIEW',
    'ACCEPTED',
    'REJECTED',
    'AWAITING_BED',
    'BED_ASSIGNED',
    'IN_TRANSIT',
    'ARRIVED',
    'ADMITTED',
    'ESCALATED',
    'COMPLETED',
  ]

  const specialties = [
    'ALL',
    'Cardiology',
    'Emergency & Trauma',
    'Neurology',
    'Internal Medicine',
    'Pediatrics',
    'Vascular Surgery',
  ]

  const acuities = ['ALL', 'IMMEDIATE', 'URGENT', 'SEMI_URGENT']

  // Enriched referral items
  const enrichedReferrals = useMemo(() => {
    return referrals.map((r, index) => {
      const p = r.patient || {
        referenceCode: `Patient #${r.id.slice(-4)}`,
        age: 50 + index,
        sex: 'MALE',
        emergencyCategory: 'CARDIAC',
        urgencyLevel: 'IMMEDIATE',
        chiefComplaint: 'Acute emergency condition',
      }

      const referringHospitals = [
        'Indiranagar 108 ALS Ambulance',
        'Apollo Clinic Koramangala',
        'St. John Trauma Centre',
        'Government District Hospital',
        'Sunrise Polyclinic',
      ]

      const doctors = [
        'Dr. K. S. Murthy (EMS)',
        'Dr. Ramesh Kumar',
        'Dr. Farhan Akhtar',
        'Dr. Suresh Menon',
        'Dr. V. N. Sharma',
      ]

      const departments = [
        'Emergency Cardiac Care',
        'Acute Stroke Unit',
        'Trauma Bay',
        'Critical Care ICU',
        'Pediatric Emergency',
      ]

      return {
        ...r,
        patientId: `PAT-104${index + 2}`,
        patientName: p.referenceCode,
        referringHospital: referringHospitals[index % referringHospitals.length],
        referringDoctor: doctors[index % doctors.length],
        requiredSpecialty:
          p.emergencyCategory === 'CARDIAC'
            ? 'Cardiology'
            : p.emergencyCategory === 'NEURO'
            ? 'Neurology'
            : 'Emergency & Trauma',
        requiredCapability:
          p.emergencyCategory === 'CARDIAC'
            ? 'Cardiac Cath Lab & ICU'
            : p.emergencyCategory === 'NEURO'
            ? 'CT Scan & Stroke Team'
            : 'Trauma Bay & Resuscitation',
        acuity: p.urgencyLevel || 'IMMEDIATE',
        eta: index === 0 ? '8 mins' : index === 1 ? '15 mins' : 'Arrived',
        referralTime: `${index * 15 + 10}m ago`,
        assignedDepartment: departments[index % departments.length],
      }
    })
  }, [referrals])

  // Filtered referrals
  const filteredReferrals = useMemo(() => {
    return enrichedReferrals.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
      if (acuityFilter !== 'ALL' && r.acuity !== acuityFilter) return false
      if (specialtyFilter !== 'ALL' && r.requiredSpecialty !== specialtyFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match = `${r.id} ${r.patientName} ${r.patientId} ${r.referringHospital} ${r.requiredSpecialty}`.toLowerCase()
        if (!match.includes(q)) return false
      }

      return true
    })
  }, [enrichedReferrals, statusFilter, acuityFilter, specialtyFilter, searchQuery])

  const selectedReferral = useMemo(() => {
    return referrals.find((r) => r.id === selectedReferralId)
  }, [referrals, selectedReferralId])

  const handleAccept = (id: string) => {
    accept(id)
    setToastMessage(`Referral #${id} accepted. Assigned to Emergency Cardiac Bay.`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleReject = (id: string, reason: string) => {
    decline(id, reason)
    setToastMessage(`Referral #${id} rejected. Reason: ${reason}`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            INCOMING REFERRAL BUREAU
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Hospital Referral Management Command
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time incoming patient referrals, ambulance coordination, bed requests, and clinical admissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-400">Total Active:</span>
          <strong className="text-cyan-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {enrichedReferrals.length} Cases
          </strong>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Filters Toolbar ────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={14} className="text-cyan-400" /> Referral Intake Filters
          </span>
          <span className="text-slate-400">
            Showing {filteredReferrals.length} of {enrichedReferrals.length} cases
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search by Patient, ID, Hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  Status: {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Specialty Filter */}
          <div>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              {specialties.map((sp) => (
                <option key={sp} value={sp}>
                  Specialty: {sp}
                </option>
              ))}
            </select>
          </div>

          {/* Acuity Filter */}
          <div>
            <select
              value={acuityFilter}
              onChange={(e) => setAcuityFilter(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              {acuities.map((ac) => (
                <option key={ac} value={ac}>
                  Acuity: {ac}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Referrals Table ────────────────────────────────────────────── */}
      <div className="card overflow-hidden border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070b14] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Referral ID</th>
                <th className="py-3 px-3.5">Patient Details</th>
                <th className="py-3 px-3.5">Referring Source</th>
                <th className="py-3 px-3.5">Required Clinical Needs</th>
                <th className="py-3 px-3.5">Acuity</th>
                <th className="py-3 px-3.5">ETA</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Department</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReferrals.map((ref) => (
                <tr key={ref.id} className="hover:bg-white/[0.02] transition">
                  {/* Referral ID */}
                  <td className="py-3 px-3.5">
                    <span className="font-mono font-bold text-cyan-400 block">{ref.id}</span>
                    <span className="text-[10px] text-slate-500">{ref.referralTime}</span>
                  </td>

                  {/* Patient Name & ID */}
                  <td className="py-3 px-3.5">
                    <strong className="text-white block font-medium">{ref.patientName}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">{ref.patientId}</span>
                  </td>

                  {/* Referring Hospital & Doctor */}
                  <td className="py-3 px-3.5 text-slate-300">
                    <span className="font-medium block">{ref.referringHospital}</span>
                    <span className="text-[10px] text-slate-400">{ref.referringDoctor}</span>
                  </td>

                  {/* Required Specialty & Capability */}
                  <td className="py-3 px-3.5">
                    <span className="font-semibold text-cyan-300 block">{ref.requiredSpecialty}</span>
                    <span className="text-[10px] text-slate-400">{ref.requiredCapability}</span>
                  </td>

                  {/* Acuity */}
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ref.acuity === 'IMMEDIATE'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : ref.acuity === 'URGENT'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {ref.acuity}
                    </span>
                  </td>

                  {/* ETA */}
                  <td className="py-3 px-3.5 font-mono text-cyan-300 font-semibold">
                    {ref.eta}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                      {ref.status}
                    </span>
                  </td>

                  {/* Assigned Department */}
                  <td className="py-3 px-3.5 text-slate-300 text-[11px]">
                    {ref.assignedDepartment}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedReferralId(ref.id)}
                        className="btn-primary text-[11px] py-1 px-2.5 shadow-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleAccept(ref.id)}
                        className="text-[11px] font-bold py-1 px-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition"
                      >
                        Accept
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReferral && (
        <HospitalReferralDetailModal
          referral={selectedReferral}
          onClose={() => setSelectedReferralId(null)}
          onAccept={(id) => {
            handleAccept(id)
            setSelectedReferralId(null)
          }}
          onReject={(id, reason) => {
            handleReject(id, reason)
            setSelectedReferralId(null)
          }}
          onAssignBed={(id, bedLabel) => {
            setToastMessage(`Bed assigned to #${id}: ${bedLabel}`)
            setSelectedReferralId(null)
            setTimeout(() => setToastMessage(null), 4000)
          }}
          onEscalate={(id, reason) => {
            setToastMessage(`Case #${id} escalated to Central Clinical Command. Reason: ${reason}`)
            setSelectedReferralId(null)
            setTimeout(() => setToastMessage(null), 4000)
          }}
          onRequestInfo={(id, notes) => {
            setToastMessage(`Information request dispatched for Case #${id}: "${notes}"`)
            setSelectedReferralId(null)
            setTimeout(() => setToastMessage(null), 4000)
          }}
        />
      )}
    </div>
  )
}
