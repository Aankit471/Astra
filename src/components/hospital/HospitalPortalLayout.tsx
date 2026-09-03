import { useState, type ReactNode } from 'react'
import {
  ArrowRightLeft,
  BedDouble,
  Bell,
  Building2,
  CheckSquare,
  FileBarChart,
  Hospital as HospitalIcon,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  PhoneCall,
  Search,
  Settings,
  ShieldAlert,
  Siren,
  Stethoscope,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import { HOSPITALS } from '@/data/hospitals'

export type HospitalViewTab =
  | 'dashboard'
  | 'referrals'
  | 'patients'
  | 'admissions'
  | 'beds'
  | 'wards'
  | 'transfers'
  | 'clinical'
  | 'tasks'
  | 'escalations'
  | 'staff'
  | 'facility'
  | 'reports'
  | 'notifications'
  | 'settings'

interface HospitalPortalLayoutProps {
  user: AuthUser
  activeView: HospitalViewTab
  onSelectView: (view: HospitalViewTab) => void
  onLogout: () => void
  children: ReactNode
  globalSearchQuery: string
  onGlobalSearchChange: (q: string) => void
  selectedHospitalId: string
  onSelectHospitalId: (id: string) => void
}

export function HospitalPortalLayout({
  user,
  activeView,
  onSelectView,
  onLogout,
  children,
  globalSearchQuery,
  onGlobalSearchChange,
  selectedHospitalId,
  onSelectHospitalId,
}: HospitalPortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false)

  const currentHospital =
    HOSPITALS.find((h) => h.id === selectedHospitalId) || HOSPITALS[0]

  const navItems: Array<{ id: HospitalViewTab; label: string; icon: LucideIcon; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'referrals', label: 'Referrals', icon: Siren, badge: '3' },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'admissions', label: 'Admissions', icon: UserCheck, badge: '2' },
    { id: 'beds', label: 'Beds & Capacity', icon: BedDouble },
    { id: 'wards', label: 'Wards', icon: Layers },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'clinical', label: 'Clinical Coordination', icon: Stethoscope },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: '5' },
    { id: 'escalations', label: 'Escalations', icon: ShieldAlert, badge: '1' },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'facility', label: 'Facility', icon: Building2 },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const handleNavClick = (viewId: HospitalViewTab) => {
    onSelectView(viewId)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col antialiased">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="h-16 bg-[#0B111E] border-b border-slate-800/80 sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Hospital Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-sm text-white">ASTRA</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.2 rounded">
                  HOSPITAL OPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none hidden sm:block">
                Facility Operational Command
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
            <input
              type="text"
              placeholder="Search patients, wards, beds, admissions, doctors..."
              value={globalSearchQuery}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Right: Facility Selector, Status, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Facility indicator / selector */}
          <div className="relative hidden sm:flex items-center gap-2 bg-[#070b14] border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
            <HospitalIcon size={14} className="text-cyan-400" />
            <select
              value={selectedHospitalId}
              onChange={(e) => onSelectHospitalId(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer pr-2 text-xs"
            >
              {HOSPITALS.map((h) => (
                <option key={h.id} value={h.id} className="bg-slate-900 text-slate-100">
                  {h.name} ({h.id})
                </option>
              ))}
            </select>
          </div>

          {/* System Status indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>99.9% Operational</span>
          </div>

          {/* Notifications bell */}
          <button
            onClick={() => setShowNotificationsDrawer(!showNotificationsDrawer)}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white relative"
            title="Hospital Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
          </button>

          {/* User profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300">
              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold text-white block leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-400 block leading-tight">Operations Lead</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Body with Persistent Sidebar ─────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Left Sidebar */}
        <aside
          className={`w-64 bg-[#090E1A] border-r border-slate-800/80 flex flex-col justify-between shrink-0 transition-all z-30 ${
            mobileMenuOpen
              ? 'fixed inset-y-0 left-0 top-16 shadow-2xl z-50 flex'
              : 'hidden lg:flex'
          }`}
        >
          {/* Facility mini-badge */}
          <div className="p-3.5 border-b border-slate-800/60">
            <div className="p-2.5 rounded-xl bg-[#0F172A] border border-slate-800/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <HospitalIcon size={18} />
              </div>
              <div className="min-w-0">
                <strong className="text-xs font-bold text-white truncate block">
                  {currentHospital.name}
                </strong>
                <span className="text-[10px] text-emerald-400 font-semibold block">
                  Active Facility Command
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
                      ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom Sidebar: Logout & Emergency Phone */}
          <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#070b14]/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400 p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="flex items-center gap-1.5">
                <PhoneCall size={12} className="text-rose-400" />
                <span>Facility Hotline</span>
              </span>
              <strong className="text-slate-200 font-mono">
                {currentHospital.emergencyPhone || currentHospital.phone}
              </strong>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>

      {/* ── Slideover Notification Drawer ─────────────────────────────── */}
      {showNotificationsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs" role="presentation">
          <div className="w-full max-w-sm bg-[#0B111E] border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">Facility Operations Alerts</h3>
                </div>
                <button
                  onClick={() => setShowNotificationsDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                  <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                    Incoming Referral #REF-2026-001
                  </span>
                  <strong className="text-white block">Patient Rajesh Kumar (STEMI)</strong>
                  <p className="text-slate-400 text-[11px]">
                    108 ALS Ambulance ETA 8 mins. CICU Bed C-04 prepped.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                    Capacity Alert · Surgery Ward
                  </span>
                  <strong className="text-white block">Post-Operative Ward at 89% Capacity</strong>
                  <p className="text-slate-400 text-[11px]">
                    22 of 28 beds occupied. Consider step-down transfers.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                    Bed Sanitization Complete
                  </span>
                  <strong className="text-white block">Bed B-12 (Cardiology Step-Down)</strong>
                  <p className="text-slate-400 text-[11px]">
                    Sanitization verified by Housekeeping. Available for admission.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectView('notifications')
                setShowNotificationsDrawer(false)
              }}
              className="w-full btn-secondary text-xs py-2"
            >
              View All Facility Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
