'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { formatTimestamp } from '@/lib/utils'
import type { AgentEvent } from '@/lib/types'

const eventIcons: Record<string, string> = {
  task_created: '📝',
  task_assigned: '👤',
  task_completed: '✅',
  agent_thinking: '🤔',
  agent_action: '⚡',
  error: '🚨',
  delegation: '🔄',
}

function EventItem({ event }: { event: AgentEvent }) {
  const { agents } = useDashboardStore()
  const agent = event.agentId ? agents.find(a => a.id === event.agentId) : null

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0"
    >
      <span className="text-sm">{eventIcons[event.type] || '📌'}</span>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {agent && (
            <span
              className="text-xs font-mono uppercase"
              style={{ color: agent.color }}
            >
              {agent.displayName}
            </span>
          )}
          <span className="text-xs text-white/40 font-mono">
            {formatTimestamp(event.timestamp)}
          </span>
        </div>
        <p className="text-sm text-white/70 truncate">
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
      <h3 className="text-sm uppercase tracking-widest text-accent font-bold mb-4">
        Event Stream
      </h3>

      <div className="max-h-60 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-white/40 text-center py-4"
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
