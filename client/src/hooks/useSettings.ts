import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchSettings, updateSettings, type UserSettings } from '../api/settings'

// Fetch user settings by User ID
export const useSettings = (userId?: number | null) => {
  return useQuery<UserSettings>({
    queryKey: ['user-settings', userId],
    queryFn: () => fetchSettings(userId!),
    enabled: Boolean(userId), // Only run query when userId is defined
  })
}

// Update user settings by User ID
export const useUpdateSettings = (userId?: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updatedSettings: Partial<UserSettings>) => {
      if (!userId) throw new Error('User ID is required to update settings.')
      return updateSettings(userId, updatedSettings)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-settings', userId], data)
    },
  })
}
