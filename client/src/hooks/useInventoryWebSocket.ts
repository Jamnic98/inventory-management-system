import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { itemKeys } from './useItems'

export function useInventoryWebSocket() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // 💡 Connect to /ws so Vite proxies wss://localhost:5173/ws -> ws://localhost:8080
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    console.log('🔌 Connecting WebSocket via Vite proxy:', wsUrl)
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => console.log('✅ WebSocket Connected via Vite Proxy!')
    ws.onerror = (err) => console.error('❌ WebSocket Error:', err)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (typeof data.type === 'string' && data.type.startsWith('item:')) {
          console.log('🔄 Refetching items query cache...')
          queryClient.invalidateQueries({
            queryKey: itemKeys.all,
            refetchType: 'all',
          })
        }
      } catch (err) {
        console.error('Failed to parse WS event:', err)
      }
    }

    return () => {
      ws.close()
    }
  }, [queryClient])
}
