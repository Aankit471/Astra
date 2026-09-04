import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { useAppStore } from '@/store/appStore'

/**
 * Realtime hook that listens to Postgres changes on core ASTRA tables:
 * - hospital_beds
 * - blood_inventory
 * - referrals
 * - notifications
 *
 * Safely handles clean teardown on component unmount and no-ops if Supabase
 * credentials are not configured.
 */
export function useSupabaseRealtime() {
  const refresh = useAppStore((state) => state.refresh)

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const channel = supabase
      .channel('astra-realtime-telemetry')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referrals' },
        (payload) => {
          console.debug('[Realtime] Referral updated:', payload)
          refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_beds' },
        (payload) => {
          console.debug('[Realtime] Hospital beds updated:', payload)
          refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_inventory' },
        (payload) => {
          console.debug('[Realtime] Blood inventory updated:', payload)
          refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.debug('[Realtime] New notification:', payload)
          refresh()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('[Realtime] Subscribed to ASTRA live telemetry channel.')
        }
      })

    return () => {
      supabase.removeChannel(channel).catch(() => {})
    }
  }, [refresh])
}
