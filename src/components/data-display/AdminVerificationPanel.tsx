import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, Search, ShieldCheck, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { getFreshnessLevel } from '@/utils/freshness'
import type { VerificationStatus } from '@/types/domain'

const statuses: VerificationStatus[] = ['VERIFIED', 'SELF_REPORTED', 'INFERRED', 'STALE']

type GroupTab = 'ALL' | 'PENDING_VERIFICATION' | 'SELF_REPORTED' | 'STALE' | 'RECENTLY_VERIFIED'

export function AdminVerificationPanel() {
  const hospitals = useAppStore((state) => state.hospitals)
  const updateCapability = useAppStore((state) => state.updateCapability)

  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<GroupTab>('ALL')
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'ALL'>('ALL')
  const [freshnessFilter, setFreshnessFilter] = useState('ALL')

  const [pending, setPending] = useState<{
    hospitalId: string
    capabilityId: string
    hospital: string
    capability: string
    current: VerificationStatus
    next: VerificationStatus
  } | null>(null)

  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const rows = useMemo(() => {
    return hospitals
      .flatMap((hospital) =>
        hospital.capabilities.capabilities.map((capability) => ({
          hospital,
          capability,
          freshness: getFreshnessLevel(capability.lastUpdated),
        }))
      )
      .filter((row) => {
        const needle = query.toLowerCase()
        const matchesSearch = !needle || `${row.hospital.name} ${row.capability.label}`.toLowerCase().includes(needle)

        let matchesTab = true
        if (activeTab === 'PENDING_VERIFICATION') matchesTab = row.capability.verificationStatus !== 'VERIFIED'
        else if (activeTab === 'SELF_REPORTED') matchesTab = row.capability.verificationStatus === 'SELF_REPORTED'
        else if (activeTab === 'STALE') matchesTab = row.capability.verificationStatus === 'STALE' || row.freshness === 'STALE'
        else if (activeTab === 'RECENTLY_VERIFIED') matchesTab = row.capability.verificationStatus === 'VERIFIED' && row.freshness === 'FRESH'

        const matchesStatus = statusFilter === 'ALL' || row.capability.verificationStatus === statusFilter
        const matchesFreshness = freshnessFilter === 'ALL' || row.freshness === freshnessFilter

        return matchesSearch && matchesTab && matchesStatus && matchesFreshness
      })
  }, [activeTab, freshnessFilter, hospitals, query, statusFilter])

  const openModal = (
    hospitalId: string,
    capabilityId: string,
    hospitalName: string,
    capabilityLabel: string,
    current: VerificationStatus,
    targetNext: VerificationStatus
  ) => {
    setReason('')
    setPending({
      hospitalId,
      capabilityId,
      hospital: hospitalName,
      capability: capabilityLabel,
      current,
      next: targetNext,
    })
  }

  useEffect(() => {
    if (!pending) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pending])

  const handleCancel = () => {
    // Cancel produces ZERO changes
    setPending(null)
    setReason('')
  }

  const handleConfirm = () => {
    if (!pending || reason.trim().length < 3 || isSubmitting) return

    setIsSubmitting(true)
    setTimeout(() => {
      const success = updateCapability(pending.hospitalId, pending.capabilityId, pending.next, reason.trim())
      setIsSubmitting(false)

      if (success) {
        setToastMessage(`Updated ${pending.capability} for ${pending.hospital} to ${pending.next}`)
        setTimeout(() => setToastMessage(null), 3000)
      }

      setPending(null)
      setReason('')
    }, 400)
  }

  return (
    <section className="verification-panel card p-6 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          ['ALL', 'All Capabilities'],
          ['PENDING_VERIFICATION', 'Pending Verification'],
          ['SELF_REPORTED', 'Self-Reported'],
          ['STALE', 'Stale / Outdated'],
          ['RECENTLY_VERIFIED', 'Verified & Fresh'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === key ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(key as GroupTab)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="verification-toolbar flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            className="pl-9 w-full"
            aria-label="Search capabilities"
            placeholder="Search hospital or capability..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <select
          aria-label="Filter verification status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as VerificationStatus | 'ALL')}
        >
          <option value="ALL">All Statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select
          aria-label="Filter freshness"
          value={freshnessFilter}
          onChange={(event) => setFreshnessFilter(event.target.value)}
        >
          <option value="ALL">All Freshness</option>
          <option value="FRESH">Fresh (&lt;24h)</option>
          <option value="AGING">Aging (24h-7d)</option>
          <option value="STALE">Stale (&gt;7d)</option>
        </select>

        {(query || statusFilter !== 'ALL' || freshnessFilter !== 'ALL' || activeTab !== 'ALL') && (
          <button
            className="btn-ghost text-xs"
            onClick={() => {
              setQuery('')
              setStatusFilter('ALL')
              setFreshnessFilter('ALL')
              setActiveTab('ALL')
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Verification Rows Table */}
      <div className="verification-table space-y-2">
        {rows.map(({ hospital, capability, freshness: level }) => (
          <div
            className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-all"
            key={`${hospital.id}-${capability.id}`}
          >
            <div>
              <strong className="text-white text-sm font-semibold block">{hospital.name}</strong>
              <span className="text-gray-300 text-xs mt-0.5 block">
                {capability.label} · <span className="text-gray-400">{capability.category}</span>
              </span>
              <small className="text-gray-500 text-[11px] block mt-1">
                Source: {capability.dataSource || 'Government Registry'} · Telemetry Date: {new Date(capability.lastUpdated).toLocaleDateString()}
              </small>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className={`verification ${capability.verificationStatus.toLowerCase()}`}>
                <ShieldCheck size={13} /> {capability.verificationStatus}
              </span>

              <span className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                level === 'FRESH' ? 'text-emerald-400 bg-emerald-500/10' : level === 'AGING' ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10'
              }`}>
                {level === 'STALE' && <AlertTriangle size={12} />}
                {level}
              </span>

              <div className="flex gap-1.5">
                {capability.verificationStatus !== 'VERIFIED' && (
                  <button
                    className="btn-primary text-xs py-1.5 px-3"
                    onClick={() => openModal(hospital.id, capability.id, hospital.name, capability.label, capability.verificationStatus, 'VERIFIED')}
                  >
                    Verify
                  </button>
                )}
                <button
                  className="btn-secondary text-xs py-1.5 px-3"
                  onClick={() => openModal(
                    hospital.id,
                    capability.id,
                    hospital.name,
                    capability.label,
                    capability.verificationStatus,
                    capability.verificationStatus === 'VERIFIED' ? 'STALE' : 'VERIFIED'
                  )}
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        ))}

        {!rows.length && (
          <div className="p-8 text-center text-gray-400 text-xs">
            No hospital capability records match the selected filter criteria.
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {pending && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirmation-modal card p-6 border border-cyan-500/40" role="dialog" aria-modal="true" aria-labelledby="verification-modal-title">
            <button className="modal-close" aria-label="Close verification dialog" onClick={handleCancel}>
              <X size={18} />
            </button>

            <h2 id="verification-modal-title" className="text-xl font-bold text-white mb-1">
              Confirm Capability Status Change
            </h2>
            <p className="text-xs text-gray-300 mb-4">
              {pending.hospital} · <span className="text-cyan-400">{pending.capability}</span>
            </p>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-black/40 border border-white/10 mb-4 text-xs">
              <div>
                <span className="text-gray-400 block">Current Verification Status</span>
                <strong className="text-amber-300 font-bold block mt-1">{pending.current}</strong>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">New Verification Status</span>
                <select
                  className="w-full text-xs py-1 px-2 rounded bg-gray-800 border border-gray-700 text-white font-bold"
                  value={pending.next}
                  onChange={(e) => setPending({ ...pending, next: e.target.value as VerificationStatus })}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Verification Reason & Audit Note <span className="text-rose-400">*</span>
              <textarea
                autoFocus
                rows={3}
                className="w-full mt-1.5"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Specify regulatory document reference, inspection date, or verification source..."
              />
            </label>

            {reason.trim().length > 0 && reason.trim().length < 3 && (
              <p className="text-rose-400 text-[11px] mb-3">Audit reason must be at least 3 characters long.</p>
            )}

            <div className="flex justify-end gap-3 mt-5 pt-3 border-t border-white/10">
              <button className="btn-secondary" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={reason.trim().length < 3 || isSubmitting}
                onClick={handleConfirm}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Updating Telemetry...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirm Status Change
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
