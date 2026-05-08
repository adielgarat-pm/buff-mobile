import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { signInWithMagicLink, signOut as authSignOut, checkIsAdmin } from '../lib/auth'

interface AuthContextType {
  session: Session | null
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Pass userId directly — do not call getSession() again inside checkIsAdmin,
    // as the session object here is already authoritative.
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) {
        const admin = await checkIsAdmin(data.session.user.id)
        setIsAdmin(admin)
      }
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        // Pass session.user.id directly — avoids a second getSession() call inside
        // checkIsAdmin that would race with Supabase writing the session to storage,
        // causing getSession() to return null and the RPC to be skipped entirely.
        const admin = await checkIsAdmin(session.user.id)
        setIsAdmin(admin)
      } else {
        setIsAdmin(false)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string) => {
    const { error } = await signInWithMagicLink(email)
    return { error: error as Error | null }
  }

  const signOutHandler = async () => {
    await authSignOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, isAdmin, isLoading, signIn, signOut: signOutHandler }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
