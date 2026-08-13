import React, { useEffect, useState } from 'react'
import { Bell, Clock, AlertTriangle, Mail, Smartphone, MapPin, Save, Loader2 } from 'lucide-react'

import { useAuth, useSettings, useUpdateSettings, useAlert } from '../hooks'
import type { UserSettings } from '../api/settings'

export default function Settings() {
  const alert = useAlert()
  const { user } = useAuth()
  const userId = user?.id

  const { data: settings, isLoading, isError } = useSettings(userId)
  const { mutate: updateSettings, isPending } = useUpdateSettings(userId)

  const [form, setForm] = useState<UserSettings>({
    defaultNotifyExpiring: true,
    defaultNotifyLowStock: true,
    autoSubscribeNewLocations: true,
    expiringThresholdDays: 7,
    emailNotifications: true,
    pushNotifications: false,
  })

  // Check if form values differ from initial settings
  const isDirty = settings ? JSON.stringify(form) !== JSON.stringify(settings) : false

  // Populate state when settings finish loading
  useEffect(() => {
    if (settings) {
      setForm(settings)
    }
  }, [settings])

  const handleToggle = (field: keyof UserSettings) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleChange = (field: keyof UserSettings, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      console.error('Missing userId, cannot save settings.')
      alert.error('User not authenticated.')
      return
    }

    // Only save if changes were made
    if (!isDirty) {
      alert.info('No changes were made to settings.')
      return
    }

    updateSettings(form, {
      onSuccess: () => {
        alert.success('Settings saved successfully!')
      },
      onError: (err) => {
        console.error('Failed to save settings:', err)
        const errorMessage =
          err instanceof Error && err.message
            ? err.message
            : 'Failed to save settings. Please try again.'
        alert.error(errorMessage)
      },
    })
  }

  if (!userId) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
        User not authenticated.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-500 gap-2 text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span>Loading settings...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
        <span>Failed to load settings. Please refresh the page.</span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6 text-xs text-slate-700">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-xs">
            Manage your alerts, notification channels, and household defaults.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ALERT PREFERENCES */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Bell className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">Alert Preferences</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="space-y-0.5">
                <span className="font-medium text-slate-800 block">Expiring Items Alert</span>
                <span className="text-xs text-slate-500 block">
                  Receive warnings when items are approaching their expiration date.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.defaultNotifyExpiring}
                onChange={() => handleToggle('defaultNotifyExpiring')}
                className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="space-y-0.5">
                <span className="font-medium text-slate-800 block">Low Stock Alert</span>
                <span className="text-xs text-slate-500 block">
                  Get notified when item quantities fall below their threshold.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.defaultNotifyLowStock}
                onChange={() => handleToggle('defaultNotifyLowStock')}
                className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Expiring Threshold Warning
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={form.expiringThresholdDays}
                    onChange={(e) => handleChange('expiringThresholdDays', Number(e.target.value))}
                    className="w-16 px-2 py-1 text-center font-bold text-slate-900 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-slate-500 text-xs">days</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Items will be flagged as "Expiring Soon" when within this many days of expiry.
              </p>
            </div>
          </div>
        </div>

        {/* HOUSEHOLD & LOCATIONS */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">Household & Locations</h2>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
            <div className="space-y-0.5">
              <span className="font-medium text-slate-800 block">
                Auto-Subscribe to New Locations
              </span>
              <span className="text-xs text-slate-500 block">
                Automatically receive notifications when housemates add new pantry locations.
              </span>
            </div>
            <input
              type="checkbox"
              checked={form.autoSubscribeNewLocations}
              onChange={() => handleToggle('autoSubscribeNewLocations')}
              className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* DELIVERY CHANNELS */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Mail className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">Delivery Channels</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <div className="space-y-0.5">
                  <span className="font-medium text-slate-800 block">Email Notifications</span>
                  <span className="text-xs text-slate-500 block">
                    Send daily summaries and urgent stock alerts to your email.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <div className="space-y-0.5">
                  <span className="font-medium text-slate-800 block">Push Notifications</span>
                  <span className="text-xs text-slate-500 block">
                    Receive instant push alerts directly in your web browser.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
                className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
