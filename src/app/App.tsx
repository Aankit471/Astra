import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Droplet,
  Hospital,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Network,
  Phone,
  Search,
  ShieldCheck,
  Siren,
  Stethoscope,
  WifiOff,
  X,
  XCircle,
  type LucideIcon
} from 'lucide-react'
import { DEMO_CREDENTIALS } from '@/data/users'
import { HOSPITALS, useAppStore, users } from '@/store/appStore'
import type { AuthUser } from '@/types/auth'
import type { EmergencyCategory, PatientBrief, RequiredCapability } from '@/types/domain'
import { ROLE_HOME_PATHS } from '@/types/auth'
import { useLocation, useNavigate } from 'react-router-dom'
import { ReferralDetail } from '@/components/data-display/ReferralDetail'
import { AdminVerificationPanel } from '@/components/data-display/AdminVerificationPanel'
import { BedAvailabilityPanel } from '@/components/data-display/BedAvailabilityPanel'
import { referralStatusConfig } from '@/utils/referralStatus'
import { getRelativeTime } from '@/utils/freshness'
import { renderRouteView } from '@/routes/AppRoutes'
import { DoctorCommandCenter } from '@/components/doctor/DoctorCommandCenter'
import { DoctorPatientQueue } from '@/components/doctor/DoctorPatientQueue'
import { BloodAvailabilityView } from '@/components/doctor/BloodAvailabilityView'
import { DoctorReferralReview } from '@/components/doctor/DoctorReferralReview'
import { UserFacilitiesView } from '@/components/data-display/UserFacilitiesView'
import { AdminHospitalManager } from '@/components/admin/AdminHospitalManager'
import { HospitalPortalContainer } from '@/components/hospital/HospitalPortalContainer'
import { DoctorPortalContainer } from '@/components/doctor-workspace/DoctorPortalContainer'
import { useSupabaseRealtime } from '@/services/supabase/useSupabaseRealtime'

const capabilityOptions = [
  ['ICU', 'Intensive Care Unit'],
  ['CARDIAC_CATH_LAB', 'Cardiac Catheterisation Lab'],
  ['CARDIOLOGY', 'Cardiology Specialist'],
  ['TRAUMA_SURGERY', 'Trauma Surgery'],
  ['CT_SCAN', 'CT Scan'],
  ['BLOOD_BANK', 'Blood Bank'],
  ['VENTILATOR', 'Mechanical Ventilator'],
] as const

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
  if (segment === 'user') return 'USER'
  if (segment === 'hospital') return 'HOSPITAL_OPS'
  if (segment === 'doctor') return 'DOCTOR'
  if (segment === 'admin') return 'ADMIN'
  return null
}

function Login({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [selected, setSelected] = useState(0)
  const credential = DEMO_CREDENTIALS[selected]

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
                {item.role === 'USER' ? <Siren size={20} /> : item.role === 'HOSPITAL_OPS' ? <Hospital size={20} /> : item.role === 'DOCTOR' ? <Stethoscope size={20} /> : <ShieldCheck size={20} />}
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
  const defaultView = user.role === 'USER' ? 'emergency' : 'dashboard'
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
    user.role === 'USER'
      ? [
          ['emergency', 'Emergency Desk', Siren],
          ['facilities', 'Suitable Facilities', Hospital],
          ['history', 'Referral History', ClipboardList],
        ]
      : user.role === 'DOCTOR'
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
    USER: { label: 'User Emergency Desk', sub: 'Decision Support & Facility Matching' },
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
    role === 'USER'
      ? referrals.filter((item) => item.createdBy === user.id)
      : role === 'ADMIN'
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

  if (role === 'USER') {
    if (view === 'facilities') return <UserFacilitiesView />
    return <EmergencyFlow user={user} />
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
  const audits = useAppStore((state) => state.auditEvents)

  return (
    <div className="space-y-6">
      <PageTitle title="System Audit Logs" subtitle="Immutable event audit trail for compliance and review." />
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

function SectionTitle({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="section-title">
      <span>{number}</span>
      <div>
        <h2>{title}</h2>
        <p className="muted text-xs">{subtitle}</p>
      </div>
    </div>
  )
}

function Verification({ status }: { status: string }) {
  return (
    <span className={`verification ${status.toLowerCase()}`}>
      <ShieldCheck size={13} /> {status.replace('_', ' ')}
    </span>
  )
}

function Timeline({ referral }: { referral: import('@/types/domain').Referral }) {
  return (
    <div className="timeline py-4 space-y-3">
      {referral.timeline.slice(-5).map((event) => (
        <div key={event.id} className="flex items-start gap-3 text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shadow-sm shadow-cyan-400" />
          <div>
            <strong className="text-white block font-medium">{event.event}</strong>
            <small className="text-gray-400">{event.actor} · {new Date(event.timestamp).toLocaleTimeString()}</small>
          </div>
        </div>
      ))}
    </div>
  )
}

function UserCockpit({ onStart }: { onStart: () => void }) {
  const primary = HOSPITALS[0]
  const alternate = HOSPITALS.slice(1, 3)
  const [viewBedModalHospital, setViewBedModalHospital] = useState<import('@/types/domain').Hospital | null>(null)

  const capabilities = [
    ['24/7 Primary PCI / Cath Lab', 'Gov Health Registry · 8m ago', 'VERIFIED'],
    ['Interventional Cardiologist On-call', 'Active Roster Check · 12m ago', 'VERIFIED'],
    ['Cardiac ICU (CICU) & Ventilation', 'Facility Telemetry · 24m ago', 'SELF-REPORTED'],
    ['Dual Antiplatelet & Thrombolysis', 'Pharmacy Inventory · 15m ago', 'VERIFIED'],
  ]

  const getBedSummary = (h: import('@/types/domain').Hospital) => {
    const beds = h.capabilities.beds || []
    const acBeds = beds.filter((b) => b.comfort === 'AC')
    const nonAcBeds = beds.filter((b) => b.comfort === 'NON_AC')
    const acAvail = acBeds.reduce((s, b) => s + b.availableBeds, 0)
    const nonAcAvail = nonAcBeds.reduce((s, b) => s + b.availableBeds, 0)
    const minAcPrice = acBeds.length ? Math.min(...acBeds.map((b) => b.chargePerDay || 2800)) : null
    const minNonAcPrice = nonAcBeds.length ? Math.min(...nonAcBeds.map((b) => b.chargePerDay || 850)) : null
    return { acAvail, nonAcAvail, minAcPrice, minNonAcPrice }
  }

  const primaryBeds = getBedSummary(primary)

  return (
    <div className="cockpit-view">
      <div className="cockpit-hero-banner">
        <div className="cockpit-hero-text">
          <span className="status-badge confirmed">
            <span /> EMERGENCY COORDINATION DESK
          </span>
          <h2 className="text-2xl font-bold mt-2">Indiranagar Emergency Coordination Desk</h2>
          <p>
            Facility capability matching, reported bed availability telemetry, AC vs Non-AC room options, and structured emergency referral coordination.
          </p>
        </div>

        <button className="btn-primary text-base px-6 py-3 shadow-lg shadow-cyan-500/20" onClick={onStart}>
          <Siren size={20} />
          <span>Start Emergency Referral</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="cockpit-grid">
        <div className="space-y-4">
          <div className="case-card">
            <div className="case-badge-row">
              <span className="case-badge">TIER-1 CRITICAL CASE</span>
              <strong className="text-cyan-400 font-mono text-sm">#AST-1042</strong>
            </div>
            <div className="case-patient">
              <div>
                <p className="case-id">PATIENT · AGE 58 · MALE</p>
                <h3>Acute ST-Elevation Myocardial Infarction (STEMI)</h3>
                <p className="case-notes">
                  Onset: 40m ago · Severe crushing chest pain, diaphoresis, dyspnea. SpO2 91%, BP 88/60. Door-to-balloon target: &lt;60 min.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-bold mb-3">Mandatory Emergency Capabilities Required</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {capabilities.map(([title, meta, status]) => (
                <div key={title} className="capability-tag flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div>
                    <strong className="text-white text-xs block font-semibold">{title}</strong>
                    <small className="text-gray-400 text-[11px]">{meta}</small>
                  </div>
                  <Verification status={status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-base font-bold mb-3">Telemetry Matched Receiving Facilities</h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 relative space-y-2">
                <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded">
                  98% FIT · PRIMARY
                </span>
                <div>
                  <strong className="text-white text-sm block font-semibold">{primary.name}</strong>
                  <small className="text-gray-400 text-xs block mt-0.5">
                    {primary.address.city} · 4.8 km · 12 min transit
                  </small>
                  <span className="text-xs text-emerald-400 font-medium block mt-1">
                    Cath Lab on Standby · Team Alerted
                  </span>
                </div>

                <div className="pt-2 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/20">
                      ❄️ AC: {primaryBeds.acAvail} beds ({primaryBeds.minAcPrice ? `from ₹${primaryBeds.minAcPrice.toLocaleString()}/d` : ''})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                      Non-AC: {primaryBeds.nonAcAvail} beds ({primaryBeds.minNonAcPrice ? `from ₹${primaryBeds.minNonAcPrice.toLocaleString()}/d` : ''})
                    </span>
                  </div>
                  <button
                    onClick={() => setViewBedModalHospital(primary)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline text-xs"
                  >
                    View Bed Tariffs →
                  </button>
                </div>
              </div>

              {alternate.map((hospital, index) => {
                const altBeds = getBedSummary(hospital)
                return (
                  <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 relative space-y-2" key={hospital.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-white text-sm block font-semibold">{hospital.name}</strong>
                        <small className="text-gray-400 text-xs block mt-0.5">
                          {hospital.address.city} · {index === 0 ? '8.2' : '11.4'} km
                        </small>
                        <span className="text-[11px] text-gray-300 block mt-1">
                          {index === 0 ? 'Cath Lab Bed Queued' : 'Gov Cardiac Care Wing'}
                        </span>
                      </div>
                      <div className="text-right">
                        <strong className="text-gray-300 text-base font-semibold">{96 - index * 8}%</strong>
                        <small className="text-gray-400 text-[10px] block uppercase">{index === 0 ? 'SECONDARY' : 'ESCALATION'}</small>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/20">
                          ❄️ AC: {altBeds.acAvail} beds ({altBeds.minAcPrice ? `₹${altBeds.minAcPrice.toLocaleString()}/d` : ''})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                          Non-AC: {altBeds.nonAcAvail} beds ({altBeds.minNonAcPrice ? `₹${altBeds.minNonAcPrice.toLocaleString()}/d` : hospital.type === 'GOVERNMENT' ? '₹250/d Govt' : 'Subsidized'})
                        </span>
                      </div>
                      <button
                        onClick={() => setViewBedModalHospital(hospital)}
                        className="text-cyan-400 hover:text-cyan-300 font-bold underline text-xs"
                      >
                        View Bed Tariffs →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-bold mb-3">Safety Fallback & Patient Contacts</h3>
            <div className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                AK
              </div>
              <div>
                <strong className="text-white text-sm block">Ananya Kumar</strong>
                <small className="text-gray-400 text-xs">Daughter · Primary Kin</small>
              </div>
              <a href="tel:+919876543210" className="ml-auto btn-secondary text-xs py-1.5 px-3">
                <Phone size={13} /> Call
              </a>
            </div>
          </div>
        </div>
      </div>

      {viewBedModalHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="presentation">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{viewBedModalHospital.name}</h3>
                <p className="text-xs text-slate-400">Bed Availability & Daily Charges (AC / Non-AC Tariff)</p>
              </div>
              <button onClick={() => setViewBedModalHospital(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <BedAvailabilityPanel hospital={viewBedModalHospital} />

            <div className="flex justify-end pt-2">
              <button onClick={() => setViewBedModalHospital(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmergencyFlow({ user: _user }: { user: AuthUser }) {
  const createReferral = useAppStore((state) => state.createReferral)
  const sendReferral = useAppStore((state) => state.sendReferral)
  const referrals = useAppStore((state) => state.referrals)
  const decline = useAppStore((state) => state.declineReferral)
  const accept = useAppStore((state) => state.acceptReferral)
  const arrived = useAppStore((state) => state.markArrived)
  const complete = useAppStore((state) => state.completeReferral)

  const [step, setStep] = useState(0)
  const [category, setCategory] = useState<EmergencyCategory>('CARDIAC')
  const [age, setAge] = useState('58')
  const [complaint, setComplaint] = useState('Severe chest pain, onset 40 minutes ago')
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(['ICU', 'CARDIAC_CATH_LAB', 'CARDIOLOGY'])
  const [referralId, setReferralId] = useState<string | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null)

  const referral = referrals.find((item) => item.id === referralId)
  const matches = referral
    ? HOSPITALS.filter((hospital) => referral.matchedFacilities.includes(hospital.id))
    : HOSPITALS.filter((hospital) => hospital.capabilities.emergencyCategories.includes(category))

  const next = () => {
    if (step === 0) setStep(1)
    else if (step === 1) {
      const parsedAge = Number(age)
      if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 120 || !complaint.trim()) return
      setStep(2)
    } else if (step === 2) {
      if (!selectedCapabilities.length) return
      const patient: PatientBrief = {
        referenceCode: `CASE-${Date.now().toString().slice(-4)}`,
        age: Number(age),
        sex: 'MALE',
        chiefComplaint: complaint.trim(),
        emergencyCategory: category,
        urgencyLevel: 'IMMEDIATE',
      }
      const required: RequiredCapability[] = selectedCapabilities.map((item) => ({
        capabilityItem: item,
        label: capabilityOptions.find(([key]) => key === item)?.[1] || item,
        isMandatory: true,
      }))
      const created = createReferral(patient, required)
      setReferralId(created.id)
      setStep(3)
    } else if (step === 3 && selectedHospital) {
      sendReferral(referralId!, selectedHospital)
      setStep(4)
    }
  }

  const [viewBedModalHospital, setViewBedModalHospital] = useState<import('@/types/domain').Hospital | null>(null)

  const stepLabels = ['Overview', 'Case info', 'Capabilities', 'Match facilities', 'Status']

  if (step === 0) return <UserCockpit onStart={next} />

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EMERGENCY INTAKE WIZARD</p>
          <h1>Initiate Emergency Referral</h1>
          <p className="muted">Algorithmic decision support for patient capability matching. Clinical triage authority remains final.</p>
        </div>
        <a className="call-link" href="tel:112">
          <Phone size={16} /> Call Hotline 112
        </a>
      </div>

      <div className="stepper">
        {stepLabels.map((label, index) => (
          <div key={label} className={index <= step ? 'done' : ''}>
            <span>{index < step ? <CheckCircle2 size={16} /> : index + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>

      {step === 1 && (
        <section className="form-panel card">
          <SectionTitle number="01" title="Patient & Case Intake" subtitle="Provide anonymized clinical parameters." />
          <div className="form-grid">
            <label>
              Emergency Category
              <select value={category} onChange={(event) => setCategory(event.target.value as EmergencyCategory)}>
                {['CARDIAC', 'TRAUMA', 'NEURO', 'RESPIRATORY', 'OBSTETRIC', 'PAEDIATRIC'].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Patient Age
              <input value={age} onChange={(event) => setAge(event.target.value)} type="number" min="0" />
            </label>
            <label className="full">
              Chief Complaint & Symptoms
              <textarea value={complaint} onChange={(event) => setComplaint(event.target.value)} rows={3} />
            </label>
          </div>
          <button className="btn-primary" onClick={next}>
            Continue to Required Capabilities <ArrowRight size={17} />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="form-panel card">
          <SectionTitle number="02" title="Required Medical Capabilities" subtitle="Select mandatory clinical requirements for facility matching." />
          <div className="capability-grid">
            {capabilityOptions.map(([key, label]) => (
              <button
                key={key}
                className={`capability ${selectedCapabilities.includes(key) ? 'selected' : ''}`}
                onClick={() =>
                  setSelectedCapabilities((current) =>
                    current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
                  )
                }
              >
                <span>
                  {selectedCapabilities.includes(key) ? <CheckCircle2 size={18} className="text-cyan-400" /> : <div className="w-4 h-4 border border-gray-600 rounded" />}
                </span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>
          <button className="btn-primary" disabled={!selectedCapabilities.length} onClick={next}>
            Find Matched Facilities <ArrowRight size={17} />
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="form-panel card space-y-4">
          <SectionTitle number="03" title="Matched Receiving Facilities & Operational Capacity" subtitle={`${matches.length} suitable hospitals meet mandatory capability criteria.`} />
          <div className="space-y-4">
            {matches.map((hospital) => {
              const emergencyBeds = hospital.capabilities.beds?.find((b) => b.category === 'EMERGENCY')?.availableBeds ?? 8
              const icuBeds = hospital.capabilities.beds?.find((b) => b.category === 'ICU')?.availableBeds ?? 2
              const generalBeds = hospital.capabilities.beds?.find((b) => b.category === 'GENERAL')?.availableBeds ?? 14
              const acCount = hospital.capabilities.beds?.filter((b) => b.comfort === 'AC').reduce((s, b) => s + b.availableBeds, 0) ?? 5
              const nonAcCount = hospital.capabilities.beds?.filter((b) => b.comfort === 'NON_AC').reduce((s, b) => s + b.availableBeds, 0) ?? 9

              const acBeds = hospital.capabilities.beds?.filter((b) => b.comfort === 'AC' && b.chargePerDay) || []
              const nonAcBeds = hospital.capabilities.beds?.filter((b) => b.comfort === 'NON_AC' && b.chargePerDay) || []
              const minAcCharge = acBeds.length ? Math.min(...acBeds.map((b) => b.chargePerDay!)) : null
              const minNonAcCharge = nonAcBeds.length ? Math.min(...nonAcBeds.map((b) => b.chargePerDay!)) : null

              return (
                <div
                  key={hospital.id}
                  onClick={() => setSelectedHospital(hospital.id)}
                  className={`card p-5 space-y-4 border transition-all cursor-pointer ${
                    selectedHospital === hospital.id ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${selectedHospital === hospital.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Hospital size={22} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{hospital.name}</h4>
                        <p className="text-xs text-slate-400">{hospital.type} · {hospital.address.line1}, {hospital.address.city}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            100% Capability Match
                          </span>
                          <Verification status={hospital.verificationStatus} />
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="selectedHospital"
                      checked={selectedHospital === hospital.id}
                      onChange={() => setSelectedHospital(hospital.id)}
                      className="w-5 h-5 text-cyan-400 focus:ring-cyan-400 mt-1"
                    />
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <BedDouble size={14} /> Reported Bed Availability & Daily Charges
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded">
                        TELEMETRY
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block">Emergency / ICU</span>
                        <strong className="text-sm font-bold text-emerald-400">{emergencyBeds} Emer · {icuBeds} ICU</strong>
                      </div>
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block">General Ward</span>
                        <strong className="text-sm font-bold text-emerald-400">{generalBeds} available</strong>
                      </div>
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-cyan-500/20 bg-cyan-950/10">
                        <span className="text-[11px] text-cyan-300 block font-semibold">❄️ AC Room Beds</span>
                        <strong className="text-xs font-bold text-white block">
                          {acCount} beds available
                        </strong>
                        <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                          {minAcCharge ? `from ₹${minAcCharge.toLocaleString()} / day` : 'Tariff available'}
                        </span>
                      </div>
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 bg-slate-900/80">
                        <span className="text-[11px] text-slate-300 block font-semibold">Non-AC Room Beds</span>
                        <strong className="text-xs font-bold text-white block">
                          {nonAcCount} beds available
                        </strong>
                        <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                          {minNonAcCharge ? `from ₹${minNonAcCharge.toLocaleString()} / day` : 'Govt subsidized'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Hospital-reported · Updated {getRelativeTime(hospital.lastUpdated)}</span>
                      <button
                        type="button"
                        onClick={() => setViewBedModalHospital(hospital)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1"
                      >
                        View Bed Details <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button className="btn-primary" disabled={!selectedHospital} onClick={next}>
            Send Referral Request <ArrowRight size={17} />
          </button>
        </section>
      )}

      {viewBedModalHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="presentation">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{viewBedModalHospital.name}</h3>
                <p className="text-xs text-slate-400">Bed Availability & Operational Accommodation Telemetry</p>
              </div>
              <button onClick={() => setViewBedModalHospital(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <BedAvailabilityPanel hospital={viewBedModalHospital} />

            <div className="flex justify-end pt-2">
              <button onClick={() => setViewBedModalHospital(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && referral && (
        <section className="status-panel card">
          <div className="status-hero flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Activity size={24} />
            </div>
            <div>
              <p className="eyebrow">REFERRAL CASE · {referral.id}</p>
              <h2 className="text-xl font-bold">
                {referral.status === 'CONFIRMED'
                  ? 'Referral Confirmed'
                  : referral.status === 'REVIEWING'
                  ? 'Clinical Review In Progress'
                  : 'Referral Routing Active'}
              </h2>
              <p className="muted">{referral.sentToFacilityName || 'Preparing receiving hospital notification'}</p>
            </div>
            <div className="ml-auto">
              <StatusBadge status={referral.status} />
            </div>
          </div>

          <Timeline referral={referral} />

          <div className="action-row pt-4">
            {referral.status === 'REVIEWING' && (
              <>
                <button className="btn-danger" onClick={() => decline(referral.id, 'No ICU capacity confirmed by clinical team')}>
                  <XCircle size={16} /> Simulate Hospital Decline
                </button>
                <button className="btn-primary" onClick={() => accept(referral.id)}>
                  <CheckCircle2 size={16} /> Simulate Clinical Acceptance
                </button>
              </>
            )}
            {referral.status === 'CONFIRMED' && (
              <>
                <button className="btn-primary" onClick={() => arrived(referral.id)}>
                  Mark Patient Arrived <ArrowRight size={16} />
                </button>
                <div className="route-card">
                  <MapPin size={18} />
                  <div>
                    <strong>ALS Ambulance Dispatch Active</strong>
                    <small>ETA ~8 minutes to receiving facility</small>
                  </div>
                </div>
              </>
            )}
            {referral.status === 'ARRIVED' && (
              <button className="btn-primary" onClick={() => complete(referral.id)}>
                Complete Referral <CheckCircle2 size={16} />
              </button>
            )}
            {(referral.status as string) === 'COMPLETED' && (
              <div className="success-callout">
                <CheckCircle2 size={18} /> Patient handoff completed and audit record logged.
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}


