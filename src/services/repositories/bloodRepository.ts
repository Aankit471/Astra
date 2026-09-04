import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import type { BloodGroup, BloodInventoryItem } from '@/types/domain'
import { getFreshnessLevel } from '@/utils/freshness'
import { auditRepository } from './auditRepository'

export interface BloodGroupStatusItem {
  id: string
  hospitalId: string
  hospitalName: string
  bloodGroup: BloodGroup
  component: string
  availableUnits: number
  minimumThreshold: number
  status: 'NORMAL' | 'LOW' | 'CRITICAL'
  lastUpdated: string
}

const ALL_BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const DEFAULT_THRESHOLDS: Record<BloodGroup, number> = {
  'O+': 10,
  'O-': 5,
  'A+': 10,
  'A-': 5,
  'B+': 10,
  'B-': 5,
  'AB+': 4,
  'AB-': 3,
}

export const bloodRepository = {
  /**
   * List blood inventory items from Supabase blood_inventory table.
   */
  async list(hospitalId?: string): Promise<BloodInventoryItem[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('blood_inventory').select('*')
        if (hospitalId) query = query.eq('hospital_id', hospitalId)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map((b: any) => {
            const fresh = getFreshnessLevel(b.last_updated)
            const freshness: 'CURRENT' | 'RECENT' | 'STALE' =
              fresh === 'FRESH' ? 'CURRENT' : fresh === 'AGING' ? 'RECENT' : 'STALE'
            const units = Number(b.available_units ?? 0)

            return {
              id: b.id,
              hospitalId: b.hospital_id,
              hospitalName: b.hospital_name || 'Hospital Blood Bank',
              bloodGroup: b.blood_group as BloodGroup,
              component: b.component || 'PACKED_RBC',
              availableUnits: units,
              status: b.status || (units > 5 ? 'AVAILABLE' : 'LIMITED'),
              lastUpdated: b.last_updated || new Date().toISOString(),
              freshness,
              source: b.source || 'State Blood Transfusion Registry',
              verificationStatus: b.verification_status || 'VERIFIED',
            }
          })
        }
      } catch (err) {
        console.warn('Supabase blood fetch failed, using mock fallback:', err)
      }
    }

    return MockDatabase.getInstance().getBloodInventory(hospitalId)
  },

  /**
   * Get telemetry for all 8 blood groups with thresholds and calculated status
   * (NORMAL, LOW, CRITICAL) for a specific hospital.
   */
  async getHospitalBloodTelemetry(hospitalId: string): Promise<BloodGroupStatusItem[]> {
    const rawList = await this.list(hospitalId)

    return ALL_BLOOD_GROUPS.map((group) => {
      const match = rawList.find((b) => b.bloodGroup === group)
      const units = match ? match.availableUnits : 0
      const threshold = DEFAULT_THRESHOLDS[group] || 5

      let status: 'NORMAL' | 'LOW' | 'CRITICAL' = 'NORMAL'
      if (units <= Math.floor(threshold / 2)) {
        status = 'CRITICAL'
      } else if (units <= threshold) {
        status = 'LOW'
      }

      return {
        id: match?.id || `BLD-${hospitalId}-${group}`,
        hospitalId,
        hospitalName: match?.hospitalName || 'Blood Bank',
        bloodGroup: group,
        component: match?.component || 'PACKED_RBC',
        availableUnits: units,
        minimumThreshold: threshold,
        status,
        lastUpdated: match?.lastUpdated || new Date().toISOString(),
      }
    })
  },

  /**
   * Update blood inventory units with audit logging.
   */
  async updateBloodUnits(
    hospitalId: string,
    bloodGroup: BloodGroup,
    newUnits: number,
    actor: { id: string; name: string; role: string }
  ): Promise<boolean> {
    const safeUnits = Math.max(0, newUnits)
    const timestamp = new Date().toISOString()
    const status = safeUnits > 5 ? 'AVAILABLE' : safeUnits > 0 ? 'LIMITED' : 'FULL'

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('blood_inventory')
          .update({
            available_units: safeUnits,
            status,
            last_updated: timestamp,
          })
          .match({ hospital_id: hospitalId, blood_group: bloodGroup })

        if (!error) {
          await auditRepository.log({
            action: 'BLOOD_INVENTORY_UPDATED',
            actorId: actor.id,
            actorName: actor.name,
            actorRole: actor.role,
            targetType: 'HOSPITAL',
            targetId: hospitalId,
            targetLabel: `Blood Unit ${bloodGroup}`,
            details: { bloodGroup, units: safeUnits },
          })
          return true
        }
      } catch (err) {
        console.warn('Supabase update blood error, using mock fallback:', err)
      }
    }

    // Mock update
    const mockDb = MockDatabase.getInstance()
    const item = mockDb.bloodInventory.find(
      (b) => b.hospitalId === hospitalId && b.bloodGroup === bloodGroup
    )
    if (item) {
      item.availableUnits = safeUnits
      item.lastUpdated = timestamp
      await auditRepository.log({
        action: 'BLOOD_INVENTORY_UPDATED',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        targetType: 'HOSPITAL',
        targetId: hospitalId,
        targetLabel: `Blood Unit ${bloodGroup}`,
        details: { bloodGroup, units: safeUnits, mode: 'OFFLINE_FALLBACK' },
      })
      return true
    }

    return false
  },

  /**
   * Get blood inventory for a specific blood group.
   */
  async getByBloodGroup(bloodGroup: BloodGroup): Promise<BloodInventoryItem[]> {
    const list = await this.list()
    return list.filter((b) => b.bloodGroup === bloodGroup)
  },
}
