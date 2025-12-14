import React, { createContext, useContext, useState, useEffect } from 'react'
import { Admin } from '@/types'
import { authenticateAdmin, getAdminById } from '@/data'

interface AuthContextType {
  admin: Admin | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = 'admin_session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)

  // 세션 복원 (페이지 새로고침 시)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionData = sessionStorage.getItem(SESSION_KEY)
      if (sessionData) {
        try {
          const { adminId } = JSON.parse(sessionData)
          const restoredAdmin = getAdminById(adminId)
          if (restoredAdmin) {
            setAdmin(restoredAdmin)
          } else {
            sessionStorage.removeItem(SESSION_KEY)
          }
        } catch {
          sessionStorage.removeItem(SESSION_KEY)
        }
      }
    }
  }, [])

  const login = (username: string, password: string): boolean => {
    const authenticatedAdmin = authenticateAdmin(username, password)
    if (authenticatedAdmin) {
      setAdmin(authenticatedAdmin)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ adminId: authenticatedAdmin.id })
        )
      }
      return true
    }
    return false
  }

  const logout = () => {
    setAdmin(null)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        login,
        logout,
        isAuthenticated: admin !== null,
      }}
    >
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
