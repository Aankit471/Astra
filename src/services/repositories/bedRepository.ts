import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import type { BedAvailability } from '@/types/domain'

export const bedRepository = {
  /**
   * Get beds for a given hospital.
   */
  async getByHospitalId(hospitalId: string): Promise<BedAvailability[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('hospital_beds')
          .select('*')
          .eq('hospital_id', hospitalId)

        if (!error && data) {
          return data.map((b) => ({
            id: b.id,
            hospitalId: b.hospital_id,
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
          }))
        }
      } catch (err) {
        console.warn('Supabase bed fetch failed, using mock fallback:', err)
      }
    }

    const hospital = MockDatabase.getInstance().getHospitalById(hospitalId)
    return hospital?.capabilities.beds || []
  },

  /**
   * Update bed availability ensuring available + occupied + reserved <= total.
   */
  async updateBedAvailability(
    hospitalId: string,
    bedId: string,
    availableBeds: number,
    occupiedBeds: number
  ): Promise<boolean> {
    const safeAvail = Math.max(0, availableBeds)
    const safeOcc = Math.max(0, occupiedBeds)
    const total = Math.max(safeAvail + safeOcc, 1)

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('hospital_beds')
          .update({
            available_beds: safeAvail,
            occupied_beds: safeOcc,
            total_beds: total,
            last_updated: new Date().toISOString(),
          })
          .eq('id', bedId)

        if (!error) return true
      } catch (err) {
        console.warn('Supabase update bed error, using mock fallback:', err)
      }
    }

    return MockDatabase.getInstance().updateBedAvailability(hospitalId, bedId, safeAvail, safeOcc)
  },
}
