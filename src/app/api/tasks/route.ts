import { NextRequest, NextResponse } from 'next/server'
import type { Task, TaskPriority } from '@/lib/types'

// In-memory task storage for demo
// In production, this would use a database
const tasks: Task[] = []

export async function GET() {
  return NextResponse.json({
    tasks,
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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

    tasks.push(task)

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
