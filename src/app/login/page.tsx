'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Zap } from 'lucide-react'
import { signIn, signUp, demoLogin, signInWithGoogle, signInWithGitHub, getUser } from '@/lib/supabase/auth'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { SignInPage, Testimonial } from '@/components/ui/sign-in'

const testimonials: Testimonial[] = [
  {
    avatarSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    name: 'Sarah Chen',
    handle: '@sarahdigital',
    text: 'The agent orchestration is seamless. My team productivity increased 3x.',
  },
  {
    avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    name: 'Marcus Johnson',
    handle: '@marcustech',
    text: 'Finally, AI agents that actually work together intelligently.',
  },
  {
    avatarSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    name: 'David Martinez',
    handle: '@davidcreates',
    text: 'The best AI dashboard I\'ve used. Clean design, powerful features.',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check if already logged in
  useEffect(() => {
    async function checkAuth() {
      if (!isSupabaseConfigured()) {
        // Skip auth if Supabase not configured
        router.push('/')
        return
      }

      const user = await getUser()
      if (user) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      if (mode === 'login') {
        const { user, error } = await signIn(email, password)
        if (error) {
          setError(error)
        } else if (user) {
          router.push('/')
        }
      } else {
        const { user, error } = await signUp(email, password)
        if (error) {
          setError(error)
        } else if (user) {
          setSuccess('Account created! Check your email to confirm.')
          setMode('login')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError(null)
    setIsDemoLoading(true)

    try {
      const { user, error } = await demoLogin()
      if (error) {
        setError('Demo account not configured. Please sign up or contact support.')
      } else if (user) {
        router.push('/')
      }
    } finally {
      setIsDemoLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error)
    }
  }

  const handleGitHubLogin = async () => {
    setError(null)
    const { error } = await signInWithGitHub()
    if (error) {
      setError(error)
    }
  }

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError(null)
    setSuccess(null)
  }

  // If Supabase is not configured, show a bypass option
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <div className="glass-background" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-card p-8 max-w-md w-full text-center relative z-10"
        >
          <div className="text-[var(--accent)] text-4xl mb-4">
            <Zap className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">
            Local Development Mode
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Supabase is not configured. Running in local-only mode.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded-xl hover:bg-[var(--accent)]/90 transition-colors"
          >
            Continue to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <SignInPage
      title={
        <span className="text-[var(--text-main)]">
          Claude Agent Dashboard
        </span>
      }
      subtitle="19-Agent Orchestration System"
      description={mode === 'login' ? 'Sign in to access your AI agent team' : 'Create an account to get started'}
      heroImageSrc="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&q=80"
      testimonials={testimonials}
      mode={mode}
      isLoading={isLoading}
      isDemoLoading={isDemoLoading}
      error={error}
      success={success}
      onSignIn={handleSubmit}
      onGoogleSignIn={handleGoogleLogin}
      onGitHubSignIn={handleGitHubLogin}
      onDemoSignIn={handleDemoLogin}
      onToggleMode={handleToggleMode}
    />
  )
}
