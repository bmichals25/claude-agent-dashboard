import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Agent,
  AgentId,
  Task,
  Message,
  AgentEvent,
  AgentStatus,
  Project,
  ProjectStats,
  StreamEntry,
  TaskSortBy,
  TaskSortOrder,
  TaskFilters,
  NavigationPage,
  AgentHealthMetrics,
  AppSettings,
  PipelineProject,
  PipelineActivity,
  NotificationCounts,
} from './types'
import { getAllAgents, getAgentConnections } from './agentCatalog'

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Claude Agent',
  appTagline: '19-Agent Orchestration',
  theme: 'dark',
  accentColor: '#00fff0',
  showNotifications: true,
  autoScrollChat: true,
  soundEnabled: true,
  soundVolume: 0.5,
}

interface DashboardState {
  // Settings
  settings: AppSettings

  // Navigation
  currentPage: NavigationPage
  navDrawerOpen: boolean

  // Agents
  agents: Agent[]
  connections: { from: AgentId; to: AgentId }[]
  activeConnections: Set<string>

  // Agent Health
  agentHealth: AgentHealthMetrics[]
  healthLastUpdated: Date | null

  // Projects
  projects: Project[]
  activeProjectId: string | null  // null = "All Projects" view
  hasShownProjectPicker: boolean  // Session flag for startup modal

  // Pipeline
  pipelineProjects: PipelineProject[]
  pipelineActivity: PipelineActivity | null
  pipelineLoading: boolean
  selectedPipelineProjectId: string | null
  notificationCounts: NotificationCounts

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
  showProjectsPanel: boolean
  showNewProjectWizard: boolean
  mainViewMode: 'agents' | 'project' | 'projects'
  
  // Agent Actions
  updateAgentStatus: (agentId: AgentId, status: AgentStatus, task?: Task) => void
  
  // Project Actions
  addProject: (project: Project) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
  archiveProject: (projectId: string) => void
  setActiveProject: (projectId: string | null) => void
  getActiveProject: () => Project | null
  getProjectStats: (projectId: string) => ProjectStats
  setHasShownProjectPicker: (shown: boolean) => void
  getProjectFilteredTasks: () => Task[]  // Tasks filtered by active project
  
  // Task Actions
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
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
  setShowProjectsPanel: (show: boolean) => void
  setShowNewProjectWizard: (show: boolean) => void
  setMainViewMode: (mode: 'agents' | 'project' | 'projects') => void
  highlightConnection: (from: AgentId, to: AgentId) => void
  clearConnectionHighlight: (from: AgentId, to: AgentId) => void
  reset: () => void

  // Navigation Actions
  setCurrentPage: (page: NavigationPage) => void
  toggleNavDrawer: () => void
  setNavDrawerOpen: (open: boolean) => void

  // Agent Health Actions
  setAgentHealth: (health: AgentHealthMetrics[]) => void
  updateAgentHealthMetrics: (agentId: AgentId, metrics: Partial<AgentHealthMetrics>) => void
  refreshAgentHealth: () => Promise<void>

  // Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void

  // Pipeline Actions
  setPipelineProjects: (projects: PipelineProject[]) => void
  addPipelineProject: (project: PipelineProject) => void
  setPipelineActivity: (activity: PipelineActivity | null) => void
  setPipelineLoading: (loading: boolean) => void
  setSelectedPipelineProject: (projectId: string | null) => void
  refreshPipeline: () => Promise<void>
  updatePipelineProject: (project: PipelineProject) => Promise<void>
  getSelectedPipelineProject: () => PipelineProject | null
}

const initialAgents = getAllAgents()
const initialConnections = getAgentConnections()

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
  // Initial State
  settings: DEFAULT_SETTINGS,
  currentPage: 'dashboard',
  navDrawerOpen: false,
  agents: initialAgents,
  connections: initialConnections,
  activeConnections: new Set(),
  agentHealth: [],
  healthLastUpdated: null,
  projects: [],
  activeProjectId: null,
  hasShownProjectPicker: false,
  // Pipeline state
  pipelineProjects: [],
  pipelineActivity: null,
  pipelineLoading: false,
  selectedPipelineProjectId: null,
  notificationCounts: { blocked: 0, review: 0, agentIssues: 0, total: 0 },
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
  showProjectsPanel: false,
  showNewProjectWizard: false,
  mainViewMode: 'agents',

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

  archiveProject: (projectId) => {
    set(state => ({
      // Archive the project
      projects: state.projects.map(p =>
        p.id === projectId ? { ...p, status: 'archived' as const, updatedAt: new Date() } : p
      ),
      // Archive all tasks belonging to this project (move to taskHistory)
      tasks: state.tasks.filter(t => t.projectId !== projectId),
      taskHistory: [
        ...state.taskHistory,
        ...state.tasks
          .filter(t => t.projectId === projectId)
          .map(t => ({ ...t, status: 'completed' as const, completedAt: new Date() }))
      ],
      // Clear active project if it was archived
      activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId,
    }))
  },

  setActiveProject: (projectId) => {
    set({ activeProjectId: projectId })
  },

  getActiveProject: () => {
    const { projects, activeProjectId } = get()
    if (!activeProjectId) return null
    return projects.find(p => p.id === activeProjectId) || null
  },

  getProjectStats: (projectId) => {
    const { tasks, taskHistory } = get()
    const projectTasks = tasks.filter(t => t.projectId === projectId)
    const projectHistory = taskHistory.filter(t => t.projectId === projectId)

    const activeTasks = projectTasks.filter(t => t.status === 'in_progress').length
    const completedTasks = projectHistory.length
    const totalTasks = projectTasks.length + completedTasks

    // Get unique agents working on this project's tasks
    const activeAgents = [...new Set(
      projectTasks
        .filter(t => t.assignedTo && t.status === 'in_progress')
        .map(t => t.assignedTo!)
    )]

    // Find most recent activity
    const allDates = [
      ...projectTasks.map(t => t.updatedAt),
      ...projectHistory.map(t => t.completedAt || t.updatedAt)
    ].filter(Boolean) as Date[]
    const lastActivityAt = allDates.length > 0
      ? new Date(Math.max(...allDates.map(d => new Date(d).getTime())))
      : null

    // Calculate progress
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      activeTasks,
      completedTasks,
      totalTasks,
      activeAgents,
      lastActivityAt,
      progressPercent,
    }
  },

  setHasShownProjectPicker: (shown) => {
    set({ hasShownProjectPicker: shown })
  },

  getProjectFilteredTasks: () => {
    const { tasks, activeProjectId } = get()
    if (!activeProjectId) return tasks  // All Projects view
    return tasks.filter(t => t.projectId === activeProjectId)
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
      id: crypto.randomUUID(),
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

  deleteTask: (taskId) => {
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return

    set(state => ({
      tasks: state.tasks.filter(t => t.id !== taskId),
    }))

    get().addEvent({
      id: crypto.randomUUID(),
      type: 'task_completed',
      timestamp: new Date(),
      agentId: task.assignedTo || 'ceo',
      taskId: task.id,
      message: `Task deleted: ${task.title}`,
    })
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
      id: crypto.randomUUID(),
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

  completeTask: (taskId, output) => {
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
      id: crypto.randomUUID(),
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
  setShowProjectsPanel: (show) => set({ showProjectsPanel: show }),
  setShowNewProjectWizard: (show) => set({ showNewProjectWizard: show }),
  setMainViewMode: (mode) => set({ mainViewMode: mode }),

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
      currentPage: 'dashboard',
      navDrawerOpen: false,
      agents: initialAgents,
      connections: initialConnections,
      activeConnections: new Set(),
      agentHealth: [],
      healthLastUpdated: null,
      projects: [],
      activeProjectId: null,
      hasShownProjectPicker: false,
      pipelineProjects: [],
      pipelineActivity: null,
      pipelineLoading: false,
      selectedPipelineProjectId: null,
      notificationCounts: { blocked: 0, review: 0, agentIssues: 0, total: 0 },
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
      showProjectsPanel: false,
      mainViewMode: 'agents',
    })
  },

  // Navigation Actions
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleNavDrawer: () => set(state => ({ navDrawerOpen: !state.navDrawerOpen })),
  setNavDrawerOpen: (open) => set({ navDrawerOpen: open }),

  // Agent Health Actions
  setAgentHealth: (health) => set({ agentHealth: health, healthLastUpdated: new Date() }),

  updateAgentHealthMetrics: (agentId, metrics) => {
    set(state => ({
      agentHealth: state.agentHealth.map(h =>
        h.agentId === agentId ? { ...h, ...metrics } : h
      ),
    }))
  },

  refreshAgentHealth: async () => {
    try {
      const response = await fetch('/api/agent-health')
      if (response.ok) {
        const health = await response.json()
        set({ agentHealth: health, healthLastUpdated: new Date() })
      }
    } catch (error) {
      console.error('Failed to refresh agent health:', error)
    }
  },

  // Settings Actions
  updateSettings: (updates) => {
    set(state => ({
      settings: { ...state.settings, ...updates },
    }))
  },

  resetSettings: () => {
    set({ settings: DEFAULT_SETTINGS })
  },

  // Pipeline Actions
  setPipelineProjects: (projects) => {
    // Compute notification counts when setting projects
    const blocked = projects.filter(p => p.status === 'Blocked').length
    const review = projects.filter(p => p.status === 'Review').length
    const { agentHealth } = get()
    const agentIssues = agentHealth.filter(h => h.status === 'critical' || h.status === 'needs_attention').length

    set({
      pipelineProjects: projects,
      notificationCounts: {
        blocked,
        review,
        agentIssues,
        total: blocked + review + agentIssues,
      },
    })
  },

  addPipelineProject: (project) => {
    set(state => ({
      pipelineProjects: [project, ...state.pipelineProjects],
    }))
  },

  setPipelineActivity: (activity) => {
    set({ pipelineActivity: activity })
  },

  setPipelineLoading: (loading) => {
    set({ pipelineLoading: loading })
  },

  setSelectedPipelineProject: (projectId) => {
    set({ selectedPipelineProjectId: projectId })
  },

  refreshPipeline: async () => {
    set({ pipelineLoading: true })
    try {
      const response = await fetch('/api/pipeline')
      if (response.ok) {
        const data = await response.json()
        get().setPipelineProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to refresh pipeline:', error)
    } finally {
      set({ pipelineLoading: false })
    }
  },

  updatePipelineProject: async (project: PipelineProject) => {
    try {
      // Optimistically update local state
      const { pipelineProjects } = get()
      const updatedProjects = pipelineProjects.map(p =>
        p.id === project.id ? project : p
      )
      set({ pipelineProjects: updatedProjects })

      // Send update to API (which syncs with Notion)
      const response = await fetch('/api/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })

      if (!response.ok) {
        // Revert on failure
        console.error('Failed to update project:', await response.text())
        set({ pipelineProjects }) // Restore original
      }
    } catch (error) {
      console.error('Failed to update pipeline project:', error)
    }
  },

  getSelectedPipelineProject: () => {
    const { pipelineProjects, selectedPipelineProjectId } = get()
    if (!selectedPipelineProjectId) return null
    return pipelineProjects.find(p => p.id === selectedPipelineProjectId) || null
  },
}),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        settings: state.settings,
        tasks: state.tasks,
        taskHistory: state.taskHistory,
        messages: state.messages,
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        events: state.events.slice(0, 50), // Keep last 50 events
      }),
      onRehydrateStorage: () => (state) => {
        // Rehydrate dates from localStorage
        if (state) {
          state.tasks = state.tasks.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          }))
          state.taskHistory = state.taskHistory.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          }))
          state.messages = state.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
          state.projects = state.projects.map(p => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }))
          state.events = state.events.map(e => ({
            ...e,
            timestamp: new Date(e.timestamp),
          }))
        }
      },
    }
  )
)

// Alias for backward compatibility
export const useStore = useDashboardStore
