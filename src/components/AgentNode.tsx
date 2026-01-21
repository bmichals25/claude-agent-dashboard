'use client'

import { memo, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Agent } from '@/lib/types'
import { AgentAvatar } from './AgentAvatar'
import { useDashboardStore } from '@/lib/store'

interface AgentNodeProps {
  agent: Agent
  size?: 'sm' | 'md' | 'lg'
}

export const AgentNode = memo(function AgentNode({ agent, size }: AgentNodeProps) {
  const setSelectedAgent = useDashboardStore(state => state.setSelectedAgent)
  const selectedAgentId = useDashboardStore(state => state.selectedAgentId)
  const tasks = useDashboardStore(state => state.tasks)
  const activeProjectId = useDashboardStore(state => state.activeProjectId)
  const isSelected = selectedAgentId === agent.id
  const [isHovered, setIsHovered] = useState(false)

  // Find current task this agent is working on
  const currentTask = tasks.find(
    t => t.assignedTo === agent.id && t.status === 'in_progress'
  )

  // Check if agent is working on a task for the active project
  const isWorkingOnActiveProject = !activeProjectId || tasks.some(
    t => t.assignedTo === agent.id && t.projectId === activeProjectId && t.status === 'in_progress'
  )

  // Dim agents not working on active project (but not in All Projects view)
  const isDimmed = activeProjectId !== null && !isWorkingOnActiveProject

  const handleClick = useCallback(() => {
    setSelectedAgent(isSelected ? null : agent.id)
  }, [setSelectedAgent, isSelected, agent.id])

  // Use provided size or fallback to tier-based sizing
  const avatarSize = size ?? (agent.tier === 'ceo' ? 'lg' : agent.tier === 'vp' ? 'md' : 'sm')

  return (
    <div
      data-agent-node
      className="absolute"
      style={{
        left: `${agent.position.x}%`,
        top: `${agent.position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered ? 250 : isSelected ? 200 : 100,
        opacity: isDimmed ? 0.3 : 1,
        transition: 'opacity 0.3s ease',
        filter: isDimmed ? 'grayscale(0.5)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AgentAvatar
        agent={agent}
        size={avatarSize}
        onClick={handleClick}
        isSelected={isSelected}
      />

      {/* Current Task Tooltip */}
      <AnimatePresence>
        {isHovered && currentTask && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '12px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
              minWidth: '200px',
              maxWidth: '280px',
              pointerEvents: 'none',
            }}
          >
            {/* Arrow */}
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--bg-elevated)',
                borderLeft: '1px solid var(--glass-border)',
                borderTop: '1px solid var(--glass-border)',
              }}
            />

            {/* Status indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#ff6b35',
                boxShadow: '0 0 8px #ff6b35',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: '10px',
                fontFamily: 'ui-monospace, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#ff6b35',
                fontWeight: 600,
              }}>
                Working on
              </span>
            </div>

            {/* Task title */}
            <p style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-main)',
              margin: 0,
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {currentTask.title}
            </p>

            {/* Progress if available */}
            {currentTask.progress !== undefined && currentTask.progress > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'ui-monospace, monospace',
                    color: 'var(--text-muted)',
                  }}>
                    Progress
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'ui-monospace, monospace',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}>
                    {currentTask.progress}%
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
                    width: `${currentTask.progress}%`,
                    backgroundColor: '#ff6b35',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
