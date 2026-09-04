import MockDatabase from './mockDb'
import type { AuditEvent, PatientBrief, Referral, RequiredCapability } from '@/types/domain'
import { assertTransition } from '@/utils/referralTransitions'
import { AppError } from '@/api/errors'
import { matchFacilities } from '@/services/matchingService'

const getDb = () => MockDatabase.getInstance()
const actor = { id: 'dispatch-001', name: '108 Emergency Dispatch', role: 'DISPATCH' }

const notify = (id: string, title: string, body: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS', referral: Referral, recipientRole?: string) => {
  getDb().addNotification({ id, type: 'SYSTEM_ALERT', title, body, severity, isRead: false, createdAt: new Date().toISOString(), referralId: referral.id, recipientRole })
}

const audit = (action: string, target: Referral, details?: Record<string, unknown>) => {
  const event: AuditEvent = {
    id: `AUD-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(), action, actorId: actor.id, actorName: actor.name,
    actorRole: actor.role, targetType: 'REFERRAL', targetId: target.id,
    targetLabel: target.patient.referenceCode, details,
  }
  getDb().addAuditEvent(event)
}

const update = (referral: Referral, status: Referral['status'], event: string) => {
  assertTransition(referral.status, status)
  referral.status = status
  referral.updatedAt = new Date().toISOString()
  referral.timeline.push({ id: `TL-${Date.now()}-${Math.random().toString(16).slice(2)}`, timestamp: referral.updatedAt, event, actor: 'ASTRA System', actorRole: 'SYSTEM', isSystemEvent: true })
  getDb().upsertReferral(referral)
}

export const referralService = {
  listReferrals: () => getDb().referrals,
  listAuditEvents: () => getDb().auditEvents,
  matchingFacilities: (category: PatientBrief['emergencyCategory'], capabilities: RequiredCapability[]) => matchFacilities(category, capabilities.filter((item) => item.isMandatory), getDb().hospitals).filter((match) => match.kind === 'FULL_MATCH').map((match) => match.hospital),
  createReferral: (patient: PatientBrief, requiredCapabilities: RequiredCapability[], createdBy: string) => {
    const matchedFacilities = referralService.matchingFacilities(patient.emergencyCategory, requiredCapabilities)
    const now = new Date().toISOString()
    const referral: Referral = {
      id: `REF-${String(getDb().referrals.length + 1).padStart(3, '0')}`, status: 'CREATED', createdAt: now, updatedAt: now,
      createdBy, patient, requiredCapabilities, matchedFacilities: matchedFacilities.map((hospital) => hospital.id), attemptedFacilityIds: [],
      responseDeadline: new Date(Date.now() + 10 * 60_000).toISOString(), timeline: [
        { id: `TL-${Date.now()}`, timestamp: now, event: 'Emergency created and capability match completed', actor: 'Priya Sharma', actorRole: 'USER', isSystemEvent: false },
      ],
    }
    getDb().upsertReferral(referral)
    audit('Referral Created', referral, { matchedFacilities: matchedFacilities.length })
    update(referral, 'MATCHING', 'Capability matching started')
    audit('Matching Started', referral)
    update(referral, 'MATCHED', 'Suitable facilities identified')
    notify(`N-${referral.id}-OPS`, 'New referral received', `${referral.patient.referenceCode} is ready for hospital operations review.`, 'INFO', referral, 'HOSPITAL_OPS')
    return referral
  },
  sendReferral: (id: string, hospitalId: string) => {
    const referral = getDb().getReferralById(id); const hospital = getDb().getHospitalById(hospitalId)
    if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404)
    if (!hospital) throw new AppError('NOT_FOUND', 'Hospital was not found.', 404)
    if (!['MATCHED', 'ESCALATED'].includes(referral.status)) throw new AppError('CONFLICT', 'Referral is not ready to contact a facility.', 409)
    referral.sentToFacilityId = hospital.id; referral.sentToFacilityName = hospital.name; referral.attemptedFacilityIds = [...new Set([...(referral.attemptedFacilityIds || []), hospital.id])]
    update(referral, 'WAITING_FOR_RESPONSE', `Referral request sent to ${hospital.name}`); audit('Hospital Contacted', referral, { hospitalId })
    notify(`N-${referral.id}-${hospitalId}`, 'Referral received', `${referral.patient.referenceCode} is awaiting hospital operations routing.`, 'CRITICAL', referral, 'HOSPITAL_OPS')
  },
  routeToClinical: (id: string) => {
    const referral = getDb().getReferralById(id)
    if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404)
    if (referral.status !== 'WAITING_FOR_RESPONSE') throw new AppError('CONFLICT', 'Referral is not awaiting hospital routing.', 409)
    update(referral, 'REVIEWING', `Referral routed to clinical team at ${referral.sentToFacilityName}`)
    audit('Routed To Clinical', referral, { hospitalId: referral.sentToFacilityId })
    notify(`N-${referral.id}-CLINICAL`, 'Clinical review required', `${referral.patient.referenceCode} is ready for authorized clinical review.`, 'CRITICAL', referral, 'DOCTOR')
  },
  declineReferral: (id: string, reason: string) => {
    const referral = getDb().getReferralById(id); if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404)
    if (referral.status !== 'REVIEWING') throw new AppError('CONFLICT', 'Referral is not awaiting clinical review.', 409)
    referral.decision = { type: 'DECLINE', decidedBy: 'doc-002', decidedAt: new Date().toISOString(), declineReason: 'NO_CAPACITY', declineNotes: reason }
    audit('Hospital Declined', referral, { reason })
    notify(`N-${referral.id}-DECLINED-${Date.now()}`, 'Referral declined', `${referral.sentToFacilityName || 'Current facility'} declined the referral.`, 'WARNING', referral, 'USER')
    const nextHospital = referral.matchedFacilities.find((hospitalId) => !(referral.attemptedFacilityIds || []).includes(hospitalId))
    if (nextHospital) {
      update(referral, 'DECLINED', 'Referral declined by clinical team')
      update(referral, 'ESCALATED', 'Escalation started after clinical decline')
      referral.escalationReason = 'DECLINED_ALL'; referral.escalatedAt = new Date().toISOString(); audit('Escalation Started', referral, { reason })
      notify(`N-${referral.id}-ESCALATED-${Date.now()}`, 'Referral escalated', 'ASTRA is contacting the next suitable facility.', 'WARNING', referral)
      referralService.sendReferral(referral.id, nextHospital)
    } else { update(referral, 'DECLINED', 'No suitable facility remains after decline'); referral.unresolvedExhausted = true; notify(`N-${referral.id}-EXHAUSTED`, 'Unable to confirm a facility', 'ASTRA was unable to confirm a suitable facility. Please call 112 immediately.', 'CRITICAL', referral, 'ADMIN'); audit('Facility Search Exhausted', referral) }
  },
  requestInformation: (id: string, notes: string) => {
    const referral = getDb().getReferralById(id)
    if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404)
    if (!['WAITING_FOR_RESPONSE', 'REVIEWING'].includes(referral.status)) {
      throw new AppError('CONFLICT', 'Referral is not awaiting response or clinical review.', 409)
    }
    referral.infoRequested = true
    referral.infoRequestedNotes = notes
    referral.decision = { type: 'INFO_REQUEST', decidedBy: 'doc-001', decidedAt: new Date().toISOString(), infoRequest: notes }
    referral.updatedAt = new Date().toISOString()
    referral.timeline.push({
      id: `TL-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: referral.updatedAt,
      event: `Doctor requested additional information: "${notes}"`,
      actor: 'Dr. Ananya Patel',
      actorRole: 'DOCTOR',
      isSystemEvent: false,
    })
    getDb().upsertReferral(referral)
    audit('Doctor Requested Information', referral, { notes })
    notify(`N-${referral.id}-INFO-REQ-${Date.now()}`, 'Information requested', `Dr. Ananya Patel requested: "${notes}"`, 'WARNING', referral, 'USER')
    notify(`N-${referral.id}-INFO-REQ-OPS-${Date.now()}`, 'Clinical info requested', `Doctor requested info: "${notes}"`, 'INFO', referral, 'HOSPITAL_OPS')
  },
  acceptReferral: (id: string, overrideAcknowledged = false, overrideNotes = '') => {
    const referral = getDb().getReferralById(id)
    if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404)
    if (!['REVIEWING', 'ESCALATED'].includes(referral.status)) throw new AppError('CONFLICT', 'Referral is not awaiting clinical review.', 409)

    // Check if sent facility capabilities are non-verified
    const facility = referral.sentToFacilityId ? getDb().getHospitalById(referral.sentToFacilityId) : null
    const requiresOverride = facility && (facility.verificationStatus !== 'VERIFIED' || facility.capabilities.capabilities.some((c) => c.verificationStatus !== 'VERIFIED'))

    if (requiresOverride) {
      if (!overrideAcknowledged) {
        throw new AppError('CONFLICT', 'Clinical override acknowledgement required for facility with unverified or stale capability data.', 409)
      }
      referral.clinicalOverride = true
      referral.clinicalOverrideNotes = overrideNotes || 'Doctor acknowledged clinical override for unverified capability telemetry.'
      audit('Clinical Override Acknowledged', referral, {
        doctor: 'Dr. Ananya Patel',
        facilityId: facility?.id,
        facilityName: facility?.name,
        verificationStatus: facility?.verificationStatus,
      })
    }

    referral.decision = { type: 'ACCEPT', decidedBy: 'doc-001', decidedAt: new Date().toISOString() }
    update(referral, 'ACCEPTED', `Clinical decision: ACCEPTED by Dr. Ananya Patel at ${referral.sentToFacilityName || 'Receiving Facility'}`)
    audit('Referral Clinically Accepted', referral, { facilityId: referral.sentToFacilityId, clinicalOverride: referral.clinicalOverride })
    notify(`N-${referral.id}-ACCEPTED-${Date.now()}`, 'Referral clinically accepted', `${referral.sentToFacilityName} clinically accepted the referral. Operational confirmation required.`, 'SUCCESS', referral, 'HOSPITAL_OPS')
    notify(`N-${referral.id}-ACCEPTED-USER-${Date.now()}`, 'Clinical acceptance', `Clinical team at ${referral.sentToFacilityName} accepted your referral request. Awaiting operational bed confirmation.`, 'SUCCESS', referral, 'USER')
  },
  confirmReferral: (id: string) => {
    const referral = getDb().getReferralById(id)
    if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404)
    if (referral.status !== 'ACCEPTED') throw new AppError('CONFLICT', 'Only clinically accepted referrals can be operationally confirmed.', 409)
    referral.confirmedFacilityId = referral.sentToFacilityId
    referral.confirmedFacilityName = referral.sentToFacilityName
    update(referral, 'CONFIRMED', `Operationally confirmed by hospital command at ${referral.sentToFacilityName}`)
    audit('Referral Confirmed', referral, { facilityId: referral.confirmedFacilityId })
    notify(`N-${referral.id}-CONFIRMED-${Date.now()}`, 'Referral confirmed', `${referral.sentToFacilityName} confirmed bed allocation and operational intake.`, 'SUCCESS', referral, 'USER')
    notify(`N-${referral.id}-CONFIRMED-OPS-${Date.now()}`, 'Incoming patient confirmed', 'Prepare emergency bay and ICU bed for incoming patient arrival.', 'SUCCESS', referral, 'HOSPITAL_OPS')
  },
  timeoutReferral: (id: string) => {
    const referral = getDb().getReferralById(id); if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404)
    if (referral.status !== 'WAITING_FOR_RESPONSE') throw new AppError('CONFLICT', 'Only waiting referrals can time out.', 409)
    const nextHospital = referral.matchedFacilities.find((hospitalId) => !(referral.attemptedFacilityIds || []).includes(hospitalId))
    if (!nextHospital) { update(referral, 'ESCALATED', 'No-response timeout; human intervention required'); referral.unresolvedExhausted = true; notify(`N-${referral.id}-TIMEOUT-EXHAUSTED`, 'Escalation exhausted', 'No suitable facility responded. Please call 112 immediately.', 'CRITICAL', referral, 'ADMIN'); return }
    update(referral, 'ESCALATED', 'No-response timeout; escalating to next suitable facility'); referral.escalationReason = 'TIMEOUT'; referral.escalatedAt = new Date().toISOString(); audit('Escalation Started', referral, { reason: 'no_response_timeout' }); notify(`N-${referral.id}-TIMEOUT`, 'Referral escalated after timeout', 'No response received in the demo response window.', 'WARNING', referral, 'USER'); referralService.sendReferral(id, nextHospital)
  },
  markArrived: (id: string) => { const referral = getDb().getReferralById(id); if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404); if (referral.status !== 'CONFIRMED') throw new AppError('CONFLICT', 'Only confirmed referrals can be marked arrived.', 409); referral.arrivedAt = new Date().toISOString(); update(referral, 'ARRIVED', 'Patient arrival recorded'); audit('Patient Arrived', referral); notify(`N-${referral.id}-ARRIVED-${Date.now()}`, 'Patient arrived', `${referral.patient.referenceCode} arrival has been recorded.`, 'SUCCESS', referral, 'ADMIN') },
  completeReferral: (id: string) => { const referral = getDb().getReferralById(id); if (!referral) throw new AppError('NOT_FOUND', 'Referral was not found.', 404); if (referral.status !== 'ARRIVED') throw new AppError('CONFLICT', 'Only arrived referrals can be completed.', 409); update(referral, 'COMPLETED', 'Referral completed'); audit('Referral Completed', referral); notify(`N-${referral.id}-COMPLETED-${Date.now()}`, 'Referral completed', `${referral.patient.referenceCode} has completed its referral lifecycle.`, 'SUCCESS', referral, 'USER') },
}
