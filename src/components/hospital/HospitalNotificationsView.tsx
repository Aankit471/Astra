import { useState } from 'react'
import {
  Bell,
  Clock3,
  Trash2,
} from 'lucide-react'

export function HospitalNotificationsView() {
  const [notifications, setNotifications] = useState([
    {
      id: 'NOTIF-01',
      title: 'Immediate Referral Dispatched: Rajesh Kumar (STEMI)',
      desc: '108 ALS Ambulance dispatched towards Metro Central Bay. ETA: 8 minutes. CICU Bed C-04 prepped.',
      type: 'REFERRAL',
      priority: 'CRITICAL',
      time: '12m ago',
      read: false,
    },
    {
      id: 'NOTIF-02',
      title: 'Surgery Ward Approaching Capacity Threshold (89%)',
      desc: '22 of 28 beds occupied in Post-Operative Surgery Ward. Review step-down transfers.',
      type: 'CAPACITY',
      priority: 'WARNING',
      time: '28m ago',
      read: false,
    },
    {
      id: 'NOTIF-03',
      title: 'Bed Sanitization Verified: Bed B-12 (Cardiology Step-Down)',
      desc: 'Sanitization checklist completed by Housekeeping. Available for immediate patient allocation.',
      type: 'TASK',
      priority: 'INFO',
      time: '45m ago',
      read: true,
    },
    {
      id: 'NOTIF-04',
      title: 'Doctor Shift Handover Complete: Dr. Ananya Mehta (Cardiology Lead)',
      desc: 'Morning roster active. Dr. Suresh Menon on-call for Trauma Surgery.',
      type: 'STAFF',
      priority: 'INFO',
      time: '1.2h ago',
      read: true,
    },
    {
      id: 'NOTIF-05',
      title: 'Internal Patient Transfer Completed',
      desc: 'Patient Meena Pillai transferred from Emergency Bay to Cardiology Step-Down Ward (CSD-12).',
      type: 'TRANSFER',
      priority: 'INFO',
      time: '2h ago',
      read: true,
    },
  ])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            OPERATIONAL BROADCASTS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Facility Notifications & Live Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ambulance dispatch alerts, capacity threshold warnings, bed turnarounds, and duty notifications.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={markAllRead}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Mark All Read
          </button>
          <button
            onClick={clearAll}
            className="text-xs font-bold py-1.5 px-3 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition flex items-center gap-1"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="card p-10 text-center text-slate-500 text-xs">
            No active notifications. Facility operations nominal.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                !n.read
                  ? 'bg-slate-900/95 border-cyan-500/30 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800 opacity-75'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    n.priority === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400'
                      : n.priority === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  <Bell size={16} />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-semibold text-sm">{n.title}</strong>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                  <p className="text-slate-300 text-xs">{n.desc}</p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                    <span className="font-mono text-cyan-400">{n.type}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock3 size={11} /> {n.time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="self-end sm:self-auto shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    n.priority === 'CRITICAL'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : n.priority === 'WARNING'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {n.priority}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
