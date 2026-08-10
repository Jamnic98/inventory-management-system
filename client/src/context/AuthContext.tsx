import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { apiClient } from '../api/client'

export type User = {
  id: number
  email: string
  name: string | null
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  loginWithToken: (token: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check existing session on app mount
  useEffect(() => {
    let isMounted = true

    const fetchCurrentUser = async () => {
      try {
        const response = await apiClient.get<{ user: User }>('/auth/me')
        if (isMounted) setUser(response.user)
      } catch {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

  // Login handler for magic link tokens
  const loginWithToken = useCallback(async (token: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.get<{ user: User }>(`/auth/login?token=${token}`)
      setUser(response.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

  // Prevent downstream re-renders on every AuthProvider render
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      loginWithToken,
      logout,
    }),
    [user, isLoading, loginWithToken, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
