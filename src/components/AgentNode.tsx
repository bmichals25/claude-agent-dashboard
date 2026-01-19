'use client'

import { memo, useCallback } from 'react'
import { motion } from 'motion/react'
import type { Agent } from '@/lib/types'
import { AgentAvatar } from './AgentAvatar'
import { useDashboardStore } from '@/lib/store'

interface AgentNodeProps {
  agent: Agent
}

// Selection indicator component with layered effects
const SelectionIndicator = memo(function SelectionIndicator({ color }: { color: string }) {
  return (
    <>
      {/* Layer 1: Outermost soft glow - creates atmosphere */}
      <motion.div
        className="absolute inset-0 -m-8 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Layer 2: Rotating gradient ring */}
      <motion.div
        className="absolute inset-0 -m-5 rounded-full pointer-events-none"
        style={{
          padding: '2px',
          background: `conic-gradient(from 0deg, ${color}, transparent, ${color}80, transparent, ${color})`,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: 'var(--bg)' }}
        />
      </motion.div>

      {/* Layer 3: Inner glow ring */}
      <motion.div
        className="absolute inset-0 -m-4 rounded-full pointer-events-none"
        style={{
          border: `1px solid ${color}60`,
          boxShadow: `
            0 0 15px ${color}40,
            inset 0 0 15px ${color}20
          `,
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Layer 4: Pulsing expansion rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 -m-4 rounded-full pointer-events-none"
          style={{
            border: `1px solid ${color}`,
          }}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{
            scale: [1, 1.5],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.6,
          }}
        />
      ))}

      {/* Layer 5: Corner accents - tech/HUD style */}
      {[0, 90, 180, 270].map((rotation) => (
        <motion.div
          key={rotation}
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
        >
          <motion.div
            className="absolute"
            style={{
              top: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              background: color,
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              filter: `drop-shadow(0 0 4px ${color})`,
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: rotation / 360,
            }}
          />
        </motion.div>
      ))}

      {/* Layer 6: Bright center highlight */}
      <div
        className="absolute inset-0 -m-3 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${color}10 0%, transparent 60%)`,
        }}
      />

      {/* Layer 7: Sharp inner border */}
      <div
        className="absolute inset-0 -m-3 rounded-full pointer-events-none"
        style={{
          border: `1.5px solid ${color}`,
          boxShadow: `0 0 8px ${color}80`,
        }}
      />
    </>
  )
})

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
      {/* Premium selection indicator */}
      {isSelected && <SelectionIndicator color={agent.color} />}

      <AgentAvatar
        agent={agent}
        size={agent.tier === 'ceo' ? 'lg' : agent.tier === 'vp' ? 'md' : 'sm'}
        onClick={handleClick}
      />
    </div>
  )
})
