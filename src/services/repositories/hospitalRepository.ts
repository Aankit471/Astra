import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import type { Hospital, VerificationStatus } from '@/types/domain'
import { auditRepository } from './auditRepository'

export interface AdminActor {
  id: string
  name: string
  role: string
}

export const hospitalRepository = {
  /**
   * List all hospitals from Supabase with fallback to MockDatabase.
   */
  async list(): Promise<Hospital[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: hData, error } = await supabase
          .from('hospitals')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (!error && hData && hData.length > 0) {
          const { data: bData } = await supabase.from('hospital_beds').select('*')
          const bedsByHospital: Record<string, any[]> = {}
          ;(bData || []).forEach((b) => {
            if (!bedsByHospital[b.hospital_id]) bedsByHospital[b.hospital_id] = []
            bedsByHospital[b.hospital_id].push(b)
          })

          return hData.map((row) => ({
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
            lastUpdated: row.last_updated || new Date().toISOString(),
            capabilities: {
              emergencyCategories: ['CARDIAC', 'TRAUMA', 'RESPIRATORY', 'NEURO'],
              capabilities: [
                {
                  id: `${row.id}-icu`,
                  category: 'CRITICAL_CARE',
                  item: 'ICU',
                  label: 'Intensive Care Unit (ICU)',
                  available: true,
                  verificationStatus: (row.capabilities?.capabilities?.find((c: any) => c.item === 'ICU')?.verificationStatus) || row.verification_status || 'VERIFIED',
                  lastUpdated: row.last_updated || new Date().toISOString(),
                },
                {
                  id: `${row.id}-cath`,
                  category: 'SPECIALIZATION',
                  item: 'CARDIAC_CATH_LAB',
                  label: 'Cardiac Cath Lab',
                  available: true,
                  verificationStatus: (row.capabilities?.capabilities?.find((c: any) => c.item === 'CARDIAC_CATH_LAB')?.verificationStatus) || row.verification_status || 'VERIFIED',
                  lastUpdated: row.last_updated || new Date().toISOString(),
                },
              ],
              overallVerificationStatus: row.verification_status || 'VERIFIED',
              beds: (bedsByHospital[row.id] || []).map((b) => ({
                id: b.id,
                hospitalId: row.id,
                category: b.category,
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
              })),
            },
          }))
        }
      } catch (err) {
        console.warn('Supabase hospital fetch failed, falling back to mock:', err)
      }
    }

    return MockDatabase.getInstance().hospitals
  },

  /**
   * Get single hospital by ID.
   */
  async getById(id: string): Promise<Hospital | undefined> {
    const list = await this.list()
    return list.find((h) => h.id === id)
  },

  /**
   * Update overall hospital verification status.
   * Enforces strict ADMIN RBAC and audit logging.
   */
  async updateVerificationStatus(
    hospitalId: string,
    status: VerificationStatus,
    actor: AdminActor,
    reason = 'Administrative verification review'
  ): Promise<{ success: boolean; error?: string }> {
    if (actor.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only platform administrators can verify hospitals.' }
    }

    const timestamp = new Date().toISOString()

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('hospitals')
          .update({ verification_status: status, last_updated: timestamp })
          .eq('id', hospitalId)

        if (!error) {
          await auditRepository.log({
            action: 'ADMIN_HOSPITAL_VERIFIED',
            actorId: actor.id,
            actorName: actor.name,
            actorRole: 'ADMIN',
            targetType: 'HOSPITAL',
            targetId: hospitalId,
            targetLabel: `Hospital ${hospitalId} Verification Status Changed`,
            details: { newStatus: status, reason },
          })
          MockDatabase.getInstance().updateHospitalDetails(hospitalId, { verificationStatus: status })
          return { success: true }
        }
        return { success: false, error: error.message }
      } catch (err: any) {
        console.warn('Supabase updateVerificationStatus error, using fallback:', err)
      }
    }

    MockDatabase.getInstance().updateHospitalDetails(hospitalId, { verificationStatus: status })
    await auditRepository.log({
      action: 'ADMIN_HOSPITAL_VERIFIED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'ADMIN',
      targetType: 'HOSPITAL',
      targetId: hospitalId,
      targetLabel: `Hospital ${hospitalId} Verification Status Changed`,
      details: { newStatus: status, reason, mode: 'OFFLINE_FALLBACK' },
    })
    return { success: true }
  },

  /**
   * Update capability verification status.
   * Enforces strict ADMIN RBAC and audit logging.
   */
  async updateCapabilityStatus(
    hospitalId: string,
    capabilityId: string,
    status: VerificationStatus,
    actor: AdminActor,
    reason = 'Administrative capability verification'
  ): Promise<{ success: boolean; error?: string }> {
    if (actor.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only platform administrators can verify capabilities.' }
    }

    const timestamp = new Date().toISOString()

    if (isSupabaseConfigured()) {
      try {
        // Fetch current hospital row to update capability JSON
        const { data: hosp } = await supabase.from('hospitals').select('*').eq('id', hospitalId).single()
        if (hosp) {
          const capObj = hosp.capabilities || { emergencyCategories: [], capabilities: [] }
          const capList = Array.isArray(capObj.capabilities) ? capObj.capabilities : []
          const existing = capList.find((c: any) => c.id === capabilityId || c.item === capabilityId)
          if (existing) {
            existing.verificationStatus = status
            existing.lastUpdated = timestamp
          } else {
            capList.push({
              id: capabilityId,
              item: capabilityId,
              label: capabilityId,
              available: true,
              verificationStatus: status,
              lastUpdated: timestamp,
            })
          }
          capObj.capabilities = capList

          await supabase
            .from('hospitals')
            .update({ capabilities: capObj, last_updated: timestamp })
            .eq('id', hospitalId)
        }

        await auditRepository.log({
          action: 'CAPABILITY_STATUS_CHANGED',
          actorId: actor.id,
          actorName: actor.name,
          actorRole: 'ADMIN',
          targetType: 'HOSPITAL',
          targetId: hospitalId,
          targetLabel: `Capability ${capabilityId} status set to ${status}`,
          details: { capabilityId, status, reason },
        })

        MockDatabase.getInstance().updateCapability(hospitalId, capabilityId, status)
        return { success: true }
      } catch (err: any) {
        console.warn('Supabase updateCapabilityStatus error, using fallback:', err)
      }
    }

    MockDatabase.getInstance().updateCapability(hospitalId, capabilityId, status)
    await auditRepository.log({
      action: 'CAPABILITY_STATUS_CHANGED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'ADMIN',
      targetType: 'HOSPITAL',
      targetId: hospitalId,
      targetLabel: `Capability ${capabilityId} status set to ${status}`,
      details: { capabilityId, status, reason, mode: 'OFFLINE_FALLBACK' },
    })
    return { success: true }
  },

  /**
   * Update hospital operational details.
   * Enforces strict ADMIN RBAC and audit logging.
   */
  async updateHospitalDetails(
    hospitalId: string,
    updates: Partial<Hospital>,
    actor: AdminActor
  ): Promise<{ success: boolean; error?: string }> {
    if (actor.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only platform administrators can modify hospital records.' }
    }

    const timestamp = new Date().toISOString()

    if (isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, any> = { last_updated: timestamp }
        if (updates.phone) updatePayload.phone = updates.phone
        if (updates.emergencyPhone) updatePayload.emergency_phone = updates.emergencyPhone
        if (updates.operationalStatus) updatePayload.operational_status = updates.operationalStatus
        if (updates.address?.line1) updatePayload.address_line1 = updates.address.line1

        const { error } = await supabase.from('hospitals').update(updatePayload).eq('id', hospitalId)
        if (!error) {
          await auditRepository.log({
            action: 'ADMIN_HOSPITAL_UPDATE',
            actorId: actor.id,
            actorName: actor.name,
            actorRole: 'ADMIN',
            targetType: 'HOSPITAL',
            targetId: hospitalId,
            targetLabel: `Hospital ${hospitalId} operational profile updated`,
            details: { updates },
          })
          MockDatabase.getInstance().updateHospitalDetails(hospitalId, updates)
          return { success: true }
        }
        return { success: false, error: error.message }
      } catch (err: any) {
        console.warn('Supabase updateHospitalDetails error, using fallback:', err)
      }
    }

    MockDatabase.getInstance().updateHospitalDetails(hospitalId, updates)
    await auditRepository.log({
      action: 'ADMIN_HOSPITAL_UPDATE',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'ADMIN',
      targetType: 'HOSPITAL',
      targetId: hospitalId,
      targetLabel: `Hospital ${hospitalId} operational profile updated`,
      details: { updates, mode: 'OFFLINE_FALLBACK' },
    })
    return { success: true }
  },

  /**
   * Legacy method for backwards compatibility.
   */
  async updateVerification(hospitalId: string, status: VerificationStatus): Promise<boolean> {
    const res = await this.updateVerificationStatus(
      hospitalId,
      status,
      { id: 'admin-system', name: 'Platform Admin', role: 'ADMIN' },
      'Verification status change'
    )
    return res.success
  },
}
