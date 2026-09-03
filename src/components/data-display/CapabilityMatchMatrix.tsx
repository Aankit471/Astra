import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from 'lucide-react'
import type { Hospital, RequiredCapability } from '@/types/domain'
import { getFreshnessLevel } from '@/utils/freshness'

export function CapabilityMatchMatrix({ required, hospital }: { required: RequiredCapability[]; hospital: Hospital }) {
  return <div className="capability-matrix"><div className="matrix-header"><span>Required capability</span><span>Facility capability</span><span>Verification / freshness</span></div>{required.map((item) => { const capability = hospital.capabilities.capabilities.find((candidate) => candidate.item === item.capabilityItem); const fresh = capability ? getFreshnessLevel(capability.lastUpdated) : null; const status = capability?.verificationStatus || null; return <div className="matrix-row" key={item.capabilityItem}><strong>{item.label}</strong><span className={capability?.available ? 'available' : 'missing'}>{capability?.available ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{capability?.available ? 'Available' : 'Unavailable'}</span><span className={`matrix-meta ${status?.toLowerCase() || 'missing'}`}>{status === 'STALE' || fresh === 'STALE' ? <AlertTriangle size={13} /> : status === 'VERIFIED' ? <CheckCircle2 size={13} /> : <CircleHelp size={13} />}{status ? `${status} · ${fresh}` : 'Not recorded'}</span></div> })}</div>
}
