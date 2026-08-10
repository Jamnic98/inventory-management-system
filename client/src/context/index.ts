import React, { createContext, useContext, useEffect, useState } from 'react'

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
    const fetchCurrentUser = async () => {
      try {
        const response = await apiClient.get<{ user: User }>('/auth/me')
        setUser(response.user)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  // Login handler for magic link tokens
  const loginWithToken = async (token: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.get<{ user: User }>(`/auth/login?token=${token}`)
      setUser(response.user)
    } finally {
      setIsLoading(false)
    }
  }

  // Logout handler
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    loginWithToken,
    logout,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
