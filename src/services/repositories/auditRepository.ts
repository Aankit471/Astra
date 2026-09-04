import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import MockDatabase from '@/services/mock/mockDb'
import type { AuditEvent } from '@/types/domain'

export interface AuditLogEntry {
  id?: string
  timestamp?: string
  action: string
  actorId: string
  actorName: string
  actorRole: string
  targetType: 'REFERRAL' | 'HOSPITAL' | 'USER' | 'SYSTEM'
  targetId: string
  targetLabel: string
  details?: Record<string, any>
  ipAddress?: string
}

export const auditRepository = {
  /**
   * Log an operational mutation or clinical event to Supabase public.audit_logs.
   * Seamlessly logs to MockDatabase as well for local offline fallback.
   */
  async log(entry: AuditLogEntry): Promise<boolean> {
    const id = entry.id || `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const timestamp = entry.timestamp || new Date().toISOString()

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('audit_logs').insert({
          id,
          timestamp,
          action: entry.action,
          actor_id: entry.actorId,
          actor_name: entry.actorName,
          actor_role: entry.actorRole,
          target_type: entry.targetType,
          target_id: entry.targetId,
          target_label: entry.targetLabel,
          details: entry.details || {},
          ip_address: entry.ipAddress || '127.0.0.1',
        })
        if (!error) {
          // Also track in mock memory so UI reflects immediately
          MockDatabase.getInstance().auditEvents.unshift({
            id,
            timestamp,
            action: entry.action,
            actorId: entry.actorId,
            actorName: entry.actorName,
            actorRole: entry.actorRole as any,
            targetType: entry.targetType,
            targetId: entry.targetId,
            targetLabel: entry.targetLabel,
            details: entry.details,
          })
          return true
        }
      } catch (err) {
        console.warn('Supabase audit log insert error, using mock fallback:', err)
      }
    }

    MockDatabase.getInstance().auditEvents.unshift({
      id,
      timestamp,
      action: entry.action,
      actorId: entry.actorId,
      actorName: entry.actorName,
      actorRole: entry.actorRole as any,
      targetType: entry.targetType,
      targetId: entry.targetId,
      targetLabel: entry.targetLabel,
      details: entry.details,
    })
    return true
  },

  /**
   * List recent audit logs for a hospital or target entity.
   */
  async list(targetIdOrFilter?: string | { targetId?: string; facilityId?: string; limit?: number }): Promise<AuditEvent[]> {
    const targetId = typeof targetIdOrFilter === 'string' ? targetIdOrFilter : targetIdOrFilter?.targetId
    const limit = typeof targetIdOrFilter === 'object' && targetIdOrFilter?.limit ? targetIdOrFilter.limit : 20

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(limit)
        if (targetId) {
          query = query.or(`target_id.eq.${targetId},actor_id.eq.${targetId}`)
        }

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map((a: any) => ({
            id: a.id,
            timestamp: a.timestamp,
            action: a.action,
            actorId: a.actor_id,
            actorName: a.actor_name,
            actorRole: a.actor_role,
            targetType: a.target_type,
            targetId: a.target_id,
            targetLabel: a.target_label,
            details: a.details,
          }))
        }
      } catch (err) {
        console.warn('Supabase audit list error, using mock fallback:', err)
      }
    }

    const mockLogs = MockDatabase.getInstance().auditEvents
    if (targetId) {
      return mockLogs.filter((a) => a.targetId === targetId || a.actorId === targetId).slice(0, limit)
    }
    return mockLogs.slice(0, limit)
  },
}
