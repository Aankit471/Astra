import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import type { Hospital, VerificationStatus } from '@/types/domain'

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
   * Update capability verification status.
   */
  async updateVerification(hospitalId: string, status: VerificationStatus): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('hospitals')
          .update({ verification_status: status, last_updated: new Date().toISOString() })
          .eq('id', hospitalId)
        if (!error) return true
      } catch (err) {
        console.warn('Supabase updateVerification error:', err)
      }
    }
    return MockDatabase.getInstance().updateHospitalDetails(hospitalId, {})
  },
}
