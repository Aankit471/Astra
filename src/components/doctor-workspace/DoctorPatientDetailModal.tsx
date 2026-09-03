import { useState } from 'react'
import {
  Clock3,
  Download,
  Eye,
  FileText,
  HeartPulse,
  Hospital,
  PenTool,
  Plus,
  X,
} from 'lucide-react'
import type { DoctorPatient } from '@/data/doctorData'

interface DoctorPatientDetailModalProps {
  patient: DoctorPatient
  onClose: () => void
}

export function DoctorPatientDetailModal({
  patient,
  onClose,
}: DoctorPatientDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'VITALS' | 'HISTORY' | 'CLINICAL' | 'DOCUMENTS' | 'NOTES' | 'TIMELINE'
  >('OVERVIEW')

  const [notes, setNotes] = useState(patient.notes)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [previewDocName, setPreviewDocName] = useState<string | null>(null)

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteContent.trim()) return

    const createdNote = {
      id: `NOTE-${Date.now().toString().slice(-4)}`,
      author: 'Dr. Sarah Jenkins, MD',
      role: 'Attending Interventional Cardiologist',
      timestamp: 'Just now',
      content: newNoteContent.trim(),
    }

    setNotes([createdNote, ...notes])
    setNewNoteContent('')
    setToastMessage('Clinical progress note saved to electronic medical record.')
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleDownloadDoc = (docName: string) => {
    setToastMessage(`Downloading verified document: ${docName}...`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
      role="presentation"
    >
      <div className="bg-[#09101d] border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-slate-100">
        {/* ── Patient Header ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">{patient.name}</h2>
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                {patient.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  patient.acuity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : patient.acuity === 'URGENT'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {patient.acuity} ACUITY
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {patient.status}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              {patient.age} Yrs · {patient.gender} · Location: <strong className="text-slate-200">{patient.bedRoom}</strong> · Arrived: <strong className="text-slate-200">{patient.arrivalTime}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white self-start sm:self-auto"
          >
            <X size={20} />
          </button>
        </div>

        {toastMessage && (
          <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center justify-between shadow-lg">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-teal-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* ── Sub-Navigation Tabs ───────────────────────────────────────── */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
          {[
            { id: 'OVERVIEW', label: 'Patient Overview' },
            { id: 'VITALS', label: 'Live Vitals' },
            { id: 'HISTORY', label: 'Medical History' },
            { id: 'CLINICAL', label: 'Clinical Info & Diagnosis' },
            { id: 'DOCUMENTS', label: `Documents (${patient.documents.length})` },
            { id: 'NOTES', label: `Clinical Notes (${notes.length})` },
            { id: 'TIMELINE', label: 'Clinical Timeline' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 py-2 rounded-t-lg font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-slate-800 text-teal-300 border-b-2 border-teal-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── TAB 1: OVERVIEW ───────────────────────────────────────────── */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                <HeartPulse size={14} className="text-teal-400" /> Chief Complaint & Reason
              </h4>
              <div className="space-y-2 text-slate-300">
                <div>
                  <span className="text-slate-500 text-[10px] block">Chief Complaint:</span>
                  <p className="text-rose-300 font-medium text-xs mt-0.5">
                    {patient.overview.chiefComplaint}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Reason for Visit:</span>
                  <p className="text-white font-medium">{patient.reasonForVisit}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                <Hospital size={14} className="text-teal-400" /> Facility & Doctor Assignment
              </h4>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Location:</span>
                  <strong className="text-white">{patient.overview.currentLocation}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Doctor:</span>
                  <strong className="text-teal-300">{patient.overview.assignedDoctor}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Referring Facility:</span>
                  <strong className="text-slate-200">{patient.overview.referringFacility}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Facility:</span>
                  <strong className="text-slate-200">{patient.overview.currentFacility}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: VITALS ─────────────────────────────────────────────── */}
        {activeTab === 'VITALS' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="card p-4 bg-slate-900/90 border-slate-800 text-center space-y-1">
                <span className="text-slate-400 text-[11px] block">Heart Rate</span>
                <strong className="text-2xl font-bold text-rose-400 block font-mono">
                  {patient.vitals.heartRate} <small className="text-xs font-normal text-slate-400">bpm</small>
                </strong>
                <span className="text-[10px] text-rose-300 font-semibold block">Tachycardia</span>
              </div>

              <div className="card p-4 bg-slate-900/90 border-slate-800 text-center space-y-1">
                <span className="text-slate-400 text-[11px] block">Blood Pressure</span>
                <strong className="text-2xl font-bold text-rose-400 block font-mono">
                  {patient.vitals.bloodPressure}
                </strong>
                <span className="text-[10px] text-rose-300 font-semibold block">Hypotensive</span>
              </div>

              <div className="card p-4 bg-slate-900/90 border-slate-800 text-center space-y-1">
                <span className="text-slate-400 text-[11px] block">Temperature</span>
                <strong className="text-2xl font-bold text-teal-300 block font-mono">
                  {patient.vitals.temperature}°C
                </strong>
                <span className="text-[10px] text-emerald-400 font-semibold block">Normothermic</span>
              </div>

              <div className="card p-4 bg-slate-900/90 border-slate-800 text-center space-y-1">
                <span className="text-slate-400 text-[11px] block">SpO2 Oxygen</span>
                <strong className="text-2xl font-bold text-amber-400 block font-mono">
                  {patient.vitals.spO2}%
                </strong>
                <span className="text-[10px] text-amber-300 font-semibold block">On 4L O2 Cannula</span>
              </div>

              <div className="card p-4 bg-slate-900/90 border-slate-800 text-center space-y-1">
                <span className="text-slate-400 text-[11px] block">Respiratory Rate</span>
                <strong className="text-2xl font-bold text-white block font-mono">
                  {patient.vitals.respiratoryRate} <small className="text-xs font-normal text-slate-400">/min</small>
                </strong>
                <span className="text-[10px] text-amber-300 font-semibold block">Tachypneic</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400 text-xs">
                Continuous Cardiac Telemetry: <strong className="text-emerald-400">Connected to Central Monitor Suite</strong>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Calibrated: 12m ago</span>
            </div>
          </div>
        )}

        {/* ── TAB 3: MEDICAL HISTORY ────────────────────────────────────── */}
        {activeTab === 'HISTORY' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                Previous Medical Conditions
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {patient.medicalHistory.conditions.map((cond, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-slate-800 text-slate-200 text-xs border border-slate-700">
                    • {cond}
                  </span>
                ))}
              </div>

              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs pt-2">
                Documented Allergies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {patient.medicalHistory.allergies.map((allg, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                    ⚠ {allg}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                Active Medications
              </h4>
              <div className="space-y-1 text-slate-300">
                {patient.medicalHistory.medications.map((med, i) => (
                  <div key={i} className="p-1.5 rounded bg-black/40 border border-white/5">
                    {med}
                  </div>
                ))}
              </div>

              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs pt-2">
                Relevant Social & Family History
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {patient.medicalHistory.relevantHistory}
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 4: CLINICAL INFO & DIAGNOSIS ─────────────────────────── */}
        {activeTab === 'CLINICAL' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                Reported Clinical Symptoms
              </h4>
              <div className="flex flex-wrap gap-2">
                {patient.clinicalInfo.symptoms.map((sym, i) => (
                  <span key={i} className="px-2.5 py-1 rounded bg-teal-950/30 text-teal-300 border border-teal-500/30 font-medium">
                    ✓ {sym}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                  Initial Clinical Assessment
                </span>
                <p className="text-slate-200 leading-relaxed text-[11px]">
                  {patient.clinicalInfo.initialAssessment}
                </p>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                    Clinical Observations & Auscultation
                  </span>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    {patient.clinicalInfo.observations}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                  Primary Working Diagnosis
                </span>
                <p className="text-teal-300 font-bold text-sm">
                  {patient.clinicalInfo.diagnosis}
                </p>

                <div className="pt-2 border-t border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                    Calculated Risk Indicators
                  </span>
                  <div className="space-y-1">
                    {patient.clinicalInfo.riskIndicators.map((risk, i) => (
                      <span key={i} className="block text-rose-300 font-medium text-[11px]">
                        • {risk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: DOCUMENTS ─────────────────────────────────────────── */}
        {activeTab === 'DOCUMENTS' && (
          <div className="space-y-3 text-xs">
            {patient.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">{doc.name}</strong>
                    <span className="text-[11px] text-slate-400">
                      {doc.type} · {doc.uploadedDate} · {doc.size}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewDocName(doc.name)}
                    className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownloadDoc(doc.name)}
                    className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1 shadow-sm"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}

            {previewDocName && (
              <div className="p-4 rounded-xl bg-black/70 border border-teal-500/40 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <strong className="text-white text-sm">Previewing: {previewDocName}</strong>
                  <button onClick={() => setPreviewDocName(null)} className="text-slate-400 hover:text-white">
                    Close Preview
                  </button>
                </div>
                <div className="p-6 rounded bg-slate-950 text-center text-slate-400 space-y-2 border border-slate-800">
                  <FileText size={32} className="text-teal-400 mx-auto" />
                  <p className="text-white font-medium">Verified Medical Diagnostic Record</p>
                  <p className="text-slate-400 text-[11px]">
                    Simulated high-resolution telemetry viewer. Diagnostic values and waveforms verified by Central Imaging System.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 6: CLINICAL NOTES ────────────────────────────────────── */}
        {activeTab === 'NOTES' && (
          <div className="space-y-4 text-xs">
            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <PenTool size={14} className="text-teal-400" />
                Add Attending Physician Clinical Progress Note
              </h4>
              <textarea
                rows={3}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Document findings, hemodynamic status, orders, or intervention plan..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                required
              />
              <div className="flex justify-end">
                <button type="submit" className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 shadow-sm">
                  <Plus size={14} />
                  <span>Save Clinical Note</span>
                </button>
              </div>
            </form>

            {/* Existing Notes */}
            <div className="space-y-2.5">
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <strong className="text-teal-300 font-semibold">{note.author} ({note.role})</strong>
                    <span className="text-slate-500 font-mono">{note.timestamp}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 7: TIMELINE ──────────────────────────────────────────── */}
        {activeTab === 'TIMELINE' && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock3 size={14} className="text-teal-400" /> Chronological Clinical Journey
            </h4>

            <div className="space-y-3">
              {patient.timeline.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                    step.completed
                      ? 'bg-teal-950/20 border-teal-500/30 text-teal-300'
                      : 'bg-black/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-black/40 border border-white/10">
                      {step.completed ? '✓' : idx + 1}
                    </div>
                    <div>
                      <strong className="text-white block text-xs">{step.title}</strong>
                      <span className="text-[11px] text-slate-400">Staff: {step.actor}</span>
                    </div>
                  </div>

                  <span className="font-mono text-slate-400 text-[11px]">{step.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-500 text-[11px]">
            Electronic Health Record · Last Synced: {patient.lastUpdated}
          </span>
          <button onClick={onClose} className="btn-primary text-xs py-2 px-4">
            Close Clinical Workspace
          </button>
        </div>
      </div>
    </div>
  )
}
