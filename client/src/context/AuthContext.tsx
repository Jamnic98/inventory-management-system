import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { apiClient } from '../api/client'
import { TOKEN_KEY } from '../utils/constants'
import { type User } from '../types/user'

type AuthContextType = {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  loginWithToken: (token: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Synchronize initial state with TOKEN_KEY
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY)
  })

  const [isLoading, setIsLoading] = useState(true)

  // Check existing session on app mount
  useEffect(() => {
    let isMounted = true

    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY)

      if (!storedToken) {
        if (isMounted) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        const response = await apiClient.get<{ user: User }>('/auth/me')
        if (isMounted) {
          setUser(response.user)
        }
      } catch (error) {
        if (isMounted) {
          // Token is invalid/expired — clean up storage and state
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setUser(null)
        }
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
  const loginWithToken = useCallback(async (magicToken: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.get<{ user: User; token?: string }>(
        `/auth/login?token=${magicToken}`
      )

      const authToken = response.token || magicToken

      localStorage.setItem(TOKEN_KEY, authToken)
      setToken(authToken)
      setUser(response.user)
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user),
      loginWithToken,
      logout,
    }),
    [user, token, isLoading, loginWithToken, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
