import { supabase, isSupabaseConfigured } from '@/services/supabase/supabaseClient'
import { mockApi } from './mockAdapter'
import type { AstraApi, ReferralFilters, ApiSession } from './types'
import type {
  AuditEvent,
  BloodGroup,
  BloodInventoryItem,
  Hospital,
  Notification,
  PatientBrief,
  Referral,
  RequiredCapability,
  SpecialistTeamMember,
  VerificationStatus,
  BedAvailability,
  ReferralTimelineEvent,
} from '@/types/domain'
import { ROLE_PERMISSIONS, type UserRole } from '@/types/auth'
import { getFreshnessLevel } from '@/utils/freshness'

// Helper: map DB hospital + bed rows to domain Hospital
function mapDbHospital(row: any, beds: any[] = []): Hospital {
  const mappedBeds: BedAvailability[] = beds.map((b) => ({
    id: b.id,
    hospitalId: row.id,
    category: b.category || 'EMERGENCY',
    roomType: b.room_type || 'SHARED',
    comfort: b.comfort || 'AC',
    clinicalSupport: b.clinical_support || 'STANDARD',
    totalBeds: b.total_beds,
    availableBeds: b.available_beds,
    occupiedBeds: b.occupied_beds,
    reservedBeds: b.reserved_beds ?? 0,
    availabilityStatus: b.available_beds > 0 ? 'AVAILABLE' : 'FULL',
    verificationStatus: 'VERIFIED',
    lastUpdatedAt: b.last_updated || new Date().toISOString(),
    source: 'HOSPITAL_TELEMETRY',
    chargePerDay: b.charge_per_day ? Number(b.charge_per_day) : undefined,
    chargeFormatted: b.charge_per_day ? `₹${Number(b.charge_per_day).toLocaleString()} / day` : undefined,
    notes: b.ward_name,
  }))

  return {
    id: row.id,
    name: row.name,
    shortName: row.code || row.name,
    type: row.type || 'PRIVATE',
    location: {
      lat: row.latitude ? Number(row.latitude) : 12.9716,
      lng: row.longitude ? Number(row.longitude) : 77.5946,
    },
    address: {
      line1: row.address_line1 || '',
      city: row.city || '',
      state: 'Karnataka',
      pincode: row.pincode || '',
    },
    phone: row.phone || '',
    emergencyPhone: row.emergency_phone || row.phone || '',
    email: row.email || '',
    verificationStatus: row.verification_status || 'VERIFIED',
    isActive: row.is_active ?? true,
    registeredAt: row.created_at || new Date().toISOString(),
    capabilities: {
      emergencyCategories: ['CARDIAC', 'TRAUMA', 'RESPIRATORY', 'NEURO'],
      capabilities: [
        {
          id: `${row.id}-icu`,
          category: 'CRITICAL_CARE',
          item: 'ICU',
          label: 'Intensive Care Unit (ICU)',
          available: true,
          verificationStatus: 'VERIFIED',
          lastUpdated: row.last_updated || new Date().toISOString(),
        },
        {
          id: `${row.id}-cath`,
          category: 'SPECIALIZATION',
          item: 'CARDIAC_CATH_LAB',
          label: 'Cardiac Cath Lab',
          available: true,
          verificationStatus: 'VERIFIED',
          lastUpdated: row.last_updated || new Date().toISOString(),
        },
      ],
      overallVerificationStatus: row.verification_status || 'VERIFIED',
      beds: mappedBeds,
    },
    lastUpdated: row.last_updated || new Date().toISOString(),
  }
}

// Helper: map DB referral + patient + events to domain Referral
function mapDbReferral(row: any, patientRow?: any, events: any[] = []): Referral {
  const patient: PatientBrief = patientRow
    ? {
        referenceCode: patientRow.reference_code,
        age: patientRow.age,
        sex: patientRow.sex,
        chiefComplaint: patientRow.chief_complaint,
        emergencyCategory: patientRow.emergency_category,
        urgencyLevel: patientRow.urgency_level,
        bloodGroup: patientRow.blood_group || undefined,
      }
    : {
        referenceCode: 'UNKNOWN',
        age: 0,
        sex: 'OTHER',
        chiefComplaint: 'Emergency Intake',
        emergencyCategory: 'CARDIAC',
        urgencyLevel: 'IMMEDIATE',
      }

  const timeline: ReferralTimelineEvent[] = events.map((e) => ({
    id: e.id,
    event: e.event,
    timestamp: e.timestamp || e.created_at || new Date().toISOString(),
    actor: e.actor || 'System',
    notes: e.notes || undefined,
    isSystemEvent: !e.actor || e.actor === 'System',
  }))

  return {
    id: row.id,
    patient,
    requiredCapabilities: Array.isArray(row.required_capabilities) ? row.required_capabilities : [],
    matchedFacilities: Array.isArray(row.matched_facilities) ? row.matched_facilities : [],
    sentToFacilityId: row.sent_to_facility_id || undefined,
    sentToFacilityName: row.sent_to_facility_name || undefined,
    status: row.status,
    timeline,
    decision: row.clinical_decision || undefined,
    assignedDoctorId: row.assigned_doctor_id || undefined,
    responseDeadline: new Date(Date.now() + 15 * 60_000).toISOString(),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  }
}

export const supabaseApi: AstraApi = {
  auth: {
    async login(email: string, password: string): Promise<ApiSession> {
      if (!isSupabaseConfigured()) return mockApi.auth.login(email, password)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error || !data.user) {
          return mockApi.auth.login(email, password)
        }
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        const role: UserRole = (profile?.role as UserRole) || 'USER'
        return {
          user: {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.name || email.split('@')[0],
            role,
            hospitalId: profile?.hospital_id,
            permissions: ROLE_PERMISSIONS[role] || [],
          },
          token: data.session?.access_token || `supa-${data.user.id}`,
          expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
        }
      } catch {
        return mockApi.auth.login(email, password)
      }
    },
    async logout(): Promise<void> {
      if (!isSupabaseConfigured()) return mockApi.auth.logout()
      await supabase.auth.signOut().catch(() => {})
    },
    async currentSession(): Promise<ApiSession | null> {
      if (!isSupabaseConfigured()) return mockApi.auth.currentSession()
      try {
        const { data } = await supabase.auth.getSession()
        if (!data.session?.user) return null
        const user = data.session.user
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        const role: UserRole = (profile?.role as UserRole) || 'USER'
        return {
          user: {
            id: user.id,
            email: user.email!,
            name: profile?.name || user.email!.split('@')[0],
            role,
            hospitalId: profile?.hospital_id,
            permissions: ROLE_PERMISSIONS[role] || [],
          },
          token: data.session.access_token,
          expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
        }
      } catch {
        return null
      }
    },
  },

  referrals: {
    async list(filters?: ReferralFilters): Promise<Referral[]> {
      if (!isSupabaseConfigured()) return mockApi.referrals.list(filters)
      try {
        let query = supabase.from('referrals').select('*, patients(*), referral_events(*)')
        if (filters?.createdBy) query = query.eq('created_by', filters.createdBy)
        if (filters?.hospitalId) query = query.eq('sent_to_facility_id', filters.hospitalId)
        if (filters?.doctorId) query = query.eq('assigned_doctor_id', filters.doctorId)
        if (filters?.status) query = query.eq('status', filters.status)

        const { data, error } = await query.order('updated_at', { ascending: false })
        if (error || !data) return mockApi.referrals.list(filters)

        return data.map((row: any) =>
          mapDbReferral(row, row.patients, row.referral_events || [])
        )
      } catch {
        return mockApi.referrals.list(filters)
      }
    },

    async get(id: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.get(id)
      try {
        const { data, error } = await supabase
          .from('referrals')
          .select('*, patients(*), referral_events(*)')
          .eq('id', id)
          .single()

        if (error || !data) return mockApi.referrals.get(id)
        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.get(id)
      }
    },

    async create(patient: PatientBrief, capabilities: RequiredCapability[], createdBy: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.create(patient, capabilities, createdBy)
      try {
        const { data: pData, error: pError } = await supabase
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

        if (pError || !pData) return mockApi.referrals.create(patient, capabilities, createdBy)

        const referralId = `REF-${Date.now().toString().slice(-6)}`
        const { data: rData, error: rError } = await supabase
          .from('referrals')
          .insert({
            id: referralId,
            patient_id: pData.id,
            status: 'MATCHED',
            required_capabilities: capabilities,
            matched_facilities: ['H001', 'H002', 'H003', 'H004'],
            created_by: createdBy,
          })
          .select()
          .single()

        if (rError || !rData) return mockApi.referrals.create(patient, capabilities, createdBy)

        await supabase.from('referral_events').insert({
          referral_id: referralId,
          event: 'Referral created and matched to receiving network.',
          actor: createdBy,
        })

        return mapDbReferral(rData, pData, [{ id: 'evt-1', event: 'Referral created', actor: createdBy, timestamp: new Date().toISOString(), isSystemEvent: false }])
      } catch {
        return mockApi.referrals.create(patient, capabilities, createdBy)
      }
    },

    async send(id: string, hospitalId: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.send(id, hospitalId)
      try {
        const { data: h } = await supabase.from('hospitals').select('name').eq('id', hospitalId).single()
        const hospitalName = h?.name || 'Receiving Hospital'

        const { data, error } = await supabase
          .from('referrals')
          .update({
            sent_to_facility_id: hospitalId,
            sent_to_facility_name: hospitalName,
            status: 'PENDING_TRIAGE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, patients(*), referral_events(*)')
          .single()

        if (error || !data) return mockApi.referrals.send(id, hospitalId)

        await supabase.from('referral_events').insert({
          referral_id: id,
          event: `Referral sent to ${hospitalName} - awaiting intake review.`,
          actor: 'Emergency Desk',
        })

        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.send(id, hospitalId)
      }
    },

    async routeToClinical(id: string, actorId?: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.routeToClinical(id, actorId)
      try {
        const { data, error } = await supabase
          .from('referrals')
          .update({
            status: 'REVIEWING',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, patients(*), referral_events(*)')
          .single()

        if (error || !data) return mockApi.referrals.routeToClinical(id, actorId)

        await supabase.from('referral_events').insert({
          referral_id: id,
          event: 'Intake validated by Hospital Ops. Routed to Duty Medical Officer / Specialist queue.',
          actor: actorId || 'Hospital Operations',
        })

        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.routeToClinical(id, actorId)
      }
    },

    async requestInformation(id: string, notes: string, actorId?: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.requestInformation(id, notes, actorId)
      try {
        const { data, error } = await supabase
          .from('referrals')
          .update({
            status: 'INFO_REQUESTED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, patients(*), referral_events(*)')
          .single()

        if (error || !data) return mockApi.referrals.requestInformation(id, notes, actorId)

        await supabase.from('referral_events').insert({
          referral_id: id,
          event: 'Clinical team requested additional telemetry / ECG clarification.',
          actor: actorId || 'Clinical Desk',
          notes,
        })

        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.requestInformation(id, notes, actorId)
      }
    },

    async timeout(id: string, actorId?: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.timeout(id, actorId)
      try {
        const { data, error } = await supabase
          .from('referrals')
          .update({
            status: 'ESCALATED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, patients(*), referral_events(*)')
          .single()

        if (error || !data) return mockApi.referrals.timeout(id, actorId)

        await supabase.from('referral_events').insert({
          referral_id: id,
          event: 'Review timer expired without decision. Escalated to Network Operations Center.',
          actor: actorId || 'System Automator',
        })

        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.timeout(id, actorId)
      }
    },

    async accept(id: string, overrideAcknowledged?: boolean, overrideNotes?: string, actorId?: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.accept(id, overrideAcknowledged, overrideNotes, actorId)
      try {
        const decision = {
          type: 'ACCEPT' as const,
          decidedBy: actorId || 'Duty Specialist',
          decidedAt: new Date().toISOString(),
          notes: overrideNotes || 'Clinically accepted for emergency admission.',
        }

        const { data, error } = await supabase
          .from('referrals')
          .update({
            status: 'PENDING_CONFIRMATION',
            clinical_decision: decision,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, patients(*), referral_events(*)')
          .single()

        if (error || !data) return mockApi.referrals.accept(id, overrideAcknowledged, overrideNotes, actorId)

        await supabase.from('referral_events').insert({
          referral_id: id,
          event: 'Clinical decision: ACCEPTED by attending specialist. Awaiting bed allocation confirmation.',
          actor: actorId || 'Clinical Specialist',
          notes: overrideNotes,
        })

        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.accept(id, overrideAcknowledged, overrideNotes, actorId)
      }
    },

    async confirm(id: string, actorId?: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.confirm(id, actorId)
      try {
        const { data, error } = await supabase
          .from('referrals')
          .update({
            status: 'CONFIRMED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, patients(*), referral_events(*)')
          .single()

        if (error || !data) return mockApi.referrals.confirm(id, actorId)

        await supabase.from('referral_events').insert({
          referral_id: id,
          event: 'Hospital Operations confirmed bed reservation. Emergency bay standing by.',
          actor: actorId || 'Hospital Operations',
        })

        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.confirm(id, actorId)
      }
    },

    async decline(id: string, reason: string, actorId?: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.decline(id, reason, actorId)
      try {
        const decision = {
          type: 'DECLINE' as const,
          decidedBy: actorId || 'Clinical Desk',
          decidedAt: new Date().toISOString(),
          declineReason: 'OTHER' as const,
          declineNotes: reason,
        }

        const { data, error } = await supabase
          .from('referrals')
          .update({
            status: 'DECLINED',
            clinical_decision: decision,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, patients(*), referral_events(*)')
          .single()

        if (error || !data) return mockApi.referrals.decline(id, reason, actorId)

        await supabase.from('referral_events').insert({
          referral_id: id,
          event: `Referral declined: ${reason}. Escalated to ASTRA network coordination.`,
          actor: actorId || 'Clinical Desk',
          notes: reason,
        })

        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.decline(id, reason, actorId)
      }
    },

    async arrive(id: string, actorId?: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.arrive(id, actorId)
      try {
        const { data, error } = await supabase
          .from('referrals')
          .update({
            status: 'ARRIVED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, patients(*), referral_events(*)')
          .single()

        if (error || !data) return mockApi.referrals.arrive(id, actorId)

        await supabase.from('referral_events').insert({
          referral_id: id,
          event: 'Patient arrived at emergency bay. Immediate triage handoff in progress.',
          actor: actorId || 'Triage Nurse',
        })

        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.arrive(id, actorId)
      }
    },

    async complete(id: string, actorId?: string): Promise<Referral> {
      if (!isSupabaseConfigured()) return mockApi.referrals.complete(id, actorId)
      try {
        const { data, error } = await supabase
          .from('referrals')
          .update({
            status: 'COMPLETED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, patients(*), referral_events(*)')
          .single()

        if (error || !data) return mockApi.referrals.complete(id, actorId)

        await supabase.from('referral_events').insert({
          referral_id: id,
          event: 'Referral lifecycle completed. Patient transferred to definitive care.',
          actor: actorId || 'Admissions',
        })

        return mapDbReferral(data, data.patients, data.referral_events || [])
      } catch {
        return mockApi.referrals.complete(id, actorId)
      }
    },
  },

  hospitals: {
    async list(): Promise<Hospital[]> {
      if (!isSupabaseConfigured()) return mockApi.hospitals.list()
      try {
        const { data: hData, error: hError } = await supabase.from('hospitals').select('*').order('name')
        if (hError || !hData || !hData.length) return mockApi.hospitals.list()

        const { data: bData } = await supabase.from('hospital_beds').select('*')
        const bedsByHospital: Record<string, any[]> = {}
        ;(bData || []).forEach((bed) => {
          if (!bedsByHospital[bed.hospital_id]) bedsByHospital[bed.hospital_id] = []
          bedsByHospital[bed.hospital_id].push(bed)
        })

        return hData.map((h) => mapDbHospital(h, bedsByHospital[h.id] || []))
      } catch {
        return mockApi.hospitals.list()
      }
    },

    async get(id: string): Promise<Hospital> {
      if (!isSupabaseConfigured()) return mockApi.hospitals.get(id)
      try {
        const { data: hData, error: hError } = await supabase.from('hospitals').select('*').eq('id', id).single()
        if (hError || !hData) return mockApi.hospitals.get(id)

        const { data: bData } = await supabase.from('hospital_beds').select('*').eq('hospital_id', id)
        return mapDbHospital(hData, bData || [])
      } catch {
        return mockApi.hospitals.get(id)
      }
    },

    async verifyCapability(hospitalId: string, capabilityId: string, status: VerificationStatus): Promise<Hospital> {
      if (!isSupabaseConfigured()) return mockApi.hospitals.verifyCapability(hospitalId, capabilityId, status)
      try {
        await supabase
          .from('hospitals')
          .update({ verification_status: status, last_updated: new Date().toISOString() })
          .eq('id', hospitalId)
        return this.get(hospitalId)
      } catch {
        return mockApi.hospitals.verifyCapability(hospitalId, capabilityId, status)
      }
    },

    async updateBedAvailability(
      hospitalId: string,
      bedId: string,
      availableBeds: number,
      occupiedBeds: number
    ): Promise<Hospital> {
      if (!isSupabaseConfigured()) {
        return mockApi.hospitals.updateBedAvailability(hospitalId, bedId, availableBeds, occupiedBeds)
      }
      try {
        const safeAvail = Math.max(0, availableBeds)
        const safeOcc = Math.max(0, occupiedBeds)
        const total = Math.max(safeAvail + safeOcc, 1)

        const { error } = await supabase
          .from('hospital_beds')
          .update({
            available_beds: safeAvail,
            occupied_beds: safeOcc,
            total_beds: total,
            last_updated: new Date().toISOString(),
          })
          .eq('id', bedId)

        if (error) {
          return mockApi.hospitals.updateBedAvailability(hospitalId, bedId, availableBeds, occupiedBeds)
        }
        return this.get(hospitalId)
      } catch {
        return mockApi.hospitals.updateBedAvailability(hospitalId, bedId, availableBeds, occupiedBeds)
      }
    },
  },

  blood: {
    async list(hospitalId?: string): Promise<BloodInventoryItem[]> {
      if (!isSupabaseConfigured()) return mockApi.blood.list(hospitalId)
      try {
        let query = supabase.from('blood_inventory').select('*')
        if (hospitalId) query = query.eq('hospital_id', hospitalId)

        const { data, error } = await query
        if (error || !data || !data.length) return mockApi.blood.list(hospitalId)

        return data.map((b) => {
          const fresh = getFreshnessLevel(b.last_updated)
          const freshness: 'CURRENT' | 'RECENT' | 'STALE' =
            fresh === 'FRESH' ? 'CURRENT' : fresh === 'AGING' ? 'RECENT' : 'STALE'
          return {
            id: b.id,
            hospitalId: b.hospital_id,
            hospitalName: 'Blood Center',
            bloodGroup: b.blood_group as BloodGroup,
            component: 'WHOLE_BLOOD',
            availableUnits: b.units_available,
            status: b.units_available > 5 ? 'AVAILABLE' : 'LIMITED',
            lastUpdated: b.last_updated,
            freshness,
            source: 'HOSPITAL_TELEMETRY',
            verificationStatus: 'VERIFIED',
          }
        })
      } catch {
        return mockApi.blood.list(hospitalId)
      }
    },

    async getRelevant(bloodGroup: BloodGroup): Promise<BloodInventoryItem[]> {
      if (!isSupabaseConfigured()) return mockApi.blood.getRelevant(bloodGroup)
      try {
        const { data, error } = await supabase.from('blood_inventory').select('*').eq('blood_group', bloodGroup)
        if (error || !data || !data.length) return mockApi.blood.getRelevant(bloodGroup)

        return data.map((b) => {
          const fresh = getFreshnessLevel(b.last_updated)
          const freshness: 'CURRENT' | 'RECENT' | 'STALE' =
            fresh === 'FRESH' ? 'CURRENT' : fresh === 'AGING' ? 'RECENT' : 'STALE'
          return {
            id: b.id,
            hospitalId: b.hospital_id,
            hospitalName: 'Blood Center',
            bloodGroup: b.blood_group as BloodGroup,
            component: 'WHOLE_BLOOD',
            availableUnits: b.units_available,
            status: b.units_available > 5 ? 'AVAILABLE' : 'LIMITED',
            lastUpdated: b.last_updated,
            freshness,
            source: 'HOSPITAL_TELEMETRY',
            verificationStatus: 'VERIFIED',
          }
        })
      } catch {
        return mockApi.blood.getRelevant(bloodGroup)
      }
    },
  },

  specialists: {
    async list(hospitalId?: string): Promise<SpecialistTeamMember[]> {
      if (!isSupabaseConfigured()) return mockApi.specialists.list(hospitalId)
      try {
        let query = supabase.from('doctors').select('*')
        if (hospitalId) query = query.eq('hospital_id', hospitalId)

        const { data, error } = await query
        if (error || !data || !data.length) return mockApi.specialists.list(hospitalId)

        return data.map((d) => ({
          id: d.id,
          doctorId: d.id,
          doctorCode: d.registration_number || `DOC-${d.id.slice(0, 4)}`,
          doctorName: d.name,
          specialty: d.specialty,
          department: d.specialty,
          hospitalId: d.hospital_id,
          hospitalName: 'Hospital',
          status: d.on_call ? 'ON_CALL' : 'AVAILABLE',
          lastUpdated: new Date().toISOString(),
          isAvailable: d.on_call ?? true,
        }))
      } catch {
        return mockApi.specialists.list(hospitalId)
      }
    },

    async getForDoctor(doctorId: string): Promise<SpecialistTeamMember | undefined> {
      if (!isSupabaseConfigured()) return mockApi.specialists.getForDoctor(doctorId)
      try {
        const { data, error } = await supabase.from('doctors').select('*').eq('id', doctorId).single()
        if (error || !data) return mockApi.specialists.getForDoctor(doctorId)

        return {
          id: data.id,
          doctorId: data.id,
          doctorCode: data.registration_number || `DOC-${data.id.slice(0, 4)}`,
          doctorName: data.name,
          specialty: data.specialty,
          department: data.specialty,
          hospitalId: data.hospital_id,
          hospitalName: 'Hospital',
          status: data.on_call ? 'ON_CALL' : 'AVAILABLE',
          lastUpdated: new Date().toISOString(),
          isAvailable: data.on_call ?? true,
        }
      } catch {
        return mockApi.specialists.getForDoctor(doctorId)
      }
    },
  },

  notifications: {
    async list(userId: string): Promise<Notification[]> {
      if (!isSupabaseConfigured()) return mockApi.notifications.list(userId)
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error || !data || !data.length) return mockApi.notifications.list(userId)

        return data.map((n) => ({
          id: n.id,
          userId: n.user_id,
          hospitalId: n.hospital_id,
          title: n.title,
          body: n.body,
          severity: n.severity,
          isRead: n.is_read,
          createdAt: n.created_at,
        }))
      } catch {
        return mockApi.notifications.list(userId)
      }
    },

    async markRead(id: string): Promise<void> {
      if (!isSupabaseConfigured()) return mockApi.notifications.markRead(id)
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      } catch {
        mockApi.notifications.markRead(id)
      }
    },
  },

  audit: {
    async list(): Promise<AuditEvent[]> {
      if (!isSupabaseConfigured()) return mockApi.audit.list()
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })

        if (error || !data || !data.length) return mockApi.audit.list()

        return data.map((a) => ({
          id: a.id,
          timestamp: a.timestamp,
          action: a.action,
          actorId: a.actor_id || 'system',
          actorName: a.actor_email || 'System User',
          actorRole: 'SYSTEM',
          targetType: (a.entity_type as 'REFERRAL' | 'HOSPITAL' | 'USER' | 'SYSTEM') || 'SYSTEM',
          targetId: a.entity_id || 'general',
          targetLabel: a.action,
          details: typeof a.details === 'object' ? a.details : { info: a.details },
        }))
      } catch {
        return mockApi.audit.list()
      }
    },
  },
}
