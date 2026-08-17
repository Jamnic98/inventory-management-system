import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../api'

export interface NotificationItem {
  id: number
  title: string
  message: string
  isRead: boolean
  createdAt: string
  locationId?: number
  itemId?: number
}

interface NotificationsResponse {
  notifications: NotificationItem[]
  unreadCount: number
}

export const useNotifications = () => {
  const queryClient = useQueryClient()

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await apiClient.get<NotificationsResponse>('/notifications')
    },
    refetchInterval: 30000,
  })

  // Safely extract notifications array with fallback
  const notifications = data?.notifications ?? []

  // Use server unreadCount or fallback to client calculation
  const unreadCount = data?.unreadCount ?? notifications.filter((n) => !n.isRead).length

  const { mutate: markAllAsRead } = useMutation({
    mutationFn: async () => {
      // Endpoint path matches controller: /api/notifications/mark-read
      await apiClient.patch('/notifications/mark-read')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return {
    notifications,
    unreadCount,
    markAllAsRead,
  }
}
