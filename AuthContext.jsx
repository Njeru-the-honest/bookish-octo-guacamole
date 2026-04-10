import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    const storedUser  = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
      }
    }

    setLoading(false)
  }, [])

  // Login — store token and user in state and localStorage
  const login = (tokenValue, userData) => {
    localStorage.setItem('access_token', tokenValue)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }

  // Logout — clear everything
  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  // Refresh current user from the API
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me')
      const updatedUser = response.data.data
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch {
      logout()
    }
  }

  const isAuthenticated = !!token && !!user

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for easy access
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}