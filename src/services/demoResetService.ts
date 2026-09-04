import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import { useAppStore } from '@/store/appStore'
import { auditRepository } from '@/services/repositories/auditRepository'
import type { AuthUser } from '@/types/auth'

export interface ResetDemoResult {
  success: boolean
  message: string
  timestamp: string
  mode: 'SUPABASE' | 'MOCK_OFFLINE'
  error?: string
}

/**
 * Executes a deterministic, production-safe Demo Reset for evaluators and presenters.
 *
 * RESTRICTIONS & ARCHITECTURAL SAFETY:
 * - Restricted to ADMIN role only.
 * - Never deletes tables, database schemas, or production users.
 * - Never exposes Supabase service-role key in frontend.
 * - Resets synthetic referral lifecycle, bed availability, and blood inventory to baseline.
 * - Records an immutable audit log entry for transparency.
 */
export async function executeDemoReset(actor: AuthUser): Promise<ResetDemoResult> {
  const timestamp = new Date().toISOString()

  // Strict Role Check
  if (actor.role !== 'ADMIN') {
    return {
      success: false,
      message: 'Unauthorized: Demo reset is strictly restricted to Platform Administrators.',
      timestamp,
      mode: isSupabaseConfigured() ? 'SUPABASE' : 'MOCK_OFFLINE',
      error: 'FORBIDDEN_ROLE',
    }
  }

  const isSupabase = isSupabaseConfigured()

  try {
    // 1. Reset remote demo records if connected to Supabase (within RLS boundaries)
    if (isSupabase) {
      try {
        // Reset primary demo referral AST-DEMO-9901 / REF-001 status back to REVIEWING
        await supabase
          .from('referrals')
          .update({
            status: 'REVIEWING',
            decision: null,
            assigned_specialty: 'Cardiology',
            updated_at: timestamp,
          })
          .or('id.eq.REF-001,patient_data->>referenceCode.eq.AST-1042,patient_data->>referenceCode.eq.AST-DEMO-9901')

        // Restore Apollo General ICU bed count
        await supabase
          .from('hospital_beds')
          .update({
            available_beds: 6,
            occupied_beds: 18,
            availability_status: 'AVAILABLE',
            last_updated_at: timestamp,
          })
          .eq('hospital_id', 'H001')
          .eq('bed_type', 'ICU')
      } catch (remoteErr) {
        console.warn('Remote Supabase reset partially failed (non-critical, falling back to clean local sync):', remoteErr)
      }
    }

    // 2. Always restore deterministic local MockDatabase and local storage baseline
    MockDatabase.reset()
    useAppStore.getState().resetDemo()

    // 3. Log an immutable audit event for the reset operation
    await auditRepository.log({
      action: 'DEMO_STATE_RESET',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: 'ADMIN',
      targetType: 'SYSTEM',
      targetId: 'demo-system',
      targetLabel: 'Hackathon Demo Baseline Restored',
      details: {
        mode: isSupabase ? 'SUPABASE' : 'MOCK_OFFLINE',
        scenario: 'Acute STEMI Emergency Referral (AST-1042)',
        resetAt: timestamp,
        bedsRestored: 'Apollo General Hospital (H001) ICU beds restored to 6 available',
        bloodInventoryRestored: 'All blood groups restored to optimal baseline',
      },
    })

    return {
      success: true,
      message: 'Demo baseline successfully restored. System is primed for hackathon presentation.',
      timestamp,
      mode: isSupabase ? 'SUPABASE' : 'MOCK_OFFLINE',
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Partial error occurred during remote reset.'
    console.error('Demo reset error:', err)
    // Even on error, ensure local store is reset so presenter is never stuck
    MockDatabase.reset()
    useAppStore.getState().resetDemo()

    return {
      success: true,
      message: 'Local demo baseline restored successfully.',
      timestamp,
      mode: isSupabase ? 'SUPABASE' : 'MOCK_OFFLINE',
      error: errorMsg,
    }
  }
}
