import { useEffect, useState, useCallback } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Droplet,
  Hospital,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Search,
  ShieldCheck,
  Siren,
  Stethoscope,
  WifiOff,
  type LucideIcon
} from 'lucide-react'
import { DEMO_CREDENTIALS } from '@/data/users'
import { useAppStore, users } from '@/store/appStore'
import type { AuthUser } from '@/types/auth'
import { ROLE_HOME_PATHS } from '@/types/auth'
import { useLocation, useNavigate } from 'react-router-dom'
import { ReferralDetail } from '@/components/data-display/ReferralDetail'
import { AdminVerificationPanel } from '@/components/data-display/AdminVerificationPanel'
import { referralStatusConfig } from '@/utils/referralStatus'
import { renderRouteView } from '@/routes/AppRoutes'
import { DoctorCommandCenter } from '@/components/doctor/DoctorCommandCenter'
import { DoctorPatientQueue } from '@/components/doctor/DoctorPatientQueue'
import { BloodAvailabilityView } from '@/components/doctor/BloodAvailabilityView'
import { DoctorReferralReview } from '@/components/doctor/DoctorReferralReview'
import { AdminHospitalManager } from '@/components/admin/AdminHospitalManager'
import { HospitalPortalContainer } from '@/components/hospital/HospitalPortalContainer'
import { DoctorPortalContainer } from '@/components/doctor-workspace/DoctorPortalContainer'
import { useSupabaseRealtime } from '@/services/supabase/useSupabaseRealtime'
import { auditRepository } from '@/services/repositories/auditRepository'

export default function App() {
  const user = useAppStore((state) => state.user)
  const setUser = useAppStore((state) => state.setUser)
  const navigate = useNavigate()
  const location = useLocation()

  const login = (nextUser: AuthUser) => {
    setUser(nextUser)
    navigate(ROLE_HOME_PATHS[nextUser.role])
  }

  const logout = () => {
    setUser(null)
    navigate('/login')
  }

  const requestedRole = getRoleFromPath(location.pathname)

  const setOffline = useAppStore((state) => state.setOffline)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [setOffline])

  // Frontend RBAC provides client routing boundaries. Production authorization must be enforced server-side.
  useEffect(() => {
    if (!user && requestedRole) navigate('/login', { replace: true })
    if (user && requestedRole && requestedRole !== user.role) navigate('/unauthorized', { replace: true })
  }, [navigate, requestedRole, user])

  if (!user) return <Login onLogin={login} />
  if (location.pathname === '/unauthorized') return <Unauthorized user={user} onReturn={() => navigate(ROLE_HOME_PATHS[user.role])} />
  if (requestedRole && requestedRole !== user.role) return null

  return <Portal user={user} onLogout={logout} />
}

function Unauthorized({ user, onReturn }: { user: AuthUser; onReturn: () => void }) {
  return (
    <main className="app-error" role="alert">
      <div className="brand-mark">A</div>
      <p className="eyebrow">ACCESS CONTROL</p>
      <h1>Portal access restricted</h1>
      <p className="muted">This role cannot access that portal path. RBAC enforces navigation boundaries.</p>
      <button className="btn-primary" onClick={onReturn}>
        Return to {user.role === 'HOSPITAL_OPS' ? 'Hospital Operations' : user.role.toLowerCase()} dashboard
      </button>
    </main>
  )
}

function getRoleFromPath(pathname: string): AuthUser['role'] | null {
  const segment = pathname.split('/').filter(Boolean)[0]
  if (segment === 'hospital') return 'HOSPITAL_OPS'
  if (segment === 'doctor') return 'DOCTOR'
  if (segment === 'admin') return 'ADMIN'
  return null
}

function Login({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [selected, setSelected] = useState(0)
  const credential = DEMO_CREDENTIALS[selected] || DEMO_CREDENTIALS[0]

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="brand-mark mb-4">A</div>
        <p className="eyebrow">Emergency Referral Coordination Platform</p>
        <h1>Move from fragmented data to coordinated clinical action.</h1>
        <p className="hero-copy">
          Simulate. Match. Coordinate. ASTRA connects emergency teams, verified hospital capabilities, and automated decision-support pipelines in real time.
        </p>

        <div className="hero-stats">
          <div className="hero-stat-card">
            <strong>98.4%</strong>
            <span>Capability Match Rate</span>
          </div>
          <div className="hero-stat-card">
            <strong>4.2 min</strong>
            <span>Avg Response Time</span>
          </div>
          <div className="hero-stat-card">
            <strong>100%</strong>
            <span>Audited Decisions</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div>
          <div className="wordmark">ASTRA <span>ENTERPRISE</span></div>
          <h2 className="text-2xl font-bold mt-2">Enter Command Center</h2>
          <p className="muted">Select a persona role to explore the coordinated referral workflow.</p>
        </div>

        <div className="role-grid">
          {DEMO_CREDENTIALS.map((item, index) => (
            <button
              key={item.email}
              className={`role-option ${selected === index ? 'selected' : ''}`}
              onClick={() => setSelected(index)}
            >
              <span className="role-icon">
                {item.role === 'HOSPITAL_OPS' ? <Hospital size={20} /> : item.role === 'DOCTOR' ? <Stethoscope size={20} /> : <ShieldCheck size={20} />}
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.email}</small>
              </span>
              <ChevronRight size={18} className={selected === index ? 'text-cyan-400' : 'text-gray-500'} />
            </button>
          ))}
        </div>

        <button
          className="btn-primary wide text-base py-3"
          onClick={() => onLogin(users.find((item) => item.email === credential.email) as AuthUser)}
        >
          <span>Open {credential.label} Portal</span>
          <ArrowRight size={18} />
        </button>

        <p className="demo-note">ASTRA Emergency Operations · Demo Environment</p>
      </section>
    </main>
  )
}

function Portal({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  useSupabaseRealtime()
  const location = useLocation()
  const navigate = useNavigate()
  const defaultView = 'dashboard'
  const pathView = location.pathname.split('/').filter(Boolean).pop()
  const referralPathId = location.pathname.match(/\/referrals?\/([^/]+)/)?.[1]
  const [view, setView] = useState(referralPathId ? `detail:${referralPathId}` : pathView && pathView !== user.role.toLowerCase() ? pathView : defaultView)
  const [mobileNav, setMobileNav] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const offline = useAppStore((state) => state.isOffline)
  const referrals = useAppStore((state) => state.referrals)
  const hospitals = useAppStore((state) => state.hospitals)
  const notifications = useAppStore((state) => state.notifications).filter(
    (item) => (!item.recipientRole || item.recipientRole === user.role) && (!item.recipientId || item.recipientId === user.id)
  ).slice(0, 8)

  const markNotificationRead = useAppStore((state) => state.markNotificationRead)
  const toggleOffline = useAppStore((state) => state.toggleOffline)

  const nav: Array<[string, string, LucideIcon]> =
    user.role === 'DOCTOR'
      ? [
          ['dashboard', 'Command Center', Activity],
          ['referrals', 'Patient Queue', Stethoscope],
          ['blood', 'Blood Availability', Droplet],
          ['history', 'Referral History', ClipboardList],
        ]
      : user.role === 'HOSPITAL_OPS'
      ? [
          ['dashboard', 'Ops Overview', Activity],
          ['referrals', 'Incoming Referrals', Network],
          ['history', 'Referral History', ClipboardList],
        ]
      : [
          ['dashboard', 'Admin Command Center', LayoutDashboard],
          ['hospitals', 'Hospital Network & Editor', Hospital],
          ['referrals', 'Active Referrals', Activity],
          ['escalations', 'Escalation Queue', Siren],
          ['verification', 'Capability Verification', ShieldCheck],
          ['audit', 'Audit Logs', ClipboardList],
        ]

  useEffect(() => {
    const nextView = referralPathId ? `detail:${referralPathId}` : pathView
    if (nextView && nextView !== view) setView(nextView)
  }, [pathView, referralPathId, view])

  const rolePrefix = user.role === 'HOSPITAL_OPS' ? '/hospital' : `/${user.role.toLowerCase()}`

  const goTo = (id: string) => {
    setView(id)
    setMobileNav(false)
    if (id.startsWith('detail:')) {
      navigate(`${rolePrefix}/referrals/${id.slice(7)}`)
    } else {
      navigate(`${rolePrefix}/${id === 'dashboard' ? 'dashboard' : id}`)
    }
  }

  const detailId = view.startsWith('detail:') ? view.slice(7) : null
  const detail = detailId ? referrals.find((item) => item.id === detailId) : undefined

  // Page header titles
  const headerTitles: Record<AuthUser['role'], { label: string; sub: string }> = {
    HOSPITAL_OPS: { label: 'Hospital Operations Portal', sub: user.hospitalName || 'Apollo General Hospital — Operations' },
    DOCTOR: {
      label: 'Clinical Command Center',
      sub: user.hospitalName
        ? `${user.hospitalName} — ${user.department || user.specialty || 'Clinical Department'}`
        : 'Emergency Clinical Desk',
    },
    ADMIN: { label: 'Platform Governance & Network', sub: 'ASTRA Coordination & Audit Network' },
  }

  if (user.role === 'HOSPITAL_OPS') {
    return <HospitalPortalContainer user={user} onLogout={onLogout} />
  }

  if (user.role === 'DOCTOR') {
    return <DoctorPortalContainer user={user} onLogout={onLogout} />
  }

  return (
    <div className="app-shell">
      {offline && (
        <div className="offline-strip">
          <WifiOff size={15} /> OFFLINE MODE · Telemetry cached as of {new Date().toLocaleTimeString()} · Verify before taking clinical action.
        </div>
      )}

      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark small">A</div>
          <div>
            <strong>ASTRA</strong>
            <small>COMMAND CENTER</small>
          </div>
        </div>

        <div className="sidebar-context">
          <span className="live-dot" /> LIVE NETWORK ACTIVE
        </div>

        <nav>
          {nav.map(([id, label, Icon]) => (
            <button key={id} className={view === id ? 'active' : ''} onClick={() => goTo(id)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="offline-toggle" onClick={toggleOffline}>
            <WifiOff size={16} /> {offline ? 'Reconnect Network' : 'Simulate Offline'}
          </button>
          <button className="logout" onClick={onLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation">
            <Menu size={22} />
          </button>
          <div>
            <span className="topbar-label">{headerTitles[user.role].label}</span>
            <span className="topbar-sub">{headerTitles[user.role].sub}</span>
          </div>

          <div className="topbar-user">
            <button className="notification-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Open notifications">
              <Bell size={18} />
              {notifications.some((item) => !item.isRead) && <b>{notifications.filter((item) => !item.isRead).length}</b>}
            </button>
            <div className="avatar">{user.avatarInitials}</div>
            <div className="flex flex-col">
              <span className="font-semibold text-white leading-none">{user.name}</span>
              <span className="text-[11px] text-gray-400 capitalize">{user.role.toLowerCase().replace('_', ' ')}</span>
            </div>
          </div>

          {showNotifications && (
            <div className="notification-panel" aria-live="polite">
              <div className="notification-panel-head">
                <strong>Notifications</strong>
                <small className="text-cyan-400">{notifications.filter((item) => !item.isRead).length} unread</small>
              </div>
              {notifications.length ? (
                notifications.map((item) => (
                  <button key={item.id} className={`notification-item ${item.isRead ? 'read' : ''}`} onClick={() => markNotificationRead(item.id)}>
                    <span className={`notification-severity ${item.severity.toLowerCase()}`} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </span>
                  </button>
                ))
              ) : (
                <p className="muted p-4">No active notifications for this portal.</p>
              )}
            </div>
          )}
        </header>

        <main className="content">
          {detail ? (
            (user.role as string) === 'DOCTOR' ? (
              <DoctorReferralReview
                referral={detail}
                user={user}
                hospitals={hospitals}
                onBack={() => goTo('referrals')}
              />
            ) : (
              <>
                <PageTitle title="Referral Detail & Map View" subtitle="Real-time operational & clinical lifecycle tracking." />
                <ReferralDetail referral={detail} hospitals={hospitals} admin={user.role === 'ADMIN'} />
              </>
            )
          ) : (
            <Dashboard view={view} role={user.role} user={user} goTo={goTo} />
          )}
        </main>
      </div>
    </div>
  )
}

function Dashboard({
  view,
  role,
  user,
  goTo,
}: {
  view: string
  role: AuthUser['role']
  user: AuthUser
  goTo: (id: string) => void
}) {
  const referrals = useAppStore((state) => state.referrals)
  const visible =
    role === 'ADMIN'
      ? referrals
      : referrals.filter((item) => item.sentToFacilityId === user.hospitalId)

  // Render route views from AppRoutes if matched
  const routeView = renderRouteView({ view, role, user })
  if (routeView) return routeView

  if (view === 'history') {
    return (
      <>
        <PageTitle title="Referral History" subtitle="Comprehensive record of emergency referral events." />
        <ReferralTable referrals={visible} />
      </>
    )
  }

  if (role === 'HOSPITAL_OPS') {
    if (view === 'dashboard') return <OpsDashboard referrals={visible} />
    if (view === 'referrals') return <IncomingReferralsView referrals={visible} />
  }

  if (role === 'DOCTOR') {
    if (view === 'dashboard') {
      return (
        <DoctorCommandCenter
          user={user}
          onOpenReferral={(id) => goTo(`detail:${id}`)}
          onViewBlood={() => goTo('blood')}
          onOpenQueue={() => goTo('referrals')}
        />
      )
    }
    if (view === 'referrals') {
      return (
        <DoctorPatientQueue
          user={user}
          onOpenReferral={(id) => goTo(`detail:${id}`)}
        />
      )
    }
    if (view === 'blood' || view === 'blood-availability') {
      return <BloodAvailabilityView />
    }
  }

  if (role === 'ADMIN') {
    if (view === 'dashboard' || view === 'hospitals') return <AdminHospitalManager />
    if (view === 'referrals') return <AdminReferralsView referrals={referrals} />
    if (view === 'escalations') return <AdminEscalationQueue referrals={referrals} />
    if (view === 'verification') return <AdminRegistry />
    if (view === 'audit') return <AdminAuditLogs />
  }

  return (
    <>
      <PageTitle title="Overview Dashboard" subtitle="Monitor active referral lifecycle and operational telemetry." />
      <MetricsSummary visible={visible} />
      <ReferralTable referrals={visible.slice(0, 5)} compact />
    </>
  )
}

// ── Role Specific Views ───────────────────────────────────────────────────

function OpsDashboard({ referrals }: { referrals: import('@/types/domain').Referral[] }) {
  const activeCount = referrals.filter((item) => !['ARRIVED', 'COMPLETED'].includes(item.status)).length
  const reviewingCount = referrals.filter((item) => item.status === 'REVIEWING').length
  const confirmedCount = referrals.filter((item) => item.status === 'CONFIRMED').length

  return (
    <div className="space-y-6">
      <PageTitle title="Hospital Operations Overview" subtitle="Real-time intake queue and bed capacity coordination." />

      <div className="metric-grid">
        <Metric label="Active Referrals" value={activeCount.toString()} icon={Activity} tone="cyan" />
        <Metric label="Clinical Review" value={reviewingCount.toString()} icon={Clock3} tone="warning" />
        <Metric label="Confirmed Inbound" value={confirmedCount.toString()} icon={CheckCircle2} tone="teal" />
        <Metric label="ICU Beds Available" value="6" icon={Hospital} tone="teal" />
      </div>

      <OperationsActions referrals={referrals} />

      <div className="card p-5">
        <h3 className="text-base font-bold mb-3">Incoming Patient Referrals Queue</h3>
        <ReferralTable referrals={referrals} compact />
      </div>
    </div>
  )
}

function IncomingReferralsView({ referrals }: { referrals: import('@/types/domain').Referral[] }) {
  return (
    <div className="space-y-6">
      <PageTitle title="Incoming Referrals Management" subtitle="Review incoming emergency referral transfers for your facility." />
      <OperationsActions referrals={referrals} />
      <ReferralTable referrals={referrals} />
    </div>
  )
}

function AdminReferralsView({ referrals }: { referrals: import('@/types/domain').Referral[] }) {
  return (
    <div className="space-y-6">
      <PageTitle title="Network Active Referrals" subtitle="Global network visibility across all emergency referrals." />
      <MetricsSummary visible={referrals} />
      <ReferralTable referrals={referrals} />
    </div>
  )
}

function AdminEscalationQueue({ referrals }: { referrals: import('@/types/domain').Referral[] }) {
  const escalated = referrals.filter((item) => item.status === 'ESCALATED' || item.status === 'DECLINED')

  return (
    <div className="space-y-6">
      <PageTitle title="System Escalation Queue" subtitle="Monitor declined or timed-out referrals requiring manual intervention." />

      {escalated.length ? (
        <div className="space-y-3">
          {escalated.map((item) => (
            <div key={item.id} className="card p-5 border-l-4 border-l-rose-500 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-400" />
                  <strong className="text-white text-sm">{item.patient.referenceCode} · {item.patient.emergencyCategory}</strong>
                </div>
                <p className="text-xs text-gray-400 mt-1">{item.patient.chiefComplaint}</p>
                <small className="text-rose-400 text-xs block mt-1">Reason: {item.escalationReason || 'Timed out without hospital response'}</small>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-400">
          <ShieldCheck size={32} className="mx-auto text-emerald-400 mb-2" />
          <p>No active escalations. Network running smoothly.</p>
        </div>
      )}
    </div>
  )
}

function AdminAuditLogs() {
  const storeAudits = useAppStore((state) => state.auditEvents)
  const [audits, setAudits] = useState(storeAudits)
  const [_loading, setLoading] = useState(false)

  const loadAudits = useCallback(async () => {
    setLoading(true)
    try {
      const list = await auditRepository.list({ limit: 50 })
      if (list && list.length > 0) setAudits(list)
    } catch (err) {
      console.warn('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAudits()
  }, [loadAudits])

  useSupabaseRealtime(
    useCallback(() => {
      loadAudits()
    }, [loadAudits])
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle title="System Audit Logs" subtitle="Immutable event audit trail for compliance and review." />
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          LIVE AUDIT STREAM
        </span>
      </div>
      <div className="audit-list card">
        {audits.map((event) => (
          <div className="audit-row" key={event.id}>
            <span className="audit-dot" />
            <div>
              <strong className="text-white text-sm">{event.action}</strong>
              <small className="text-gray-400 text-xs block">
                {event.actorName} ({event.actorRole}) → {event.targetLabel}
              </small>
            </div>
            <time className="text-xs text-gray-400 ml-auto font-mono">{new Date(event.timestamp).toLocaleTimeString()}</time>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricsSummary({ visible }: { visible: import('@/types/domain').Referral[] }) {
  return (
    <div className="metric-grid">
      <Metric label="Active Referrals" value={visible.filter((item) => !['ARRIVED', 'COMPLETED'].includes(item.status)).length.toString()} icon={Activity} tone="cyan" />
      <Metric label="Clinical Review" value={visible.filter((item) => item.status === 'REVIEWING').length.toString()} icon={Clock3} tone="warning" />
      <Metric label="Confirmed" value={visible.filter((item) => item.status === 'CONFIRMED').length.toString()} icon={CheckCircle2} tone="teal" />
      <Metric label="Escalations" value={visible.filter((item) => item.status === 'ESCALATED').length.toString()} icon={Siren} tone="coral" />
    </div>
  )
}

function AdminRegistry() {
  return (
    <>
      <PageTitle title="Capability Verification Registry" subtitle="Review verification source and telemetry freshness before trusting facility capabilities." />
      <AdminVerificationPanel />
    </>
  )
}

export function OperationsActions({ referrals }: { referrals: import('@/types/domain').Referral[] }) {
  const routeToClinical = useAppStore((state) => state.routeToClinical)
  const confirmReferral = useAppStore((state) => state.confirmReferral)

  const pendingRoute = referrals.filter((referral) => referral.status === 'WAITING_FOR_RESPONSE')
  const pendingConfirm = referrals.filter((referral) => referral.status === 'ACCEPTED')

  if (!pendingRoute.length && !pendingConfirm.length) return null

  return (
    <div className="space-y-4 mb-4">
      {pendingRoute.length > 0 && (
        <section className="clinical-actions card p-5 border-l-4 border-l-amber-400">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-amber-400">Incoming Triage Requests ({pendingRoute.length})</h3>
            <span className="text-xs text-gray-400">Operational Routing Required</span>
          </div>
          {pendingRoute.map((referral) => (
            <div className="clinical-row flex justify-between items-center py-2.5 border-t border-white/10" key={referral.id}>
              <div>
                <strong className="text-white text-sm block">{referral.patient.referenceCode} · {referral.patient.emergencyCategory}</strong>
                <small className="text-gray-400 text-xs block">{referral.patient.chiefComplaint}</small>
              </div>
              <button className="btn-primary text-xs py-1.5 px-3" onClick={() => routeToClinical(referral.id)}>
                Route to Clinical Team <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </section>
      )}

      {pendingConfirm.length > 0 && (
        <section className="clinical-actions card p-5 border-l-4 border-l-emerald-400">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-emerald-400">Clinically Accepted — Operational Confirmation Needed ({pendingConfirm.length})</h3>
            <span className="text-xs text-gray-400">Bed Allocation & Arrival Preparation</span>
          </div>
          {pendingConfirm.map((referral) => (
            <div className="clinical-row flex justify-between items-center py-2.5 border-t border-white/10" key={referral.id}>
              <div>
                <strong className="text-white text-sm block">{referral.patient.referenceCode} · {referral.patient.emergencyCategory}</strong>
                <small className="text-emerald-300 text-xs block">
                  Clinically Accepted by {referral.decision?.decidedBy || 'Medical Desk'} · Awaiting bed allocation confirmation.
                </small>
              </div>
              <button className="btn-primary text-xs py-1.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20" onClick={() => confirmReferral(referral.id)}>
                <CheckCircle2 size={15} /> Confirm Bed Allocation & Intake
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">ASTRA COMMAND CENTER</p>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="muted text-sm">{subtitle}</p>
      </div>
      <span className="decision-pill">
        <ShieldCheck size={16} /> Automated Decision Support
      </span>
    </div>
  )
}

function ReferralTable({ referrals, compact = false }: { referrals: import('@/types/domain').Referral[]; compact?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')

  const filtered = referrals.filter((referral) => {
    const needle = query.toLowerCase()
    const matchesSearch =
      !needle ||
      `${referral.id} ${referral.patient.referenceCode} ${referral.patient.chiefComplaint} ${referral.sentToFacilityName || ''}`
        .toLowerCase()
        .includes(needle)
    return matchesSearch && (status === 'ALL' || referral.status === status)
  })

  return (
    <div className={`table-wrap ${compact ? 'compact' : ''}`}>
      <div className="table-filters">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            className="pl-9"
            aria-label="Search referrals"
            placeholder="Search referral, patient reference, complaint..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select aria-label="Filter referral status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All Statuses</option>
          {['MATCHED', 'REVIEWING', 'ESCALATED', 'CONFIRMED', 'ARRIVED', 'COMPLETED'].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Case Ref</th>
            <th>Patient / Condition</th>
            <th>Facility Target</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((referral) => (
            <tr key={referral.id} onClick={() => navigate(`${location.pathname.replace(/\/$/, '')}/../referrals/${referral.id}`)}>
              <td>
                <strong className="text-cyan-400 font-mono">{referral.patient.referenceCode}</strong>
                <small>{referral.id}</small>
              </td>
              <td>
                <strong className="text-white">{referral.patient.age} yrs · {referral.patient.emergencyCategory}</strong>
                <small className="truncate max-w-xs">{referral.patient.chiefComplaint}</small>
              </td>
              <td>
                <span className="text-gray-200">{referral.sentToFacilityName || 'Matching facilities'}</span>
                <small>{referral.requiredCapabilities.length} required capabilities</small>
              </td>
              <td>
                <StatusBadge status={referral.status} />
              </td>
              <td className="font-mono text-xs text-gray-400">
                {new Date(referral.updatedAt).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!filtered.length && <div className="empty-state">No emergency referrals match the active filter criteria.</div>}
    </div>
  )
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Activity; tone: string }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="flex justify-between items-center">
        <Icon size={22} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">REALTIME</span>
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = referralStatusConfig[status as keyof typeof referralStatusConfig]
  return (
    <span className={`status-badge ${status.toLowerCase()}`} aria-label={config?.description || status}>
      <span />
      {config?.label || status.replace('_', ' ')}
    </span>
  )
}
