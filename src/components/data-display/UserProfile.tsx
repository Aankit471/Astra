import { Mail, ShieldCheck, User } from 'lucide-react'
import type { AuthUser } from '@/types/auth'

export function UserProfile({ user }: { user: AuthUser }) {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
          {user.avatarInitials}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-sm text-cyan-400 font-medium capitalize">{user.role.toLowerCase().replace('_', ' ')} Account</p>
          <p className="text-xs text-gray-400 flex items-center gap-1.5 justify-center sm:justify-start mt-1">
            <Mail size={13} /> {user.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <User size={18} className="text-cyan-400" /> Identity & Contact Information
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-400 block">Full Legal Name</span>
              <strong className="text-white text-sm">{user.name}</strong>
            </div>
            <div>
              <span className="text-gray-400 block">Registered Email</span>
              <strong className="text-white text-sm">{user.email}</strong>
            </div>
            <div>
              <span className="text-gray-400 block">Primary Contact Number</span>
              <strong className="text-white text-sm">+91 98765 43210</strong>
            </div>
            <div>
              <span className="text-gray-400 block">Hospital/Node Affiliation</span>
              <strong className="text-white text-sm">{user.hospitalName || 'ASTRA Coordination Network'}</strong>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <ShieldCheck size={18} className="text-emerald-400" /> Health Scheme & ABHA Linkage
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <strong className="text-emerald-300 block text-sm">PM-JAY Scheme Linked</strong>
                <small className="text-gray-400">National Health Authority Verified</small>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                ACTIVE
              </span>
            </div>

            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-gray-400 block text-[11px]">ABHA Health ID</span>
              <strong className="text-cyan-300 font-mono text-base block mt-0.5">91-8402-9912-34</strong>
            </div>

            <div>
              <span className="text-gray-400 block">Emergency Kin Contact</span>
              <strong className="text-white text-sm">Ananya Kumar (Daughter) · +91 98123 45678</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
