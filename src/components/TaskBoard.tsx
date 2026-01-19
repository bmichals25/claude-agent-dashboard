'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { ProjectManager } from '@/components/ProjectManager'
import type { Task, TaskStatus, TaskSortBy, StreamEntry } from '@/lib/types'
import { formatTimestamp, truncate } from '@/lib/utils'

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Pending', color: '#6b5f52' },
  { status: 'in_progress', label: 'In Progress', color: '#ff6b35' },
  { status: 'review', label: 'Review', color: '#f7c59f' },
  { status: 'completed', label: 'Completed', color: '#2ec4b6' },
]

const sortOptions: { value: TaskSortBy; label: string }[] = [
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'agent', label: 'Agent' },
  { value: 'project', label: 'Project' },
  { value: 'status', label: 'Status' },
]

function StreamOutput({ entries }: { entries: StreamEntry[] }) {
  if (!entries || entries.length === 0) return null

  const typeStyles = {
    thought: 'text-[var(--accent-secondary)]',
    action: 'text-accent',
    result: 'text-[var(--accent-tertiary)]',
    error: 'text-[var(--error)]',
  }

  const typeIcons = {
    thought: '○',
    action: '⚡',
    result: '✓',
    error: '✕',
  }

  return (
    <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
      {entries.slice(-5).map((entry) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-2 text-xs"
        >
          <span>{typeIcons[entry.type]}</span>
          <span className={typeStyles[entry.type]}>{entry.content}</span>
        </motion.div>
      ))}
    </div>
  )
}

function ProgressBar({ progress, currentStep }: { progress: number; currentStep?: string }) {
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-[var(--text-dim)] mb-1">
        <span>{currentStep || 'Processing...'}</span>
        <span className="font-mono">{progress}%</span>
      </div>
      <div className="h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function TaskCard({ task, expanded, onToggle }: {
  task: Task
  expanded: boolean
  onToggle: () => void
}) {
  const { agents, projects } = useDashboardStore()
  const assignedAgent = agents.find(a => a.id === task.assignedTo)
  const project = projects.find(p => p.id === task.projectId)

  const priorityColors: Record<string, string> = {
    critical: 'var(--error)',
    high: '#ff8c42',
    medium: 'var(--warning)',
    low: 'var(--text-dim)',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-[var(--glass)] border border-[var(--glass-border)] rounded-xl p-3 mb-2 cursor-pointer hover:border-[var(--glass-border-hover)] transition-all duration-200 border-l-4"
      style={{ borderLeftColor: priorityColors[task.priority] || 'var(--text-dim)' }}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <h4 className="text-sm text-[var(--text-main)] font-medium flex-1" title={task.title}>
          {truncate(task.title, 40)}
        </h4>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-[var(--text-dim)] text-xs ml-2"
        >
          ▼
        </motion.span>
      </div>

      {/* Agent & Project Tags */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {assignedAgent && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: assignedAgent.color }}
            />
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              {assignedAgent.displayName}
            </span>
          </div>
        )}
        {project && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{
              backgroundColor: `${project.color}15`,
              color: project.color,
            }}
          >
            {project.name}
          </span>
        )}
      </div>

      {/* Priority & Time */}
      <div className="flex items-center justify-between mt-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            task.priority === 'critical'
              ? 'bg-[var(--error)]/15 text-[var(--error)]'
              : task.priority === 'high'
              ? 'bg-orange-500/15 text-orange-400'
              : task.priority === 'medium'
              ? 'bg-[var(--warning)]/15 text-[var(--warning)]'
              : 'bg-[var(--text-dim)]/15 text-[var(--text-dim)]'
          }`}
        >
          {task.priority}
        </span>
        <span className="text-xs text-[var(--text-dim)] font-mono">
          {formatTimestamp(task.createdAt)}
        </span>
      </div>

      {/* Progress Bar (for active tasks) */}
      {(task.status === 'in_progress' || task.status === 'review') && task.progress > 0 && (
        <ProgressBar progress={task.progress} currentStep={task.currentStep} />
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Description */}
            {task.description && (
              <p className="text-xs text-[var(--text-secondary)] mt-3 border-t border-[var(--glass-border)] pt-3 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Stream of Consciousness */}
            {task.streamOutput && task.streamOutput.length > 0 && (
              <div className="border-t border-[var(--glass-border)] pt-3 mt-3">
                <h5 className="text-xs text-[var(--text-dim)] font-mono mb-2">Live Output</h5>
                <StreamOutput entries={task.streamOutput} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function TaskBoard() {
  const { 
    tasks, 
    taskHistory, 
    showTaskBoard, 
    toggleTaskBoard,
    agents,
    projects,
    taskSortBy,
    taskSortOrder,
    taskFilters,
    setTaskSortBy,
    setTaskSortOrder,
    setTaskFilters,
    clearTaskFilters,
    getSortedFilteredTasks,
  } = useDashboardStore()

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [showProjectManager, setShowProjectManager] = useState(false)

  const sortedTasks = getSortedFilteredTasks()

  const getTasksForStatus = (status: TaskStatus) => {
    if (status === 'completed') {
      return taskHistory.slice(-10).reverse()
    }
    return sortedTasks.filter(t => t.status === status)
  }

  const hasActiveFilters = Object.values(taskFilters).some(v => v !== null && v !== undefined)

  return (
    <>
      {/* Toggle Button - hidden when panel is open to avoid z-index conflict */}
      <AnimatePresence>
        {!showTaskBoard && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={toggleTaskBoard}
            className="fixed top-6 right-6 z-40 px-4 py-2 rounded-xl bg-[var(--bg-elevated)]/80 backdrop-blur-xl border border-[var(--glass-border)] text-[var(--text-secondary)] text-sm font-mono hover:border-[var(--glass-border-hover)] hover:text-[var(--text-main)] transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Show task board"
          >
            Tasks →
            {tasks.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-accent/15 text-accent rounded-full text-xs font-medium">
                {tasks.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Task Board Panel */}
      <AnimatePresence>
        {showTaskBoard && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-[700px] h-full bg-[var(--bg)]/98 backdrop-blur-xl border-l border-[var(--glass-border)] z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--text-main)]">Agent Task Board</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProjectManager(!showProjectManager)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${
                      showProjectManager ? 'bg-accent/15 text-accent' : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass)]'
                    }`}
                  >
                    Projects
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${
                      viewMode === 'kanban' ? 'bg-accent/15 text-accent' : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass)]'
                    }`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${
                      viewMode === 'list' ? 'bg-accent/15 text-accent' : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass)]'
                    }`}
                  >
                    List
                  </button>
                  {/* Close button */}
                  <button
                    onClick={toggleTaskBoard}
                    className="p-2 rounded-lg hover:bg-[var(--glass)] transition-all duration-200 text-[var(--text-dim)] hover:text-[var(--text-main)] ml-2 focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label="Close task board"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Sort & Filter Controls */}
              <div className="flex gap-4 flex-wrap">
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-xs text-[var(--text-dim)]">Sort:</label>
                  <select
                    id="sort-select"
                    value={taskSortBy}
                    onChange={(e) => setTaskSortBy(e.target.value as TaskSortBy)}
                    className="bg-[var(--glass)] border border-[var(--glass-border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-main)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent hover:border-[var(--glass-border-hover)] transition-colors [&>option]:bg-[var(--bg)] [&>option]:text-[var(--text-main)]"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setTaskSortOrder(taskSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="text-xs text-[var(--text-dim)] hover:text-[var(--text-main)] px-2 py-1 rounded-lg hover:bg-[var(--glass)] transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label={taskSortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
                  >
                    {taskSortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                {/* Filter by Agent */}
                <div className="flex items-center gap-2">
                  <label htmlFor="agent-filter" className="text-xs text-[var(--text-dim)]">Agent:</label>
                  <select
                    id="agent-filter"
                    value={taskFilters.agentId || ''}
                    onChange={(e) => setTaskFilters({ agentId: (e.target.value || null) as any })}
                    className="bg-[var(--glass)] border border-[var(--glass-border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-main)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent hover:border-[var(--glass-border-hover)] transition-colors [&>option]:bg-[var(--bg)] [&>option]:text-[var(--text-main)]"
                  >
                    <option value="">All</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.displayName}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Project */}
                <div className="flex items-center gap-2">
                  <label htmlFor="project-filter" className="text-xs text-[var(--text-dim)]">Project:</label>
                  <select
                    id="project-filter"
                    value={taskFilters.projectId || ''}
                    onChange={(e) => setTaskFilters({ projectId: e.target.value || null })}
                    className="bg-[var(--glass)] border border-[var(--glass-border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-main)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent hover:border-[var(--glass-border-hover)] transition-colors [&>option]:bg-[var(--bg)] [&>option]:text-[var(--text-main)]"
                  >
                    <option value="">All</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearTaskFilters}
                    className="text-xs text-accent hover:text-accent/80 focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Project Manager Sidebar */}
            <AnimatePresence>
              {showProjectManager && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-[var(--glass-border)] overflow-hidden"
                >
                  <div className="p-4">
                    <h3 className="text-sm font-mono text-[var(--text-secondary)] mb-3">Manage Projects</h3>
                    <ProjectManager
                      selectedProjectId={taskFilters.projectId || null}
                      onSelectProject={(id) => setTaskFilters({ projectId: id })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Task Content */}
            <div className="flex-1 overflow-hidden p-6">
              {viewMode === 'kanban' ? (
                <div className="grid grid-cols-4 gap-4 h-full">
                  {statusColumns.map(({ status, label, color }) => (
                    <div key={status} className="flex flex-col min-h-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <h3 className="text-xs font-mono text-[var(--text-secondary)]">
                          {label}
                        </h3>
                        <span className="text-xs text-[var(--text-dim)] font-mono">
                          ({getTasksForStatus(status).length})
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-1">
                        <AnimatePresence mode="popLayout">
                          {getTasksForStatus(status).map(task => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              expanded={expandedTaskId === task.id}
                              onToggle={() => setExpandedTaskId(
                                expandedTaskId === task.id ? null : task.id
                              )}
                            />
                          ))}
                        </AnimatePresence>

                        {getTasksForStatus(status).length === 0 && (
                          <div className="text-xs text-[var(--text-dim)] text-center py-6 font-mono">
                            No tasks
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {sortedTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task}
                        expanded={expandedTaskId === task.id}
                        onToggle={() => setExpandedTaskId(
                          expandedTaskId === task.id ? null : task.id
                        )}
                      />
                    ))}
                  </AnimatePresence>
                  
                  {sortedTasks.length === 0 && (
                    <div className="text-sm text-[var(--text-dim)] text-center py-12 font-mono">
                      No tasks match your filters
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
