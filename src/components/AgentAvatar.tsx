'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { Agent, AgentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AgentAvatarProps {
  agent: Agent
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onClick?: () => void
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
}

const statusStyles: Record<AgentStatus, string> = {
  idle: 'opacity-60',
  thinking: 'opacity-80 animate-pulse',
  working: 'opacity-100 animate-pulse-glow',
  delegating: 'opacity-100',
  completed: 'opacity-100',
}

export function AgentAvatar({ agent, size = 'md', showLabel = true, onClick }: AgentAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const [mouthHeight, setMouthHeight] = useState(6)

  // Track mouse for eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const distX = e.clientX - centerX
      const distY = e.clientY - centerY
      const distance = Math.sqrt(distX ** 2 + distY ** 2)
      
      if (distance < 300) {
        const angle = Math.atan2(distY, distX)
        const maxOffset = 4
        setEyeOffset({
          x: Math.cos(angle) * maxOffset,
          y: Math.sin(angle) * maxOffset,
        })
        
        // Mouth reacts to proximity
        const mouthSize = Math.max(2, Math.min(10, (300 - distance) / 30))
        setMouthHeight(mouthSize)
      } else {
        setEyeOffset({ x: 0, y: 0 })
        setMouthHeight(6)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Status-based animations
  const isActive = agent.status === 'working' || agent.status === 'delegating'
  const isThinking = agent.status === 'thinking'

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center cursor-pointer group"
      onClick={onClick}
    >
      {/* Agent Blob */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center animate-morph',
          sizeClasses[size],
          statusStyles[agent.status]
        )}
        style={{
          background: `linear-gradient(135deg, ${agent.color}, ${agent.color}88, #ffffff33)`,
          filter: `drop-shadow(0 0 ${isActive ? 20 : 10}px ${agent.color}66)`,
        }}
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
          rotate: isThinking ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          duration: isActive ? 1.5 : 0.3,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.1 }}
      >
        {/* Face */}
        <div className="relative w-2/5 h-1/3">
          {/* Eyes */}
          <motion.div
            className="absolute w-2.5 h-2.5 bg-black rounded-full left-0 top-1/2"
            style={{
              transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
            }}
            animate={{
              scaleY: [1, 1, 0.1, 1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: [0, 0.9, 0.95, 1, 1],
            }}
          />
          <motion.div
            className="absolute w-2.5 h-2.5 bg-black rounded-full right-0 top-1/2"
            style={{
              transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
            }}
            animate={{
              scaleY: [1, 1, 0.1, 1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: [0, 0.9, 0.95, 1, 1],
            }}
          />
          
          {/* Mouth */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black rounded-b-full"
            style={{
              width: 12,
              height: mouthHeight,
            }}
            animate={{
              height: isThinking ? [6, 3, 6] : mouthHeight,
            }}
            transition={{
              duration: 0.5,
              repeat: isThinking ? Infinity : 0,
            }}
          />
        </div>

        {/* Status indicator ring */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: agent.color }}
            animate={{
              scale: [1, 1.3, 1.3],
              opacity: [0.8, 0, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        )}
      </motion.div>

      {/* Label */}
      {showLabel && (
        <motion.div
          className="mt-2 px-2 py-1 bg-black/50 rounded text-center"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: agent.color }}
          >
            {agent.displayName}
          </span>
          {agent.currentTask && (
            <div className="text-xs text-gray-400 truncate max-w-24">
              {agent.currentTask.title}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
