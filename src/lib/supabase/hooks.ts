'use client'

import { useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from './client'
import { useDashboardStore } from '../store'
import type { Message, Task, Project, AgentEvent, StreamEntry, AgentId } from '../types'

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
    const { data, error } = await supabase
      .from('dashboard_sessions')
      .insert({ name: `Session ${new Date().toLocaleDateString()}` })
      .select()
      .single()

    if (error) {
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
