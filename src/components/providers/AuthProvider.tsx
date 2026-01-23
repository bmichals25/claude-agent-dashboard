'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'
import { getUser, getSession, onAuthStateChange, signOut as authSignOut } from '@/lib/supabase/auth'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/reset-password']

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're on a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))

  useEffect(() => {
    // If Supabase is not configured, skip auth
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    // Initial auth check
    async function initAuth() {
      try {
        const [currentUser, currentSession] = await Promise.all([
          getUser(),
          getSession(),
        ])

        setUser(currentUser)
        setSession(currentSession)

        // Redirect logic
        if (!currentUser && !isPublicRoute) {
          router.push('/login')
        } else if (currentUser && isPublicRoute) {
          router.push('/')
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Subscribe to auth changes
    const subscription = onAuthStateChange((newUser, newSession) => {
      setUser(newUser)
      setSession(newSession)

      // Handle auth state changes
      if (!newUser && !isPublicRoute) {
        router.push('/login')
      } else if (newUser && pathname === '/login') {
        router.push('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname, isPublicRoute])

  const handleSignOut = async () => {
    await authSignOut()
    setUser(null)
    setSession(null)
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signOut: handleSignOut,
  }

  // Show loading state while checking auth
  if (isLoading && isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not on a public route, don't render children
  // (redirect will happen in useEffect)
  if (!user && !isPublicRoute && isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-white/60">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
