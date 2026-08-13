import React, { createContext, useState, useCallback } from 'react'

import AlertBanner, { type AlertType } from '../components/AlertBanner'

export interface AlertOptions {
  type?: AlertType
  title?: string
  message: React.ReactNode
  /** Duration in milliseconds before auto-dismissing. Default: 5000ms. Set to 0 to keep open until dismissed. */
  duration?: number
  /** Optional undo callback */
  onUndo?: () => void
  undoLabel?: string
}

export interface AlertItem extends AlertOptions {
  id: string
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => string
  dismissAlert: (id: string) => void
  success: (message: React.ReactNode, options?: Omit<AlertOptions, 'message' | 'type'>) => string
  error: (message: React.ReactNode, options?: Omit<AlertOptions, 'message' | 'type'>) => string
  warning: (message: React.ReactNode, options?: Omit<AlertOptions, 'message' | 'type'>) => string
  info: (message: React.ReactNode, options?: Omit<AlertOptions, 'message' | 'type'>) => string
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined)

export default function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }, [])

  const showAlert = useCallback(
    ({ type = 'info', title, message, duration = 5000, onUndo, undoLabel }: AlertOptions) => {
      const id = Math.random().toString(36).substring(2, 9)

      const newAlert: AlertItem = {
        id,
        type,
        title,
        message,
        onUndo,
        undoLabel,
      }

      setAlerts((prev) => [...prev, newAlert])

      // Auto-dismiss setup
      if (duration > 0) {
        setTimeout(() => {
          dismissAlert(id)
        }, duration)
      }

      return id
    },
    [dismissAlert]
  )

  // Convenience shorthand methods
  const success = useCallback(
    (message: React.ReactNode, options?: Omit<AlertOptions, 'message' | 'type'>) =>
      showAlert({ type: 'success', message, ...options }),
    [showAlert]
  )

  const error = useCallback(
    (message: React.ReactNode, options?: Omit<AlertOptions, 'message' | 'type'>) =>
      showAlert({ type: 'error', message, ...options }),
    [showAlert]
  )

  const warning = useCallback(
    (message: React.ReactNode, options?: Omit<AlertOptions, 'message' | 'type'>) =>
      showAlert({ type: 'warning', message, ...options }),
    [showAlert]
  )

  const info = useCallback(
    (message: React.ReactNode, options?: Omit<AlertOptions, 'message' | 'type'>) =>
      showAlert({ type: 'info', message, ...options }),
    [showAlert]
  )

  return (
    <AlertContext.Provider value={{ showAlert, dismissAlert, success, error, warning, info }}>
      {children}

      {/* FLOATING TOAST CONTAINER */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="pointer-events-auto transition-all duration-200 animate-in slide-in-from-bottom-5 fade-in"
          >
            <AlertBanner
              type={alert.type}
              title={alert.title}
              message={alert.message}
              undoLabel={alert.undoLabel}
              onUndo={
                alert.onUndo
                  ? () => {
                      alert.onUndo?.()
                      dismissAlert(alert.id)
                    }
                  : undefined
              }
              onDismiss={() => dismissAlert(alert.id)}
            />
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  )
}
