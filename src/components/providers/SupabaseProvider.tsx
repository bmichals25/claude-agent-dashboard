'use client'

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react'
import { useSupabaseSync } from '@/lib/supabase/hooks'
import { useStore } from '@/lib/store'
import type { Message, Task, Project, AgentEvent, StreamEntry } from '@/lib/types'

interface SupabaseContextType {
  isInitialized: boolean
  isConfigured: boolean
  sessionId: string | null
  saveMessage: (message: Message) => Promise<void>
  saveTask: (task: Task) => Promise<void>
  persistTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  saveStreamEntry: (taskId: string, entry: StreamEntry) => Promise<void>
  saveProject: (project: Project) => Promise<void>
  saveEvent: (event: AgentEvent) => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | null>(null)

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}

interface SupabaseProviderProps {
  children: ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  const {
    initSession,
    loadSessionData,
    saveMessage,
    saveTask,
    persistTaskUpdate,
    saveStreamEntry,
    saveProject,
    saveEvent,
    isConfigured,
  } = useSupabaseSync()

  // Initialize session on mount
  useEffect(() => {
    async function init() {
      if (!isConfigured) {
        console.log('Supabase not configured, running in local-only mode')
        setIsInitialized(true)
        return
      }

      try {
        const id = await initSession()
        if (id) {
          setSessionId(id)
          await loadSessionData(id)
        }
      } catch (error) {
        console.error('Failed to initialize Supabase session:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    init()
  }, [isConfigured, initSession, loadSessionData])

  const value: SupabaseContextType = {
    isInitialized,
    isConfigured,
    sessionId,
    saveMessage,
    saveTask,
    persistTaskUpdate,
    saveStreamEntry,
    saveProject,
    saveEvent,
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg">
        <div className="liquid-card p-8 text-center">
          <div className="animate-pulse">
            <div className="text-accent text-lg font-semibold">Initializing Dashboard...</div>
            <div className="text-white/50 text-sm mt-2">Connecting to data store</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}
