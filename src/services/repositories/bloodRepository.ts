import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import type { BloodGroup, BloodInventoryItem } from '@/types/domain'
import { getFreshnessLevel } from '@/utils/freshness'

export const bloodRepository = {
  /**
   * List blood inventory items.
   */
  async list(hospitalId?: string): Promise<BloodInventoryItem[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('blood_inventory').select('*')
        if (hospitalId) query = query.eq('hospital_id', hospitalId)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map((b) => {
            const fresh = getFreshnessLevel(b.last_updated)
            const freshness: 'CURRENT' | 'RECENT' | 'STALE' =
              fresh === 'FRESH' ? 'CURRENT' : fresh === 'AGING' ? 'RECENT' : 'STALE'
            return {
              id: b.id,
              hospitalId: b.hospital_id,
              hospitalName: 'Blood Bank',
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
        }
      } catch (err) {
        console.warn('Supabase blood fetch failed, using mock fallback:', err)
      }
    }

    return MockDatabase.getInstance().getBloodInventory(hospitalId)
  },

  /**
   * Get blood inventory for a specific blood group.
   */
  async getByBloodGroup(bloodGroup: BloodGroup): Promise<BloodInventoryItem[]> {
    const list = await this.list()
    return list.filter((b) => b.bloodGroup === bloodGroup)
  },
}
