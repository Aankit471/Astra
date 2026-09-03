import { useState, useMemo, useEffect } from 'react'
import {
  CheckSquare,
  Search,
  X,
} from 'lucide-react'
import {
  MOCK_DOCTOR_PATIENTS,
  MOCK_CLINICAL_REVIEWS,
  MOCK_DOCTOR_TASKS,
  MOCK_MEDICAL_RECORDS,
  type DoctorPatient,
} from '@/data/doctorData'

interface DoctorGlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPatient: (patient: DoctorPatient) => void
  onSelectReview: (reviewId: string) => void
  onNavigateView: (view: string) => void
}

export function DoctorGlobalSearchModal({
  isOpen,
  onClose,
  onSelectPatient,
  onSelectReview,
  onNavigateView,
}: DoctorGlobalSearchModalProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const results = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase().trim()

    const matchedPatients = MOCK_DOCTOR_PATIENTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.reasonForVisit.toLowerCase().includes(q)
    )

    const matchedReviews = MOCK_CLINICAL_REVIEWS.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.referralId.toLowerCase().includes(q) ||
        r.requiredSpecialty.toLowerCase().includes(q)
    )

    const matchedTasks = MOCK_DOCTOR_TASKS.filter(
      (t) =>
        t.task.toLowerCase().includes(q) ||
        (t.patientName && t.patientName.toLowerCase().includes(q))
    )

    const matchedRecords = MOCK_MEDICAL_RECORDS.filter(
      (rec) =>
        rec.id.toLowerCase().includes(q) ||
        rec.patientName.toLowerCase().includes(q) ||
        rec.recordType.toLowerCase().includes(q) ||
        rec.summary.toLowerCase().includes(q)
    )

    return {
      patients: matchedPatients,
      reviews: matchedReviews,
      tasks: matchedTasks,
      records: matchedRecords,
      totalCount:
        matchedPatients.length +
        matchedReviews.length +
        matchedTasks.length +
        matchedRecords.length,
    }
  }, [query])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-sm"
      role="presentation"
    >
      <div className="bg-[#09101d] border border-teal-500/30 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl text-slate-100">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-teal-400" size={18} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, patient IDs, referrals, clinical reviews, tasks, records..."
            className="w-full bg-[#060b13] border border-slate-700 rounded-xl pl-11 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3 text-slate-400 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {!results && (
            <div className="py-8 text-center text-slate-500 space-y-1">
              <Search size={28} className="mx-auto text-slate-600 mb-2" />
              <p className="text-slate-300 font-medium">Quick Clinical Search</p>
              <p className="text-xs">Type a patient name (e.g. Rajesh), ID (PAT-8801), or diagnosis to inspect</p>
            </div>
          )}

          {results && results.totalCount === 0 && (
            <div className="py-8 text-center text-slate-500">
              <p className="text-slate-400">No clinical results found matching &quot;{query}&quot;</p>
            </div>
          )}

          {results && results.totalCount > 0 && (
            <div className="space-y-4">
              {/* Categorized: Patients */}
              {results.patients.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                    Patients ({results.patients.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPatient(p)
                          onClose()
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center font-bold text-xs">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <strong className="text-white block">{p.name}</strong>
                            <span className="text-[10px] text-slate-400">
                              {p.id} · {p.bedRoom} · {p.reasonForVisit}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded">
                          {p.acuity}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized: Clinical Reviews */}
              {results.reviews.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Clinical Reviews ({results.reviews.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.reviews.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onSelectReview(r.id)
                          onClose()
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition"
                      >
                        <div>
                          <strong className="text-white block">
                            {r.id} · {r.patientName}
                          </strong>
                          <span className="text-[10px] text-slate-400">
                            {r.requiredSpecialty} · {r.referralId}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300 font-semibold">
                          SLA: {r.dueTime}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized: Tasks */}
              {results.tasks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                    Clinical Tasks ({results.tasks.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.tasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onNavigateView('tasks')
                          onClose()
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-2">
                          <CheckSquare size={14} className="text-blue-400 shrink-0" />
                          <span className="text-slate-200">{t.task}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Due: {t.dueDate}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized: Records */}
              {results.records.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Medical Records ({results.records.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.records.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => {
                          onNavigateView('records')
                          onClose()
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition"
                      >
                        <div>
                          <strong className="text-white block">
                            {rec.id} · {rec.patientName} ({rec.recordType})
                          </strong>
                          <span className="text-[10px] text-slate-400 truncate max-w-md block">
                            {rec.summary}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-300 font-mono">
                          {rec.date}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Press ESC to close</span>
          <span>ASTRA Global Clinical Index</span>
        </div>
      </div>
    </div>
  )
}
