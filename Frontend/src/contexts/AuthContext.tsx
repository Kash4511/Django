import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiClient } from '../lib/apiClient'

interface User {
  id: number
  email: string
  name: string
  phone_number?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, phone_number: string) => Promise<void>
  register: (email: string, password: string, name: string, phone_number: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const response = await apiClient.get('/api/auth/profile/')
          setUser(response.data)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login/', {
        email,
        password,
      })

      const { access, refresh } = response.data
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)

      // Fetch user profile
      const profileResponse = await apiClient.get('/api/auth/profile/')
      setUser(profileResponse.data)
    } catch (error: any) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const signup = async (email: string, password: string, name: string, phone_number: string) => {
    try {
      const response = await apiClient.post('/api/auth/register/', {
        email,
        password,
        password_confirm: password,
        name,
        phone_number,
      })

      const { access, refresh } = response.data
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)

      // Fetch user profile
      const profileResponse = await apiClient.get('/api/auth/profile/')
      setUser(profileResponse.data)
    } catch (error: any) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, phone_number: string) => {
    try {
      const response = await apiClient.post('/api/auth/register/', {
        email,
        password,
        password_confirm: password,
        name,
        phone_number,
      })
      // Don't automatically log in - just register
      console.log('Registration successful:', response.data)
    } catch (error: any) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    register,
    logout,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}