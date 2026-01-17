// Agent Types
export type AgentId = 
  | 'ceo'
  | 'chief_of_staff'
  | 'pipeline_manager'
  | 'vp_engineering'
  | 'vp_product'
  | 'vp_design_qa'
  | 'support_agent'
  | 'autopilot_agent'
  | 'architect'
  | 'developer'
  | 'devops_engineer'
  | 'code_reviewer'
  | 'security_engineer'
  | 'product_researcher'
  | 'product_manager'
  | 'data_engineer'
  | 'growth_marketer'
  | 'frontend_designer'
  | 'user_testing'
  | 'technical_writer'

export type AgentRole = AgentId

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'delegating' | 'completed'

export type AgentTier = 'ceo' | 'leadership' | 'vp' | 'specialist'

export interface Agent {
  id: AgentId
  role: AgentRole
  displayName: string
  tier: AgentTier
  reportsTo: AgentId | null
  directReports: AgentId[]
  status: AgentStatus
  currentTask: Task | null
  color: string
  position: { x: number; y: number }
  tools: string[]
  specialty: string
}

// Project Types
export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  createdAt: Date
  updatedAt: Date
  color: string
}

// Task Types
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed'

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

// Stream output entry - represents agent's stream of consciousness
export interface StreamEntry {
  id: string
  timestamp: Date
  agentId: AgentId
  type: 'thought' | 'action' | 'result' | 'error'
  content: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo?: AgentId
  delegatedFrom?: AgentId
  projectId: string | null
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  // Stream of consciousness - live agent thoughts/actions
  streamOutput: StreamEntry[]
  // Progress tracking
  progress: number // 0-100
  currentStep?: string
}

// Event Types for Real-time Updates
export type AgentEventType =
  | 'task_created'
  | 'task_assigned'
  | 'task_completed'
  | 'agent_thinking'
  | 'agent_action'
  | 'error'
  | 'delegation'

export interface AgentEvent {
  id: string
  type: AgentEventType
  timestamp: Date
  agentId?: AgentId
  taskId?: string
  message: string
  data?: Record<string, unknown>
}

// Message Types (for chat)
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: AgentId
}

// Alias for backward compatibility
export type ChatMessage = Message

// SSE Event Structure
export interface SSEEvent {
  event: string | null
  data: string
}

// Sort/Filter options for Task Board
export type TaskSortBy = 'created' | 'updated' | 'priority' | 'agent' | 'project' | 'status'
export type TaskSortOrder = 'asc' | 'desc'

export interface TaskFilters {
  agentId?: AgentId | null
  projectId?: string | null
  status?: TaskStatus | null
  priority?: TaskPriority | null
}
