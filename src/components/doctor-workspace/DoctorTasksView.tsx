import { useState } from 'react'
import {
  CheckCircle2,
  CheckSquare,
} from 'lucide-react'
import {
  MOCK_DOCTOR_TASKS,
  type DoctorTask,
} from '@/data/doctorData'

interface DoctorTasksViewProps {
  onNavigateToPatient?: (patientId: string) => void
  onNavigateToReferral?: (referralId: string) => void
}

export function DoctorTasksView({
  onNavigateToPatient,
  onNavigateToReferral,
}: DoctorTasksViewProps) {
  const [tasks, setTasks] = useState<DoctorTask[]>(MOCK_DOCTOR_TASKS)
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleUpdateStatus = (
    taskId: string,
    newStatus: DoctorTask['status']
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    setToastMessage(`Task #${taskId} updated to ${newStatus}.`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleMarkComplete = (taskId: string) => {
    handleUpdateStatus(taskId, 'Completed')
  }

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            PHYSICIAN CLINICAL ORDERS & TASKS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Doctor Assigned Tasks & Clinical Actions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnostic report verifications, referral follow-ups, discharge sign-offs, and critical order completions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Active Tasks:</span>
          <strong className="text-teal-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            {tasks.filter((t) => t.status !== 'Completed').length} Pending
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

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Filter by Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-[#060b13] border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:ring-1 focus:ring-teal-400"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-[#060b13] border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:ring-1 focus:ring-teal-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* ── Tasks Table ───────────────────────────────────────────────── */}
      <div className="card overflow-hidden border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060b13] text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Task Description</th>
                <th className="py-3 px-3.5">Patient / Referral</th>
                <th className="py-3 px-3.5">Priority</th>
                <th className="py-3 px-3.5">Assigned Date</th>
                <th className="py-3 px-3.5">Due Date</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3.5 font-medium text-white max-w-sm">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={14} className="text-teal-400 shrink-0" />
                      <span>{t.task}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    {t.patientName ? (
                      <button
                        onClick={() => onNavigateToPatient && t.patientId && onNavigateToPatient(t.patientId)}
                        className="text-teal-300 hover:underline font-medium block"
                      >
                        {t.patientName} ({t.patientId})
                      </button>
                    ) : t.referralId ? (
                      <button
                        onClick={() => onNavigateToReferral && t.referralId && onNavigateToReferral(t.referralId)}
                        className="text-cyan-300 font-mono hover:underline block"
                      >
                        {t.referralId}
                      </button>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.priority === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">
                    {t.assignedDate}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300 font-mono text-[11px]">
                    {t.dueDate}
                  </td>
                  <td className="py-3 px-3.5">
                    <select
                      value={t.status}
                      onChange={(e) =>
                        handleUpdateStatus(t.id, e.target.value as DoctorTask['status'])
                      }
                      className="bg-slate-950 border border-slate-700 rounded p-1 text-slate-200 text-xs focus:ring-1 focus:ring-teal-400 cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    {t.status !== 'Completed' ? (
                      <button
                        onClick={() => handleMarkComplete(t.id)}
                        className="btn-primary text-[11px] py-1 px-2.5 shadow-sm"
                      >
                        Mark Complete
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
