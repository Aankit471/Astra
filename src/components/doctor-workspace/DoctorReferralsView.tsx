import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { Referral } from '@/types/domain'
import { DoctorReferralReviewModal } from './DoctorReferralReviewModal'

export function DoctorReferralsView() {
  const referrals = useAppStore((state) => state.referrals)
  const acceptReferral = useAppStore((state) => state.acceptReferral)
  const declineReferral = useAppStore((state) => state.declineReferral)
  const requestInformation = useAppStore((state) => state.requestInformation)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL')
  const [selectedReviewReferral, setSelectedReviewReferral] = useState<Referral | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Doctor assigned referrals dataset
  const enrichedReferrals = useMemo(() => {
    return referrals.map((ref, idx) => {
      const referringFacilities = [
        'Indiranagar 108 Emergency Ambulance',
        'Apollo Clinic Koramangala',
        'St. John Trauma Centre',
        'Government District Hospital',
        'Sunrise Polyclinic',
      ]

      const referringDoctors = [
        'Dr. K. S. Murthy (EMS)',
        'Dr. Ramesh Kumar',
        'Dr. Farhan Akhtar',
        'Dr. Suresh Menon',
        'Dr. V. N. Sharma',
      ]

      const specialties = [
        'Interventional Cardiology',
        'Cardiology Consult',
        'Vascular Medicine',
        'Cardiac Critical Care',
      ]

      return {
        ...ref,
        referringHospital: referringFacilities[idx % referringFacilities.length],
        referringDoctor: referringDoctors[idx % referringDoctors.length],
        requiredSpecialty: specialties[idx % specialties.length],
        reason: ref.patient?.chiefComplaint || 'Emergency Cardiac Triage',
      }
    })
  }, [referrals])

  const filteredReferrals = useMemo(() => {
    return enrichedReferrals.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
      if (priorityFilter !== 'ALL' && r.patient?.urgencyLevel !== priorityFilter) return false
      if (specialtyFilter !== 'ALL' && r.requiredSpecialty !== specialtyFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match = `${r.id} ${r.patient?.referenceCode} ${r.referringHospital} ${r.reason}`.toLowerCase()
        if (!match.includes(q)) return false
      }

      return true
    })
  }, [enrichedReferrals, statusFilter, priorityFilter, specialtyFilter, searchQuery])

  const handleAccept = (id: string, notes?: string) => {
    acceptReferral(id, true, notes || 'Accepted by Dr. Sarah Jenkins')
    setToastMessage(`Referral #${id} accepted. Cath Lab & Bed reserved.`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleReject = (id: string, reason: string) => {
    declineReferral(id, 'CAPACITY_FULL')
    setToastMessage(`Referral #${id} declined: ${reason}`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleEscalate = (id: string, reason: string) => {
    setToastMessage(`Referral #${id} escalated to Chief Medical Officer: ${reason}`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleRequestInfo = (id: string, notes: string) => {
    requestInformation(id, notes)
    setToastMessage(`Clarification requested from referring doctor for Referral #${id}`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            REFERRAL MANAGEMENT DESK
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Clinical Emergency Referrals Intake & Review
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review incoming emergency transfer requests assigned to Dr. Sarah Jenkins and cardiology on-call.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-400">Assigned Referrals:</span>
          <strong className="text-teal-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {enrichedReferrals.length} Cases
          </strong>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-teal-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Filter Bar ────────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search referral ID, hospital, patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#060b13] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 focus:ring-1 focus:ring-teal-400"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#060b13] border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:ring-1 focus:ring-teal-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="ROUTED">Routed</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DECLINED">Rejected</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-[#060b13] border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:ring-1 focus:ring-teal-400"
          >
            <option value="ALL">All Priorities</option>
            <option value="IMMEDIATE">Immediate (Crash / STEMI)</option>
            <option value="URGENT">Urgent (&lt; 2h)</option>
            <option value="SEMI_URGENT">Semi-Urgent (&lt; 6h)</option>
          </select>
        </div>

        <div>
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="w-full bg-[#060b13] border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:ring-1 focus:ring-teal-400"
          >
            <option value="ALL">All Specialties</option>
            <option value="Interventional Cardiology">Interventional Cardiology</option>
            <option value="Cardiology Consult">Cardiology Consult</option>
            <option value="Cardiac Critical Care">Cardiac Critical Care</option>
          </select>
        </div>
      </div>

      {/* ── Referrals Table ───────────────────────────────────────────── */}
      <div className="card overflow-hidden border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060b13] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Referral ID</th>
                <th className="py-3 px-3.5">Patient</th>
                <th className="py-3 px-3.5">Referring Hospital</th>
                <th className="py-3 px-3.5">Referring Doctor</th>
                <th className="py-3 px-3.5">Required Specialty</th>
                <th className="py-3 px-3.5">Acuity</th>
                <th className="py-3 px-3.5">Clinical Reason</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReferrals.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3.5 font-mono font-bold text-teal-400">
                    {r.id}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-white">
                    {r.patient?.referenceCode || `Patient #${r.id.slice(-4)}`}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">
                    {r.referringHospital}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400">
                    {r.referringDoctor}
                  </td>
                  <td className="py-3 px-3.5 text-teal-300 font-medium">
                    {r.requiredSpecialty}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        r.patient?.urgencyLevel === 'IMMEDIATE'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {r.patient?.urgencyLevel || 'IMMEDIATE'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-300 max-w-xs truncate">
                    {r.reason}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedReviewReferral(r)}
                        className="btn-primary text-[11px] py-1 px-2.5 shadow-sm"
                      >
                        Review Dossier
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral Review Modal */}
      {selectedReviewReferral && (
        <DoctorReferralReviewModal
          referral={selectedReviewReferral}
          onClose={() => setSelectedReviewReferral(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          onEscalate={handleEscalate}
          onRequestInfo={handleRequestInfo}
        />
      )}
    </div>
  )
}
