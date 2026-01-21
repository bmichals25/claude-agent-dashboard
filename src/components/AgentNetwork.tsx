'use client'

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { AgentNode } from './AgentNode'
import { ProjectPickerModal } from './ProjectPickerModal'
import { NewProjectWizard } from './NewProjectWizard'
import { getAgentColorWithOpacity, formatTimestamp, truncate } from '@/lib/utils'
import { getDefaultLayoutConfig, calculateOptimalLayout } from '@/lib/layoutCalculator'
import type { AgentId, Agent, Task, TaskStatus } from '@/lib/types'

// Task status columns for kanban - Mission Control aesthetic
const STATUS_COLUMNS: { status: TaskStatus; label: string; shortLabel: string; color: string; icon: string }[] = [
  { status: 'pending', label: 'Queue', shortLabel: 'QUE', color: '#6b5f52', icon: '◇' },
  { status: 'in_progress', label: 'Active', shortLabel: 'ACT', color: '#ff6b35', icon: '▸' },
  { status: 'review', label: 'Review', shortLabel: 'REV', color: '#f7c59f', icon: '◎' },
  { status: 'completed', label: 'Complete', shortLabel: 'DON', color: '#2ec4b6', icon: '✓' },
]

// Priority configuration with full styling
const PRIORITY_CONFIG: Record<string, { color: string; label: string; glow: string }> = {
  critical: { color: '#ef4444', label: 'CRIT', glow: 'rgba(239, 68, 68, 0.4)' },
  high: { color: '#f97316', label: 'HIGH', glow: 'rgba(249, 115, 22, 0.3)' },
  medium: { color: '#eab308', label: 'MED', glow: 'rgba(234, 179, 8, 0.2)' },
  low: { color: '#6b7280', label: 'LOW', glow: 'rgba(107, 114, 128, 0.1)' },
}

// Legacy compat
const PRIORITY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(PRIORITY_CONFIG).map(([k, v]) => [k, v.color])
)

// Department definitions
const DEPARTMENTS = [
  {
    id: 'chief_of_staff',
    name: 'Chief of Staff',
    description: 'Admin & Support Operations',
    vpId: 'chief_of_staff' as AgentId,
    members: ['support_agent'] as AgentId[],
    color: '#ff00c1',
  },
  {
    id: 'pipeline_manager',
    name: 'Pipeline Management',
    description: 'Project Lifecycle Coordination',
    vpId: 'pipeline_manager' as AgentId,
    members: ['autopilot_agent'] as AgentId[],
    color: '#7000ff',
  },
  {
    id: 'agent_operations',
    name: 'Agent Operations',
    description: 'Health Monitoring & Optimization',
    vpId: 'agent_operations' as AgentId,
    members: [] as AgentId[],
    color: '#00ffaa',
  },
  {
    id: 'vp_engineering',
    name: 'Engineering',
    description: 'Technical Execution & Architecture',
    vpId: 'vp_engineering' as AgentId,
    members: ['architect', 'developer', 'devops_engineer', 'code_reviewer', 'security_engineer'] as AgentId[],
    color: '#00ff66',
  },
  {
    id: 'vp_product',
    name: 'Product',
    description: 'Strategy, Research & Growth',
    vpId: 'vp_product' as AgentId,
    members: ['product_researcher', 'product_manager', 'data_engineer', 'growth_marketer'] as AgentId[],
    color: '#ffaa00',
  },
  {
    id: 'vp_design_qa',
    name: 'Design & QA',
    description: 'UX, Visual Design & Quality',
    vpId: 'vp_design_qa' as AgentId,
    members: ['frontend_designer', 'user_testing', 'technical_writer'] as AgentId[],
    color: '#ff6b6b',
  },
]

// Department positions for focused view - VP centered, members below (no CEO in department view)
const getDepartmentPositions = (memberCount: number): { vp: { x: number; y: number }; members: { x: number; y: number }[] } => {
  const vpPos = { x: 50, y: 35 }   // VP centered below banner
  const members: { x: number; y: number }[] = []

  if (memberCount === 0) {
    return { vp: vpPos, members }
  }

  // Spread members in an arc below the VP
  const spacing = Math.min(18, 72 / memberCount)
  const startX = 50 - ((memberCount - 1) * spacing) / 2
  for (let i = 0; i < memberCount; i++) {
    members.push({
      x: startX + i * spacing,
      y: 70,
    })
  }

  return { vp: vpPos, members }
}

// Memoized connection line component
const ConnectionLine = memo(function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  color,
  isActive
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  isActive: boolean
}) {
  return (
    <line
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      stroke={getAgentColorWithOpacity(color, isActive ? 0.5 : 0.2)}
      strokeWidth={isActive ? 2.5 : 1.5}
      strokeLinecap="round"
    />
  )
})

// View mode type for agent network
type AgentViewMode = 'full' | 'department' | 'tasks' | 'all_projects'

// Map view modes to URL slugs
const VIEW_MODE_SLUGS: Record<AgentViewMode, string> = {
  full: 'network',
  department: 'departments',
  all_projects: 'projects',
  tasks: 'tasks',
}

interface AgentNetworkProps {
  initialView?: AgentViewMode
  projectSlug?: string
}

export function AgentNetwork({ initialView = 'full', projectSlug }: AgentNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })
  const zoomSyncTimeout = useRef<NodeJS.Timeout | null>(null)
  const {
    agents,
    connections,
    activeConnections,
    setSelectedAgent,
    tasks,
    taskHistory,
    projects,
    addTask,
    updateTask,
    deleteTask,
    activeProjectId,
    setActiveProject,
    hasShownProjectPicker,
    setHasShownProjectPicker,
    showNewProjectWizard,
    setShowNewProjectWizard,
  } = useDashboardStore()

  // Track viewport dimensions for dynamic layout
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 })

  // Resize observer for dynamic layout
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      setViewportSize({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }

    // Initial size
    updateSize()

    // Observe resize
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  // Calculate dynamic layout based on viewport
  const dynamicLayout = useMemo(() => {
    const config = getDefaultLayoutConfig(viewportSize.width, viewportSize.height)
    return calculateOptimalLayout(config)
  }, [viewportSize.width, viewportSize.height])

  // Get agents with computed positions
  const agentsWithDynamicPositions = useMemo(() => {
    return agents.map(agent => {
      const computedPosition = dynamicLayout.positions[agent.id]
      if (computedPosition) {
        return {
          ...agent,
          position: computedPosition,
        }
      }
      return agent
    })
  }, [agents, dynamicLayout.positions])

  // Get dynamic size for an agent based on tier
  const getAgentSize = useCallback((tier: Agent['tier']): 'sm' | 'md' | 'lg' => {
    return dynamicLayout.sizes[tier] || 'sm'
  }, [dynamicLayout.sizes])

  // View mode state - initialized from prop
  const [viewMode, setViewModeState] = useState<AgentViewMode>(initialView)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [currentDeptIndex, setCurrentDeptIndex] = useState(0)

  // Sync viewMode when initialView prop changes (e.g., navigating between pages)
  useEffect(() => {
    setViewModeState(initialView)
  }, [initialView])

  // Handle view mode change with URL update
  const setViewMode = useCallback((mode: AgentViewMode) => {
    setViewModeState(mode)
    // Update URL to reflect the new view mode
    const slug = projectSlug || 'all'
    const viewSlug = VIEW_MODE_SLUGS[mode]
    window.history.replaceState(null, '', `/${slug}/agents/${viewSlug}`)
  }, [projectSlug])

  // Project modals state
  const [showProjectPicker, setShowProjectPicker] = useState(false)

  // Show project picker on startup if no project selected and not shown yet
  useEffect(() => {
    if (!hasShownProjectPicker && projects.length > 0) {
      setShowProjectPicker(true)
    }
  }, [hasShownProjectPicker, projects.length])

  // New task form state
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<AgentId | ''>('')
  const currentDept = DEPARTMENTS[currentDeptIndex]

  // Filter state for task board
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [filterAgent, setFilterAgent] = useState<AgentId | 'all'>('all')
  const [filterProject, setFilterProject] = useState<string | 'all'>('all')
  const [openDropdown, setOpenDropdown] = useState<'priority' | 'agent' | 'project' | null>(null)

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState<{
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    assignedTo: AgentId | undefined
    status: TaskStatus
  } | null>(null)

  // Get tasks for a specific status
  const getTasksForStatus = useCallback((status: TaskStatus) => {
    if (status === 'completed') {
      return taskHistory.slice(-20).reverse()
    }
    return tasks.filter(t => t.status === status)
  }, [tasks, taskHistory])

  // Get agent by ID helper
  const getAgentById = useCallback((id: AgentId | undefined) => {
    if (!id) return null
    return agents.find(a => a.id === id) || null
  }, [agents])

  // Get project by ID helper
  const getProjectById = useCallback((id: string | null) => {
    if (!id) return null
    return projects.find(p => p.id === id) || null
  }, [projects])

  // Filter tasks based on search and filter criteria
  const getFilteredTasksForStatus = useCallback((status: TaskStatus) => {
    let tasksToFilter = status === 'completed'
      ? taskHistory.slice(-20).reverse()
      : tasks.filter(t => t.status === status)

    return tasksToFilter.filter(task => {
      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false
      }
      // Agent filter
      if (filterAgent !== 'all' && task.assignedTo !== filterAgent) {
        return false
      }
      // Project filter
      if (filterProject !== 'all' && task.projectId !== filterProject) {
        return false
      }
      return true
    })
  }, [tasks, taskHistory, searchQuery, filterPriority, filterAgent, filterProject])

  // Calculate task stats
  const taskStats = useMemo(() => {
    const active = tasks.filter(t => t.status === 'in_progress').length
    const review = tasks.filter(t => t.status === 'review').length
    const completed = taskHistory.length
    const pending = tasks.filter(t => t.status === 'pending').length
    return { active, review, completed, pending, total: tasks.length }
  }, [tasks, taskHistory])

  // Check if any filters are active
  const hasActiveFilters = searchQuery || filterPriority !== 'all' || filterAgent !== 'all' || filterProject !== 'all'

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setFilterPriority('all')
    setFilterAgent('all')
    setFilterProject('all')
  }, [])

  // Edit modal handlers
  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task)
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignedTo: task.assignedTo,
      status: task.status,
    })
  }, [])

  const closeEditModal = useCallback(() => {
    setEditingTask(null)
    setEditForm(null)
  }, [])

  const saveEditModal = useCallback(() => {
    if (!editingTask || !editForm) return
    updateTask(editingTask.id, {
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority,
      assignedTo: editForm.assignedTo,
      status: editForm.status,
    })
    closeEditModal()
  }, [editingTask, editForm, updateTask, closeEditModal])

  const handleDeleteTask = useCallback(() => {
    if (!editingTask) return
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(editingTask.id)
      closeEditModal()
    }
  }, [editingTask, deleteTask, closeEditModal])

  // Create new task handler
  const handleCreateTask = useCallback(() => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      status: 'pending',
      priority: newTaskPriority,
      assignedTo: newTaskAssignedTo || undefined,
      projectId: activeProjectId,  // Auto-assign to active project
      createdAt: new Date(),
      updatedAt: new Date(),
      streamOutput: [],
      progress: 0,
    }

    addTask(newTask)
    // Reset form
    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskPriority('medium')
    setNewTaskAssignedTo('')
    setShowNewTaskForm(false)
  }, [newTaskTitle, newTaskDescription, newTaskPriority, newTaskAssignedTo, addTask, activeProjectId])

  // Close new task modal
  const closeNewTaskModal = useCallback(() => {
    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskPriority('medium')
    setNewTaskAssignedTo('')
    setShowNewTaskForm(false)
  }, [])

  // Navigation handlers
  const goToPrevDept = useCallback(() => {
    setCurrentDeptIndex(i => (i - 1 + DEPARTMENTS.length) % DEPARTMENTS.length)
  }, [])

  const goToNextDept = useCallback(() => {
    setCurrentDeptIndex(i => (i + 1) % DEPARTMENTS.length)
  }, [])

  // Keyboard navigation for department view
  useEffect(() => {
    if (viewMode !== 'department') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevDept()
      } else if (e.key === 'ArrowRight') {
        goToNextDept()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, goToPrevDept, goToNextDept])

  // Use ref for transform during drag to avoid re-renders
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  // Helper to update zoom via direct DOM manipulation
  const applyZoom = useCallback((newScale: number) => {
    transformRef.current = { ...transformRef.current, scale: newScale }

    const canvas = containerRef.current?.querySelector('[data-canvas]') as HTMLElement
    if (canvas) {
      canvas.style.transform = `translate(${transformRef.current.x}px, ${transformRef.current.y}px) scale(${newScale})`
    }

    const zoomDisplay = containerRef.current?.querySelector('[data-zoom-display]') as HTMLElement
    if (zoomDisplay) {
      zoomDisplay.textContent = `${Math.round(newScale * 100)}%`
    }

    // Debounced state sync
    if (zoomSyncTimeout.current) clearTimeout(zoomSyncTimeout.current)
    zoomSyncTimeout.current = setTimeout(() => {
      setTransform({ ...transformRef.current })
    }, 150)
  }, [])

  // Handle mouse wheel zoom - direct DOM update for performance
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    const newScale = Math.min(Math.max(transformRef.current.scale * delta, 0.3), 3)
    applyZoom(newScale)
  }, [applyZoom])

  // Handle pan start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-agent-node]')) return
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true)
      panStartRef.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y
      }
    }
  }, [])

  // Handle pan move - use RAF for smooth updates
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return

    const newX = e.clientX - panStartRef.current.x
    const newY = e.clientY - panStartRef.current.y
    transformRef.current = { ...transformRef.current, x: newX, y: newY }

    // Direct DOM update for smoother panning
    const canvas = containerRef.current?.querySelector('[data-canvas]') as HTMLElement
    if (canvas) {
      canvas.style.transform = `translate(${newX}px, ${newY}px) scale(${transformRef.current.scale})`
    }
  }, [isPanning])

  // Handle pan end - sync state
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      setTransform({ ...transformRef.current })
    }
  }, [isPanning])

  // Reset view
  const resetView = useCallback(() => {
    transformRef.current = { x: 0, y: 0, scale: 1 }
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Memoize connections rendering - use dynamic positions
  const connectionElements = useMemo(() => {
    return connections.map(({ from, to }) => {
      const fromAgent = agentsWithDynamicPositions.find(a => a.id === from)
      const toAgent = agentsWithDynamicPositions.find(a => a.id === to)

      if (!fromAgent || !toAgent) return null

      const key = `${from}-${to}`
      const isActive = activeConnections.has(key)

      return (
        <ConnectionLine
          key={key}
          x1={fromAgent.position.x}
          y1={fromAgent.position.y}
          x2={toAgent.position.x}
          y2={toAgent.position.y}
          color={fromAgent.color}
          isActive={isActive}
        />
      )
    })
  }, [connections, agentsWithDynamicPositions, activeConnections])

  // Memoize agent nodes for full view - use dynamic positions and sizes
  const agentNodes = useMemo(() => {
    return agentsWithDynamicPositions.map(agent => (
      <AgentNode key={agent.id} agent={agent} size={getAgentSize(agent.tier)} />
    ))
  }, [agentsWithDynamicPositions, getAgentSize])

  // Department view: Get agents with custom positions (VP centered, members below)
  const departmentAgents = useMemo(() => {
    if (viewMode !== 'department') return null

    const vpAgent = agents.find(a => a.id === currentDept.vpId)
    const memberAgents = currentDept.members.map(id => agents.find(a => a.id === id)).filter(Boolean)

    const positions = getDepartmentPositions(memberAgents.length)

    return {
      vp: vpAgent ? { ...vpAgent, position: positions.vp } : null,
      members: memberAgents.map((agent, i) => agent ? { ...agent, position: positions.members[i] } : null).filter(Boolean),
    }
  }, [viewMode, currentDept, agents])

  // Department view connections (VP to members only, no CEO connection)
  const departmentConnections = useMemo(() => {
    if (viewMode !== 'department' || !departmentAgents) return null

    const lines: { from: { x: number; y: number }; to: { x: number; y: number }; color: string }[] = []

    // VP to members only
    if (departmentAgents.vp) {
      departmentAgents.members.forEach(member => {
        if (member) {
          lines.push({
            from: departmentAgents.vp!.position,
            to: member.position,
            color: member.color,
          })
        }
      })
    }

    return lines
  }, [viewMode, departmentAgents])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseDown={viewMode === 'full' ? handleMouseDown : undefined}
      onMouseMove={viewMode === 'full' ? handleMouseMove : undefined}
      onMouseUp={viewMode === 'full' ? handleMouseUp : undefined}
      onMouseLeave={viewMode === 'full' ? handleMouseUp : undefined}
      style={{ cursor: viewMode === 'full' ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
    >
      {/* Top Right Controls - View Mode Toggle (hidden in tasks view) */}
      {viewMode !== 'tasks' && (
        <div
          style={{
            position: 'absolute',
            top: '24px',
            right: '40px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '12px',
          }}
        >
          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              padding: '5px',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
            }}
          >
          {[
            { mode: 'full' as const, icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', title: 'Agents' },
            { mode: 'department' as const, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', title: 'Departments' },
          ].map(({ mode, icon, title }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === mode ? 'var(--bg-elevated)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: viewMode === mode ? 'var(--text-main)' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              title={title}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
            </button>
          ))}
          </div>
        </div>
      )}

      {/* FULL VIEW MODE */}
      <AnimatePresence mode="wait">
        {viewMode === 'full' && (
          <motion.div
            key="full-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {/* Transformable canvas layer */}
            <div
              data-canvas
              className="absolute inset-0 origin-center"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                willChange: isPanning ? 'transform' : 'auto',
              }}
            >
              {/* SVG Layer for connections */}
              <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 0 }}
                preserveAspectRatio="none"
              >
                {connectionElements}
              </svg>

              {/* Agent Nodes */}
              {agentNodes}
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
              <button
                onClick={() => applyZoom(Math.min(transformRef.current.scale * 1.2, 3))}
                className="btn btn-ghost btn-icon btn-sm"
              >
                +
              </button>
              <button
                onClick={() => applyZoom(Math.max(transformRef.current.scale * 0.8, 0.3))}
                className="btn btn-ghost btn-icon btn-sm"
              >
                −
              </button>
              <button
                onClick={resetView}
                className="btn btn-ghost btn-sm"
              >
                Reset
              </button>
              <span data-zoom-display className="text-caption ml-2">
                {Math.round(transform.scale * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEPARTMENT VIEW MODE */}
      <AnimatePresence mode="wait">
        {viewMode === 'department' && departmentAgents && (
          <motion.div
            key="department-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {/* Full canvas for agents - CEO top-left, VP center, members below */}
            <div className="absolute inset-0">
              {/* SVG connections for department view */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 1 }}
                preserveAspectRatio="none"
              >
                {departmentConnections?.map((line, i) => (
                  <line
                    key={i}
                    x1={`${line.from.x}%`}
                    y1={`${line.from.y}%`}
                    x2={`${line.to.x}%`}
                    y2={`${line.to.y}%`}
                    stroke={getAgentColorWithOpacity(line.color, 0.4)}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                ))}
              </svg>

              {/* VP Agent */}
              {departmentAgents.vp && (
                <AgentNode key={departmentAgents.vp.id} agent={departmentAgents.vp} size={getAgentSize(departmentAgents.vp.tier)} />
              )}

              {/* Member Agents */}
              {departmentAgents.members.map(agent => agent && (
                <AgentNode key={agent.id} agent={agent} size={getAgentSize('specialist')} />
              ))}
            </div>

            {/* Department Banner with Navigation - at the top */}
            <div className="absolute top-14 left-0 right-0 z-30 flex items-center justify-center px-6">
              <div className="flex items-center gap-6 max-w-2xl w-full">
                {/* Left Arrow */}
                <motion.button
                  onClick={goToPrevDept}
                  className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--glass-border-hover)] transition-all flex-shrink-0"
                  whileHover={{ scale: 1.08, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>

                {/* Department Info Banner - static pill, animated content */}
                <motion.div
                  className="flex-1 rounded-[2rem] border relative overflow-hidden"
                  animate={{
                    background: `linear-gradient(180deg, ${currentDept.color}08 0%, var(--bg-elevated) 100%)`,
                    borderColor: `${currentDept.color}20`,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: `linear-gradient(180deg, ${currentDept.color}08 0%, var(--bg-elevated) 100%)`,
                    borderColor: `${currentDept.color}20`,
                  }}
                >
                  {/* Inner content with proper spacing */}
                  <div className="px-10 py-5 text-center">
                    {/* Title - animated */}
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={currentDept.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="text-xl font-semibold tracking-wide relative z-10"
                        style={{ color: currentDept.color }}
                      >
                        {currentDept.name}
                      </motion.h2>
                    </AnimatePresence>

                    {/* Description - animated */}
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`${currentDept.id}-desc`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: 0.05 }}
                        className="text-sm text-[var(--text-secondary)] relative z-10 mt-2 tracking-wide"
                      >
                        {currentDept.description}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Subtle top highlight - animated color */}
                  <motion.div
                    className="absolute inset-x-0 top-0 h-px"
                    animate={{ background: `linear-gradient(90deg, transparent, ${currentDept.color}30, transparent)` }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>

                {/* Right Arrow */}
                <motion.button
                  onClick={goToNextDept}
                  className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--glass-border-hover)] transition-all flex-shrink-0"
                  whileHover={{ scale: 1.08, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Keyboard hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-caption flex items-center gap-4 z-10">
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--glass-border)] text-xs">←</kbd>
                <kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--glass-border)] text-xs">→</kbd>
                <span>Navigate</span>
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span>{currentDeptIndex + 1} of {DEPARTMENTS.length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALL PROJECTS VIEW MODE */}
      <AnimatePresence mode="wait">
        {viewMode === 'all_projects' && (
          <motion.div
            key="all-projects-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {/* Background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 107, 53, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 107, 53, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
              }}
            />

            {/* Content */}
            <div style={{
              position: 'absolute',
              top: '24px',
              left: '40px',
              right: '40px',
              bottom: '32px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={{ marginBottom: '24px', paddingRight: '140px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <button
                    onClick={() => setViewMode('full')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                    title="Back to Dashboard"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <div>
                    <h1 style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      letterSpacing: '-0.02em',
                      margin: 0,
                    }}>
                      Your Projects
                    </h1>
                    <p style={{
                      fontSize: '12px',
                      fontFamily: 'ui-monospace, monospace',
                      color: 'var(--text-muted)',
                      margin: '4px 0 0 0',
                    }}>
                      {projects.filter(p => p.status !== 'archived').length} active
                      {' • '}
                      {projects.filter(p => p.status === 'paused').length} paused
                      {' • '}
                      {projects.filter(p => p.status === 'archived').length} archived
                    </p>
                  </div>
                </div>
              </motion.header>

              {/* Projects Grid */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
                alignContent: 'start',
              }}>
                {/* Active Projects */}
                {projects
                  .filter(p => p.status !== 'archived')
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map(project => {
                    const stats = useDashboardStore.getState().getProjectStats(project.id)
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          setActiveProject(project.id)
                          setViewMode('full')
                        }}
                        style={{
                          padding: '20px',
                          borderRadius: '16px',
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--glass-border)',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Color bar */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          backgroundColor: project.color,
                        }} />

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: `${project.color}20`,
                            color: project.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              margin: 0,
                              marginBottom: '4px',
                            }}>
                              {project.name}
                            </h3>
                            {project.description && (
                              <p style={{
                                fontSize: '12px',
                                color: 'var(--text-dim)',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '1px solid var(--glass-border)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: stats.activeTasks > 0 ? '#ff6b35' : '#6b7280',
                            }} />
                            <span style={{
                              fontSize: '12px',
                              fontFamily: 'ui-monospace, monospace',
                              color: stats.activeTasks > 0 ? '#ff6b35' : 'var(--text-dim)',
                            }}>
                              {stats.activeTasks} active
                            </span>
                          </div>
                          <span style={{
                            fontSize: '12px',
                            fontFamily: 'ui-monospace, monospace',
                            color: 'var(--text-dim)',
                          }}>
                            {stats.activeAgents.length} agent{stats.activeAgents.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Progress */}
                        {stats.totalTasks > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '6px',
                            }}>
                              <span style={{
                                fontSize: '10px',
                                fontFamily: 'ui-monospace, monospace',
                                color: 'var(--text-dim)',
                              }}>
                                Progress
                              </span>
                              <span style={{
                                fontSize: '10px',
                                fontFamily: 'ui-monospace, monospace',
                                color: 'var(--text-secondary)',
                                fontWeight: 600,
                              }}>
                                {stats.progressPercent}%
                              </span>
                            </div>
                            <div style={{
                              height: '4px',
                              backgroundColor: 'var(--bg-surface)',
                              borderRadius: '2px',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${stats.progressPercent}%`,
                                backgroundColor: project.color,
                                borderRadius: '2px',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}

                {/* New Project Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowNewProjectWizard(true)}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: 'transparent',
                    border: '2px dashed var(--glass-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '180px',
                    gap: '12px',
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                  }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      margin: 0,
                    }}>
                      New Project
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-dim)',
                      margin: '4px 0 0 0',
                    }}>
                      Start a new venture
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TASKS VIEW MODE - Clean design matching Agent Health */}
      <AnimatePresence mode="wait">
        {viewMode === 'tasks' && (
          <motion.div
            key="tasks-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {/* Content Wrapper - matching Agent Health layout */}
            <div className="h-full w-full overflow-auto scrollbar-fade">
              <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 56px 120px' }}>
              {/* Header Section */}
              <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: '48px' }}
              >
              {/* Title Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}>
                    Task Operations
                  </h1>
                  <p style={{
                    fontSize: '14px',
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    color: 'var(--text-dim)',
                    marginTop: '6px',
                    letterSpacing: '0.02em',
                  }}>
                    {tasks.length} tasks · {taskStats.active} active
                  </p>
                </div>
                {/* New Task Button */}
                <motion.button
                  onClick={() => setShowNewTaskForm(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--accent)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--bg)',
                    boxShadow: '0 4px 16px rgba(255, 107, 53, 0.35)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>New Task</span>
                </motion.button>
              </div>

              {/* Stats Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '32px',
              }}>
                {[
                  { count: taskStats.active, label: 'active', color: '#ff6b35' },
                  { count: taskStats.review, label: 'review', color: '#f7c59f' },
                  { count: taskStats.completed, label: 'done', color: '#2ec4b6' },
                ].map(({ count, label, color }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '24px',
                      backgroundColor: `${color}12`,
                      border: `1px solid ${color}25`,
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                    <span style={{ fontSize: '14px', fontFamily: 'ui-monospace, monospace', color, fontWeight: 600 }}>{count}</span>
                    <span style={{ fontSize: '13px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-secondary)' }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Search and Filters Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                {/* Search Input */}
                <div style={{
                  position: 'relative',
                  flex: 1,
                  maxWidth: '320px',
                }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeWidth="2"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontFamily: 'ui-monospace, monospace',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Priority Filter */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: filterPriority !== 'all' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-surface)',
                      border: filterPriority !== 'all' ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'ui-monospace, monospace',
                      color: filterPriority !== 'all' ? 'var(--accent)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>Priority{filterPriority !== 'all' ? `: ${PRIORITY_CONFIG[filterPriority]?.label}` : ''}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {openDropdown === 'priority' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '4px',
                        minWidth: '140px',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '4px',
                        zIndex: 100,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <button
                        onClick={() => { setFilterPriority('all'); setOpenDropdown(null) }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          textAlign: 'left',
                          background: filterPriority === 'all' ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'ui-monospace, monospace',
                          color: 'var(--text-main)',
                        }}
                      >
                        All Priorities
                      </button>
                      {(['critical', 'high', 'medium', 'low'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => { setFilterPriority(p); setOpenDropdown(null) }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            textAlign: 'left',
                            background: filterPriority === p ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontFamily: 'ui-monospace, monospace',
                            color: PRIORITY_CONFIG[p].color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PRIORITY_CONFIG[p].color }} />
                          {PRIORITY_CONFIG[p].label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agent Filter */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'agent' ? null : 'agent')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: filterAgent !== 'all' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-surface)',
                      border: filterAgent !== 'all' ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'ui-monospace, monospace',
                      color: filterAgent !== 'all' ? 'var(--accent)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>Agent{filterAgent !== 'all' ? `: ${getAgentById(filterAgent)?.displayName || filterAgent}` : ''}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {openDropdown === 'agent' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '4px',
                        minWidth: '200px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '4px',
                        zIndex: 100,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <button
                        onClick={() => { setFilterAgent('all'); setOpenDropdown(null) }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          textAlign: 'left',
                          background: filterAgent === 'all' ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'ui-monospace, monospace',
                          color: 'var(--text-main)',
                        }}
                      >
                        All Agents
                      </button>
                      {agents.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => { setFilterAgent(agent.id); setOpenDropdown(null) }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            textAlign: 'left',
                            background: filterAgent === agent.id ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontFamily: 'ui-monospace, monospace',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: agent.color }} />
                          {agent.displayName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Project Filter */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'project' ? null : 'project')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: filterProject !== 'all' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-surface)',
                      border: filterProject !== 'all' ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'ui-monospace, monospace',
                      color: filterProject !== 'all' ? 'var(--accent)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>Project{filterProject !== 'all' ? `: ${getProjectById(filterProject)?.name || filterProject}` : ''}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {openDropdown === 'project' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '4px',
                        minWidth: '180px',
                        maxHeight: '250px',
                        overflowY: 'auto',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '4px',
                        zIndex: 100,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <button
                        onClick={() => { setFilterProject('all'); setOpenDropdown(null) }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          textAlign: 'left',
                          background: filterProject === 'all' ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'ui-monospace, monospace',
                          color: 'var(--text-main)',
                        }}
                      >
                        All Projects
                      </button>
                      {projects.length === 0 && (
                        <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          No projects yet
                        </div>
                      )}
                      {projects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => { setFilterProject(project.id); setOpenDropdown(null) }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            textAlign: 'left',
                            background: filterProject === project.id ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontFamily: 'ui-monospace, monospace',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: project.color }} />
                          {project.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'ui-monospace, monospace',
                      color: 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>

            </motion.header>

            {/* Kanban Columns */}
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <div style={{
                height: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
              }}>
                {STATUS_COLUMNS.map(({ status, label, shortLabel, color, icon }, colIndex) => {
                  const columnTasks = getFilteredTasksForStatus(status)
                  const isActiveColumn = status === 'in_progress'
                  const isReviewColumn = status === 'review'
                  // Subtle background tint for active/review columns
                  const columnBg = isActiveColumn
                    ? 'rgba(255, 107, 53, 0.02)'
                    : isReviewColumn
                    ? 'rgba(247, 197, 159, 0.02)'
                    : 'transparent'

                  return (
                    <motion.div
                      key={status}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + colIndex * 0.1, duration: 0.5 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        backgroundColor: columnBg,
                        borderRadius: '14px',
                        padding: '16px',
                        border: isActiveColumn || isReviewColumn ? `1px solid ${color}10` : '1px solid transparent',
                      }}
                    >
                      {/* Column Header */}
                      <div
                        style={{
                          marginBottom: '16px',
                          paddingBottom: '12px',
                          borderBottom: `1px solid ${color}20`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Status dot */}
                            <div style={{ position: 'relative' }}>
                              <div
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: color,
                                  boxShadow: `0 0 10px ${color}`,
                                }}
                              />
                              {isActiveColumn && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: '-2px',
                                    borderRadius: '50%',
                                    border: `1px solid ${color}`,
                                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                                  }}
                                />
                              )}
                            </div>

                            {/* Icon and label */}
                            <span style={{ fontSize: '14px', color }}>{icon}</span>
                            <h3 style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: color,
                              letterSpacing: '0.02em',
                            }}>
                              {label}
                            </h3>
                          </div>

                          {/* Task count */}
                          <span style={{
                            fontSize: '11px',
                            fontFamily: 'ui-monospace, monospace',
                            fontWeight: 600,
                            color: columnTasks.length > 0 ? color : 'var(--text-muted)',
                            backgroundColor: columnTasks.length > 0 ? `${color}15` : 'transparent',
                            padding: columnTasks.length > 0 ? '4px 10px' : '4px 6px',
                            borderRadius: '6px',
                          }}>
                            {columnTasks.length}
                          </span>
                        </div>
                      </div>

                      {/* Tasks Container */}
                      <div
                        style={{
                          flex: 1,
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          paddingRight: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <AnimatePresence mode="popLayout">
                          {columnTasks.map((task, taskIndex) => {
                            const assignedAgent = getAgentById(task.assignedTo)
                            const project = getProjectById(task.projectId)
                            const isExpanded = expandedTaskId === task.id
                            const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low

                            return (
                              <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                transition={{
                                  delay: taskIndex * 0.03,
                                  layout: { duration: 0.3 },
                                }}
                                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                className="group relative cursor-pointer"
                              >
                                {/* Card Container */}
                                <div
                                  style={{
                                    position: 'relative',
                                    padding: '16px',
                                    borderRadius: '14px',
                                    background: isExpanded
                                      ? 'linear-gradient(135deg, rgba(255, 235, 220, 0.08) 0%, rgba(255, 235, 220, 0.03) 100%)'
                                      : 'linear-gradient(135deg, rgba(255, 235, 220, 0.04) 0%, rgba(255, 235, 220, 0.01) 100%)',
                                    border: `1px solid ${isExpanded ? priorityConfig.color + '40' : 'var(--glass-border)'}`,
                                    boxShadow: isExpanded
                                      ? `0 0 30px ${priorityConfig.glow}, 0 10px 40px -10px rgba(0, 0, 0, 0.5)`
                                      : '0 4px 20px -5px rgba(0, 0, 0, 0.3)',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  {/* Hover Actions */}
                                  <div
                                    className="opacity-0 group-hover:opacity-100"
                                    style={{
                                      position: 'absolute',
                                      top: '8px',
                                      right: '8px',
                                      display: 'flex',
                                      gap: '4px',
                                      zIndex: 10,
                                      transition: 'opacity 0.15s ease',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Edit Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openEditModal(task)
                                      }}
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--glass-border)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-secondary)',
                                        transition: 'all 0.15s ease',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--accent)'
                                        e.currentTarget.style.borderColor = 'var(--accent)'
                                        e.currentTarget.style.color = 'var(--bg)'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
                                        e.currentTarget.style.borderColor = 'var(--glass-border)'
                                        e.currentTarget.style.color = 'var(--text-secondary)'
                                      }}
                                      title="Edit task"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Priority accent line */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: 0,
                                      top: '14px',
                                      bottom: '14px',
                                      width: '3px',
                                      borderRadius: '2px',
                                      backgroundColor: priorityConfig.color,
                                      boxShadow: `0 0 10px ${priorityConfig.glow}`,
                                    }}
                                  />

                                  {/* Content */}
                                  <div style={{ marginLeft: '12px' }}>
                                    {/* Title */}
                                    <h4 style={{
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      color: 'var(--text-main)',
                                      lineHeight: 1.4,
                                      marginBottom: '12px',
                                    }}>
                                      {truncate(task.title, 50)}
                                    </h4>

                                    {/* Meta Row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      {/* Agent */}
                                      {assignedAgent && (
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          backgroundColor: `${assignedAgent.color}12`,
                                          border: `1px solid ${assignedAgent.color}25`,
                                        }}>
                                          <div
                                            style={{
                                              width: '6px',
                                              height: '6px',
                                              borderRadius: '50%',
                                              backgroundColor: assignedAgent.color,
                                              boxShadow: `0 0 6px ${assignedAgent.color}`,
                                            }}
                                          />
                                          <span style={{
                                            fontSize: '10px',
                                            color: assignedAgent.color,
                                            fontFamily: 'ui-monospace, monospace',
                                            fontWeight: 500,
                                          }}>
                                            {assignedAgent.displayName}
                                          </span>
                                        </div>
                                      )}

                                      {/* Project */}
                                      {project && (
                                        <span style={{
                                          fontSize: '10px',
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          fontFamily: 'ui-monospace, monospace',
                                          backgroundColor: `${project.color}12`,
                                          color: project.color,
                                          border: `1px solid ${project.color}25`,
                                        }}>
                                          {project.name}
                                        </span>
                                      )}
                                    </div>

                                    {/* Progress Bar (if has progress) */}
                                    {task.progress > 0 && !isExpanded && (
                                      <div className="mt-3">
                                        <div
                                          className="h-1 rounded-full overflow-hidden"
                                          style={{ backgroundColor: `${color}20` }}
                                        >
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${task.progress}%` }}
                                            className="h-full rounded-full"
                                            style={{
                                              backgroundColor: color,
                                              boxShadow: `0 0 10px ${color}`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="pt-4 mt-4 border-t border-[var(--glass-border)]">
                                            {task.description && (
                                              <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
                                                {task.description}
                                              </p>
                                            )}

                                            {task.progress > 0 && (
                                              <div className="mb-4">
                                                <div className="flex items-center justify-between text-xs mb-2">
                                                  <span className="text-[var(--text-dim)] font-mono">PROGRESS</span>
                                                  <span className="text-[var(--text-main)] font-mono font-bold">{task.progress}%</span>
                                                </div>
                                                <div
                                                  className="h-2 rounded-full overflow-hidden"
                                                  style={{ backgroundColor: `${color}20` }}
                                                >
                                                  <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${task.progress}%` }}
                                                    className="h-full rounded-full"
                                                    style={{
                                                      backgroundColor: color,
                                                      boxShadow: `0 0 15px ${color}`,
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {task.currentStep && (
                                              <div className="flex items-center gap-2 text-xs">
                                                <span className="text-[var(--accent)]">▸</span>
                                                <span className="text-[var(--text-secondary)] italic">
                                                  {task.currentStep}
                                                </span>
                                              </div>
                                            )}

                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--glass-border)]/50">
                                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                                Updated {formatTimestamp(task.updatedAt)}
                                              </span>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>

                        {/* Empty State */}
                        {columnTasks.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '48px 16px',
                            }}
                          >
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '12px',
                                border: `1px dashed ${color}25`,
                                backgroundColor: `${color}08`,
                              }}
                            >
                              <span style={{ fontSize: '20px', color, opacity: 0.4 }}>
                                {icon}
                              </span>
                            </div>
                            <p style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              fontFamily: 'ui-monospace, monospace',
                              textAlign: 'center',
                            }}>
                              No {shortLabel.toLowerCase()} tasks
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(3, 7, 8, 0.5) 100%)',
        }}
      />

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && editForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={closeEditModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '500px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: '20px',
              }}>
                Edit Task
              </h2>

              {/* Title Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Description Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Priority & Status Row */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                {/* Priority Select */}
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontFamily: 'ui-monospace, monospace',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}>
                    Priority
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setEditForm({ ...editForm, priority: p })}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: editForm.priority === p ? `1px solid ${PRIORITY_CONFIG[p].color}` : '1px solid var(--glass-border)',
                          backgroundColor: editForm.priority === p ? `${PRIORITY_CONFIG[p].color}20` : 'var(--bg-surface)',
                          color: editForm.priority === p ? PRIORITY_CONFIG[p].color : 'var(--text-secondary)',
                          fontSize: '10px',
                          fontFamily: 'ui-monospace, monospace',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {PRIORITY_CONFIG[p].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Select */}
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontFamily: 'ui-monospace, monospace',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}>
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      fontFamily: 'ui-monospace, monospace',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {STATUS_COLUMNS.map(col => (
                      <option key={col.status} value={col.status}>
                        {col.icon} {col.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assigned Agent */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Assigned To
                </label>
                <select
                  value={editForm.assignedTo || ''}
                  onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value as AgentId || undefined })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontFamily: 'ui-monospace, monospace',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Unassigned</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={handleDeleteTask}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    fontSize: '13px',
                    fontFamily: 'ui-monospace, monospace',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                >
                  Delete
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={closeEditModal}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontFamily: 'ui-monospace, monospace',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditModal}
                    disabled={!editForm.title.trim()}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--accent)',
                      border: 'none',
                      color: 'var(--bg)',
                      fontSize: '13px',
                      fontFamily: 'ui-monospace, monospace',
                      fontWeight: 600,
                      cursor: editForm.title.trim() ? 'pointer' : 'not-allowed',
                      opacity: editForm.title.trim() ? 1 : 0.5,
                      transition: 'all 0.15s ease',
                      boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Task Modal */}
      <AnimatePresence>
        {showNewTaskForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}
            onClick={closeNewTaskModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                padding: '28px',
                width: '480px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            >
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: '24px',
                fontFamily: 'ui-monospace, monospace',
              }}>
                Create New Task
              </h2>

              {/* Title */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  fontFamily: 'ui-monospace, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Title
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    fontFamily: 'ui-monospace, monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  fontFamily: 'ui-monospace, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Description
                </label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Describe the task..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    fontFamily: 'ui-monospace, monospace',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Priority */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  fontFamily: 'ui-monospace, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Priority
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: newTaskPriority === p
                          ? p === 'critical' ? '#ef4444'
                          : p === 'high' ? '#f97316'
                          : p === 'medium' ? '#eab308'
                          : '#22c55e'
                          : 'var(--bg)',
                        border: '1px solid',
                        borderColor: newTaskPriority === p
                          ? 'transparent'
                          : 'var(--glass-border)',
                        color: newTaskPriority === p ? 'white' : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontFamily: 'ui-monospace, monospace',
                        fontWeight: newTaskPriority === p ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textTransform: 'capitalize',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned To */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  fontFamily: 'ui-monospace, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Assign To
                </label>
                <select
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value as AgentId | '')}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontFamily: 'ui-monospace, monospace',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Unassigned</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={closeNewTaskModal}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontFamily: 'ui-monospace, monospace',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent)',
                    border: 'none',
                    color: 'var(--bg)',
                    fontSize: '13px',
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 600,
                    cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
                    opacity: newTaskTitle.trim() ? 1 : 0.5,
                    transition: 'all 0.15s ease',
                    boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                  }}
                >
                  Create Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Picker Modal (Startup) */}
      {showProjectPicker && (
        <ProjectPickerModal
          onClose={() => setShowProjectPicker(false)}
          onCreateNew={() => setShowNewProjectWizard(true)}
        />
      )}

      {/* New Project Wizard Modal */}
      <AnimatePresence>
        {showNewProjectWizard && (
          <NewProjectWizard onClose={() => setShowNewProjectWizard(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
