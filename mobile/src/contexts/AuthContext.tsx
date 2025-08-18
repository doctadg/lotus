import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth data on mount
    loadStoredAuthData()
  }, [])

  const loadStoredAuthData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken')
      const storedUser = await AsyncStorage.getItem('userData')

      console.log('Loading stored auth data:', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUser,
        tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : null
      })

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          
          // Verify token is a proper JWT by checking structure
          const tokenParts = storedToken.split('.')
          if (tokenParts.length === 3) {
            console.log('Valid JWT token found, setting auth state')
            setToken(storedToken)
            setUser(parsedUser)
          } else {
            console.log('Invalid token format, clearing auth data')
            await AsyncStorage.removeItem('userToken')
            await AsyncStorage.removeItem('userData')
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          // Clear invalid data
          await AsyncStorage.removeItem('userToken')
          await AsyncStorage.removeItem('userData')
        }
      } else {
        console.log('No stored auth data found')
      }
    } catch (error) {
      console.error('Error loading stored auth data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { apiService } = await import('../lib/api')
      const { user, token } = await apiService.login(email, password)
      
      setToken(token)
      setUser(user)
      await AsyncStorage.setItem('userToken', token)
      await AsyncStorage.setItem('userData', JSON.stringify(user))
    } catch (error) {
      console.error('Error during login:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    try {
      const { apiService } = await import('../lib/api')
      const { user, token } = await apiService.register(email, password, name)
      
      setToken(token)
      setUser(user)
      await AsyncStorage.setItem('userToken', token)
      await AsyncStorage.setItem('userData', JSON.stringify(user))
    } catch (error) {
      console.error('Error during registration:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      setToken(null)
      setUser(null)
      await AsyncStorage.removeItem('userToken')
      await AsyncStorage.removeItem('userData')
    } catch (error) {
      console.error('Error clearing auth data:', error)
      throw error
    }
  }

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user
  }

  return (
    <AuthContext.Provider value={value}>
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
