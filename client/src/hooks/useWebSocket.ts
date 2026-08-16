import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useWebSocketSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Dynamically derive WS protocol and host from current window location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.hostname}:8080`

    const ws = new WebSocket(host)

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        // Handles broadcast({ type: 'stock:opened' }) from openStockUnit controller
        if (
          message.type === 'stock:opened' ||
          message.type?.startsWith('stock:') ||
          message.type?.startsWith('item:')
        ) {
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['items'] })
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    return () => {
      ws.close()
    }
  }, [queryClient])
}
