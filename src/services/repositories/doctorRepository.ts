import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import type { SpecialistTeamMember } from '@/types/domain'

export const doctorRepository = {
  /**
   * List specialists/doctors by hospital or overall.
   */
  async list(hospitalId?: string): Promise<SpecialistTeamMember[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('doctors').select('*')
        if (hospitalId) query = query.eq('hospital_id', hospitalId)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
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
        }
      } catch (err) {
        console.warn('Supabase doctor fetch failed, using mock fallback:', err)
      }
    }

    return MockDatabase.getInstance().getSpecialists(hospitalId)
  },

  /**
   * Get specialist by doctor ID.
   */
  async getByDoctorId(doctorId: string): Promise<SpecialistTeamMember | undefined> {
    const list = await this.list()
    return list.find((d) => d.doctorId === doctorId)
  },
}
