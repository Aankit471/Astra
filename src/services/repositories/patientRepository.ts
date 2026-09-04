import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import type { PatientBrief } from '@/types/domain'

export const patientRepository = {
  /**
   * Create emergency patient record in Supabase with synthetic fallback.
   */
  async create(patient: PatientBrief, createdBy: string): Promise<string> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
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
          .select('id')
          .single()

        if (!error && data) return data.id
      } catch (err) {
        console.warn('Supabase patient creation error:', err)
      }
    }

    return `pat-${Date.now()}`
  },
}
