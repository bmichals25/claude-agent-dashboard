// @ts-nocheck - Supabase types not generated for this project yet
'use client'

import { useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from './client'
import { useDashboardStore } from '../store'
import type { Message, Task, Project, AgentEvent, StreamEntry, AgentId } from '../types'

// Type for session data (until proper Supabase types are generated)
interface SessionData {
  id: string
  name: string
  created_at: string
}

// Session management
let currentSessionId: string | null = null

export function useSupabaseSync() {
  const {
    addMessage,
    addTask,
    updateTask,
    addProject,
    addEvent,
    addStreamEntry,
  } = useDashboardStore()

  // Initialize or restore session
  const initSession = useCallback(async () => {
    if (!isSupabaseConfigured()) return null

    // Check for existing session in localStorage
    const storedSessionId = typeof window !== 'undefined' 
      ? localStorage.getItem('agent_dashboard_session_id')
      : null
    
    if (storedSessionId) {
      // Verify session exists in DB
      const { data } = await supabase
        .from('dashboard_sessions')
        .select('id')
        .eq('id', storedSessionId)
        .single()
      
      if (data) {
        currentSessionId = storedSessionId
        return storedSessionId
      }
    }

    // Create new session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('dashboard_sessions')
      .insert({ name: `Session ${new Date().toLocaleDateString()}` })
      .select()
      .single() as { data: SessionData | null; error: Error | null }

    if (error || !data) {
      console.error('Failed to create session:', error)
      return null
    }

    currentSessionId = data.id
    if (typeof window !== 'undefined') {
      localStorage.setItem('agent_dashboard_session_id', data.id)
    }
    return data.id
  }, [])

  // Load existing data from Supabase
  const loadSessionData = useCallback(async (sessionId: string) => {
    if (!isSupabaseConfigured()) return

    // Load messages
    const { data: messagesData } = await supabase
      .from('dashboard_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (messagesData) {
      messagesData.forEach(msg => {
        addMessage({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          agentId: msg.agent_id as AgentId | undefined,
        })
      })
    }

    // Load projects
    const { data: projectsData } = await supabase
      .from('dashboard_projects')
      .select('*')
      .eq('session_id', sessionId)

    if (projectsData) {
      projectsData.forEach(proj => {
        addProject({
          id: proj.id,
          name: proj.name,
          description: proj.description || undefined,
          status: proj.status,
          color: proj.color,
          createdAt: new Date(proj.created_at),
          updatedAt: new Date(proj.updated_at),
        })
      })
    }

    // Load tasks with stream entries
    const { data: tasksData } = await supabase
      .from('dashboard_tasks')
      .select(`
        *,
        dashboard_stream_entries (*)
      `)
      .eq('session_id', sessionId)

    if (tasksData) {
      tasksData.forEach((task: any) => {
        const streamOutput: StreamEntry[] = (task.dashboard_stream_entries || []).map((entry: any) => ({
          id: entry.id,
          timestamp: new Date(entry.created_at),
          agentId: entry.agent_id as AgentId,
          type: entry.type,
          content: entry.content,
        }))

        addTask({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assigned_agent_id as AgentId | undefined,
          delegatedFrom: task.delegated_from as AgentId | undefined,
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at),
          projectId: task.project_id,
          streamOutput,
          progress: task.progress,
          currentStep: task.current_step || undefined,
        })
      })
    }

    // Load events
    const { data: eventsData } = await supabase
      .from('dashboard_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (eventsData) {
      eventsData.forEach(event => {
        addEvent({
          id: event.id,
          type: event.type,
          agentId: event.agent_id as AgentId | undefined,
          taskId: event.task_id || undefined,
          message: event.message,
          timestamp: new Date(event.created_at),
          data: event.data as Record<string, unknown> | undefined,
        })
      })
    }
  }, [addMessage, addTask, addProject, addEvent])

  // Save message to Supabase
  const saveMessage = useCallback(async (message: Message) => {
    if (!isSupabaseConfigured() || !currentSessionId) return

    await supabase.from('dashboard_messages').insert({
      id: message.id,
      session_id: currentSessionId,
      role: message.role,
      content: message.content,
      agent_id: message.agentId || null,
    })
  }, [])

  // Save task to Supabase
  const saveTask = useCallback(async (task: Task) => {
    if (!isSupabaseConfigured() || !currentSessionId) return

    await supabase.from('dashboard_tasks').insert({
      id: task.id,
      session_id: currentSessionId,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description || null,
      status: task.status,
      priority: task.priority,
      assigned_agent_id: task.assignedTo || null,
      delegated_from: task.delegatedFrom || null,
      progress: task.progress || 0,
      current_step: task.currentStep || null,
    })
  }, [])

  // Update task in Supabase
  const persistTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!isSupabaseConfigured()) return

    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.assignedTo !== undefined) dbUpdates.assigned_agent_id = updates.assignedTo
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress
    if (updates.currentStep !== undefined) dbUpdates.current_step = updates.currentStep
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId

    await supabase.from('dashboard_tasks').update(dbUpdates).eq('id', taskId)
  }, [])

  // Save stream entry to Supabase
  const saveStreamEntry = useCallback(async (taskId: string, entry: StreamEntry) => {
    if (!isSupabaseConfigured()) return

    await supabase.from('dashboard_stream_entries').insert({
      id: entry.id,
      task_id: taskId,
      agent_id: entry.agentId,
      type: entry.type,
      content: entry.content,
    })
  }, [])

  // Save project to Supabase
  const saveProject = useCallback(async (project: Project) => {
    if (!isSupabaseConfigured() || !currentSessionId) return

    await supabase.from('dashboard_projects').insert({
      id: project.id,
      session_id: currentSessionId,
      name: project.name,
      description: project.description || null,
      status: project.status,
      color: project.color,
    })
  }, [])

  // Save event to Supabase
  const saveEvent = useCallback(async (event: AgentEvent) => {
    if (!isSupabaseConfigured() || !currentSessionId) return

    await supabase.from('dashboard_events').insert({
      id: event.id,
      session_id: currentSessionId,
      type: event.type,
      agent_id: event.agentId || null,
      task_id: event.taskId || null,
      message: event.message,
      data: event.data || null,
    })
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const channel = supabase
      .channel('dashboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dashboard_tasks' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const task = payload.new as any
            updateTask(task.id, {
              status: task.status,
              progress: task.progress,
              currentStep: task.current_step,
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dashboard_stream_entries' },
        (payload) => {
          const entry = payload.new as any
          addStreamEntry(entry.task_id, {
            id: entry.id,
            timestamp: new Date(entry.created_at),
            agentId: entry.agent_id as AgentId,
            type: entry.type,
            content: entry.content,
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [updateTask, addStreamEntry])

  return {
    initSession,
    loadSessionData,
    saveMessage,
    saveTask,
    persistTaskUpdate,
    saveStreamEntry,
    saveProject,
    saveEvent,
    isConfigured: isSupabaseConfigured(),
  }
}

export function getSessionId() {
  return currentSessionId
}

// ============================================
// Skills CRUD functions (for Netlify deployment)
// ============================================

export interface SkillData {
  id?: string
  skill_id: string
  skill_name: string
  content: string
  github_url?: string | null
  is_installed?: boolean
}

export async function loadSkills(): Promise<SkillData[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('dashboard_skills')
    .select('*')
    .eq('is_installed', true)
    .order('installed_at', { ascending: false })

  if (error) {
    console.error('Failed to load skills:', error)
    return []
  }

  return data || []
}

export async function saveSkill(skill: SkillData): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  const { error } = await supabase
    .from('dashboard_skills')
    .upsert({
      skill_id: skill.skill_id,
      skill_name: skill.skill_name,
      content: skill.content,
      github_url: skill.github_url || null,
      is_installed: true,
    }, {
      onConflict: 'user_id,skill_id',
    })

  if (error) {
    console.error('Failed to save skill:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteSkill(skillId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  const { error } = await supabase
    .from('dashboard_skills')
    .update({ is_installed: false })
    .eq('skill_id', skillId)

  if (error) {
    console.error('Failed to delete skill:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getSkillContent(skillId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('dashboard_skills')
    .select('content')
    .eq('skill_id', skillId)
    .eq('is_installed', true)
    .single()

  if (error || !data) {
    return null
  }

  return data.content
}

// ============================================
// Agent Configs CRUD functions
// ============================================

export interface AgentConfigData {
  agent_id: string
  config_content: string
}

export async function loadAgentConfig(agentId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('dashboard_agent_configs')
    .select('config_content')
    .eq('agent_id', agentId)
    .single()

  if (error || !data) {
    return null
  }

  return data.config_content
}

export async function saveAgentConfig(agentId: string, content: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  const { error } = await supabase
    .from('dashboard_agent_configs')
    .upsert({
      agent_id: agentId,
      config_content: content,
    }, {
      onConflict: 'user_id,agent_id',
    })

  if (error) {
    console.error('Failed to save agent config:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function loadAllAgentConfigs(): Promise<AgentConfigData[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('dashboard_agent_configs')
    .select('agent_id, config_content')

  if (error) {
    console.error('Failed to load agent configs:', error)
    return []
  }

  return data || []
}

// ============================================
// Settings CRUD functions
// ============================================

export interface SettingsData {
  theme?: string
  accent_color?: string
  show_notifications?: boolean
  auto_scroll_chat?: boolean
  sound_enabled?: boolean
  sound_volume?: number
  app_name?: string
  app_tagline?: string
}

export async function loadSettings(sessionId: string): Promise<SettingsData | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('dashboard_settings')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    theme: data.theme,
    accent_color: data.accent_color,
    show_notifications: data.show_notifications,
    auto_scroll_chat: data.auto_scroll_chat,
    sound_enabled: data.sound_enabled,
    sound_volume: data.sound_volume,
    app_name: data.app_name,
    app_tagline: data.app_tagline,
  }
}

export async function saveSettings(sessionId: string, settings: SettingsData): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  const { error } = await supabase
    .from('dashboard_settings')
    .upsert({
      session_id: sessionId,
      ...settings,
    }, {
      onConflict: 'session_id',
    })

  if (error) {
    console.error('Failed to save settings:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================
// Project Appearance CRUD functions
// ============================================

export interface ProjectAppearanceData {
  project_id: string
  logo_url?: string | null
  background_color?: string | null
  background_preset?: string | null
  hero_background_image?: string | null
  subtitle?: string | null
  slug?: string | null
}

export async function loadProjectAppearance(sessionId: string, projectId: string): Promise<ProjectAppearanceData | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('dashboard_project_appearance')
    .select('*')
    .eq('session_id', sessionId)
    .eq('project_id', projectId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    project_id: data.project_id,
    logo_url: data.logo_url,
    background_color: data.background_color,
    background_preset: data.background_preset,
    hero_background_image: data.hero_background_image,
    subtitle: data.subtitle,
    slug: data.slug,
  }
}

export async function saveProjectAppearance(sessionId: string, appearance: ProjectAppearanceData): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  const { error } = await supabase
    .from('dashboard_project_appearance')
    .upsert({
      session_id: sessionId,
      ...appearance,
    }, {
      onConflict: 'session_id,project_id',
    })

  if (error) {
    console.error('Failed to save project appearance:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function loadAllProjectAppearances(sessionId: string): Promise<ProjectAppearanceData[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('dashboard_project_appearance')
    .select('*')
    .eq('session_id', sessionId)

  if (error) {
    console.error('Failed to load project appearances:', error)
    return []
  }

  return data?.map(d => ({
    project_id: d.project_id,
    logo_url: d.logo_url,
    background_color: d.background_color,
    background_preset: d.background_preset,
    hero_background_image: d.hero_background_image,
    subtitle: d.subtitle,
    slug: d.slug,
  })) || []
}
