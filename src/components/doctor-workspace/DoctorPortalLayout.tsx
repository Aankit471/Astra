import { useState, type ReactNode } from 'react'
import {
  Bell,
  Calendar,
  CheckSquare,
  FileText,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Radio,
  Search,
  Siren,
  Stethoscope,
  User,
  Users,
  WifiOff,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import { MOCK_DOCTOR_NOTIFICATIONS } from '@/data/doctorData'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export type DoctorViewTab =
  | 'dashboard'
  | 'patients'
  | 'referrals'
  | 'reviews'
  | 'tasks'
  | 'schedule'
  | 'messages'
  | 'notifications'
  | 'records'
  | 'profile'

interface DoctorPortalLayoutProps {
  user: AuthUser
  activeView: DoctorViewTab
  onSelectView: (view: DoctorViewTab) => void
  onLogout: () => void
  children: ReactNode
  onOpenGlobalSearch: () => void
}

export function DoctorPortalLayout({
  user,
  activeView,
  onSelectView,
  onLogout,
  children,
  onOpenGlobalSearch,
}: DoctorPortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false)

  const navItems: Array<{ id: DoctorViewTab; label: string; icon: LucideIcon; badge?: string; badgeColor?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'My Patients', icon: Users, badge: '4', badgeColor: 'bg-teal-500/20 text-teal-300' },
    { id: 'referrals', label: 'Referrals', icon: Siren, badge: '3', badgeColor: 'bg-rose-500/20 text-rose-300' },
    { id: 'reviews', label: 'Clinical Reviews', icon: Stethoscope, badge: '2', badgeColor: 'bg-amber-500/20 text-amber-300' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: '5', badgeColor: 'bg-blue-500/20 text-blue-300' },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: '1', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: '2', badgeColor: 'bg-rose-500/20 text-rose-300' },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  const handleNavClick = (viewId: DoctorViewTab) => {
    onSelectView(viewId)
    setMobileMenuOpen(false)
  }

  const doctorSpecialty = user.specialty || 'Interventional Cardiology'
  const doctorHospital = user.hospitalName || 'Apollo General Hospital'
  const doctorReg = user.doctorCode || 'KMC-84729'
  const isLive = isSupabaseConfigured()
  const rawStatus = (user.doctorStatus as string) || 'ON-CALL'
  const isOnCall = rawStatus === 'ON_CALL' || rawStatus === 'AVAILABLE' || rawStatus === 'ON-CALL'
  const onCallLabel = isOnCall ? 'ON-CALL' : 'OFF-DUTY'

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 flex flex-col antialiased">
      {/* ── Top Clinical Command Bar ──────────────────────────────────── */}
      <header className="h-16 bg-[#09101d] border-b border-slate-800/80 sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Branding & Mobile Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-teal-500/20">
              <HeartPulse size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-sm text-white">ASTRA</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/15 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded">
                  DOCTOR / CLINICAL
                </span>
                {isLive ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    <Radio size={10} className="animate-pulse text-emerald-400" />
                    LIVE TELEMETRY
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    <WifiOff size={10} />
                    MOCK FALLBACK
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-none hidden sm:block">
                Physician Decision Support · Reg: {doctorReg}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar Button */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenGlobalSearch}
            className="w-full bg-[#060b13] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400 flex items-center justify-between hover:border-slate-700 transition"
          >
            <span className="flex items-center gap-2">
              <Search size={14} className="text-slate-500" />
              <span>Search patients, records, reviews, tasks...</span>
            </span>
            <span className="text-[10px] font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">
              Ctrl + K
            </span>
          </button>
        </div>

        {/* Right: Facility, Status, Notifications & Doctor Profile */}
        <div className="flex items-center gap-3">
          {/* Facility indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-[#060b13] border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Hospital size={14} className="text-teal-400" />
            <span className="text-slate-300 font-medium">{doctorHospital}</span>
            <span className="text-[10px] text-teal-400 font-mono font-semibold">{doctorSpecialty}</span>
          </div>

          {/* On-call status */}
          <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            !isOnCall
              ? 'bg-slate-800 border-slate-700 text-slate-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${!isOnCall ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{onCallLabel}</span>
          </div>

          {/* Notifications button */}
          <button
            onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white relative"
            title="Clinical Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-400" />
          </button>

          {/* Doctor Profile chip */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-xs font-bold text-teal-300">
              {user.avatarInitials || 'DR'}
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold text-white block leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                {doctorSpecialty} · {doctorReg}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Realtime fallback warning if disconnected or mock */}
      {!isLive && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-1 text-center text-xs text-amber-300 font-medium">
          Realtime connection unavailable — displaying last synchronized data.
        </div>
      )}

      {/* ── Main Body with Persistent Sidebar ─────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Left Sidebar */}
        <aside
          className={`w-64 bg-[#080e1a] border-r border-slate-800/80 flex flex-col justify-between shrink-0 transition-all z-30 ${
            mobileMenuOpen
              ? 'fixed inset-y-0 left-0 top-16 shadow-2xl z-50 flex'
              : 'hidden lg:flex'
          }`}
        >
          {/* Active Doctor Persona Badge */}
          <div className="p-3.5 border-b border-slate-800/60">
            <div className="p-2.5 rounded-xl bg-[#0d1627] border border-slate-800/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
                <Stethoscope size={18} />
              </div>
              <div className="min-w-0">
                <strong className="text-xs font-bold text-white truncate block">
                  {user.name}
                </strong>
                <span className="text-[10px] text-teal-400 font-semibold block">
                  {doctorSpecialty} · {onCallLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border border-teal-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-teal-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom Sidebar: Logout */}
          <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#060b13]/60">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
            >
              <LogOut size={14} />
              <span>Sign Out Workstation</span>
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>

      {/* ── Notifications Slideover Drawer ────────────────────────────── */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs" role="presentation">
          <div className="w-full max-w-sm bg-[#09101d] border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-teal-400" />
                  <h3 className="font-bold text-sm text-white">Clinical Alerts</h3>
                </div>
                <button
                  onClick={() => setShowNotificationDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {MOCK_DOCTOR_NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border space-y-1 ${
                      n.priority === 'CRITICAL'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        : n.priority === 'HIGH'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider block">
                      {n.title}
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{n.description}</p>
                    <span className="text-[10px] text-slate-500 block font-mono">{n.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                onSelectView('notifications')
                setShowNotificationDrawer(false)
              }}
              className="w-full btn-secondary text-xs py-2"
            >
              Open Notification Center
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
