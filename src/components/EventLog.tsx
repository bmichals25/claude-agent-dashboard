'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { formatTimestamp } from '@/lib/utils'
import type { AgentEvent } from '@/lib/types'

const eventIcons: Record<string, string> = {
  task_created: '◈',
  task_assigned: '◉',
  task_completed: '✓',
  agent_thinking: '○',
  agent_action: '⚡',
  error: '✕',
  delegation: '↻',
}

function EventItem({ event }: { event: AgentEvent }) {
  const { agents } = useDashboardStore()
  const agent = event.agentId ? agents.find(a => a.id === event.agentId) : null

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-start gap-4 py-3.5 border-b border-[var(--glass-border)] last:border-0"
    >
      <span className="text-base text-[var(--text-dim)] mt-0.5">{eventIcons[event.type] || '•'}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {agent && (
            <span
              className="text-xs font-mono font-medium tracking-wide"
              style={{ color: agent.color }}
            >
              {agent.displayName}
            </span>
          )}
          <span className="text-xs text-[var(--text-dim)] font-mono">
            {formatTimestamp(event.timestamp)}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] truncate leading-relaxed" title={event.message}>
          {event.message}
        </p>
      </div>
    </motion.div>
  )
}

export function EventLog() {
  const { events } = useDashboardStore()

  return (
    <div className="liquid-card">
      <h3 className="text-lg font-semibold tracking-wide text-accent mb-6 pb-4 border-b border-[var(--glass-border)]">
        Event Stream
      </h3>

      <div className="max-h-72 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-[var(--text-dim)] text-center py-10 font-mono"
            >
              Waiting for events...
            </motion.div>
          ) : (
            events.slice(0, 20).map((event) => (
              <EventItem key={event.id} event={event} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
