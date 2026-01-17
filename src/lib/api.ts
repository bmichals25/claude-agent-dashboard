import type { ChatMessage, Task, Agent } from './types'

const API_BASE = '/api'

/**
 * Send a chat message to Claude
 */
export async function sendMessage(message: string): Promise<{
  id: string
  agentId: string
  content: string
  timestamp: string
  taskCreated?: {
    id: string
    title: string
    status: string
  }
}> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Get all agents and their connections
 */
export async function getAgents(): Promise<{
  agents: Agent[]
  connections: { from: string; to: string }[]
}> {
  const response = await fetch(`${API_BASE}/agents`)

  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.status}`)
  }

  return response.json()
}

/**
 * Get a specific agent by ID
 */
export async function getAgent(agentId: string): Promise<{ agent: Agent }> {
  const response = await fetch(`${API_BASE}/agents/${agentId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch agent: ${response.status}`)
  }

  return response.json()
}

/**
 * Get all tasks
 */
export async function getTasks(): Promise<{ tasks: Task[] }> {
  const response = await fetch(`${API_BASE}/tasks`)

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.status}`)
  }

  return response.json()
}

/**
 * Create a new task
 */
export async function createTask(task: {
  title: string
  description?: string
  priority?: string
  assignedTo?: string
}): Promise<{ task: Task }> {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.status}`)
  }

  return response.json()
}

/**
 * Connect to SSE event stream
 */
export function connectToEvents(
  onEvent: (event: { type: string; data: unknown }) => void,
  onError?: (error: Error) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/events`)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onEvent({ type: 'message', data })
    } catch (e) {
      console.error('Failed to parse event:', e)
    }
  }

  eventSource.addEventListener('connected', (event) => {
    const data = JSON.parse((event as MessageEvent).data)
    onEvent({ type: 'connected', data })
  })

  eventSource.addEventListener('task_update', (event) => {
    const data = JSON.parse((event as MessageEvent).data)
    onEvent({ type: 'task_update', data })
  })

  eventSource.addEventListener('agent_update', (event) => {
    const data = JSON.parse((event as MessageEvent).data)
    onEvent({ type: 'agent_update', data })
  })

  eventSource.onerror = () => {
    onError?.(new Error('SSE connection error'))
  }

  // Return cleanup function
  return () => {
    eventSource.close()
  }
}
