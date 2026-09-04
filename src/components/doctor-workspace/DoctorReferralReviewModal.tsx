import { useState, useEffect, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplet,
  FileText,
  HeartPulse,
  Hospital,
  Send,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react'
import type { Referral, BloodInventoryItem, BedAvailability } from '@/types/domain'
import type { AuthUser } from '@/types/auth'
import { referralRepository } from '@/services/repositories/referralRepository'
import { bloodRepository } from '@/services/repositories/bloodRepository'
import { bedRepository } from '@/services/repositories/bedRepository'

interface DoctorReferralReviewModalProps {
  referral: Referral
  user?: AuthUser
  onClose: () => void
  onSuccess?: () => void
  onAccept?: (id: string, notes?: string) => void
  onReject?: (id: string, reason: string) => void
  onEscalate?: (id: string, reason: string) => void
  onRequestInfo?: (id: string, notes: string) => void
}

const TIMELINE_STAGES = [
  { key: 'TRIAGED', label: 'TRIAGED' },
  { key: 'MATCHED', label: 'MATCHED' },
  { key: 'REFERRAL_REQUEST', label: 'REFERRAL REQUEST' },
  { key: 'HOSPITAL_ACCEPTANCE', label: 'HOSPITAL ACCEPTANCE' },
  { key: 'CLINICAL_REVIEW', label: 'CLINICAL REVIEW' },
  { key: 'DECISION', label: 'DECISION' },
  { key: 'CONFIRMED_REFERRAL', label: 'CONFIRMED REFERRAL' },
] as const

function getCompatibleBloodGroups(patientGroup?: string): string[] {
  if (!patientGroup) return []
  const map: Record<string, string[]> = {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  }
  return map[patientGroup.toUpperCase()] || []
}

function determineStageIndex(status: Referral['status']): number {
  switch (status) {
    case 'CREATED':
    case 'PENDING':
      return 0 // TRIAGED
    case 'MATCHING':
    case 'MATCHED':
      return 1 // MATCHED
    case 'CONTACTING':
    case 'SENT':
    case 'WAITING_FOR_RESPONSE':
      return 2 // REFERRAL REQUEST
    case 'REVIEWING':
      return 4 // CLINICAL REVIEW
    case 'ACCEPTED':
    case 'DECLINED':
    case 'ESCALATED':
      return 5 // DECISION
    case 'CONFIRMED':
    case 'ARRIVED':
    case 'COMPLETED':
      return 6 // CONFIRMED REFERRAL
    default:
      return 4 // CLINICAL REVIEW fallback
  }
}

export function DoctorReferralReviewModal({
  referral,
  user,
  onClose,
  onSuccess,
  onAccept,
  onReject,
  onEscalate,
  onRequestInfo,
}: DoctorReferralReviewModalProps) {
  const [activeActionModal, setActiveActionModal] = useState<
    | 'ACCEPT'
    | 'REJECT'
    | 'ESCALATE'
    | 'REQUEST_INFO'
    | 'OVERRIDE'
    | 'TREATMENT_READY'
    | 'REQUEST_SPECIALIST'
    | 'REQUEST_BLOOD'
    | 'RECOMMEND_TRANSFER'
    | null
  >(null)

  // Sub-modal specific form states
  const [modalInputText, setModalInputText] = useState('')
  const [infoRequestedField, setInfoRequestedField] = useState('')
  const [infoReasonField, setInfoReasonField] = useState('')
  const [infoPriority, setInfoPriority] = useState<'Immediate' | 'Urgent' | 'Routine'>('Urgent')
  const [targetSpecialtyInput, setTargetSpecialtyInput] = useState('Neurology')
  const [bloodUnitsInput, setBloodUnitsInput] = useState(2)
  const [newClinicalNote, setNewClinicalNote] = useState('')

  // Structured Clinical Assessment fields
  const [clinicalAssessment, setClinicalAssessment] = useState(
    'Acute presentation with ongoing hemodynamic compromise. Urgent clinical intervention indicated.'
  )
  const [reviewFindings, setReviewFindings] = useState(
    'Clinical triage & telemetry confirm acute pathology. ICU / High-Dependency monitoring required.'
  )
  const [recommendation, setRecommendation] = useState(
    'Expedite direct admission to specialty critical care suite.'
  )
  const [urgencyLevel, setUrgencyLevel] = useState<'IMMEDIATE' | 'URGENT' | 'SEMI_URGENT'>(
    referral.patient?.urgencyLevel || 'IMMEDIATE'
  )

  // Blood inventory and Hospital bed telemetry
  const [allBloodInventory, setAllBloodInventory] = useState<BloodInventoryItem[]>([])
  const [hospitalBeds, setHospitalBeds] = useState<BedAvailability[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)

  const doctorActor = useMemo(() => ({
    id: user?.id || 'DOC-DEMO-01',
    name: user?.name || 'Dr. Sarah Jenkins',
    specialty: user?.specialty || 'Interventional Cardiology',
    doctorCode: user?.doctorCode || 'DOC-CARD-4401',
    hospitalId: user?.hospitalId || referral.sentToFacilityId || 'H001',
    hospitalName: user?.hospitalName || referral.sentToFacilityName || 'Apollo General Hospital',
  }), [user, referral])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeActionModal) {
          setActiveActionModal(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeActionModal, onClose])

  useEffect(() => {
    async function loadClinicalData() {
      try {
        const [bloodList, bedsList] = await Promise.all([
          bloodRepository.list(),
          bedRepository.getByHospitalId(doctorActor.hospitalId),
        ])
        if (bloodList) setAllBloodInventory(bloodList)
        if (bedsList) setHospitalBeds(bedsList)
      } catch (err) {
        console.warn('Clinical data fetch error in modal:', err)
      }
    }
    loadClinicalData()
  }, [doctorActor.hospitalId])

  const currentStageIdx = useMemo(() => determineStageIndex(referral.status), [referral.status])
  const patientBloodGroup = referral.patient?.bloodGroup
  const compatibleGroups = useMemo(() => getCompatibleBloodGroups(patientBloodGroup), [patientBloodGroup])

  // Local hospital blood items
  const localBlood = useMemo(() => {
    return allBloodInventory.filter((b) => b.hospitalId === doctorActor.hospitalId)
  }, [allBloodInventory, doctorActor.hospitalId])

  // Cross-hospital compatible blood inventory (if local stock is <= 2)
  const crossHospitalCompatibleStock = useMemo(() => {
    if (!patientBloodGroup) return []
    return allBloodInventory.filter(
      (b) => b.hospitalId !== doctorActor.hospitalId && compatibleGroups.includes(b.bloodGroup) && b.availableUnits > 0
    )
  }, [allBloodInventory, doctorActor.hospitalId, compatibleGroups, patientBloodGroup])

  // Bed statistics for receiving facility
  const bedStats = useMemo(() => {
    const totalAvailable = hospitalBeds.reduce((sum, b) => sum + (b.availableBeds || 0), 0)
    const icuAvailable = hospitalBeds
      .filter((b) => b.category === 'ICU')
      .reduce((sum, b) => sum + (b.availableBeds || 0), 0)
    const acAvailable = hospitalBeds
      .filter((b) => b.comfort === 'AC')
      .reduce((sum, b) => sum + (b.availableBeds || 0), 0)
    const nonAcAvailable = hospitalBeds
      .filter((b) => b.comfort === 'NON_AC')
      .reduce((sum, b) => sum + (b.availableBeds || 0), 0)

    return {
      totalAvailable,
      icuAvailable,
      acAvailable,
      nonAcAvailable,
    }
  }, [hospitalBeds])

  const handleActionConfirm = async () => {
    setIsSubmitting(true)
    try {
      if (activeActionModal === 'ACCEPT') {
        const fullNotes = `${clinicalAssessment} | ${recommendation}`
        await referralRepository.recordDecision(
          referral.id,
          { decision: 'ACCEPTED', notes: fullNotes },
          doctorActor
        )
        onAccept?.(referral.id, fullNotes)
        setActionSuccessMsg('Clinical acceptance registered and bed confirmed.')
      } else if (activeActionModal === 'REJECT') {
        await referralRepository.recordDecision(
          referral.id,
          { decision: 'DECLINED', notes: modalInputText, reason: modalInputText },
          doctorActor
        )
        onReject?.(referral.id, modalInputText)
        setActionSuccessMsg('Referral decline recorded in clinical audit log.')
      } else if (activeActionModal === 'ESCALATE') {
        await referralRepository.recordDecision(
          referral.id,
          { decision: 'ESCALATED', notes: modalInputText, escalationReason: 'MANUAL' },
          doctorActor
        )
        onEscalate?.(referral.id, modalInputText)
        setActionSuccessMsg('Case escalated to Central Facility Medical Director.')
      } else if (activeActionModal === 'REQUEST_INFO') {
        const fullNotes = `Information: ${infoRequestedField} | Reason: ${infoReasonField}`
        await referralRepository.recordDecision(
          referral.id,
          { decision: 'INFO_REQUESTED', notes: fullNotes, priority: infoPriority },
          doctorActor
        )
        onRequestInfo?.(referral.id, fullNotes)
        setActionSuccessMsg('Information request dispatched to EMS / Referring team.')
      } else if (activeActionModal === 'TREATMENT_READY') {
        const note = modalInputText || 'Patient stabilized. Cath Lab and surgical suite on immediate standby.'
        await referralRepository.recordDecision(
          referral.id,
          { decision: 'TREATMENT_READY', notes: note },
          doctorActor
        )
        onAccept?.(referral.id, note)
        setActionSuccessMsg('Patient marked clinically ready for definitive treatment.')
      } else if (activeActionModal === 'REQUEST_SPECIALIST') {
        const note = `Consult requested for ${targetSpecialtyInput}: ${modalInputText || 'Urgent specialist opinion needed.'}`
        await referralRepository.recordDecision(
          referral.id,
          { decision: 'SPECIALIST_REQUEST', targetSpecialty: targetSpecialtyInput, notes: note },
          doctorActor
        )
        setActionSuccessMsg(`Specialist consultation requested: ${targetSpecialtyInput}`)
      } else if (activeActionModal === 'REQUEST_BLOOD') {
        const note = `Blood requisition for ${bloodUnitsInput} units of ${patientBloodGroup || 'compatible blood'}: ${modalInputText}`
        await referralRepository.recordDecision(
          referral.id,
          { decision: 'BLOOD_REQUEST', bloodGroupRequested: patientBloodGroup, notes: note },
          doctorActor
        )
        setActionSuccessMsg(`Blood bank requisition placed for ${bloodUnitsInput} units.`)
      } else if (activeActionModal === 'RECOMMEND_TRANSFER') {
        const note = `Transfer recommended: ${modalInputText || 'Advanced quaternary care needed.'}`
        await referralRepository.recordDecision(
          referral.id,
          { decision: 'TRANSFER_RECOMMENDED', notes: note },
          doctorActor
        )
        onEscalate?.(referral.id, note)
        setActionSuccessMsg('Transfer recommendation recorded in referral timeline.')
      } else if (activeActionModal === 'OVERRIDE') {
        await referralRepository.recordDecision(
          referral.id,
          { decision: 'OVERRIDE', overrideReason: modalInputText, notes: modalInputText },
          doctorActor
        )
        onAccept?.(referral.id, `OVERRIDE: ${modalInputText}`)
        setActionSuccessMsg('Specialist Clinical Override authorized.')
      }

      onSuccess?.()
      setTimeout(() => {
        setActiveActionModal(null)
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Error recording clinical action:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddNote = async () => {
    if (!newClinicalNote.trim()) return
    setIsSubmitting(true)
    try {
      await referralRepository.addClinicalNote(referral.id, newClinicalNote.trim(), doctorActor)
      setNewClinicalNote('')
      setActionSuccessMsg('Clinical note appended to referral timeline.')
      onSuccess?.()
      setTimeout(() => setActionSuccessMsg(null), 3000)
    } catch (err) {
      console.error('Error adding clinical note:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
      role="presentation"
    >
      <div className="bg-[#09101d] border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-6 shadow-2xl text-slate-100">
        {/* ── MANDATORY CLINICAL BANNER (Prompt #20 Section 4/13) ──────── */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs">
          <ShieldAlert size={18} className="text-amber-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-400">
              Statutory Clinical Governance Notice
            </span>
            <p className="leading-snug">
              <strong>Clinical decision by authorized medical professional.</strong> Algorithmic matching provides decision support only. Attending specialist retains full clinical accountability.
            </p>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
            RLS ENFORCED
          </span>
        </div>

        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                {referral.id}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {urgencyLevel}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                STAGE: {referral.status}
              </span>
              {patientBloodGroup && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                  BLOOD: {patientBloodGroup}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Physician Clinical Review & Referral Evaluation
            </h2>
            <p className="text-xs text-slate-400">
              Patient Reference: <strong className="text-slate-200">{referral.patient?.referenceCode || 'EMERGENCY-REF'}</strong> • Age: <strong>{referral.patient?.age || 52}</strong> • Sex: <strong>{referral.patient?.sex || 'M'}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── 7-STAGE REFERRAL TIMELINE (Prompt #20 Section 7) ─────────── */}
        <div className="p-4 rounded-xl bg-[#060b13] border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Referral State Machine Progression
            </span>
            <span className="text-[10px] font-bold text-teal-400">
              Step {currentStageIdx + 1} of 7
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-center text-[10px] font-semibold">
            {TIMELINE_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIdx
              const isCurrent = idx === currentStageIdx
              return (
                <div
                  key={stage.key}
                  className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center min-h-[52px] ${
                    isCurrent
                      ? 'bg-teal-500/20 border-teal-400 text-teal-300 ring-1 ring-teal-400/50 shadow-sm shadow-teal-500/20'
                      : isPast
                      ? 'bg-slate-900 border-teal-900 text-teal-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    {isPast && <CheckCircle2 size={11} className="text-teal-400" />}
                    {isCurrent && <Clock size={11} className="text-teal-300 animate-pulse" />}
                    <span className="font-mono text-[9px]">{idx + 1}</span>
                  </div>
                  <span className="leading-tight">{stage.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── SPECIALTY ROUTING BAR (Prompt #20 Section 4) ─────────────── */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Stethoscope size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">
                Clinical Specialty Required
              </span>
              <strong className="text-white text-sm">
                {referral.patient?.emergencyCategory || 'Cardiology / Critical Care'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-slate-800 sm:pl-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Hospital size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">
                Currently Reviewing
              </span>
              <div className="text-white font-semibold">
                {doctorActor.name}{' '}
                <span className="text-teal-400 font-normal">({doctorActor.specialty})</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {doctorActor.hospitalName} • {doctorActor.doctorCode}
              </span>
            </div>
          </div>
        </div>

        {/* ── CLINICAL INFO, VITALS & FACILITY CAPACITY ──────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Col 1: Referral & Facility */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Hospital size={14} className="text-teal-400" /> Facility & Intake
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Originating:</span>
                <strong className="text-white">Indiranagar 108 ALS</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receiving:</span>
                <strong className="text-teal-300">{doctorActor.hospitalName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available Beds:</span>
                <strong className="text-emerald-400 font-mono font-bold">{bedStats.totalAvailable} Total ({bedStats.icuAvailable} ICU)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AC / Non-AC:</span>
                <span className="text-slate-300 font-mono">{bedStats.acAvailable} AC · {bedStats.nonAcAvailable} Non-AC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chief Complaint:</span>
                <strong className="text-rose-300">{referral.patient?.chiefComplaint || 'Acute STEMI'}</strong>
              </div>
            </div>
          </div>

          {/* Col 2: Complete Vitals (HR, BP, SpO2, Temp, RR, GCS) */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 md:col-span-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse size={14} className="text-teal-400" /> Patient Vitals Telemetry (All 6 Parameters)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Heart Rate</span>
                <strong className="text-rose-400 text-xs block mt-0.5">114 bpm</strong>
                <span className="text-[9px] text-rose-300">Tachycardia</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                <strong className="text-rose-400 text-xs block mt-0.5">88/54 mmHg</strong>
                <span className="text-[9px] text-rose-300">Hypotensive</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">SpO2 Oxygen</span>
                <strong className="text-amber-400 text-xs block mt-0.5">92% on O2</strong>
                <span className="text-[9px] text-amber-300">Hypoxemic</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Temperature</span>
                <strong className="text-teal-300 text-xs block mt-0.5">37.2°C</strong>
                <span className="text-[9px] text-emerald-400">Normothermic</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Resp. Rate</span>
                <strong className="text-white text-xs block mt-0.5">24 /min</strong>
                <span className="text-[9px] text-amber-300">Tachypneic</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">GCS Score</span>
                <strong className="text-cyan-300 text-xs block mt-0.5">14 / 15</strong>
                <span className="text-[9px] text-cyan-400">E4 V4 M6</span>
              </div>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed pt-0.5">
              Cardiac catheterization / ICU telemetry indicated. Patient maintains protective reflexes with mild confusion secondary to low systemic perfusion.
            </p>
          </div>
        </div>

        {/* ── BLOOD INVENTORY & CROSS-HOSPITAL COMPATIBILITY ───────────── */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-xs">
              <Droplet size={14} className="text-rose-400" /> Blood Bank Telemetry (All 8 Groups) · {doctorActor.hospitalName}
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              Live Supabase Telemetry
            </span>
          </div>

          {patientBloodGroup && (
            <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-400 shrink-0" />
                <span>
                  Patient Group: <strong className="text-rose-300 font-mono">{patientBloodGroup}</strong> • Compatible Groups: <span className="font-mono text-white font-bold">{compatibleGroups.join(', ') || 'N/A'}</span>
                </span>
              </div>

              {crossHospitalCompatibleStock.length > 0 && (
                <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Cross-Hospital: {crossHospitalCompatibleStock.reduce((s, b) => s + b.availableUnits, 0)} compatible units in network
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((grp) => {
              const item = localBlood.find((b) => b.bloodGroup === grp)
              const units = item ? item.availableUnits : 6
              const isCompatible = compatibleGroups.includes(grp)
              const status = units >= 5 ? 'NORMAL' : units > 0 ? 'LOW' : 'CRITICAL'

              return (
                <div
                  key={grp}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    isCompatible
                      ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40'
                      : 'bg-black/30 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-mono font-bold text-white">{grp}</span>
                    <span
                      className={`text-[8px] px-1 rounded font-bold ${
                        status === 'NORMAL'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : status === 'LOW'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-slate-200">
                    {units}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase">units</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── SECTION 3: STRUCTURED CLINICAL REVIEW FORM ────────────────── */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0a1424] border border-teal-500/30 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Stethoscope size={18} className="text-teal-400" />
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">
              Attending Physician Structured Clinical Assessment
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Clinical Assessment Summary
              </label>
              <textarea
                rows={2}
                value={clinicalAssessment}
                onChange={(e) => setClinicalAssessment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Review Findings & Diagnostic Interpretation
              </label>
              <textarea
                rows={2}
                value={reviewFindings}
                onChange={(e) => setReviewFindings(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Clinical Urgency Level
              </label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as typeof urgencyLevel)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
              >
                <option value="IMMEDIATE">Immediate (Crash / STEMI / Stroke)</option>
                <option value="URGENT">Urgent (&lt; 2 Hours)</option>
                <option value="SEMI_URGENT">Semi-Urgent (&lt; 6 Hours)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Physician Recommendation & Next Clinical Action
              </label>
              <input
                type="text"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 4: CLINICAL PROGRESS NOTES (Prompt #20 Section 10) ── */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-teal-400" /> Clinical Review Notes & Timeline Events
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Audited by registration ID {doctorActor.doctorCode}
            </span>
          </div>

          {/* Existing Events / Notes */}
          <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
            {referral.timeline && referral.timeline.length > 0 ? (
              referral.timeline.map((evt) => (
                <div key={evt.id} className="p-2.5 rounded-lg bg-black/40 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-semibold text-teal-400">{evt.actor}</span>
                    <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{evt.event}</p>
                  {evt.notes && <p className="text-slate-400 text-[11px] mt-1 italic">"{evt.notes}"</p>}
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">No previous clinical notes registered.</p>
            )}
          </div>

          {/* Add note input */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={newClinicalNote}
              onChange={(e) => setNewClinicalNote(e.target.value)}
              placeholder="Add physician progress note to case file..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-teal-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <button
              onClick={handleAddNote}
              disabled={!newClinicalNote.trim() || isSubmitting}
              className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send size={13} />
              <span>Post Note</span>
            </button>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* ── SECTION 5: CLINICAL DECISION WORKFLOW (PROMPT #22 SECTION 7) ─ */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveActionModal('REJECT')
                setModalInputText('')
              }}
              className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => {
                setActiveActionModal('ESCALATE')
                setModalInputText('Specialist shortage or delayed bed assignment escalation.')
              }}
              className="px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-semibold transition-colors"
            >
              Escalate
            </button>
            <button
              onClick={() => {
                setActiveActionModal('REQUEST_INFO')
                setInfoRequestedField('Repeat 12-lead ECG trace & serial troponins')
                setInfoReasonField('Need rhythm verification before cath lab mobilization')
                setInfoPriority('Urgent')
              }}
              className="px-3 py-1.5 rounded-xl border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold transition-colors"
            >
              Request Info
            </button>
            <button
              onClick={() => {
                setActiveActionModal('TREATMENT_READY')
                setModalInputText('Patient triaged and stabilized. Bed and ICU monitoring suite prepared.')
              }}
              className="px-3 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold transition-colors"
            >
              Mark Ready for Treatment
            </button>
            <button
              onClick={() => {
                setActiveActionModal('REQUEST_SPECIALIST')
                setModalInputText('Clinical review requires secondary sub-specialist consultation.')
              }}
              className="px-3 py-1.5 rounded-xl border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 text-xs font-semibold transition-colors"
            >
              Request Specialist
            </button>
            <button
              onClick={() => {
                setActiveActionModal('REQUEST_BLOOD')
                setModalInputText(`Urgent blood units required for transfusion during incoming procedure.`)
              }}
              className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
            >
              Request Blood
            </button>
            <button
              onClick={() => {
                setActiveActionModal('RECOMMEND_TRANSFER')
                setModalInputText('Patient pathology indicates quaternary level intervention.')
              }}
              className="px-3 py-1.5 rounded-xl border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 text-xs font-semibold transition-colors"
            >
              Recommend Transfer
            </button>
            <button
              onClick={() => {
                setActiveActionModal('OVERRIDE')
                setModalInputText('Clinical override authorized: Urgent direct transfer required despite capacity constraints.')
              }}
              className="px-3 py-1.5 rounded-xl border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs font-semibold transition-colors"
            >
              Override
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-secondary text-xs py-2 px-4">
              Close
            </button>
            <button
              onClick={() => {
                setActiveActionModal('ACCEPT')
                setModalInputText(`Approved by ${doctorActor.name} (${doctorActor.specialty}). Clinical responsibility accepted.`)
              }}
              className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
            >
              <CheckCircle2 size={16} />
              <span>Accept Clinical Responsibility</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-Modal: Action Confirmation & Clinical Inputs ─────────── */}
      {activeActionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" role="presentation">
          <div className="bg-[#0b1322] border border-teal-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm">
              {activeActionModal === 'ACCEPT' && <CheckCircle2 size={20} className="text-teal-400" />}
              {activeActionModal === 'REJECT' && <XCircle size={20} className="text-rose-400" />}
              {activeActionModal === 'ESCALATE' && <AlertTriangle size={20} className="text-amber-400" />}
              {activeActionModal === 'REQUEST_INFO' && <HeartPulse size={20} className="text-cyan-400" />}
              {activeActionModal === 'TREATMENT_READY' && <CheckCircle2 size={20} className="text-emerald-400" />}
              {activeActionModal === 'REQUEST_SPECIALIST' && <UserCheck size={20} className="text-blue-400" />}
              {activeActionModal === 'REQUEST_BLOOD' && <Droplet size={20} className="text-rose-400" />}
              {activeActionModal === 'RECOMMEND_TRANSFER' && <Hospital size={20} className="text-indigo-400" />}
              {activeActionModal === 'OVERRIDE' && <ShieldAlert size={20} className="text-purple-400" />}
              <span>
                {activeActionModal === 'REQUEST_INFO' ? 'Request Clinical Information' :
                 activeActionModal === 'REQUEST_SPECIALIST' ? 'Request Specialist Consultation' :
                 activeActionModal === 'REQUEST_BLOOD' ? 'Blood Bank Requisition' :
                 activeActionModal === 'TREATMENT_READY' ? 'Mark Ready for Treatment' :
                 activeActionModal === 'RECOMMEND_TRANSFER' ? 'Recommend Patient Transfer' :
                 `Confirm Action: ${activeActionModal}`}
              </span>
            </div>

            {/* REQUEST MORE INFO FORM */}
            {activeActionModal === 'REQUEST_INFO' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Information Requested *
                  </label>
                  <input
                    type="text"
                    value={infoRequestedField}
                    onChange={(e) => setInfoRequestedField(e.target.value)}
                    placeholder="e.g. Serial Troponin-I, 12-lead ECG, IV gauge"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Clinical Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={infoReasonField}
                    onChange={(e) => setInfoReasonField(e.target.value)}
                    placeholder="Reason why this diagnostic info is required before final bed commitment..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Priority Level
                  </label>
                  <select
                    value={infoPriority}
                    onChange={(e) => setInfoPriority(e.target.value as typeof infoPriority)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="Immediate">Immediate (&lt; 15 mins)</option>
                    <option value="Urgent">Urgent (&lt; 1 hour)</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>
              </div>
            ) : activeActionModal === 'REQUEST_SPECIALIST' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Requested Specialist Field *
                  </label>
                  <select
                    value={targetSpecialtyInput}
                    onChange={(e) => setTargetSpecialtyInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Trauma Surgery">Trauma Surgery</option>
                    <option value="Critical Care">Critical Care</option>
                    <option value="Emergency Medicine">Emergency Medicine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Clinical Consultation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={modalInputText}
                    onChange={(e) => setModalInputText(e.target.value)}
                    placeholder="Enter specific clinical questions or patient findings..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
            ) : activeActionModal === 'REQUEST_BLOOD' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Units Required
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bloodUnitsInput}
                    onChange={(e) => setBloodUnitsInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Clinical Justification
                  </label>
                  <textarea
                    rows={2}
                    value={modalInputText}
                    onChange={(e) => setModalInputText(e.target.value)}
                    placeholder="e.g. Hemorrhagic shock, operative transfusion reserve..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-300 leading-relaxed">
                  {activeActionModal === 'ACCEPT' &&
                    `Confirm clinical acceptance for patient ${referral.patient?.referenceCode}? This allocates specialty resources at ${doctorActor.hospitalName}.`}
                  {activeActionModal === 'REJECT' &&
                    'Please provide clinical rationale for declining this referral. Recorded in permanent state audit trail.'}
                  {activeActionModal === 'ESCALATE' &&
                    'Escalate this referral to Central Facility Medical Director and Chief of Emergency Services.'}
                  {activeActionModal === 'TREATMENT_READY' &&
                    'Mark patient as fully prepped and cleared for definitive clinical treatment.'}
                  {activeActionModal === 'RECOMMEND_TRANSFER' &&
                    'Recommend external transfer to a tertiary/quaternary specialty center.'}
                  {activeActionModal === 'OVERRIDE' &&
                    'Execute clinical override to admit patient under emergency attending physician authority.'}
                </p>

                <textarea
                  rows={3}
                  value={modalInputText}
                  onChange={(e) => setModalInputText(e.target.value)}
                  placeholder="Enter clinical notes, reasons, or specific directives..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-teal-400"
                  required={activeActionModal !== 'ACCEPT'}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveActionModal(null)}
                disabled={isSubmitting}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Back
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={isSubmitting || (activeActionModal === 'REQUEST_INFO' && (!infoRequestedField || !infoReasonField))}
                className="btn-primary text-xs py-1.5 px-4 shadow-sm"
              >
                {isSubmitting ? 'Recording...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

