import { useMemo } from 'react'
import {
  Activity,
  ArrowRight,
  BedDouble,
  Clock3,
  Layers,
  ShieldAlert,
  Siren,
} from 'lucide-react'
import {
  MOCK_WARDS,
  MOCK_HOSPITAL_PATIENTS,
  MOCK_ADMISSIONS_QUEUE,
  MOCK_TRANSFERS,
} from '@/data/hospitalOperations'
import { useAppStore } from '@/store/appStore'
import type { Hospital } from '@/types/domain'

interface HospitalDashboardProps {
  hospital: Hospital
  onNavigate: (view: string) => void
  onOpenReferralModal?: (refId: string) => void
}

export function HospitalDashboard({
  hospital,
  onNavigate,
  onOpenReferralModal,
}: HospitalDashboardProps) {
  const referrals = useAppStore((state) => state.referrals)

  // Incoming referrals for this facility
  const incomingReferrals = useMemo(() => {
    return referrals.filter(
      (r) => !['ARRIVED', 'COMPLETED', 'DECLINED'].includes(r.status)
    )
  }, [referrals])

  // Aggregate capacity metrics
  const totalBeds = 141
  const occupiedBeds = 94
  const availableBeds = 32
  const reservedBeds = 8
  const cleaningBeds = 5
  const outOfServiceBeds = 2
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100)

  // Urgent cases
  const urgentCases = [
    {
      patient: 'Harish Chandra (59M)',
      acuity: 'CRITICAL',
      referral: 'REF-2026-005',
      timeWaiting: '18 min elapsed',
      currentLocation: '108 ALS Ambulance #KA-04-1288 (ETA 12m)',
      requiredAction: 'Prep CICU Bed C-06 & Pacing Tray',
      tone: 'rose',
    },
    {
      patient: 'Vikramaditya Rao (42M)',
      acuity: 'CRITICAL',
      referral: 'REF-2026-003',
      timeWaiting: '45 min in ER',
      currentLocation: 'Emergency Resuscitation Bay 2',
      requiredAction: 'IV Thrombolysis in progress · CT Stroke repeat',
      tone: 'rose',
    },
    {
      patient: 'Kavita Chawla (29M)',
      acuity: 'EMERGENT',
      referral: 'DIRECT-ER-04',
      timeWaiting: '25 min awaiting bed',
      currentLocation: 'Emergency Stretcher T-04',
      requiredAction: 'Assign Post-Operative Surgery Ward Bed',
      tone: 'amber',
    },
  ]

  // Recent Operations Activity
  const recentOperations = [
    {
      id: 'OP-01',
      title: 'Bed Assigned',
      desc: 'CICU Bed C-04 assigned to patient Rajesh Kumar (STEMI)',
      time: '12m ago',
      type: 'BED',
    },
    {
      id: 'OP-02',
      title: 'Referral Accepted',
      desc: 'Accepted transfer for patient Harish Chandra from Govt District Hospital',
      time: '18m ago',
      type: 'REFERRAL',
    },
    {
      id: 'OP-03',
      title: 'Internal Transfer Completed',
      desc: 'Patient Meena Pillai moved from ER Bay to Cardiology Step-Down CSD-12',
      time: '35m ago',
      type: 'TRANSFER',
    },
    {
      id: 'OP-04',
      title: 'Task Completed',
      desc: 'BioMed calibration check on transport ventilator Unit #1 verified',
      time: '1h ago',
      type: 'TASK',
    },
    {
      id: 'OP-05',
      title: 'Emergency Admission',
      desc: 'Aarav Gupta admitted to Pediatrics Acute Ward Bed P-03',
      time: '1.5h ago',
      type: 'ADMISSION',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a1120] to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded">
                LIVE FACILITY TELEMETRY
              </span>
              <span className="text-xs text-slate-400">
                Shift: Morning (07:00 – 15:30)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Good morning, Hospital Operations Team
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              <strong className="text-cyan-300">{hospital.name}</strong> · Facility Operations Overview & Capacity Command
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => onNavigate('referrals')}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
            >
              <Siren size={14} />
              <span>Incoming Referrals ({incomingReferrals.length})</span>
            </button>
            <button
              onClick={() => onNavigate('beds')}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <BedDouble size={14} />
              <span>Bed Map & Tariffs</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 8 KPI CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Total Beds</span>
          <strong className="text-xl font-bold text-white block mt-1">{totalBeds}</strong>
          <span className="text-[10px] text-slate-500 block">All Wards</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-emerald-500/30 bg-emerald-950/10">
          <span className="text-[11px] text-emerald-400 block font-medium">Available Beds</span>
          <strong className="text-xl font-bold text-emerald-300 block mt-1">{availableBeds}</strong>
          <span className="text-[10px] text-emerald-400/80 block">Ready to assign</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Occupied Beds</span>
          <strong className="text-xl font-bold text-cyan-300 block mt-1">{occupiedBeds}</strong>
          <span className="text-[10px] text-slate-500 block">{occupancyRate}% rate</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Pending Admissions</span>
          <strong className="text-xl font-bold text-amber-400 block mt-1">
            {MOCK_ADMISSIONS_QUEUE.length}
          </strong>
          <span className="text-[10px] text-amber-300/80 block">Bed required</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Active Referrals</span>
          <strong className="text-xl font-bold text-white block mt-1">
            {incomingReferrals.length}
          </strong>
          <span className="text-[10px] text-cyan-400 block">Incoming transfers</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Patients Today</span>
          <strong className="text-xl font-bold text-white block mt-1">
            {MOCK_HOSPITAL_PATIENTS.length}
          </strong>
          <span className="text-[10px] text-slate-500 block">On Inpatient Census</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Transfers Active</span>
          <strong className="text-xl font-bold text-cyan-300 block mt-1">
            {MOCK_TRANSFERS.filter((t) => t.status === 'IN_TRANSIT').length}
          </strong>
          <span className="text-[10px] text-slate-500 block">Ambulance en route</span>
        </div>

        <div className="card p-3.5 bg-slate-900/80 border-rose-500/30 bg-rose-950/10">
          <span className="text-[11px] text-rose-400 block font-medium">Escalations</span>
          <strong className="text-xl font-bold text-rose-400 block mt-1">1</strong>
          <span className="text-[10px] text-rose-300 block">High attention</span>
        </div>
      </div>

      {/* ── CAPACITY OVERVIEW METER ─────────────────────────────────────── */}
      <section className="card p-5 space-y-3 bg-slate-900/90 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              Facility Capacity Overview & Bed Allocation Meter
            </h3>
            <p className="text-xs text-slate-400">
              Total Capacity: <strong>{totalBeds} Beds</strong> across 6 Clinical Units · Current Occupancy: <strong className="text-cyan-300">{occupancyRate}%</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Occupied ({occupiedBeds})
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available ({availableBeds})
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reserved ({reservedBeds})
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Cleaning ({cleaningBeds})
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Out of Service ({outOfServiceBeds})
            </span>
          </div>
        </div>

        {/* Visual Capacity Stacked Bar */}
        <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${(occupiedBeds / totalBeds) * 100}%` }}
            className="bg-cyan-500 h-full transition-all"
            title={`Occupied: ${occupiedBeds}`}
          />
          <div
            style={{ width: `${(availableBeds / totalBeds) * 100}%` }}
            className="bg-emerald-500 h-full transition-all"
            title={`Available: ${availableBeds}`}
          />
          <div
            style={{ width: `${(reservedBeds / totalBeds) * 100}%` }}
            className="bg-amber-500 h-full transition-all"
            title={`Reserved: ${reservedBeds}`}
          />
          <div
            style={{ width: `${(cleaningBeds / totalBeds) * 100}%` }}
            className="bg-blue-400 h-full transition-all"
            title={`Cleaning: ${cleaningBeds}`}
          />
          <div
            style={{ width: `${(outOfServiceBeds / totalBeds) * 100}%` }}
            className="bg-slate-600 h-full transition-all"
            title={`Out of Service: ${outOfServiceBeds}`}
          />
        </div>
      </section>

      {/* ── WARD OVERVIEW CARDS ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            Ward Operations Overview ({MOCK_WARDS.length} Units)
          </h3>
          <button
            onClick={() => onNavigate('wards')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>Manage All Wards</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {MOCK_WARDS.map((ward) => {
            const occ = Math.round((ward.occupiedBeds / ward.totalBeds) * 100)
            return (
              <div
                key={ward.id}
                className="card p-4 space-y-3 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{ward.name}</h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {ward.code} · {ward.floor}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ward.status === 'OPTIMAL'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : ward.status === 'NEAR_CAPACITY'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {ward.status === 'OPTIMAL'
                      ? 'Optimal'
                      : ward.status === 'NEAR_CAPACITY'
                      ? 'Near Capacity'
                      : 'Critical Capacity'}
                  </span>
                </div>

                {/* Mini occupancy bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Occupancy</span>
                    <strong className="text-white font-mono">{occ}%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        occ > 85 ? 'bg-rose-500' : occ > 70 ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${occ}%` }}
                    />
                  </div>
                </div>

                {/* Bed numbers grid */}
                <div className="grid grid-cols-4 gap-1 text-center text-xs pt-1">
                  <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Total</span>
                    <strong className="text-white font-bold">{ward.totalBeds}</strong>
                  </div>
                  <div className="p-1.5 rounded bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 block">Avail</span>
                    <strong className="text-emerald-300 font-bold">{ward.availableBeds}</strong>
                  </div>
                  <div className="p-1.5 rounded bg-cyan-950/20 border border-cyan-500/20">
                    <span className="text-[10px] text-cyan-400 block">Occup</span>
                    <strong className="text-cyan-300 font-bold">{ward.occupiedBeds}</strong>
                  </div>
                  <div className="p-1.5 rounded bg-amber-950/20 border border-amber-500/20">
                    <span className="text-[10px] text-amber-400 block">Reserv</span>
                    <strong className="text-amber-300 font-bold">{ward.reservedBeds}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                  <span>Charge: <strong className="text-slate-300">{ward.headNurse.split(',')[0]}</strong></span>
                  <span className="font-mono text-cyan-400">{ward.phoneExt}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── TWO COLUMN: INCOMING REFERRALS & URGENT CASES ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Incoming Referrals Quick Action Table */}
        <section className="card p-5 space-y-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Siren size={18} className="text-rose-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Incoming Facility Referrals ({incomingReferrals.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('referrals')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Full Referral Desk</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 text-[10px] uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Patient / ID</th>
                  <th className="py-2.5 px-3">Referring Source</th>
                  <th className="py-2.5 px-3">Acuity</th>
                  <th className="py-2.5 px-3">ETA</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {incomingReferrals.slice(0, 4).map((ref) => (
                  <tr key={ref.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3">
                      <strong className="text-white block font-medium">
                        {ref.patient?.referenceCode || `Patient #${ref.id.slice(-4)}`}
                      </strong>
                      <span className="text-[10px] text-cyan-300 font-mono">{ref.id}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span>Emergency Transfer</span>
                      <small className="text-slate-500 block text-[10px]">
                        {ref.patient?.emergencyCategory || 'Cardiology'}
                      </small>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {ref.patient?.urgencyLevel || 'IMMEDIATE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300 text-[11px]">
                      ~10-15m
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          if (onOpenReferralModal) onOpenReferralModal(ref.id)
                          else onNavigate('referrals')
                        }}
                        className="btn-secondary text-[11px] py-1 px-2.5"
                      >
                        Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Urgent Cases & Recent Operations */}
        <div className="space-y-6">
          {/* Urgent Cases Panel */}
          <section className="card p-5 space-y-3.5 bg-slate-900/90 border-rose-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Urgent Cases Requiring Action ({urgentCases.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-950/50 border border-rose-500/30 px-2 py-0.5 rounded">
                CRITICAL INTAKE
              </span>
            </div>

            <div className="space-y-2.5">
              {urgentCases.map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-bold">{c.patient}</strong>
                    <span className="text-[10px] font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {c.acuity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{c.currentLocation}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Clock3 size={11} /> {c.timeWaiting}
                    </span>
                    <strong className="text-cyan-300 font-medium">{c.requiredAction}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Operations Activity */}
          <section className="card p-5 space-y-3 bg-slate-900/90 border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              Recent Operations Activity Log
            </h3>

            <div className="space-y-2 text-xs">
              {recentOperations.map((op) => (
                <div
                  key={op.id}
                  className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-start justify-between gap-3"
                >
                  <div>
                    <strong className="text-slate-200 block">{op.title}</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">{op.desc}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {op.time}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
