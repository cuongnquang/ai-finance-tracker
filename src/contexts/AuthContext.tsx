"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Lấy session ban đầu
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('🔄 Auth event:', event)

      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)

      // CHỈ redirect khi vừa mới SIGNED_IN và đang ở trang login/register
      if (event === "SIGNED_IN" && currentSession) {
        if (pathname === '/login' || pathname === '/register') {
          router.replace('/dashboard')
        }
      }

      if (event === "SIGNED_OUT") {
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)