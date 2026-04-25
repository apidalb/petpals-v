'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  authReady: boolean
  login: (user: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authReady: false,
  login: () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const toAppUser = (sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User => {
      let cached: User | null = null
      try {
        const raw = sessionStorage.getItem('pp_user')
        cached = raw ? (JSON.parse(raw) as User) : null
      } catch {
        cached = null
      }

      const metadataRole = sessionUser.user_metadata?.role
      const inferredRole = metadataRole === 'admin' || metadataRole === 'adopter' ? metadataRole : undefined
      const role = cached?.id === sessionUser.id ? cached.role : (inferredRole ?? 'adopter')

      const metadataName = sessionUser.user_metadata?.full_name
      const fallbackName = typeof metadataName === 'string' && metadataName.trim().length > 0
        ? metadataName
        : (sessionUser.email?.split('@')[0] || 'User')

      return {
        id: sessionUser.id,
        name: cached?.id === sessionUser.id ? cached.name : fallbackName,
        email: sessionUser.email ?? '',
        role,
      }
    }

    const hydrateUserFromSession = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user

      if (!sessionUser) {
        setUser(null)
        sessionStorage.removeItem('pp_user')
        setAuthReady(true)
        return
      }

      const nextUser = toAppUser(sessionUser)

      setUser(nextUser)
      sessionStorage.setItem('pp_user', JSON.stringify(nextUser))
      setAuthReady(true)
    }

    void hydrateUserFromSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user
      if (!sessionUser) {
        setUser(null)
        sessionStorage.removeItem('pp_user')
        setAuthReady(true)
        return
      }

      const nextUser = toAppUser(sessionUser)

      setUser(nextUser)
      sessionStorage.setItem('pp_user', JSON.stringify(nextUser))
      setAuthReady(true)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = useCallback((u: User) => {
    setUser(u)
    sessionStorage.setItem('pp_user', JSON.stringify(u))
    setAuthReady(true)
  }, [])

  const logout = useCallback(async () => {
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      sessionStorage.removeItem('pp_user')
      localStorage.removeItem('pp_remember')
      setAuthReady(true)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, authReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
