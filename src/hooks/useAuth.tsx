'use client'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { createBrowserClient } from '@/utils/supabase'
import { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: any } | void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createBrowserClient()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      setLoading(true)
      const { data, error } = await supabase.auth.getSession()
      if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
        setRole((data.session.user.user_metadata as any)?.role || null)
      } else {
        setSession(null)
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    }
    getSession()
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setRole((session?.user.user_metadata as any)?.role || null)
      },
    )
    return () => {
      listener.subscription.unsubscribe()
    }
    // eslint-disable-next-line
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    await supabase.auth.getSession() // Refresh session
    setLoading(false)
    if (error) return { error }
  }

  const logout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setRole(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{ user, session, role, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
