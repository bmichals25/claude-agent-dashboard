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
      className="bg-[var(--glass)] border border-[var(--glass-border)] rounded-xl p-5 mb-4 cursor-pointer hover:border-[var(--glass-border-hover)] transition-all duration-200 border-l-4"
      style={{ borderLeftColor: priorityColors[task.priority] || 'var(--text-dim)' }}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm text-[var(--text-main)] font-medium flex-1 leading-snug" title={task.title}>
          {truncate(task.title, 40)}
        </h4>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-[var(--text-dim)] text-xs"
        >
          ▼
        </motion.span>
      </div>

      {/* Agent & Project Tags */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {assignedAgent && (
          <div className="flex items-center gap-2">
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
            className="text-xs px-2.5 py-1 rounded-full font-mono"
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
      <div className="flex items-center justify-between mt-3">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
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

export function TasksPage() {
  const {
    tasks,
    taskHistory,
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
    <div
      className="h-full w-full rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(18, 18, 22, 0.6) 0%, rgba(12, 12, 16, 0.7) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header */}
      <div className="px-8 py-7 border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-2xl font-semibold tracking-wide text-[var(--text-main)]">Task Board</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowProjectManager(!showProjectManager)}
              className={`btn btn-sm ${showProjectManager ? 'btn-secondary' : 'btn-ghost'}`}
            >
              Projects
            </button>
            <div className="flex items-center bg-[var(--bg-surface)] rounded-xl p-1.5 gap-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-secondary' : 'btn-ghost'}`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-8 flex-wrap">
          {/* Sort By */}
          <div className="flex items-center gap-3">
            <label htmlFor="sort-select" className="label text-sm">Sort</label>
            <select
              id="sort-select"
              value={taskSortBy}
              onChange={(e) => setTaskSortBy(e.target.value as TaskSortBy)}
              className="select"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setTaskSortOrder(taskSortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn btn-ghost btn-icon btn-sm"
              aria-label={taskSortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {taskSortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Filter by Agent */}
          <div className="flex items-center gap-3">
            <label htmlFor="agent-filter" className="label text-sm">Agent</label>
            <select
              id="agent-filter"
              value={taskFilters.agentId || ''}
              onChange={(e) => setTaskFilters({ agentId: (e.target.value || null) as any })}
              className="select"
            >
              <option value="">All</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.displayName}</option>
              ))}
            </select>
          </div>

          {/* Filter by Project */}
          <div className="flex items-center gap-3">
            <label htmlFor="project-filter" className="label text-sm">Project</label>
            <select
              id="project-filter"
              value={taskFilters.projectId || ''}
              onChange={(e) => setTaskFilters({ projectId: e.target.value || null })}
              className="select"
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
              className="btn btn-ghost btn-sm text-accent"
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
      <div className="flex-1 overflow-hidden p-7">
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-4 gap-5 h-full">
            {statusColumns.map(({ status, label, color }) => (
              <div key={status} className="flex flex-col min-h-0">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--glass-border)]">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] tracking-wide">
                    {label}
                  </h3>
                  <span className="text-xs text-[var(--text-dim)] font-mono ml-auto">
                    {getTasksForStatus(status).length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
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
                    <div className="text-xs text-[var(--text-dim)] text-center py-8 font-mono">
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
    </div>
  )
}
