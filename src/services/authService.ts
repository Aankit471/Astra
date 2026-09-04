import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { DEMO_CREDENTIALS, MOCK_PASSWORDS, MOCK_USERS } from '@/data/users'
import type { AuthUser, UserRole } from '@/types/auth'
import { ROLE_PERMISSIONS } from '@/types/auth'

export interface UserProfile {
  id: string
  role: UserRole
  fullName: string
  email: string
  hospitalId?: string
  doctorId?: string
  createdAt: string
  updatedAt: string
}

export const authService = {
  /**
   * Sign in using Supabase Auth, falling back to demo credentials if Supabase is offline/unconfigured.
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error && data.user) {
          const profile = await this.getCurrentProfile(data.user.id)
          const role: UserRole = profile?.role || 'USER'
          return {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.fullName || email.split('@')[0],
            role,
            hospitalId: profile?.hospitalId,
            permissions: ROLE_PERMISSIONS[role] || [],
          }
        }
      } catch (err) {
        console.warn('Supabase signIn encountered error, using mock credentials fallback:', err)
      }
    }

    // Fallback: verify against demo users
    const validDemo = DEMO_CREDENTIALS.some((c) => c.email === email)
    if (!validDemo || MOCK_PASSWORDS[email] !== password) {
      throw new Error('Invalid email or password.')
    }

    const mockUser = MOCK_USERS.find((u) => u.email === email)
    if (!mockUser) throw new Error('User profile not found.')
    return mockUser
  },

  /**
   * Sign out current user.
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.warn('Supabase signOut error:', err)
      }
    }
  },

  /**
   * Retrieve current Supabase user identity.
   */
  async getCurrentUser() {
    if (!isSupabaseConfigured()) return null
    try {
      const { data } = await supabase.auth.getUser()
      return data.user
    } catch {
      return null
    }
  },

  /**
   * Fetch user profile record from the profiles table.
   */
  async getCurrentProfile(userId?: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null
    try {
      let targetId = userId
      if (!targetId) {
        const user = await this.getCurrentUser()
        targetId = user?.id
      }
      if (!targetId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        role: (data.role as UserRole) || 'USER',
        fullName: data.name || data.email?.split('@')[0] || 'User',
        email: data.email,
        hospitalId: data.hospital_id,
        doctorId: data.doctor_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    } catch {
      return null
    }
  },

  /**
   * Get role of a user from profile table, defaulting to 'USER'.
   */
  async getRole(userId?: string): Promise<UserRole> {
    const profile = await this.getCurrentProfile(userId)
    return profile?.role || 'USER'
  },
}
