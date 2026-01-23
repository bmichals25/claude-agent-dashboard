import { create } from 'zustand'
import type {
  Agent,
  AgentId,
  Task,
  Message,
  AgentEvent,
  AgentStatus,
  Project,
  StreamEntry,
  TaskSortBy,
  TaskSortOrder,
  TaskFilters,
} from './types'
import { getAllAgents, getAgentConnections } from './agentCatalog'

// Generate UUID for React Native
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface DashboardState {
  // Agents
  agents: Agent[]
  connections: { from: AgentId; to: AgentId }[]
  activeConnections: Set<string>

  // Projects
  projects: Project[]

  // Tasks
  tasks: Task[]
  taskHistory: Task[]
  taskSortBy: TaskSortBy
  taskSortOrder: TaskSortOrder
  taskFilters: TaskFilters

  // Chat
  messages: Message[]
  isStreaming: boolean

  // Events
  events: AgentEvent[]

  // UI State
  selectedAgentId: AgentId | null
  selectedTaskId: string | null
  showTaskBoard: boolean

  // Agent Actions
  updateAgentStatus: (agentId: AgentId, status: AgentStatus, task?: Task) => void

  // Project Actions
  addProject: (project: Project) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void

  // Task Actions
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  delegateTask: (fromAgentId: AgentId, toAgentId: AgentId, task: Task) => void
  completeTask: (taskId: string, output?: string) => void
  addStreamEntry: (taskId: string, entry: StreamEntry) => void
  updateTaskProgress: (taskId: string, progress: number, currentStep?: string) => void

  // Task Sorting/Filtering
  setTaskSortBy: (sortBy: TaskSortBy) => void
  setTaskSortOrder: (order: TaskSortOrder) => void
  setTaskFilters: (filters: TaskFilters) => void
  clearTaskFilters: () => void
  getSortedFilteredTasks: () => Task[]

  // Chat Actions
  addMessage: (message: Message) => void
  setStreaming: (isStreaming: boolean) => void

  // Event Actions
  addEvent: (event: AgentEvent) => void

  // UI Actions
  setSelectedAgent: (agentId: AgentId | null) => void
  setSelectedTask: (taskId: string | null) => void
  toggleTaskBoard: () => void
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
  projects: [],
  tasks: [],
  taskHistory: [],
  taskSortBy: 'created',
  taskSortOrder: 'desc',
  taskFilters: {},
  messages: [],
  isStreaming: false,
  events: [],
  selectedAgentId: null,
  selectedTaskId: null,
  showTaskBoard: false,

  // Agent Actions
  updateAgentStatus: (agentId, status, task) => {
    set(state => ({
      agents: state.agents.map(agent =>
        agent.id === agentId
          ? { ...agent, status, currentTask: task ?? agent.currentTask }
          : agent
      ),
    }))
  },

  // Project Actions
  addProject: (project) => {
    set(state => ({
      projects: [...state.projects, project],
    }))
  },

  updateProject: (projectId, updates) => {
    set(state => ({
      projects: state.projects.map(p =>
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
    }))
  },

  // Task Actions
  addTask: (task) => {
    const taskWithDefaults: Task = {
      ...task,
      streamOutput: task.streamOutput || [],
      progress: task.progress || 0,
    }

    set(state => ({
      tasks: [...state.tasks, taskWithDefaults],
    }))

    get().addEvent({
      id: generateUUID(),
      type: 'task_created',
      timestamp: new Date(),
      agentId: task.assignedTo || 'ceo',
      taskId: task.id,
      message: `Task created: ${task.title}`,
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
      status: 'in_progress',
      delegatedFrom: fromAgentId,
      assignedTo: toAgentId,
      updatedAt: new Date(),
    }

    set(state => ({
      tasks: state.tasks.map(t => (t.id === task.id ? updatedTask : t)),
    }))

    get().updateAgentStatus(fromAgentId, 'delegating')
    get().updateAgentStatus(toAgentId, 'working', updatedTask)
    get().highlightConnection(fromAgentId, toAgentId)

    get().addEvent({
      id: generateUUID(),
      type: 'delegation',
      timestamp: new Date(),
      agentId: fromAgentId,
      taskId: task.id,
      message: `Delegated to ${toAgentId}: ${task.title}`,
      data: { fromAgent: fromAgentId, toAgent: toAgentId },
    })

    setTimeout(() => {
      get().clearConnectionHighlight(fromAgentId, toAgentId)
      get().updateAgentStatus(fromAgentId, 'idle')
    }, 2000)
  },

  completeTask: (taskId, _output) => {
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return

    const completedTask: Task = {
      ...task,
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
      progress: 100,
    }

    set(state => ({
      tasks: state.tasks.filter(t => t.id !== taskId),
      taskHistory: [...state.taskHistory, completedTask],
    }))

    if (task.assignedTo) {
      get().updateAgentStatus(task.assignedTo, 'completed')
      setTimeout(() => {
        get().updateAgentStatus(task.assignedTo!, 'idle')
      }, 1500)
    }

    get().addEvent({
      id: generateUUID(),
      type: 'task_completed',
      timestamp: new Date(),
      agentId: task.assignedTo || 'ceo',
      taskId: task.id,
      message: `Task completed: ${task.title}`,
    })
  },

  addStreamEntry: (taskId, entry) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, streamOutput: [...(task.streamOutput || []), entry] }
          : task
      ),
    }))
  },

  updateTaskProgress: (taskId, progress, currentStep) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, progress, currentStep: currentStep ?? task.currentStep }
          : task
      ),
    }))
  },

  // Sorting & Filtering
  setTaskSortBy: (sortBy) => set({ taskSortBy: sortBy }),
  setTaskSortOrder: (order) => set({ taskSortOrder: order }),
  setTaskFilters: (filters) => set(state => ({
    taskFilters: { ...state.taskFilters, ...filters }
  })),
  clearTaskFilters: () => set({ taskFilters: {} }),

  getSortedFilteredTasks: () => {
    const { tasks, taskSortBy, taskSortOrder, taskFilters, agents, projects } = get()

    // Filter
    let filtered = tasks.filter(task => {
      if (taskFilters.agentId && task.assignedTo !== taskFilters.agentId) return false
      if (taskFilters.projectId && task.projectId !== taskFilters.projectId) return false
      if (taskFilters.status && task.status !== taskFilters.status) return false
      if (taskFilters.priority && task.priority !== taskFilters.priority) return false
      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      switch (taskSortBy) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'priority': {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        }
        case 'agent': {
          const agentA = agents.find(ag => ag.id === a.assignedTo)?.displayName || ''
          const agentB = agents.find(ag => ag.id === b.assignedTo)?.displayName || ''
          comparison = agentA.localeCompare(agentB)
          break
        }
        case 'project': {
          const projectA = projects.find(p => p.id === a.projectId)?.name || ''
          const projectB = projects.find(p => p.id === b.projectId)?.name || ''
          comparison = projectA.localeCompare(projectB)
          break
        }
        case 'status': {
          const statusOrder = { pending: 0, in_progress: 1, review: 2, completed: 3 }
          comparison = (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0)
          break
        }
      }

      return taskSortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  // Chat Actions
  addMessage: (message) => {
    set(state => ({
      messages: [...state.messages, message],
    }))
  },

  setStreaming: (isStreaming) => set({ isStreaming }),

  // Event Actions
  addEvent: (event) => {
    set(state => ({
      events: [event, ...state.events].slice(0, 100),
    }))
  },

  // UI Actions
  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),
  setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),
  toggleTaskBoard: () => set(state => ({ showTaskBoard: !state.showTaskBoard })),

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
      projects: [],
      tasks: [],
      taskHistory: [],
      taskSortBy: 'created',
      taskSortOrder: 'desc',
      taskFilters: {},
      messages: [],
      isStreaming: false,
      events: [],
      selectedAgentId: null,
      selectedTaskId: null,
      showTaskBoard: false,
    })
  },
}))

// Alias for backward compatibility
export const useStore = useDashboardStore
