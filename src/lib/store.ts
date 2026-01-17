import { create } from 'zustand'
import type { Agent, AgentId, Task, ChatMessage, AgentEvent, AgentStatus } from './types'
import { getAllAgents, getAgentConnections } from './agentCatalog'

interface DashboardState {
  // Agents
  agents: Agent[]
  connections: { from: AgentId; to: AgentId }[]
  activeConnections: Set<string> // "from-to" format for highlighting
  
  // Tasks
  tasks: Task[]
  taskHistory: Task[]
  
  // Chat
  messages: ChatMessage[]
  isStreaming: boolean
  
  // Events
  eventLog: AgentEvent[]
  
  // UI State
  selectedAgentId: AgentId | null
  showTaskBoard: boolean
  
  // Actions
  updateAgentStatus: (agentId: AgentId, status: AgentStatus, task?: Task) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  delegateTask: (fromAgentId: AgentId, toAgentId: AgentId, task: Task) => void
  completeTask: (taskId: string, output?: string) => void
  addMessage: (message: ChatMessage) => void
  addEvent: (event: AgentEvent) => void
  setSelectedAgent: (agentId: AgentId | null) => void
  toggleTaskBoard: () => void
  setStreaming: (isStreaming: boolean) => void
  highlightConnection: (from: AgentId, to: AgentId) => void
  clearConnectionHighlight: (from: AgentId, to: AgentId) => void
  reset: () => void
}

const initialAgents = getAllAgents()
const initialConnections = getAgentConnections()

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial State
  agents: initialAgents,
  connections: initialConnections,
  activeConnections: new Set(),
  tasks: [],
  taskHistory: [],
  messages: [],
  isStreaming: false,
  eventLog: [],
  selectedAgentId: null,
  showTaskBoard: false,

  // Actions
  updateAgentStatus: (agentId, status, task) => {
    set(state => ({
      agents: state.agents.map(agent =>
        agent.id === agentId
          ? { ...agent, status, currentTask: task ?? agent.currentTask }
          : agent
      ),
    }))
  },

  addTask: (task) => {
    set(state => ({
      tasks: [...state.tasks, task],
    }))
    
    // Log event
    get().addEvent({
      type: 'task_created',
      timestamp: new Date(),
      agentId: task.assignedTo || 'ceo',
      task,
    })
  },

  updateTask: (taskId, updates) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
      ),
    }))
  },

  delegateTask: (fromAgentId, toAgentId, task) => {
    const updatedTask: Task = {
      ...task,
      status: 'delegated',
      delegatedFrom: fromAgentId,
      delegatedTo: toAgentId,
      assignedTo: toAgentId,
      updatedAt: new Date(),
    }

    set(state => ({
      tasks: state.tasks.map(t => (t.id === task.id ? updatedTask : t)),
    }))

    // Update agent statuses
    get().updateAgentStatus(fromAgentId, 'delegating')
    get().updateAgentStatus(toAgentId, 'working', updatedTask)

    // Highlight connection
    get().highlightConnection(fromAgentId, toAgentId)

    // Log event
    get().addEvent({
      type: 'task_delegated',
      timestamp: new Date(),
      agentId: fromAgentId,
      task: updatedTask,
      fromAgent: fromAgentId,
      toAgent: toAgentId,
    })

    // Clear highlight after animation
    setTimeout(() => {
      get().clearConnectionHighlight(fromAgentId, toAgentId)
      get().updateAgentStatus(fromAgentId, 'idle')
    }, 2000)
  },

  completeTask: (taskId, output) => {
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return

    const completedTask: Task = {
      ...task,
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
      output,
    }

    set(state => ({
      tasks: state.tasks.filter(t => t.id !== taskId),
      taskHistory: [...state.taskHistory, completedTask],
    }))

    // Update agent status
    if (task.assignedTo) {
      get().updateAgentStatus(task.assignedTo, 'completed')
      setTimeout(() => {
        get().updateAgentStatus(task.assignedTo!, 'idle')
      }, 1500)
    }

    // Log event
    get().addEvent({
      type: 'task_completed',
      timestamp: new Date(),
      agentId: task.assignedTo || 'ceo',
      task: completedTask,
    })
  },

  addMessage: (message) => {
    set(state => ({
      messages: [...state.messages, message],
    }))
  },

  addEvent: (event) => {
    set(state => ({
      eventLog: [event, ...state.eventLog].slice(0, 100), // Keep last 100 events
    }))
  },

  setSelectedAgent: (agentId) => {
    set({ selectedAgentId: agentId })
  },

  toggleTaskBoard: () => {
    set(state => ({ showTaskBoard: !state.showTaskBoard }))
  },

  setStreaming: (isStreaming) => {
    set({ isStreaming })
  },

  highlightConnection: (from, to) => {
    const key = `${from}-${to}`
    set(state => ({
      activeConnections: new Set([...state.activeConnections, key]),
    }))
  },

  clearConnectionHighlight: (from, to) => {
    const key = `${from}-${to}`
    set(state => {
      const newSet = new Set(state.activeConnections)
      newSet.delete(key)
      return { activeConnections: newSet }
    })
  },

  reset: () => {
    set({
      agents: initialAgents,
      connections: initialConnections,
      activeConnections: new Set(),
      tasks: [],
      taskHistory: [],
      messages: [],
      isStreaming: false,
      eventLog: [],
      selectedAgentId: null,
      showTaskBoard: false,
    })
  },
}))
