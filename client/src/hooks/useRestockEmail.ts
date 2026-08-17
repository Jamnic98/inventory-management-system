import { useQuery, useMutation } from '@tanstack/react-query'

import {
  getRecipients,
  getRestockPreview,
  RestockPreviewItem,
  sendRestockEmail,
  SendRestockEmailPayload,
  SendRestockEmailResponse,
  UserRecipient,
} from '../api'

/**
 * Query hook for potential recipients
 */
export const useRecipients = (enabled: boolean = true) => {
  return useQuery<UserRecipient[]>({
    queryKey: ['recipients'],
    queryFn: getRecipients,
    enabled,
  })
}

export const useRestockPreview = (
  scope: 'public' | 'private' | 'both',
  enabled: boolean = true
) => {
  return useQuery<RestockPreviewItem[]>({
    queryKey: ['restock-preview', scope],
    queryFn: () => getRestockPreview(scope),
    enabled,
  })
}

/**
 * Mutation hook for sending restock email
 */
export const useSendRestockEmail = () => {
  return useMutation<SendRestockEmailResponse, Error, SendRestockEmailPayload>({
    mutationFn: sendRestockEmail,
  })
}
