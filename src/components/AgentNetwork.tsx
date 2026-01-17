'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { AgentNode } from './AgentNode'
import { getAgentColorWithOpacity } from '@/lib/utils'

export function AgentNetwork() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { agents, connections, activeConnections } = useDashboardStore()

  // Draw connection lines
  const renderConnections = () => {
    return connections.map(({ from, to }) => {
      const fromAgent = agents.find(a => a.id === from)
      const toAgent = agents.find(a => a.id === to)
      
      if (!fromAgent || !toAgent) return null

      const key = `${from}-${to}`
      const isActive = activeConnections.has(key)

      // Calculate positions
      const x1 = fromAgent.position.x
      const y1 = fromAgent.position.y
      const x2 = toAgent.position.x
      const y2 = toAgent.position.y

      return (
        <g key={key}>
          {/* Base line */}
          <motion.line
            x1={`${x1}%`}
            y1={`${y1}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke={getAgentColorWithOpacity(fromAgent.color, isActive ? 0.6 : 0.2)}
            strokeWidth={isActive ? 3 : 2}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: Math.random() * 0.5 }}
            style={{
              filter: isActive ? `drop-shadow(0 0 8px ${fromAgent.color})` : 'none',
            }}
          />

          {/* Active connection particle */}
          {isActive && (
            <motion.circle
              r="4"
              fill={fromAgent.color}
              initial={{ cx: `${x1}%`, cy: `${y1}%` }}
              animate={{
                cx: [`${x1}%`, `${x2}%`],
                cy: [`${y1}%`, `${y2}%`],
              }}
              transition={{
                duration: 1,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
              style={{
                filter: `drop-shadow(0 0 6px ${fromAgent.color})`,
              }}
            />
          )}
        </g>
      )
    })
  }

  return (
    <div className="relative w-full h-full">
      {/* SVG Layer for connections */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#glow)">
          {renderConnections()}
        </g>
      </svg>

      {/* Agent Nodes */}
      {agents.map(agent => (
        <AgentNode key={agent.id} agent={agent} />
      ))}

      {/* Radial gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(3, 7, 8, 0.5) 100%)',
        }}
      />
    </div>
  )
}
