'use client'

import { motion } from 'motion/react'
import type { Agent } from '@/lib/types'
import { AgentAvatar } from './AgentAvatar'
import { useDashboardStore } from '@/lib/store'

interface AgentNodeProps {
  agent: Agent
}

export function AgentNode({ agent }: AgentNodeProps) {
  const { setSelectedAgent, selectedAgentId } = useDashboardStore()
  const isSelected = selectedAgentId === agent.id

  // Convert percentage position to actual viewport position
  const style = {
    left: `${agent.position.x}%`,
    top: `${agent.position.y}%`,
  }

  return (
    <motion.div
      className="absolute z-10"
      style={style}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: '-50%',
        y: '-50%',
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: Math.random() * 0.5,
      }}
      whileHover={{ zIndex: 20 }}
    >
      {/* Selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 -m-4 rounded-full border-2 border-accent"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        />
      )}

      <AgentAvatar
        agent={agent}
        size={agent.tier === 'ceo' ? 'lg' : agent.tier === 'vp' ? 'md' : 'sm'}
        onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
      />
    </motion.div>
  )
}
