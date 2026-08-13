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

  const isDirty = settings ? JSON.stringify(form) !== JSON.stringify(settings) : false

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
    <div className="max-w-5xl text-xs text-slate-700 pb-24 md:pb-4">
      {/* PAGE HEADER */}
      <div className="pb-4 mb-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Manage your alerts, notification channels, and household defaults.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* DESKTOP: two-column grid. MOBILE: single stacked column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* ALERT PREFERENCES */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Bell className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900">Alert Preferences</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="space-y-0.5 pr-2">
                  <span className="font-medium text-slate-800 block">Expiring Items Alert</span>
                  <span className="text-xs text-slate-500 block">
                    Receive warnings when items are approaching their expiration date.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.defaultNotifyExpiring}
                  onChange={() => handleToggle('defaultNotifyExpiring')}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="space-y-0.5 pr-2">
                  <span className="font-medium text-slate-800 block">Low Stock Alert</span>
                  <span className="text-xs text-slate-500 block">
                    Get notified when item quantities fall below their threshold.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.defaultNotifyLowStock}
                  onChange={() => handleToggle('defaultNotifyLowStock')}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Expiring Threshold Warning
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={form.expiringThresholdDays}
                      onChange={(e) =>
                        handleChange('expiringThresholdDays', Number(e.target.value))
                      }
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

          {/* DELIVERY CHANNELS */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Mail className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900">Delivery Channels</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2.5 pr-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
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
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2.5 pr-2">
                  <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
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
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>

          {/* HOUSEHOLD & LOCATIONS — full width on desktop */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs md:col-span-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900">Household & Locations</h2>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-100 md:max-w-md">
              <div className="space-y-0.5 pr-2">
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
                className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>

        {/* DESKTOP: inline save button at the end of content.
            MOBILE: fixed bar above the bottom tab nav. */}
        <div className="hidden md:flex justify-end mt-6 pt-4 border-t border-slate-200">
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

        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 pt-3 pb-[calc(4.25rem+env(safe-area-inset-bottom)+0.75rem)]">
          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="w-full justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
