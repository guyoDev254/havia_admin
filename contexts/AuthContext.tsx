'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAuth()
  }, [])

  const loadAuth = () => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('admin_token')
      const storedUser = localStorage.getItem('admin_user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    }
    setIsLoading(false)
  }

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data

    // Check if user has any admin role (including new roles)
    const adminRoles = [
      'SUPER_ADMIN',
      'PLATFORM_ADMIN',
      'COMMUNITY_MANAGER',
      'MENTORSHIP_ADMIN',
      'CONTENT_MANAGER',
      'PARTNERSHIP_MANAGER',
      'DATA_ADMIN',
      'SUPPORT_ADMIN',
      'CLUB_MANAGER', // Club managers can access admin panel to manage their clubs
      'ADMIN', // Legacy
      'MODERATOR', // Legacy
    ]

    if (!adminRoles.includes(user.role)) {
      throw new Error('Access denied. Admin role required.')
    }

    setUser(user)
    setToken(token)
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_user', JSON.stringify(user))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

