import { useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, RotateCcw, ShieldCheck, X } from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import { executeDemoReset } from '@/services/demoResetService'

interface AdminDemoResetModalProps {
  user: AuthUser
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AdminDemoResetModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: AdminDemoResetModalProps) {
  const [isResetting, setIsResetting] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  // Security guard: Never render or execute for non-admin
  if (user.role !== 'ADMIN') {
    return null
  }

  const handleConfirmReset = async () => {
    setIsResetting(true)
    setErrorMessage(null)
    setResultMessage(null)

    try {
      const res = await executeDemoReset(user)
      if (res.success) {
        setResultMessage(res.message)
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1400)
      } else {
        setErrorMessage(res.error || 'Failed to complete demo reset.')
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-[#0f172a] p-6 shadow-2xl shadow-amber-950/30 text-white space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <RotateCcw size={22} className={isResetting ? 'animate-spin' : ''} />
            </div>
            <div>
              <h2 id="reset-modal-title" className="text-lg font-bold text-white tracking-tight">
                Reset Demo Baseline
              </h2>
              <p className="text-xs text-amber-400/80 font-medium">
                Admin Governance Control · One-Click Hackathon Prime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isResetting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informational Warning */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3.5 space-y-2 text-xs text-amber-200/90 leading-relaxed">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle size={15} className="shrink-0 text-amber-400" />
            <span>Restores clean demo baseline for evaluators & presenters</span>
          </div>
          <p>
            This action will revert synthetic emergency cases, bed availability, blood inventory,
            and doctor assignment queues back to their default starting baseline (
            <strong>Acute STEMI Referral AST-1042</strong>).
          </p>
        </div>

        {/* Safety Guarantees */}
        <div className="space-y-2 text-xs text-slate-300">
          <div className="font-semibold text-slate-200 uppercase tracking-wider text-[10px]">
            Safety & Infrastructure Boundaries
          </div>
          <ul className="space-y-1.5 text-slate-400">
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>Database schemas, tables, and production config remain untouched.</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>Supabase users and authentication sessions are preserved.</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>An immutable <code className="text-amber-300">DEMO_STATE_RESET</code> audit entry will be recorded.</span>
            </li>
          </ul>
        </div>

        {/* Status Alerts */}
        {resultMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{resultMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium">
            <AlertTriangle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmReset}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isResetting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Restoring Baseline...</span>
              </>
            ) : (
              <>
                <RotateCcw size={14} />
                <span>Confirm Demo Reset</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
