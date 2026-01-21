'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { formatTimestamp } from '@/lib/utils'
import type { AgentEvent } from '@/lib/types'

// Agent colors for notifications
const AGENT_COLORS: Record<string, string> = {
  ceo: '#00fff0',
  chief_of_staff: '#ff00c1',
  pipeline_manager: '#7000ff',
  agent_operations: '#00ffaa',
  vp_engineering: '#00ff66',
  vp_product: '#ffaa00',
  vp_design_qa: '#ff6b6b',
  architect: '#06b6d4',
  developer: '#22c55e',
  devops_engineer: '#f59e0b',
  code_reviewer: '#a855f7',
  security_engineer: '#ef4444',
  product_researcher: '#3b82f6',
  product_manager: '#f97316',
  data_engineer: '#6366f1',
  growth_marketer: '#ec4899',
  frontend_designer: '#14b8a6',
  user_testing: '#8b5cf6',
  technical_writer: '#64748b',
}

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
  const agentColor = agent?.color || AGENT_COLORS[event.agentId || ''] || 'var(--text-secondary)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderBottom: '1px solid var(--glass-border)',
      }}
    >
      <span
        style={{
          fontSize: '14px',
          color: agentColor,
          marginTop: '2px',
        }}
      >
        {eventIcons[event.type] || '•'}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          {agent && (
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'ui-monospace, monospace',
                fontWeight: 500,
                color: agentColor,
              }}
            >
              {agent.displayName}
            </span>
          )}
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'ui-monospace, monospace',
              color: 'var(--text-muted)',
            }}
          >
            {formatTimestamp(event.timestamp)}
          </span>
        </div>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {event.message}
        </p>
      </div>
    </motion.div>
  )
}

export function NotificationBar() {
  const { events, agents } = useDashboardStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [lastSeenCount, setLastSeenCount] = useState(0)
  const { playNotification, playClick } = useSoundEffects()
  const prevEventsCount = useRef(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Play notification sound when new events arrive
  useEffect(() => {
    if (events.length > prevEventsCount.current && prevEventsCount.current > 0) {
      playNotification()
    }
    prevEventsCount.current = events.length
  }, [events.length, playNotification])

  // Get the latest event
  const latestEvent = events[0]
  const latestAgent = latestEvent?.agentId ? agents.find(a => a.id === latestEvent.agentId) : null
  const latestColor = latestAgent?.color || AGENT_COLORS[latestEvent?.agentId || ''] || 'var(--accent)'

  // Track new events
  const hasNewEvents = events.length > lastSeenCount

  // Mark as seen when expanded
  useEffect(() => {
    if (isExpanded) {
      setLastSeenCount(events.length)
    }
  }, [isExpanded, events.length])

  if (!mounted) return null

  return (
    <>
      {/* Notification Pill - Bottom Center */}
      <AnimatePresence>
        {latestEvent && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={() => {
              playClick()
              setIsExpanded(true)
            }}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              borderRadius: '24px',
              background: 'var(--bg-elevated)',
              border: `1px solid ${latestColor}30`,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${latestColor}15`,
              cursor: 'pointer',
              maxWidth: '400px',
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Status dot */}
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: latestColor,
                boxShadow: `0 0 8px ${latestColor}`,
                flexShrink: 0,
              }}
            />

            {/* Event icon */}
            <span style={{ fontSize: '12px', color: latestColor }}>
              {eventIcons[latestEvent.type] || '•'}
            </span>

            {/* Message */}
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '280px',
              }}
            >
              {latestEvent.message}
            </span>

            {/* Event count badge */}
            {events.length > 1 && (
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: hasNewEvents ? latestColor : 'var(--glass)',
                  color: hasNewEvents ? 'var(--bg)' : 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                {events.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Modal */}
      {mounted && isExpanded && createPortal(
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              width: '90%',
              maxWidth: '500px',
              maxHeight: '70vh',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              boxShadow: '0 32px 80px -20px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid var(--glass-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent)',
                  }}
                />
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    margin: 0,
                  }}
                >
                  Event Stream
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'ui-monospace, monospace',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--glass)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {events.length} events
                </span>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border-hover)'
                  e.currentTarget.style.color = 'var(--text-main)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Events List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
              }}
            >
              <AnimatePresence mode="popLayout">
                {events.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    No events yet
                  </motion.div>
                ) : (
                  events.slice(0, 30).map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>,
        document.body
      )}
    </>
  )
}
