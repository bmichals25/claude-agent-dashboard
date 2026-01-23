import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Custom storage adapter for React Native using SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key)
    }
    return await SecureStore.getItemAsync(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value)
      return
    }
    await SecureStore.setItemAsync(key, value)
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
      return
    }
    await SecureStore.deleteItemAsync(key)
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Create Supabase client with React Native storage adapter
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database types matching the web app
export interface DatabaseSession {
  id: string
  created_at: string
  updated_at: string
  name: string | null
}

export interface DatabaseMessage {
  id: string
  session_id: string
  created_at: string
  role: 'user' | 'assistant' | 'system'
  content: string
  agent_id: string | null
}

export interface DatabaseProject {
  id: string
  session_id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'completed' | 'archived'
  color: string
}

export interface DatabaseTask {
  id: string
  session_id: string
  project_id: string | null
  created_at: string
  updated_at: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'review' | 'completed'
  priority: 'critical' | 'high' | 'medium' | 'low'
  assigned_agent_id: string | null
  delegated_from: string | null
  progress: number
  current_step: string | null
}

export interface DatabaseStreamEntry {
  id: string
  task_id: string
  created_at: string
  agent_id: string
  type: 'thought' | 'action' | 'result' | 'error'
  content: string
}

export interface DatabaseEvent {
  id: string
  session_id: string
  created_at: string
  type: string
  agent_id: string | null
  task_id: string | null
  message: string
  data: Record<string, unknown> | null
}
