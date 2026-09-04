import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import type { SpecialistTeamMember } from '@/types/domain'

export interface HospitalDoctorItem {
  id: string
  doctorId: string
  name: string
  doctorCode: string
  registrationNumber: string
  specialty: string
  department: string
  hospitalId: string
  hospitalName: string
  onCall: boolean
  isAvailable: boolean
  status: 'AVAILABLE' | 'ON_CALL' | 'BUSY' | 'UNAVAILABLE'
  contactPhone?: string
  assignedCasesCount: number
  lastUpdated: string
}

export const doctorRepository = {
  /**
   * List specialists/doctors by hospital or overall from Supabase doctors table.
   */
  async list(hospitalId?: string): Promise<SpecialistTeamMember[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('doctors').select('*')
        if (hospitalId) query = query.eq('hospital_id', hospitalId)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map((d: any) => {
            const isOnCall = d.status === 'ON_CALL' || d.on_call === true
            return {
              id: d.id,
              doctorId: d.id,
              doctorCode: d.doctor_code || d.registration_number || `DOC-${d.id.slice(0, 4)}`,
              doctorName: d.name,
              specialty: d.specialty,
              department: d.department || d.specialty,
              hospitalId: d.hospital_id,
              hospitalName: 'Hospital',
              status: isOnCall ? 'ON_CALL' : (d.status as any) || 'AVAILABLE',
              lastUpdated: d.last_updated || new Date().toISOString(),
              isAvailable: d.is_available ?? (isOnCall || d.status === 'AVAILABLE'),
            }
          })
        }
      } catch (err) {
        console.warn('Supabase doctor fetch failed, using mock fallback:', err)
      }
    }

    return MockDatabase.getInstance().getSpecialists(hospitalId)
  },

  /**
   * Get rich hospital doctor list with on-call flags, registration numbers, and assigned case counts.
   */
  async getHospitalSpecialists(hospitalId: string): Promise<HospitalDoctorItem[]> {
    const rawDoctors = await this.list(hospitalId)

    // Optionally count active referrals assigned to doctors
    const activeCaseMap: Record<string, number> = {}
    if (isSupabaseConfigured()) {
      try {
        const { data: refData } = await supabase
          .from('referrals')
          .select('assigned_doctor_id, status')
          .eq('sent_to_facility_id', hospitalId)
          .not('status', 'in', '("COMPLETED","DECLINED")')

        if (refData) {
          for (const r of refData) {
            if (r.assigned_doctor_id) {
              activeCaseMap[r.assigned_doctor_id] = (activeCaseMap[r.assigned_doctor_id] || 0) + 1
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch doctor assigned cases count:', err)
      }
    }

    return rawDoctors.map((d) => {
      const isOnCall = d.status === 'ON_CALL'
      return {
        id: d.id,
        doctorId: d.doctorId,
        name: d.doctorName,
        doctorCode: d.doctorCode,
        registrationNumber: d.doctorCode,
        specialty: d.specialty,
        department: d.department,
        hospitalId: d.hospitalId,
        hospitalName: d.hospitalName,
        onCall: isOnCall,
        isAvailable: d.isAvailable,
        status: (d.status as any) || 'AVAILABLE',
        assignedCasesCount: activeCaseMap[d.doctorId] ?? (isOnCall ? 2 : 0),
        lastUpdated: d.lastUpdated,
      }
    })
  },

  /**
   * Get specialist by doctor ID.
   */
  async getByDoctorId(doctorId: string): Promise<SpecialistTeamMember | undefined> {
    const list = await this.list()
    return list.find((d) => d.doctorId === doctorId)
  },
}
