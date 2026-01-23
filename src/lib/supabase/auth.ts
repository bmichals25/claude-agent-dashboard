import { supabase } from './client'
import type { User, Session } from '@supabase/supabase-js'

// Demo account credentials (set in Supabase Auth dashboard)
const DEMO_EMAIL = 'demo@claudeagent.app'
const DEMO_PASSWORD = 'demo123456'

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: data.user, error: null }
  } catch (err) {
    console.error('Sign in error:', err)
    return { user: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    })

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: data.user, error: null }
  } catch (err) {
    console.error('Sign up error:', err)
    return { user: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    // Clear local session storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agent_dashboard_session_id')
    }

    return { error: null }
  } catch (err) {
    console.error('Sign out error:', err)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get the current user
 */
export async function getUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (err) {
    console.error('Get user error:', err)
    return null
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (err) {
    console.error('Get session error:', err)
    return null
  }
}

/**
 * Demo login - use the pre-configured demo account
 */
export async function demoLogin(): Promise<{ user: User | null; error: string | null }> {
  return signIn(DEMO_EMAIL, DEMO_PASSWORD)
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (err) {
    console.error('Google sign in error:', err)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Sign in with GitHub OAuth
 */
export async function signInWithGitHub(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (err) {
    console.error('GitHub sign in error:', err)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (err) {
    console.error('Reset password error:', err)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (err) {
    console.error('Update password error:', err)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null, session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, session)
  })

  return subscription
}
