import { useState } from 'react'
import {
  CheckCircle2,
  CheckSquare,
  Clock3,
  Plus,
  X,
} from 'lucide-react'
import { MOCK_OPERATIONAL_TASKS, type HospitalTask } from '@/data/hospitalOperations'

export function HospitalTasksView() {
  const [tasks, setTasks] = useState<HospitalTask[]>(MOCK_OPERATIONAL_TASKS)
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New task modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<HospitalTask['category']>('BED_PREP')
  const [newWard, setNewWard] = useState('Emergency Resuscitation Bay')
  const [newAssignedTo, setNewAssignedTo] = useState('Orderly Team')
  const [newPriority, setNewPriority] = useState<HospitalTask['priority']>('HIGH')

  const handleStatusChange = (taskId: string, newStatus: HospitalTask['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    setToastMessage(`Task #${taskId} marked as ${newStatus}`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const created: HospitalTask = {
      id: `TSK-${Date.now().toString().slice(-3)}`,
      title: newTitle.trim(),
      category: newCategory,
      ward: newWard,
      assignedTo: newAssignedTo,
      priority: newPriority,
      status: 'PENDING',
      dueTime: '30 mins',
    }

    setTasks([created, ...tasks])
    setShowAddModal(false)
    setNewTitle('')
    setToastMessage('New operational task created successfully.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filteredTasks = tasks.filter((t) => {
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0B111E] to-cyan-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            WARD STAFF WORKFLOW
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Facility Operational Tasks & Checklists
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinate bed preparations, patient escorts, equipment calibration, and sanitization duties.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
          >
            <Plus size={14} />
            <span>Create Operational Task</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#070b14] border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="BED_PREP">Bed Preparation</option>
              <option value="PATIENT_TRANSPORT">Patient Transport</option>
              <option value="EQUIPMENT_CHECK">Equipment Check</option>
              <option value="SANITIZATION">Sanitization</option>
              <option value="CLINICAL_COORDINATION">Clinical Coordination</option>
            </select>
          </div>

          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-[#070b14] border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        <span className="text-slate-400">
          Showing {filteredTasks.length} tasks ({tasks.filter((t) => t.status !== 'COMPLETED').length} pending)
        </span>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              t.status === 'COMPLETED'
                ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                : t.priority === 'HIGH'
                ? 'bg-slate-900/90 border-amber-500/30 shadow-sm'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() =>
                  handleStatusChange(
                    t.id,
                    t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                  )
                }
                className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition ${
                  t.status === 'COMPLETED'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-700 text-transparent hover:text-slate-500'
                }`}
              >
                <CheckCircle2 size={16} />
              </button>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.2 rounded">
                    {t.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                      t.priority === 'HIGH'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : t.priority === 'MEDIUM'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {t.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    {t.category.replace('_', ' ')}
                  </span>
                </div>

                <h4
                  className={`text-sm font-semibold ${
                    t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-white'
                  }`}
                >
                  {t.title}
                </h4>

                <p className="text-[11px] text-slate-400">
                  Ward: <strong className="text-slate-300">{t.ward}</strong> · Assigned to: <strong className="text-slate-300">{t.assignedTo}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 text-xs">
              <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                <Clock3 size={12} /> {t.dueTime}
              </span>

              <select
                value={t.status}
                onChange={(e) => handleStatusChange(t.id, e.target.value as HospitalTask['status'])}
                className="bg-slate-950 border border-slate-700 rounded p-1 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="presentation">
          <div className="bg-[#0B111E] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare size={18} className="text-cyan-400" />
                Create Operational Task
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Task Description</label>
                <textarea
                  rows={2}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sanitize CICU Bed C-04 and attach ventilator circuit..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as HospitalTask['category'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="BED_PREP">Bed Preparation</option>
                    <option value="PATIENT_TRANSPORT">Patient Transport</option>
                    <option value="EQUIPMENT_CHECK">Equipment Check</option>
                    <option value="SANITIZATION">Sanitization</option>
                    <option value="CLINICAL_COORDINATION">Clinical Coordination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as HospitalTask['priority'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Target Ward</label>
                  <input
                    type="text"
                    value={newWard}
                    onChange={(e) => setNewWard(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Assigned To</label>
                  <input
                    type="text"
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary py-1.5 px-3">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1.5 px-4">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
