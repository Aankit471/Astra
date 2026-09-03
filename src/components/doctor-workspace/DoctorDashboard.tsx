import {
  Activity,
  ArrowRight,
  Calendar,
  Clock3,
  HeartPulse,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react'
import {
  MOCK_DOCTOR_PATIENTS,
  MOCK_CLINICAL_REVIEWS,
  MOCK_DOCTOR_TASKS,
  type DoctorPatient,
} from '@/data/doctorData'

interface DoctorDashboardProps {
  onNavigate: (view: string) => void
  onOpenPatient: (patient: DoctorPatient) => void
  onOpenReviewModal: (reviewId: string) => void
}

export function DoctorDashboard({
  onNavigate,
  onOpenPatient,
  onOpenReviewModal,
}: DoctorDashboardProps) {
  // Urgent cases
  const urgentCases = MOCK_DOCTOR_PATIENTS.filter(
    (p) => p.acuity === 'CRITICAL' || p.status === 'Urgent'
  )

  // Pending reviews
  const pendingReviews = MOCK_CLINICAL_REVIEWS.filter(
    (r) => r.status === 'Pending' || r.status === 'In Review'
  )

  // Recent activity logs
  const recentActivities = [
    {
      id: 'ACT-01',
      title: 'Clinical review completed',
      desc: 'Pre-operative cardiovascular evaluation for Farida Begum finalized.',
      time: '18m ago',
      type: 'REVIEW',
    },
    {
      id: 'ACT-02',
      title: 'Referral accepted',
      desc: 'Emergency STEMI transfer #REF-2026-001 accepted from Indiranagar 108 EMS.',
      time: '32m ago',
      type: 'REFERRAL',
    },
    {
      id: 'ACT-03',
      title: 'Patient record updated',
      desc: 'Added post-primary PCI diagnostic stent report to Rajesh Kumar dossier.',
      time: '45m ago',
      type: 'RECORD',
    },
    {
      id: 'ACT-04',
      title: 'Clinical note added',
      desc: 'Progress note documented for Someshwar Hegde in Gen Med Ward.',
      time: '1h ago',
      type: 'NOTE',
    },
    {
      id: 'ACT-05',
      title: 'Task completed',
      desc: 'EMS anticoagulant protocol advisory transmitted to Unit #14.',
      time: '1.5h ago',
      type: 'TASK',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Greeting Banner ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/15 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded">
                ACTIVE CLINICAL SHIFT
              </span>
              <span className="text-xs text-slate-400">
                Shift: Morning (07:00 – 15:30) · On-Call Cath Lab
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Good morning, Dr. Sarah Jenkins
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Here&apos;s your clinical overview for today. <strong>{urgentCases.length} urgent cases</strong> require your immediate medical attention.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => onNavigate('reviews')}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-lg shadow-teal-500/10"
            >
              <Stethoscope size={14} />
              <span>Pending Reviews ({pendingReviews.length})</span>
            </button>
            <button
              onClick={() => onNavigate('schedule')}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Calendar size={14} />
              <span>Today&apos;s Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 6 KPI CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Today&apos;s Patients</span>
          <strong className="text-2xl font-bold text-white block mt-1">
            {MOCK_DOCTOR_PATIENTS.length}
          </strong>
          <span className="text-[10px] text-teal-400 block">4 on inpatient round</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-amber-500/30 bg-amber-950/10">
          <span className="text-[11px] text-amber-400 block font-medium">Pending Reviews</span>
          <strong className="text-2xl font-bold text-amber-300 block mt-1">
            {pendingReviews.length}
          </strong>
          <span className="text-[10px] text-amber-300/80 block">SLA countdown active</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-rose-500/30 bg-rose-950/10">
          <span className="text-[11px] text-rose-400 block font-medium">Urgent Cases</span>
          <strong className="text-2xl font-bold text-rose-400 block mt-1">
            {urgentCases.length}
          </strong>
          <span className="text-[10px] text-rose-300 block">Critical triage</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Active Referrals</span>
          <strong className="text-2xl font-bold text-cyan-300 block mt-1">3</strong>
          <span className="text-[10px] text-slate-500 block">EMS / transfers</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Pending Tasks</span>
          <strong className="text-2xl font-bold text-white block mt-1">
            {MOCK_DOCTOR_TASKS.filter((t) => t.status !== 'Completed').length}
          </strong>
          <span className="text-[10px] text-slate-500 block">1 overdue</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-emerald-500/30 bg-emerald-950/10">
          <span className="text-[11px] text-emerald-400 block font-medium">Completed Reviews</span>
          <strong className="text-2xl font-bold text-emerald-300 block mt-1">1</strong>
          <span className="text-[10px] text-emerald-400/80 block">Today&apos;s cleared</span>
        </div>
      </div>

      {/* ── TODAY'S CLINICAL WORK TABLE ─────────────────────────────────── */}
      <section className="card p-5 space-y-4 bg-slate-900/90 border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} className="text-teal-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Today&apos;s Clinical Work Roster ({MOCK_DOCTOR_PATIENTS.length} Inpatients)
            </h3>
          </div>

          <button
            onClick={() => onNavigate('patients')}
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >
            <span>View All Patients</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060b13] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Patient ID</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Age / Sex</th>
                <th className="py-2.5 px-3">Acuity</th>
                <th className="py-2.5 px-3">Arrival Time</th>
                <th className="py-2.5 px-3">Clinical Reason</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {MOCK_DOCTOR_PATIENTS.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-400">
                    {p.id}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white">
                    {p.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {p.age} Yrs · {p.gender}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.acuity === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : p.acuity === 'URGENT'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {p.acuity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                    {p.arrivalTime}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                    {p.reasonForVisit}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.status === 'Urgent'
                          ? 'bg-rose-500/15 text-rose-300'
                          : p.status === 'In Consultation'
                          ? 'bg-cyan-500/15 text-cyan-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onOpenPatient(p)}
                      className="btn-primary text-[11px] py-1 px-2.5 shadow-sm"
                    >
                      Clinical Workspace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── TWO COLUMN: URGENT CASES & PENDING REVIEWS ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Urgent Cases Panel */}
        <section className="card p-5 space-y-3.5 bg-slate-900/90 border-rose-500/30 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Urgent Clinical Cases ({urgentCases.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-rose-300 bg-rose-950/50 border border-rose-500/30 px-2 py-0.5 rounded">
              HIGH PRIORITY
            </span>
          </div>

          <div className="space-y-3">
            {urgentCases.map((uc) => (
              <div
                key={uc.id}
                className="p-3.5 rounded-xl bg-black/40 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm font-bold">{uc.name}</strong>
                      <span className="text-[10px] font-mono text-teal-400">{uc.id}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                        {uc.acuity}
                      </span>
                    </div>
                    <p className="text-rose-300 font-medium text-[11px] mt-0.5">
                      {uc.reasonForVisit}
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenPatient(uc)}
                    className="btn-primary text-[11px] py-1 px-2.5 shrink-0 shadow-sm"
                  >
                    Action
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-slate-400">
                  <span>Location: <strong className="text-slate-200">{uc.bedRoom}</strong></span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1 font-mono">
                    <Clock3 size={11} /> {uc.arrivalTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Pending Clinical Reviews Panel */}
        <section className="card p-5 space-y-3.5 bg-slate-900/90 border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Pending Clinical Reviews ({pendingReviews.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reviews')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              <span>All Reviews</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {pendingReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl bg-black/40 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm font-bold">{rev.patientName}</strong>
                      <span className="text-[10px] font-mono text-cyan-400">{rev.referralId}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        SLA: {rev.dueTime}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {rev.requiredSpecialty} · From {rev.referringFacility}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenReviewModal(rev.id)}
                    className="btn-secondary text-[11px] py-1 px-3 shrink-0"
                  >
                    Review
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-slate-400">
                  <span>Priority: <strong className="text-amber-400">{rev.priority}</strong></span>
                  <span className="font-mono text-slate-400">{rev.createdTime}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── RECENT CLINICAL ACTIVITY FEED ──────────────────────────────── */}
      <section className="card p-5 space-y-3 bg-slate-900/90 border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} className="text-teal-400" />
          Recent Clinical Activity Feed
        </h3>

        <div className="space-y-2 text-xs">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between gap-3"
            >
              <div>
                <strong className="text-slate-200 block">{act.title}</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">{act.desc}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                {act.time}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
