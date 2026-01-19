'use client'

import { memo, useCallback } from 'react'
import type { Agent } from '@/lib/types'
import { AgentAvatar } from './AgentAvatar'
import { useDashboardStore } from '@/lib/store'

interface AgentNodeProps {
  agent: Agent
}

export const AgentNode = memo(function AgentNode({ agent }: AgentNodeProps) {
  const setSelectedAgent = useDashboardStore(state => state.setSelectedAgent)
  const selectedAgentId = useDashboardStore(state => state.selectedAgentId)
  const isSelected = selectedAgentId === agent.id

  const handleClick = useCallback(() => {
    setSelectedAgent(isSelected ? null : agent.id)
  }, [setSelectedAgent, isSelected, agent.id])

  return (
    <div
      data-agent-node
      className="absolute"
      style={{
        left: `${agent.position.x}%`,
        top: `${agent.position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 200 : 100,
      }}
    >
      {/* Selection glow - simple outline that follows the agent shape */}
      {isSelected && (
        <div
          className="absolute inset-0 -m-2 rounded-[inherit] animate-morph pointer-events-none"
          style={{
            border: `2px solid ${agent.color}`,
            boxShadow: `0 0 20px ${agent.color}80, 0 0 40px ${agent.color}40`,
          }}
        />
      )}

      <AgentAvatar
        agent={agent}
        size={agent.tier === 'ceo' ? 'lg' : agent.tier === 'vp' ? 'md' : 'sm'}
        onClick={handleClick}
      />
    </div>
  )
})
