// Agent Types
export type AgentId = string

export type AgentRole = 
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

// Task Types
export type TaskStatus = 'pending' | 'in_progress' | 'delegated' | 'completed' | 'blocked'

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo: AgentId | null
  delegatedFrom: AgentId | null
  delegatedTo: AgentId | null
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  subtasks: Task[]
  output?: string
}

// Event Types for Real-time Updates
export type AgentEventType =
  | 'task_created'
  | 'task_delegated'
  | 'task_started'
  | 'task_completed'
  | 'task_blocked'
  | 'agent_thinking'
  | 'agent_working'
  | 'agent_idle'
  | 'message_received'
  | 'message_sent'

export interface AgentEvent {
  type: AgentEventType
  timestamp: Date
  agentId: AgentId
  task?: Task
  message?: string
  fromAgent?: AgentId
  toAgent?: AgentId
  thought?: string
}

// Chat Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: AgentId
  relatedTaskId?: string
}

// SSE Event Structure
export interface SSEEvent {
  event: string | null
  data: string
}
