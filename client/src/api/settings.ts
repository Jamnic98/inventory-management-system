import apiClient from './client'

export interface UserSettings {
  id?: number
  userId?: number
  defaultNotifyExpiring: boolean
  defaultNotifyLowStock: boolean
  autoSubscribeNewLocations: boolean
  expiringThresholdDays: number
  emailNotifications: boolean
  pushNotifications: boolean
}

// GET /api/users/:userId/settings (or /api/settings/:userId)
export const fetchSettings = async (userId: number): Promise<UserSettings> => {
  return apiClient.get<UserSettings>(`/users/${userId}/settings`)
}

// PATCH /api/users/:userId/settings (or /api/settings/:userId)

export const updateSettings = async (
  userId: number,
  updatedSettings: Partial<UserSettings>
): Promise<UserSettings> => {
  return apiClient.patch<UserSettings>(`/users/${userId}/settings`, updatedSettings)
}
