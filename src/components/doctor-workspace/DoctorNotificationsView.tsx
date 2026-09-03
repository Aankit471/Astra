import { useState, useMemo } from 'react'
import {
  Bell,
  CheckCheck,
  Clock3,
  ShieldAlert,
} from 'lucide-react'
import {
  MOCK_DOCTOR_NOTIFICATIONS,
  type DoctorNotificationItem,
} from '@/data/doctorData'

export function DoctorNotificationsView() {
  const [notifications, setNotifications] = useState<DoctorNotificationItem[]>(
    MOCK_DOCTOR_NOTIFICATIONS
  )
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setToastMessage('All clinical notifications marked as read.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (typeFilter !== 'ALL' && n.type !== typeFilter) return false
      return true
    })
  }, [notifications, typeFilter])

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            CLINICAL TELEMETRY ALERTS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Doctor Notification & Telemetry Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Emergency STEMI arrivals, SLA expiration alerts, clinical task completions, and urgent team dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleMarkAllAsRead}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <CheckCheck size={14} />
            <span>Mark All as Read</span>
          </button>
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'URGENT_PATIENT', label: 'Urgent Patients' },
          { id: 'DEADLINE', label: 'SLA Deadlines' },
          { id: 'NEW_REFERRAL', label: 'Referrals' },
          { id: 'TASK_OVERDUE', label: 'Task Warnings' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTypeFilter(item.id)}
            className={`px-3 py-1.5 rounded-xl border font-semibold whitespace-nowrap transition ${
              typeFilter === item.id
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Notifications List ────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredNotifications.map((n) => (
          <div
            key={n.id}
            className={`card p-4 rounded-xl border flex items-start justify-between gap-4 transition shadow-xl ${
              n.priority === 'CRITICAL'
                ? 'bg-rose-950/15 border-rose-500/30'
                : n.priority === 'HIGH'
                ? 'bg-amber-950/15 border-amber-500/30'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  n.priority === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400'
                    : n.priority === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-teal-500/20 text-teal-400'
                }`}
              >
                {n.priority === 'CRITICAL' ? (
                  <ShieldAlert size={18} />
                ) : n.priority === 'HIGH' ? (
                  <Clock3 size={18} />
                ) : (
                  <Bell size={18} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <strong className="text-white text-sm font-bold">{n.title}</strong>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      n.priority === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300'
                        : n.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-teal-500/20 text-teal-300'
                    }`}
                  >
                    {n.priority}
                  </span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                  )}
                </div>

                <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
                  {n.description}
                </p>

                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  {n.timestamp}
                </span>
              </div>
            </div>

            {!n.read && (
              <button
                onClick={() => handleMarkAsRead(n.id)}
                className="btn-secondary text-[11px] py-1 px-2.5 shrink-0"
              >
                Mark Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
