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
      <AgentAvatar
        agent={agent}
        size={agent.tier === 'ceo' ? 'lg' : agent.tier === 'vp' ? 'md' : 'sm'}
        onClick={handleClick}
        isSelected={isSelected}
      />
    </div>
  )
})
