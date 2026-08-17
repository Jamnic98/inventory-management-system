import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useInventoryWebSocket() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Connect through Vite proxy route
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type?.startsWith('stock:') || message.type?.startsWith('item:')) {
          queryClient.invalidateQueries({ queryKey: ['items'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    return () => ws.close()
  }, [queryClient])
}
