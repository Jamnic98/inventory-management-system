import { User, Mail, ShieldCheck, HardDrive } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user } = useAuth()

  const displayName = user?.name || 'Home User'
  const displayEmail = user?.email || '-'
  const userInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
      <p className="mt-1 text-sm text-slate-500">View user details and system configuration.</p>

      {/* User Card */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white shadow-sm">
            {userInitial}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
            <p className="text-sm text-slate-500">{displayEmail}</p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-sm">
          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-slate-600">
              <User className="h-4 w-4 text-slate-400" /> Account Name
            </span>
            <span className="font-medium text-slate-900">{displayName}</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" /> Email
            </span>
            <span className="font-medium text-slate-900">{displayEmail}</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="h-4 w-4 text-slate-400" /> Auth Type
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {user ? 'Magic Link' : 'Local Admin'}
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-slate-600">
              <HardDrive className="h-4 w-4 text-slate-400" /> Access
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              Local Network
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
