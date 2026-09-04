import type { AstraApi } from './types'
import { mockApi } from './mockAdapter'
import { httpApi } from './httpAdapter'
import { supabaseApi } from './supabaseAdapter'
import { isSupabaseConfigured } from '@/services/supabase/supabaseClient'

// Determine active API adapter:
// 1. If VITE_USE_MOCK_API === 'true', force mockApi
// 2. If Supabase is configured, use supabaseApi (with automatic fallback to mockApi if DB empty/offline)
// 3. Otherwise, use mockApi (or httpApi if explicitly set to VITE_USE_MOCK_API === 'false')
function getActiveApi(): AstraApi {
  if (import.meta.env.VITE_USE_MOCK_API === 'true') {
    return mockApi
  }
  if (isSupabaseConfigured()) {
    return supabaseApi
  }
  if (import.meta.env.VITE_USE_MOCK_API === 'false') {
    return httpApi
  }
  return mockApi
}

export const api: AstraApi = getActiveApi()

export * from './client'
export * from './errors'
export * from './mockAdapter'
export * from './supabaseAdapter'
export type * from './types'
