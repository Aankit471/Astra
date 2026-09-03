import { useState } from 'react'
import { Bell, Save } from 'lucide-react'

export function UserSettings() {
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(true)
  const [criticalSound, setCriticalSound] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="card p-6 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
          <Bell size={22} className="text-cyan-400" /> Emergency Alert & Notification Preferences
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/5 border border-white/5">
            <div>
              <strong className="text-white text-sm block font-medium">Critical Emergency SMS Alerts</strong>
              <p className="text-xs text-gray-400">Receive zero-cellular offline SMS relays for immediate referral updates.</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/5 border border-white/5">
            <div>
              <strong className="text-white text-sm block font-medium">Browser Push Notifications</strong>
              <p className="text-xs text-gray-400">Real-time alerts for incoming referral requests and status changes.</p>
            </div>
            <input
              type="checkbox"
              checked={pushAlerts}
              onChange={(e) => setPushAlerts(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/5 border border-white/5">
            <div>
              <strong className="text-white text-sm block font-medium">Audible Critical Alert Tones</strong>
              <p className="text-xs text-gray-400">High-priority sound alerts when referrals require emergency triage.</p>
            </div>
            <input
              type="checkbox"
              checked={criticalSound}
              onChange={(e) => setCriticalSound(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/5 border border-white/5">
            <div>
              <strong className="text-white text-sm block font-medium">Auto-Refresh Telemetry Feed</strong>
              <p className="text-xs text-gray-400">Automatically sync hospital capability data every 30 seconds.</p>
            </div>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-cyan-400"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          {saved && <span className="text-emerald-400 text-xs font-semibold">✓ Settings saved successfully</span>}
          <button className="btn-primary ml-auto" onClick={handleSave}>
            <Save size={16} /> Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}
