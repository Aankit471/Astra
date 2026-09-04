import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import { referralService } from '@/services/mock/referralService'
import type { PatientBrief, Referral, RequiredCapability } from '@/types/domain'

export const referralRepository = {
  /**
   * List referrals.
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
          return data.map((r: any) => ({
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
              : {
                  referenceCode: 'UNKNOWN',
                  age: 0,
                  sex: 'OTHER',
                  chiefComplaint: 'Emergency Referral',
                  emergencyCategory: 'CARDIAC',
                  urgencyLevel: 'IMMEDIATE',
                },
            requiredCapabilities: Array.isArray(r.required_capabilities) ? r.required_capabilities : [],
            matchedFacilities: Array.isArray(r.matched_facilities) ? r.matched_facilities : [],
            sentToFacilityId: r.sent_to_facility_id,
            sentToFacilityName: r.sent_to_facility_name,
            responseDeadline: new Date(Date.now() + 15 * 60_000).toISOString(),
            timeline: (r.referral_events || []).map((e: any) => ({
              id: e.id,
              event: e.event,
              timestamp: e.timestamp || e.created_at,
              actor: e.actor || 'System',
              notes: e.notes,
              isSystemEvent: !e.actor || e.actor === 'System',
            })),
            decision: r.clinical_decision,
            assignedDoctorId: r.assigned_doctor_id,
          }))
        }
      } catch (err) {
        console.warn('Supabase referral list error, falling back to mock:', err)
      }
    }

    const mockDb = MockDatabase.getInstance()
    return mockDb.referrals.filter((r) => {
      if (filters?.hospitalId && r.sentToFacilityId !== filters.hospitalId) return false
      if (filters?.createdBy && r.createdBy !== filters.createdBy) return false
      if (filters?.doctorId && r.assignedDoctorId !== filters.doctorId) return false
      return true
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
            status: 'MATCHED',
            required_capabilities: capabilities,
            matched_facilities: ['H001', 'H002', 'H003', 'H004'],
            created_by: createdBy,
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
}
