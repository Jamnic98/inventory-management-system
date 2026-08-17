import { apiClient } from '.'
import { DashboardData } from '../types/dashboard'

export async function getDashboardData(): Promise<DashboardData> {
  return apiClient.get('/dashboard')
}
export interface UserRecipient {
  id: number
  name: string | null
  email: string
}

export interface RestockPreviewItem {
  id: number
  label: string
  currentQty: number
  threshold: number
  isOutOfStock: boolean
  locationName: string
}

export interface SendRestockEmailPayload {
  recipientIds: number[]
  scope: 'public' | 'private' | 'both'
}

export interface SendRestockEmailResponse {
  message: string
  itemCount: number
}

// Fix 'res is of type unknown' by handling both Axios and direct-unwrapped clients
export const getRecipients = async (): Promise<UserRecipient[]> => {
  const res = await apiClient.get<UserRecipient[]>('/dashboard/recipients')
  const data = (res as { data?: UserRecipient[] }).data ?? res
  return Array.isArray(data) ? data : []
}

export const getRestockPreview = async (
  scope: 'public' | 'private' | 'both'
): Promise<RestockPreviewItem[]> => {
  const res = await apiClient.get<RestockPreviewItem[]>(`/dashboard/restock-preview?scope=${scope}`)
  const data = (res as { data?: RestockPreviewItem[] }).data ?? res
  return Array.isArray(data) ? data : []
}

export const sendRestockEmail = async (
  payload: SendRestockEmailPayload
): Promise<SendRestockEmailResponse> => {
  const res = await apiClient.post<SendRestockEmailResponse>(
    '/dashboard/send-restock-email',
    payload
  )
  return (res as { data?: SendRestockEmailResponse }).data ?? res
}
