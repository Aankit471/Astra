import { useState } from 'react'
import {
  Clock3,
  MapPin,
} from 'lucide-react'
import {
  MOCK_DOCTOR_SCHEDULE,
} from '@/data/doctorData'

export function DoctorScheduleView() {
  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK'>('DAY')
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday'>('Monday')

  const scheduleItems = MOCK_DOCTOR_SCHEDULE.filter((item) => {
    if (viewMode === 'DAY') return item.dayOfWeek === selectedDay
    return true
  })

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0a1424] to-teal-950/30 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            CLINICAL TIMETABLE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Doctor Clinical Shift & Operating Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cath Lab procedural slots, inpatient ward rounds, emergency consultations, and clinical reviews.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('DAY')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              viewMode === 'DAY'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('WEEK')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              viewMode === 'WEEK'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Week View
          </button>
        </div>
      </div>

      {/* ── Day Selector (if Day View) ────────────────────────────────── */}
      {viewMode === 'DAY' && (
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
          {(['Monday', 'Tuesday', 'Wednesday'] as const).map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl border font-semibold transition ${
                selectedDay === day
                  ? 'bg-slate-800 text-teal-300 border-teal-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {day} Schedule
            </button>
          ))}
        </div>
      )}

      {/* ── Schedule List ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {scheduleItems.map((item) => (
          <div
            key={item.id}
            className="card p-4 bg-slate-900/90 border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl hover:border-slate-700 transition"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                <Clock3 size={18} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-teal-300 font-bold text-xs">
                    {item.time}
                  </span>
                  <span className="text-[10px] text-slate-400">({item.duration})</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                      item.type === 'Procedure'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.type === 'Clinical Review'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.dayOfWeek}
                  </span>
                </div>

                <strong className="text-white text-sm font-semibold block">
                  {item.patientName}
                </strong>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <MapPin size={12} className="text-teal-400" />
                  <span>{item.location}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  item.status === 'Urgent'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
