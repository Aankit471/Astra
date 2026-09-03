import { useState, useMemo } from 'react'
import {
  Download,
  Eye,
  FileCheck,
  Search,
} from 'lucide-react'
import {
  MOCK_MEDICAL_RECORDS,
  type DoctorMedicalRecord,
} from '@/data/doctorData'

export function DoctorMedicalRecordsView() {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewRecord, setPreviewRecord] = useState<DoctorMedicalRecord | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const categories = [
    'ALL',
    'Clinical Notes',
    'Lab Results',
    'Imaging',
    'Diagnoses',
    'Medications',
    'Procedures',
    'Discharge Summary',
  ]

  const filteredRecords = useMemo(() => {
    return MOCK_MEDICAL_RECORDS.filter((rec) => {
      if (selectedCategory !== 'ALL' && rec.recordType !== selectedCategory) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match = `${rec.patientName} ${rec.patientId} ${rec.recordType} ${rec.summary} ${rec.author}`.toLowerCase()
        if (!match.includes(q)) return false
      }

      return true
    })
  }, [selectedCategory, searchQuery])

  const handleDownload = (rec: DoctorMedicalRecord) => {
    setToastMessage(`Medical record #${rec.id} exported to PDF.`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            HEALTH INFORMATION MANAGEMENT
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Electronic Medical Records (EMR) Archive
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified physician notes, pathology lab results, imaging reports, and formal discharge dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Archived Records:</span>
          <strong className="text-teal-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {MOCK_MEDICAL_RECORDS.length} Verified Records
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

      {/* ── Category Tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-t-lg font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-teal-300 border-b-2 border-teal-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {cat === 'ALL' ? 'All Record Types' : cat}
            </button>
          )
        })}
      </div>

      {/* ── Search Bar ────────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search by patient name, record type, author, clinical keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#060b13] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 focus:ring-1 focus:ring-teal-400"
          />
        </div>
      </div>

      {/* ── Records Table ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060b13] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Record ID</th>
                <th className="py-3 px-3.5">Patient Name</th>
                <th className="py-3 px-3.5">Record Type</th>
                <th className="py-3 px-3.5">Date Documented</th>
                <th className="py-3 px-3.5">Author / Clinician</th>
                <th className="py-3 px-3.5">Facility</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3.5 font-mono font-bold text-teal-400">
                    {rec.id}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-white">
                    {rec.patientName} ({rec.patientId})
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                      {rec.recordType}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">
                    {rec.date}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">
                    {rec.author}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400">
                    {rec.facility}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewRecord(rec)}
                        className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownload(rec)}
                        className="btn-primary text-[11px] py-1 px-2.5 flex items-center gap-1 shadow-sm"
                      >
                        <Download size={12} />
                        <span>PDF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Record Preview Modal ──────────────────────────────────────── */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="presentation">
          <div className="bg-[#09101d] border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  Medical Record: {previewRecord.id}
                </h3>
              </div>
              <button onClick={() => setPreviewRecord(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-300 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <strong className="text-white">{previewRecord.patientName} ({previewRecord.patientId})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Record Type:</span>
                <span className="text-teal-300 font-semibold">{previewRecord.recordType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Documented By:</span>
                <span className="text-slate-200">{previewRecord.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility / Department:</span>
                <span className="text-slate-200">{previewRecord.facility}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold block">Clinical Findings & Medical Summary:</span>
              <p className="p-3.5 rounded-xl bg-black/50 border border-white/5 text-slate-200 leading-relaxed">
                {previewRecord.summary}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setPreviewRecord(null)} className="btn-secondary text-xs py-1.5 px-3">
                Close
              </button>
              <button onClick={() => handleDownload(previewRecord)} className="btn-primary text-xs py-1.5 px-4 shadow-sm">
                Download Official PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
