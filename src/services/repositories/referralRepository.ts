import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import { referralService } from '@/services/mock/referralService'
import type { PatientBrief, Referral, RequiredCapability, ReferralTimelineEvent } from '@/types/domain'
import { bedRepository } from './bedRepository'
import { auditRepository } from './auditRepository'


export interface DoctorActor {
  id: string
  name: string
  specialty?: string
  doctorCode?: string
  hospitalId?: string
  hospitalName?: string
}

export interface ClinicalDecisionPayload {
  decision: 'ACCEPTED' | 'DECLINED' | 'ESCALATED' | 'INFO_REQUESTED' | 'OVERRIDE'
  notes?: string
  reason?: string
  priority?: 'Immediate' | 'Urgent' | 'Routine'
  escalationReason?: 'MANUAL' | 'NO_RESPONSE' | 'DECLINED_ALL' | 'TIMEOUT'
  overrideReason?: string
}

export const referralRepository = {
  /**
   * List referrals with optional filtering.
   */
  async list(filters?: { hospitalId?: string; createdBy?: string; doctorId?: string }): Promise<Referral[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('referrals').select('*, patients(*), referral_events(*)')
        if (filters?.hospitalId) query = query.eq('sent_to_facility_id', filters.hospitalId)
        if (filters?.createdBy) query = query.eq('created_by', filters.createdBy)
        if (filters?.doctorId) query = query.eq('assigned_doctor_id', filters.doctorId)

        const { data, error } = await query.order('updated_at', { ascending: false })
        if (!error && data && data.length > 0) {
          const urgencyRank: Record<string, number> = {
            IMMEDIATE: 1,
            URGENT: 2,
            SEMI_URGENT: 3,
          }
          const mapped = data.map((r: any) => ({
            id: r.id,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            createdBy: r.created_by,
            patient: r.patients
              ? {
                  referenceCode: r.patients.reference_code,
                  age: r.patients.age,
                  sex: r.patients.sex,
                  chiefComplaint: r.patients.chief_complaint,
                  emergencyCategory: r.patients.emergency_category,
                  urgencyLevel: r.patients.urgency_level,
                  bloodGroup: r.patients.blood_group,
                }
              : (r.patient_data || {
                  referenceCode: 'EMERGENCY-REF',
                  age: 50,
                  sex: 'OTHER',
                  chiefComplaint: 'Emergency Referral',
                  emergencyCategory: 'CARDIAC',
                  urgencyLevel: 'IMMEDIATE',
                }),
            requiredCapabilities: Array.isArray(r.required_capabilities) ? r.required_capabilities : [],
            matchedFacilities: Array.isArray(r.matched_facilities) ? r.matched_facilities : [],
            sentToFacilityId: r.sent_to_facility_id,
            sentToFacilityName: r.sent_to_facility_name,
            responseDeadline: r.response_deadline || new Date(Date.now() + 15 * 60_000).toISOString(),
            timeline: (r.referral_events || []).map((e: any) => ({
              id: e.id,
              event: e.event,
              timestamp: e.timestamp || e.created_at,
              actor: e.actor || 'System',
              notes: e.notes,
              isSystemEvent: e.is_system_event ?? (!e.actor || e.actor === 'System'),
            })),
            decision: r.decision,
            assignedDoctorId: r.assigned_doctor_id,
          }))

          return mapped.sort((a: any, b: any) => {
            const rankA = urgencyRank[a.patient?.urgencyLevel || ''] || 99
            const rankB = urgencyRank[b.patient?.urgencyLevel || ''] || 99
            if (rankA !== rankB) return rankA - rankB
            return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
          })
        }
      } catch (err) {
        console.warn('Supabase referral list error, falling back to mock:', err)
      }
    }

    const mockDb = MockDatabase.getInstance()
    const urgencyRank: Record<string, number> = {
      IMMEDIATE: 1,
      URGENT: 2,
      SEMI_URGENT: 3,
    }
    return mockDb.referrals
      .filter((r) => {
        if (filters?.hospitalId && r.sentToFacilityId !== filters.hospitalId) return false
        if (filters?.createdBy && r.createdBy !== filters.createdBy) return false
        if (filters?.doctorId && r.assignedDoctorId !== filters.doctorId) return false
        return true
      })
      .sort((a, b) => {
        const rankA = urgencyRank[a.patient?.urgencyLevel || ''] || 99
        const rankB = urgencyRank[b.patient?.urgencyLevel || ''] || 99
        if (rankA !== rankB) return rankA - rankB
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      })

  },

  /**
   * Create referral.
   */
  async create(patient: PatientBrief, capabilities: RequiredCapability[], createdBy: string): Promise<Referral> {
    if (isSupabaseConfigured()) {
      try {
        const { data: pData } = await supabase
          .from('patients')
          .insert({
            reference_code: patient.referenceCode,
            age: patient.age,
            sex: patient.sex,
            chief_complaint: patient.chiefComplaint,
            emergency_category: patient.emergencyCategory,
            urgency_level: patient.urgencyLevel,
            created_by: createdBy,
          })
          .select()
          .single()

        const referralId = `REF-${Date.now().toString().slice(-6)}`
        const { data: rData } = await supabase
          .from('referrals')
          .insert({
            id: referralId,
            patient_id: pData?.id,
            patient_data: patient,
            status: 'MATCHED',
            required_capabilities: capabilities,
            matched_facilities: ['H001', 'H002', 'H003', 'H004'],
            created_by: createdBy,
            response_deadline: new Date(Date.now() + 15 * 60_000).toISOString(),
          })
          .select()
          .single()

        if (rData) {
          await supabase.from('referral_events').insert({
            referral_id: referralId,
            event: 'Referral created and matched to receiving network.',
            actor: createdBy,
          })

          return {
            id: referralId,
            status: 'MATCHED',
            createdAt: rData.created_at,
            updatedAt: rData.updated_at,
            createdBy,
            patient,
            requiredCapabilities: capabilities,
            matchedFacilities: ['H001', 'H002', 'H003', 'H004'],
            responseDeadline: new Date(Date.now() + 15 * 60_000).toISOString(),
            timeline: [{
              id: 'evt-1',
              event: 'Referral created and matched to receiving network.',
              actor: createdBy,
              timestamp: new Date().toISOString(),
              isSystemEvent: false,
            }],
          }
        }
      } catch (err) {
        console.warn('Supabase referral creation error, falling back to mock:', err)
      }
    }

    return referralService.createReferral(patient, capabilities, createdBy)
  },

  /**
   * Record a doctor's clinical decision on a referral.
   * Supports: ACCEPTED, DECLINED, ESCALATED, INFO_REQUESTED, OVERRIDE
   */
  async recordDecision(
    referralId: string,
    payload: ClinicalDecisionPayload,
    doctor: DoctorActor
  ): Promise<boolean> {
    const timestamp = new Date().toISOString()
    let eventTitle = ''
    let newStatus: Referral['status'] = 'REVIEWING'

    if (payload.decision === 'ACCEPTED') {
      newStatus = 'ACCEPTED'
      eventTitle = 'Clinical Acceptance Confirmed by Attending Specialist'
    } else if (payload.decision === 'DECLINED') {
      newStatus = 'DECLINED'
      eventTitle = 'Referral Declined by Receiving Specialist'
    } else if (payload.decision === 'ESCALATED') {
      newStatus = 'ESCALATED'
      eventTitle = 'Referral Escalated to Medical Director / Trauma Ops'
    } else if (payload.decision === 'INFO_REQUESTED') {
      newStatus = 'REVIEWING'
      eventTitle = `Clinical Information Requested [Priority: ${payload.priority || 'Urgent'}]`
    } else if (payload.decision === 'OVERRIDE') {
      newStatus = 'ACCEPTED'
      eventTitle = 'Clinical Override Authorized by Attending Specialist'
    }

    if (isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: timestamp,
          assigned_doctor_id: doctor.id,
          assigned_doctor_name: doctor.name,
          assigned_doctor_code: doctor.doctorCode,
          assigned_specialty: doctor.specialty,
        }

        if (payload.decision === 'ACCEPTED') {
          updatePayload.status = 'ACCEPTED'
          updatePayload.decision = {
            accepted: true,
            doctorId: doctor.id,
            doctorName: doctor.name,
            notes: payload.notes || payload.reason,
            timestamp,
          }
        } else if (payload.decision === 'DECLINED') {
          updatePayload.status = 'DECLINED'
          updatePayload.decision = {
            accepted: false,
            doctorId: doctor.id,
            doctorName: doctor.name,
            notes: payload.notes || payload.reason,
            timestamp,
          }
        } else if (payload.decision === 'ESCALATED') {
          updatePayload.status = 'ESCALATED'
          updatePayload.escalation_reason = payload.escalationReason || 'MANUAL'
          updatePayload.escalated_at = timestamp
        } else if (payload.decision === 'INFO_REQUESTED') {
          updatePayload.info_requested = true
          updatePayload.info_requested_notes = payload.notes || payload.reason
        } else if (payload.decision === 'OVERRIDE') {
          updatePayload.status = 'ACCEPTED'
          updatePayload.clinical_override = true
          updatePayload.clinical_override_notes = payload.overrideReason || payload.notes
        }

        const { error: updateErr } = await supabase
          .from('referrals')
          .update(updatePayload)
          .eq('id', referralId)

        if (!updateErr) {
          await supabase.from('referral_events').insert({
            referral_id: referralId,
            event: eventTitle,
            actor: doctor.name,
            actor_role: 'DOCTOR',
            facility_id: doctor.hospitalId,
            facility_name: doctor.hospitalName,
            notes: payload.notes || payload.reason,
            is_system_event: false,
            timestamp,
          })
          return true
        }
      } catch (err) {
        console.warn('Supabase recordDecision error, falling back to mock:', err)
      }
    }

    // Mock fallback
    const mockDb = MockDatabase.getInstance()
    const target = mockDb.getReferralById(referralId)
    if (target) {
      target.status = newStatus
      target.updatedAt = timestamp
      target.assignedDoctorId = doctor.id
      target.decision = {
        type: payload.decision === 'DECLINED' ? 'DECLINE' : payload.decision === 'INFO_REQUESTED' ? 'INFO_REQUEST' : 'ACCEPT',
        decidedBy: doctor.id,
        decidedAt: timestamp,
        declineNotes: payload.decision === 'DECLINED' ? (payload.notes || payload.reason) : undefined,
        infoRequest: payload.decision === 'INFO_REQUESTED' ? (payload.notes || payload.reason) : undefined,
      }
      const newEvt: ReferralTimelineEvent = {
        id: `evt-${Date.now()}`,
        event: eventTitle,
        actor: doctor.name,
        timestamp,
        notes: payload.notes || payload.reason,
        isSystemEvent: false,
      }
      target.timeline.unshift(newEvt)
      mockDb.upsertReferral(target)
      return true
    }
    return false
  },

  /**
   * Add a clinical note to referral timeline.
   */
  async addClinicalNote(referralId: string, note: string, doctor: DoctorActor): Promise<boolean> {
    const timestamp = new Date().toISOString()
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('referral_events').insert({
          referral_id: referralId,
          event: 'Clinical Progress Note Added',
          actor: doctor.name,
          actor_role: 'DOCTOR',
          facility_id: doctor.hospitalId,
          facility_name: doctor.hospitalName,
          notes: note,
          is_system_event: false,
          timestamp,
        })
        if (!error) return true
      } catch (err) {
        console.warn('Supabase addClinicalNote error, falling back to mock:', err)
      }
    }

    const mockDb = MockDatabase.getInstance()
    const target = mockDb.getReferralById(referralId)
    if (target) {
      target.timeline.unshift({
        id: `evt-${Date.now()}`,
        event: 'Clinical Progress Note Added',
        actor: doctor.name,
        timestamp,
        notes: note,
        isSystemEvent: false,
      })
      mockDb.upsertReferral(target)
      return true
    }
    return false
  },

  /**
   * Hospital Operations: Accept or Decline an incoming emergency referral.
   * - Performs capacity pre-check on accept (verifies available beds > 0).
   *   If capacity is 0: returns "Required capacity currently unavailable."
   * - Requires a reason on decline.
   * - Creates referral_events and audit_logs records.
   */
  async recordOperationalDecision(
    referralId: string,
    decision: 'ACCEPTED' | 'DECLINED',
    actor: { id: string; name: string; role: string; hospitalId: string; hospitalName: string },
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const timestamp = new Date().toISOString()

    if (decision === 'ACCEPTED') {
      // 1. Capacity Pre-Check: verify hospital has suitable bed availability
      const beds = await bedRepository.getByHospitalId(actor.hospitalId)
      const totalAvailable = beds.reduce((sum, b) => sum + (b.availableBeds || 0), 0)

      if (totalAvailable <= 0) {
        return {
          success: false,
          error: 'Required capacity currently unavailable.',
        }
      }

      if (isSupabaseConfigured()) {
        try {
          const { error: refErr } = await supabase
            .from('referrals')
            .update({
              status: 'ACCEPTED',
              sent_to_facility_id: actor.hospitalId,
              sent_to_facility_name: actor.hospitalName,
              updated_at: timestamp,
            })
            .eq('id', referralId)

          if (!refErr) {
            await supabase.from('referral_events').insert({
              referral_id: referralId,
              event: 'Referral Accepted by Hospital Operations',
              actor: actor.name,
              actor_role: 'HOSPITAL_OPS',
              facility_id: actor.hospitalId,
              facility_name: actor.hospitalName,
              notes: reason || 'Bed and clinical intake verified by Operations Team.',
              is_system_event: false,
              timestamp,
            })

            await auditRepository.log({
              action: 'REFERRAL_ACCEPTED',
              actorId: actor.id,
              actorName: actor.name,
              actorRole: actor.role,
              targetType: 'REFERRAL',
              targetId: referralId,
              targetLabel: `Referral #${referralId} Accepted`,
              details: { hospitalId: actor.hospitalId, reason },
            })

            return { success: true }
          }
        } catch (err: any) {
          console.warn('Supabase operational accept failed, using mock fallback:', err)
        }
      }


      // Mock fallback
      const mockDb = MockDatabase.getInstance()
      const target = mockDb.getReferralById(referralId)
      if (target) {
        target.status = 'ACCEPTED'
        target.sentToFacilityId = actor.hospitalId
        target.sentToFacilityName = actor.hospitalName
        target.updatedAt = timestamp
        target.timeline.unshift({
          id: `evt-${Date.now()}`,
          event: 'Referral Accepted by Hospital Operations',
          actor: actor.name,
          timestamp,
          notes: reason || 'Bed and clinical capacity confirmed.',
          isSystemEvent: false,
        })
        mockDb.upsertReferral(target)

        await auditRepository.log({
          action: 'REFERRAL_ACCEPTED',
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          targetType: 'REFERRAL',
          targetId: referralId,
          targetLabel: `Referral #${referralId} Accepted`,
          details: { hospitalId: actor.hospitalId, reason, mode: 'OFFLINE_FALLBACK' },
        })

        return { success: true }
      }

      return { success: false, error: 'Referral record not found.' }
    }

    if (decision === 'DECLINED') {
      if (!reason || !reason.trim()) {
        return {
          success: false,
          error: 'A reason is required to decline an incoming emergency referral.',
        }
      }

      if (isSupabaseConfigured()) {
        try {
          const { error: refErr } = await supabase
            .from('referrals')
            .update({
              status: 'DECLINED',
              updated_at: timestamp,
            })
            .eq('id', referralId)

          if (!refErr) {
            await supabase.from('referral_events').insert({
              referral_id: referralId,
              event: 'Referral Declined by Receiving Facility Operations',
              actor: actor.name,
              actor_role: 'HOSPITAL_OPS',
              facility_id: actor.hospitalId,
              facility_name: actor.hospitalName,
              notes: reason,
              is_system_event: false,
              timestamp,
            })

            await auditRepository.log({
              action: 'REFERRAL_DECLINED',
              actorId: actor.id,
              actorName: actor.name,
              actorRole: actor.role,
              targetType: 'REFERRAL',
              targetId: referralId,
              targetLabel: `Referral #${referralId} Declined`,
              details: { hospitalId: actor.hospitalId, reason },
            })

            return { success: true }
          }
        } catch (err: any) {
          console.warn('Supabase operational decline failed, using mock fallback:', err)
        }
      }

      // Mock fallback
      const mockDb = MockDatabase.getInstance()
      const target = mockDb.getReferralById(referralId)
      if (target) {
        target.status = 'DECLINED'
        target.updatedAt = timestamp
        target.timeline.unshift({
          id: `evt-${Date.now()}`,
          event: 'Referral Declined by Receiving Facility Operations',
          actor: actor.name,
          timestamp,
          notes: reason,
          isSystemEvent: false,
        })
        mockDb.upsertReferral(target)

        await auditRepository.log({
          action: 'REFERRAL_DECLINED',
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          targetType: 'REFERRAL',
          targetId: referralId,
          targetLabel: `Referral #${referralId} Declined`,
          details: { hospitalId: actor.hospitalId, reason, mode: 'OFFLINE_FALLBACK' },
        })

        return { success: true }
      }


      return { success: false, error: 'Referral record not found.' }
    }

    return { success: false, error: 'Invalid decision type.' }
  },
}

