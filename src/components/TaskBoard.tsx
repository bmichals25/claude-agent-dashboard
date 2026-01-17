'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import type { Task, TaskStatus, TaskSortBy, StreamEntry } from '@/lib/types'
import { formatTimestamp, truncate } from '@/lib/utils'

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Pending', color: '#888' },
  { status: 'in_progress', label: 'In Progress', color: '#00fff0' },
  { status: 'delegated', label: 'Delegated', color: '#ff00c1' },
  { status: 'completed', label: 'Completed', color: '#00ff66' },
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
  if (entries.length === 0) return null

  const typeStyles = {
    thought: 'text-yellow-400',
    action: 'text-accent',
    result: 'text-green-400',
    error: 'text-red-400',
  }

  const typeIcons = {
    thought: '🤔',
    action: '⚡',
    result: '✅',
    error: '❌',
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
      <div className="flex justify-between text-xs text-white/40 mb-1">
        <span>{currentStep || 'Processing...'}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2 cursor-pointer hover:bg-white/8 transition-colors"
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <h4 className="text-sm text-white font-medium flex-1">
          {truncate(task.title, 40)}
        </h4>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-white/40 text-xs ml-2"
        >
          ▼
        </motion.span>
      </div>
      
      {/* Agent & Project Tags */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {assignedAgent && (
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: assignedAgent.color }}
            />
            <span className="text-xs text-white/60 font-mono">
              {assignedAgent.displayName}
            </span>
          </div>
        )}
        {project && (
          <span 
            className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{ 
              backgroundColor: `${project.color}20`,
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
          className={`text-xs px-2 py-0.5 rounded-full ${
            task.priority === 'critical'
              ? 'bg-red-500/20 text-red-400'
              : task.priority === 'high'
              ? 'bg-orange-500/20 text-orange-400'
              : task.priority === 'medium'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {task.priority}
        </span>
        <span className="text-xs text-white/40 font-mono">
          {formatTimestamp(task.createdAt)}
        </span>
      </div>

      {/* Progress Bar (for active tasks) */}
      {(task.status === 'in_progress' || task.status === 'delegated') && (
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
              <p className="text-xs text-white/60 mt-3 border-t border-white/10 pt-3">
                {task.description}
              </p>
            )}

            {/* Stream of Consciousness */}
            {task.streamOutput.length > 0 && (
              <div className="border-t border-white/10 pt-3 mt-3">
                <h5 className="text-xs text-white/40 uppercase mb-2">Live Output</h5>
                <StreamOutput entries={task.streamOutput} />
              </div>
            )}

            {/* Output (if completed) */}
            {task.output && (
              <div className="border-t border-white/10 pt-3 mt-3">
                <h5 className="text-xs text-white/40 uppercase mb-2">Result</h5>
                <p className="text-xs text-green-400">{task.output}</p>
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
      {/* Toggle Button */}
      <motion.button
        onClick={toggleTaskBoard}
        className="fixed top-6 right-6 z-50 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-mono"
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.95 }}
      >
        {showTaskBoard ? '← Hide Tasks' : 'Tasks →'}
        {tasks.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-accent/20 text-accent rounded-full text-xs">
            {tasks.length}
          </span>
        )}
      </motion.button>

      {/* Task Board Panel */}
      <AnimatePresence>
        {showTaskBoard && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-[700px] h-full bg-bg/95 backdrop-blur-xl border-l border-white/10 z-40 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Agent Task Board</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-1 rounded text-xs font-mono ${
                      viewMode === 'kanban' ? 'bg-accent/20 text-accent' : 'text-white/40'
                    }`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded text-xs font-mono ${
                      viewMode === 'list' ? 'bg-accent/20 text-accent' : 'text-white/40'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {/* Sort & Filter Controls */}
              <div className="flex gap-4 flex-wrap">
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Sort:</span>
                  <select
                    value={taskSortBy}
                    onChange={(e) => setTaskSortBy(e.target.value as TaskSortBy)}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setTaskSortOrder(taskSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="text-xs text-white/60 hover:text-white"
                  >
                    {taskSortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                {/* Filter by Agent */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Agent:</span>
                  <select
                    value={taskFilters.agentId || ''}
                    onChange={(e) => setTaskFilters({ agentId: e.target.value || null })}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="">All</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.displayName}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Project */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Project:</span>
                  <select
                    value={taskFilters.projectId || ''}
                    onChange={(e) => setTaskFilters({ projectId: e.target.value || null })}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
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
                    className="text-xs text-accent hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

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
                        <h3 className="text-xs font-mono uppercase text-white/60">
                          {label}
                        </h3>
                        <span className="text-xs text-white/40">
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
                          <div className="text-xs text-white/30 text-center py-4">
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
                    <div className="text-sm text-white/40 text-center py-8">
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
