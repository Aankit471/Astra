import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { useAppStore } from '@/store/appStore'

export interface RealtimeTelemetryState {
  isLive: boolean
  status: 'SUBSCRIBED' | 'DISCONNECTED' | 'OFFLINE' | 'CONNECTING'
  error?: string
}

/**
 * Realtime hook that listens to Postgres changes on core ASTRA tables:
 * - hospital_beds
 * - blood_inventory
 * - referrals
 * - notifications
 * - doctors
 *
 * Safely handles clean teardown on component unmount, tracks live connection state,
 * and no-ops if Supabase credentials are not configured.
 */
export function useSupabaseRealtime(onSync?: (table: string, payload: any) => void): RealtimeTelemetryState {
  const refresh = useAppStore((state) => state.refresh)
  const [telemetryState, setTelemetryState] = useState<RealtimeTelemetryState>(() => ({
    isLive: isSupabaseConfigured(),
    status: isSupabaseConfigured() ? 'CONNECTING' : 'OFFLINE',
  }))

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setTelemetryState({ isLive: false, status: 'OFFLINE' })
      return
    }

    const channel = supabase
      .channel('astra-hospital-ops-telemetry')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referrals' },
        (payload) => {
          console.debug('[Realtime] Referral updated:', payload)
          refresh()
          if (onSync) onSync('referrals', payload)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_beds' },
        (payload) => {
          console.debug('[Realtime] Hospital beds updated:', payload)
          refresh()
          if (onSync) onSync('hospital_beds', payload)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_inventory' },
        (payload) => {
          console.debug('[Realtime] Blood inventory updated:', payload)
          refresh()
          if (onSync) onSync('blood_inventory', payload)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        (payload) => {
          console.debug('[Realtime] Doctor status updated:', payload)
          refresh()
          if (onSync) onSync('doctors', payload)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.debug('[Realtime] New notification:', payload)
          refresh()
          if (onSync) onSync('notifications', payload)
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.debug('[Realtime] Subscribed to ASTRA live telemetry channel.')
          setTelemetryState({ isLive: true, status: 'SUBSCRIBED' })
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Realtime] Telemetry channel status:', status, err)
          setTelemetryState({
            isLive: false,
            status: 'DISCONNECTED',
            error: err ? String(err) : 'Realtime connection interrupted',
          })
        }
      })

    return () => {
      supabase.removeChannel(channel).catch(() => {})
    }
  }, [refresh, onSync])

  return telemetryState
}
