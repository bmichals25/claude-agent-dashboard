'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDashboardStore } from '@/lib/store'
import type { Task, TaskStatus } from '@/lib/types'

// Status colors
const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: '#6b7280',
  in_progress: '#3b82f6',
  review: '#eab308',
  completed: '#22c55e',
}

// Priority colors
const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
}

// Format status for display
function formatStatus(status: TaskStatus): string {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Compact task card
function TaskCard({ task, agentColor }: { task: Task; agentColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      style={{
        padding: '12px 14px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: '8px',
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-main)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task.title}
        </span>
      </div>

      {/* Status and Priority row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {/* Status badge */}
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            padding: '3px 8px',
            borderRadius: '6px',
            background: `${STATUS_COLORS[task.status]}15`,
            color: STATUS_COLORS[task.status],
          }}
        >
          {formatStatus(task.status)}
        </span>

        {/* Priority indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '2px',
              backgroundColor: PRIORITY_COLORS[task.priority],
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'capitalize',
              color: 'var(--text-muted)',
            }}
          >
            {task.priority}
          </span>
        </div>
      </div>

      {/* Progress bar for in-progress tasks */}
      {task.status === 'in_progress' && task.progress > 0 && (
        <div style={{ marginTop: '4px' }}>
          <div
            style={{
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: '2px',
                background: agentColor,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
            }}
          >
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              {task.currentStep || 'Working...'}
            </span>
            <span style={{ fontSize: '9px', fontFamily: 'ui-monospace, monospace', color: agentColor }}>
              {task.progress}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Section header for task groups
function TaskSection({
  title,
  tasks,
  agentColor,
}: {
  title: string
  tasks: Task[]
  agentColor: string
}) {
  if (tasks.length === 0) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 600,
            fontFamily: 'ui-monospace, monospace',
            padding: '2px 6px',
            borderRadius: '4px',
            background: `${agentColor}15`,
            color: agentColor,
          }}
        >
          {tasks.length}
        </span>
      </div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} agentColor={agentColor} />
      ))}
    </div>
  )
}

export function AgentTasksDrawer() {
  const { agents, selectedAgentId, tasks } = useDashboardStore()
  const [mounted, setMounted] = useState(false)

  // Mount state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  // Filter tasks by selected agent
  const agentTasks = tasks.filter(t => t.assignedTo === selectedAgentId)

  // Group tasks by status
  const inProgressTasks = agentTasks.filter(t => t.status === 'in_progress')
  const pendingTasks = agentTasks.filter(t => t.status === 'pending')
  const reviewTasks = agentTasks.filter(t => t.status === 'review')

  // Use portal to render at viewport level
  if (!mounted) return null

  const drawerContent = (
    <AnimatePresence>
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          className="fixed top-0 left-[740px] z-[99] overflow-hidden"
          style={{ height: '100vh', width: '320px' }}
        >
          <div
            className="relative h-full w-full overflow-y-auto overflow-x-hidden scrollbar-fade"
            style={{
              background: `linear-gradient(180deg, ${selectedAgent.color}04 0%, var(--bg-elevated) 8%, var(--bg-surface) 100%)`,
              borderRight: '1px solid var(--glass-border)',
            }}
          >
            {/* Visual connection line to AgentDetailPanel */}
            <div
              style={{
                position: 'absolute',
                top: '80px',
                left: 0,
                width: '1px',
                height: '40px',
                background: `linear-gradient(to bottom, ${selectedAgent.color}40, transparent)`,
              }}
            />

            {/* Header */}
            <div
              style={{
                padding: '24px 20px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '3px',
                    backgroundColor: selectedAgent.color,
                    boxShadow: `0 0 10px ${selectedAgent.color}50`,
                  }}
                />
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                  }}
                >
                  Tasks
                </h3>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {agentTasks.length === 0
                  ? 'No tasks assigned'
                  : `${agentTasks.length} task${agentTasks.length === 1 ? '' : 's'} assigned`}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              {agentTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      background: `${selectedAgent.color}10`,
                      border: `1px solid ${selectedAgent.color}20`,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={selectedAgent.color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    No tasks assigned
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      maxWidth: '200px',
                    }}
                  >
                    Send a message to assign tasks to {selectedAgent.displayName}
                  </p>
                </motion.div>
              ) : (
                <>
                  <TaskSection
                    title="In Progress"
                    tasks={inProgressTasks}
                    agentColor={selectedAgent.color}
                  />
                  <TaskSection
                    title="Pending"
                    tasks={pendingTasks}
                    agentColor={selectedAgent.color}
                  />
                  <TaskSection
                    title="Review"
                    tasks={reviewTasks}
                    agentColor={selectedAgent.color}
                  />
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(drawerContent, document.body)
}
