import {
  Activity,
  ArrowUpRight,
  Download,
} from 'lucide-react'

export function HospitalReportsView() {
  const handleExport = () => {
    alert('Hospital Operations Performance Report exported to CSV / PDF.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            OPERATIONAL ANALYTICS & AUDIT
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Hospital Performance & Capacity Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational turnaround benchmarks, daily bed occupancy velocity, and referral conversion rates.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-lg shadow-cyan-500/10 self-start md:self-auto"
        >
          <Download size={14} />
          <span>Export Analytics Packet</span>
        </button>
      </div>

      {/* 4 Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 space-y-1.5 bg-slate-900/90 border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block">Average Bed Occupancy Rate</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-cyan-300">76.4%</strong>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight size={14} /> +3.2%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">7-day moving average</span>
        </div>

        <div className="card p-4 space-y-1.5 bg-slate-900/90 border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block">Intake Turnaround Time</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-emerald-400">11.8 min</strong>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight size={14} /> -2.4 min
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">Referral to Bed Allocation</span>
        </div>

        <div className="card p-4 space-y-1.5 bg-slate-900/90 border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block">Referral Acceptance Rate</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-white">94.2%</strong>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight size={14} /> +1.1%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">Network Intake Compliance</span>
        </div>

        <div className="card p-4 space-y-1.5 bg-slate-900/90 border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block">Avg Bed Sanitization Speed</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-cyan-300">18 min</strong>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight size={14} /> On Target
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">Discharge to Ready-to-Assign</span>
        </div>
      </div>

      {/* Ward Occupancy Breakdown Table */}
      <div className="card p-5 space-y-4 bg-slate-900/90 border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} className="text-cyan-400" />
          Ward Performance & Utilization Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070b14] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Clinical Ward</th>
                <th className="py-2.5 px-3">Total Capacity</th>
                <th className="py-2.5 px-3">Current Census</th>
                <th className="py-2.5 px-3">Occupancy</th>
                <th className="py-2.5 px-3">Admissions (24h)</th>
                <th className="py-2.5 px-3">Discharges (24h)</th>
                <th className="py-2.5 px-3">Target Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-white/[0.02]">
                <td className="py-2.5 px-3 font-semibold text-white">Emergency Resuscitation Bay</td>
                <td className="py-2.5 px-3">16 beds</td>
                <td className="py-2.5 px-3">10 occupied</td>
                <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">62%</td>
                <td className="py-2.5 px-3">14</td>
                <td className="py-2.5 px-3">12</td>
                <td className="py-2.5 px-3 text-emerald-400">Optimal</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-2.5 px-3 font-semibold text-white">Intensive Coronary & Cardiac ICU</td>
                <td className="py-2.5 px-3">24 beds</td>
                <td className="py-2.5 px-3">16 occupied</td>
                <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">67%</td>
                <td className="py-2.5 px-3">6</td>
                <td className="py-2.5 px-3">4</td>
                <td className="py-2.5 px-3 text-emerald-400">Optimal</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-2.5 px-3 font-semibold text-white">Post-Operative Surgery Ward</td>
                <td className="py-2.5 px-3">28 beds</td>
                <td className="py-2.5 px-3">22 occupied</td>
                <td className="py-2.5 px-3 font-mono font-bold text-amber-400">79%</td>
                <td className="py-2.5 px-3">8</td>
                <td className="py-2.5 px-3">5</td>
                <td className="py-2.5 px-3 text-amber-400">Near Limit</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-2.5 px-3 font-semibold text-white">General Medicine Ward</td>
                <td className="py-2.5 px-3">35 beds</td>
                <td className="py-2.5 px-3">24 occupied</td>
                <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">69%</td>
                <td className="py-2.5 px-3">11</td>
                <td className="py-2.5 px-3">9</td>
                <td className="py-2.5 px-3 text-emerald-400">Optimal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
