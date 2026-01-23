import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Task, TaskPriority } from '@/lib/types'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase()

  // If Supabase is not configured, return empty
  if (!supabase) {
    return NextResponse.json({
      tasks: [],
      timestamp: new Date().toISOString(),
      warning: 'Supabase not configured - running in local mode',
    })
  }

  const sessionId = request.headers.get('x-session-id')

  try {
    let query = supabase
      .from('dashboard_tasks')
      .select(`
        *,
        dashboard_stream_entries (*)
      `)
      .order('created_at', { ascending: false })

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    // Transform to frontend format
    const tasks: Task[] = (data || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assigned_agent_id || undefined,
      delegatedFrom: task.delegated_from || undefined,
      projectId: task.project_id || undefined,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
      progress: task.progress || 0,
      currentStep: task.current_step || undefined,
      streamOutput: (task.dashboard_stream_entries || []).map((entry: any) => ({
        id: entry.id,
        timestamp: new Date(entry.created_at),
        agentId: entry.agent_id,
        type: entry.type,
        content: entry.content,
      })),
    }))

    return NextResponse.json({
      tasks,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()

  try {
    const body = await request.json()
    const sessionId = request.headers.get('x-session-id')

    if (!supabase) {
      // Fallback: return a mock task for local development
      const task: Task = {
        id: `task-${Date.now()}`,
        title: body.title || 'Untitled Task',
        description: body.description || '',
        status: 'pending',
        priority: (body.priority as TaskPriority) || 'medium',
        assignedTo: body.assignedTo || 'ceo',
        projectId: body.projectId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        streamOutput: [],
        progress: 0,
      }

      return NextResponse.json({
        task,
        message: 'Task created (local mode)',
        warning: 'Supabase not configured - task not persisted',
      })
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const taskId = `task-${Date.now()}`

    const { data, error } = await supabase
      .from('dashboard_tasks')
      .insert({
        id: taskId,
        session_id: sessionId,
        title: body.title || 'Untitled Task',
        description: body.description || null,
        status: 'pending',
        priority: body.priority || 'medium',
        assigned_agent_id: body.assignedTo || 'ceo',
        project_id: body.projectId || null,
        progress: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create task:', error)
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    const task: Task = {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      assignedTo: data.assigned_agent_id || undefined,
      projectId: data.project_id || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      streamOutput: [],
      progress: 0,
    }

    return NextResponse.json({
      task,
      message: 'Task created successfully',
    })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID required' },
        { status: 400 }
      )
    }

    // Map frontend field names to database field names
    const dbUpdates: Record<string, any> = {
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

    const { data, error } = await supabase
      .from('dashboard_tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update task:', error)
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      task: data,
      message: 'Task updated successfully',
    })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('dashboard_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Failed to delete task:', error)
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
