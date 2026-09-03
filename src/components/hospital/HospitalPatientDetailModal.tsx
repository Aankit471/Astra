import {
  Clock3,
  Hospital,
  MapPin,
  Phone,
  Stethoscope,
  User,
  X,
} from 'lucide-react'
import type { HospitalPatient } from '@/data/hospitalOperations'

interface HospitalPatientDetailModalProps {
  patient: HospitalPatient
  onClose: () => void
  onContactTeam: (patient: HospitalPatient) => void
}

export function HospitalPatientDetailModal({
  patient,
  onClose,
  onContactTeam,
}: HospitalPatientDetailModalProps) {
  const operationsTimeline = [
    { title: 'Emergency Referral Received', time: 'Today 07:15', done: true },
    { title: 'Ambulance Arrival at Emergency Bay', time: 'Today 07:32', done: true },
    { title: 'Emergency Triage & Bed Allocation', time: 'Today 07:40', done: true },
    {
      title: 'Inpatient Ward Admission',
      time: patient.status !== 'WAITING' ? 'Today 08:00' : 'In Progress',
      done: patient.status !== 'WAITING',
    },
    {
      title: 'Discharge Planning',
      time: patient.status === 'DISCHARGE_PENDING' ? 'Pending Clearance' : 'Scheduled',
      done: patient.status === 'DISCHARGE_PENDING',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="presentation"
    >
      <div className="bg-[#0B111E] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {patient.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  patient.acuity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : patient.acuity === 'EMERGENT'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {patient.acuity} ACUITY
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                {patient.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{patient.name}</h2>
            <p className="text-xs text-slate-400">
              {patient.age} Yrs · {patient.gender} · Admitted {patient.admissionTime}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── 4 SECTION GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Section 1: Patient Information */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-cyan-400" /> Patient Information
            </h3>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient ID:</span>
                <strong className="font-mono text-white">{patient.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age & Gender:</span>
                <strong className="text-white">{patient.age} yrs · {patient.gender}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Acuity Level:</span>
                <strong className="text-rose-400">{patient.acuity}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <strong className="text-cyan-300">{patient.status.replace('_', ' ')}</strong>
              </div>
              <div className="pt-1 border-t border-white/5">
                <span className="text-slate-500 block text-[10px]">Diagnosis:</span>
                <strong className="text-slate-200 text-[11px] block">{patient.diagnosis}</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Current Location */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-cyan-400" /> Current Location in Facility
            </h3>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Facility:</span>
                <strong className="text-white">Apollo General Hospital</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ward Unit:</span>
                <strong className="text-cyan-300">{patient.ward}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room:</span>
                <strong className="text-white">{patient.room}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bed Allocation:</span>
                <strong className="text-emerald-400">{patient.bed}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Comfort Type:</span>
                <strong className="text-cyan-300">
                  {patient.comfort === 'AC' ? '❄️ AC Climate Room' : 'Non-AC Room'}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 3: Assigned Care Team */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope size={14} className="text-cyan-400" /> Assigned Clinical Care Team
            </h3>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Attending Physician:</span>
                <strong className="text-white">{patient.assignedDoctor}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialty & Purview:</span>
                <strong className="text-cyan-300">{patient.assignedDoctorSpecialty}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Primary Nurse:</span>
                <strong className="text-slate-200">{patient.primaryNurse}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Clinical Department:</span>
                <strong className="text-slate-200">{patient.ward}</strong>
              </div>
            </div>
          </div>

          {/* Section 4: Admission Information */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Hospital size={14} className="text-cyan-400" /> Admission & Intake Information
            </h3>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Admission Timestamp:</span>
                <strong className="text-white">{patient.admissionTime}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission Type:</span>
                <strong className="text-white">Emergency Facility Transfer</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referring Facility:</span>
                <strong className="text-slate-300">{patient.referringFacility || 'Direct Triage'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referral ID:</span>
                <strong className="font-mono text-cyan-300">{patient.referralId || 'N/A'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── Operations Timeline ── */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock3 size={14} className="text-cyan-400" /> Patient Operations Journey (Referral → Arrival → Admission)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {operationsTimeline.map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-center text-xs space-y-1 ${
                  step.done
                    ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'
                    : 'bg-black/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400">Step {idx + 1}</div>
                <strong className="block text-[11px] leading-tight text-white">{step.title}</strong>
                <span className="text-[10px] text-slate-400 block">{step.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => onContactTeam(patient)}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Phone size={13} />
            <span>Page Clinical Team ({patient.assignedDoctor})</span>
          </button>

          <button onClick={onClose} className="btn-primary text-xs py-2 px-4">
            Close Patient View
          </button>
        </div>
      </div>
    </div>
  )
}
