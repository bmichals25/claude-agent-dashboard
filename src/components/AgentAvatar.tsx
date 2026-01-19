'use client'

import { memo, useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import type { Agent, AgentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// Throttle function for mouse tracking
function throttle<T extends (...args: never[]) => void>(fn: T, delay: number): T {
  let lastCall = 0
  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }) as T
}

interface AgentAvatarProps {
  agent: Agent
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onClick?: () => void
  trackCursor?: boolean // Enable cursor tracking for this specific agent
}

const sizeClasses = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
}

// Face element sizes based on avatar size
const faceSizes = {
  sm: { eye: 6, eyeGap: 16, mouth: 8, mouthHeight: 4, faceTop: '35%' },
  md: { eye: 8, eyeGap: 24, mouth: 12, mouthHeight: 5, faceTop: '35%' },
  lg: { eye: 10, eyeGap: 32, mouth: 14, mouthHeight: 6, faceTop: '35%' },
}

const statusStyles: Record<AgentStatus, string> = {
  idle: 'opacity-70',
  thinking: 'opacity-90',
  working: 'opacity-100',
  delegating: 'opacity-100',
  completed: 'opacity-100',
}

// Memoized component to prevent unnecessary re-renders
export const AgentAvatar = memo(function AgentAvatar({
  agent,
  size = 'md',
  showLabel = true,
  onClick,
  trackCursor = false
}: AgentAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const [mouthHeight, setMouthHeight] = useState(6)

  const isActive = agent.status === 'working' || agent.status === 'delegating'
  const isThinking = agent.status === 'thinking'

  // Memoize face sizes lookup
  const faceSize = useMemo(() => faceSizes[size], [size])
  const sizeClass = useMemo(() => sizeClasses[size], [size])

  // Mouse tracking effect - only enabled when trackCursor is true
  useEffect(() => {
    if (!trackCursor) return

    const handleMouseMove = throttle((e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const distX = e.clientX - centerX
      const distY = e.clientY - centerY
      const distance = Math.sqrt(distX ** 2 + distY ** 2)

      if (distance < 400) {
        const angle = Math.atan2(distY, distX)
        const maxOffset = 5
        const scaledOffset = Math.min(distance / 50, 1) * maxOffset
        setEyeOffset({
          x: Math.cos(angle) * scaledOffset,
          y: Math.sin(angle) * scaledOffset,
        })

        // Mouth reacts to proximity - opens wider when cursor is close
        const mouthSize = Math.max(4, Math.min(12, (400 - distance) / 30))
        setMouthHeight(mouthSize)
      } else {
        setEyeOffset({ x: 0, y: 0 })
        setMouthHeight(6)
      }
    }, 50) // 20fps for smooth animation

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [trackCursor])

  // Interactive avatar with animations (for trackCursor mode)
  if (trackCursor) {
    return (
      <div
        ref={containerRef}
        className="flex flex-col items-center cursor-pointer group relative"
        onClick={onClick}
      >
        {/* Background mask */}
        <div
          className={cn('absolute rounded-full', sizeClass)}
          style={{
            backgroundColor: 'var(--bg)',
            transform: 'scale(1.15)',
            zIndex: -1,
          }}
        />
        {/* Agent Blob with Framer Motion for interactive avatar */}
        <motion.div
          className={cn(
            'relative flex items-center justify-center animate-morph',
            sizeClass,
            statusStyles[agent.status]
          )}
          style={{
            backgroundColor: agent.color,
            boxShadow: `0 0 ${isActive ? 25 : 15}px ${agent.color}88, inset 0 4px 15px rgba(255,255,255,0.35), inset 0 -4px 15px rgba(0,0,0,0.25)`,
          }}
          animate={{
            scale: isActive ? [1, 1.03, 1] : [1, 1.01, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Face with tracking eyes */}
          <div
            className="absolute flex flex-col items-center"
            style={{ top: faceSize.faceTop }}
          >
            {/* Eyes row */}
            <div
              className="flex items-center justify-center"
              style={{ gap: faceSize.eyeGap }}
            >
              {/* Left Eye with tracking */}
              <motion.div
                className="bg-black/90 rounded-full"
                style={{
                  width: faceSize.eye,
                  height: faceSize.eye,
                  transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                }}
                animate={{
                  scaleY: [1, 1, 0.1, 1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  times: [0, 0.92, 0.96, 1, 1],
                }}
              />
              {/* Right Eye with tracking */}
              <motion.div
                className="bg-black/90 rounded-full"
                style={{
                  width: faceSize.eye,
                  height: faceSize.eye,
                  transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                }}
                animate={{
                  scaleY: [1, 1, 0.1, 1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  times: [0, 0.92, 0.96, 1, 1],
                }}
              />
            </div>

            {/* Mouth - reactive */}
            <motion.div
              className="bg-black/90 rounded-b-full mt-1"
              animate={{
                height: mouthHeight * (size === 'sm' ? 0.6 : size === 'md' ? 0.8 : 1),
              }}
              transition={{ duration: 0.1 }}
              style={{
                width: faceSize.mouth,
              }}
            />
          </div>

          {/* Subtle breathing glow */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: agent.color }}
            animate={{
              opacity: [0, 0.1, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Label */}
        {showLabel && (
          <div className="mt-2 px-2 py-1 bg-black/50 rounded text-center">
            <span
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: agent.color }}
            >
              {agent.displayName}
            </span>
            {agent.currentTask && (
              <div className="text-xs text-gray-400 truncate max-w-24" title={agent.currentTask.title}>
                {agent.currentTask.title}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Static avatar for grid display (optimized, no tracking)
  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer group relative"
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Background mask to hide connection lines */}
      <div
        className={cn('absolute rounded-full', sizeClass)}
        style={{
          backgroundColor: 'var(--bg)',
          transform: 'scale(1.15)',
          zIndex: -1,
        }}
      />
      {/* Agent Blob - using CSS animation for morph, minimal JS animation */}
      <div
        className={cn(
          'relative flex items-center justify-center animate-morph transition-shadow duration-300',
          sizeClass,
          statusStyles[agent.status],
          isActive && 'animate-pulse-glow'
        )}
        style={{
          backgroundColor: agent.color,
          boxShadow: `0 0 ${isActive ? 25 : 12}px ${agent.color}50, inset 0 4px 15px rgba(255,255,255,0.3), inset 0 -4px 15px rgba(0,0,0,0.3)`,
          willChange: 'transform',
        }}
      >
        {/* Face - static positioning, CSS blink animation */}
        <div
          className="absolute flex flex-col items-center"
          style={{ top: faceSize.faceTop }}
        >
          {/* Eyes row */}
          <div
            className="flex items-center justify-center"
            style={{ gap: faceSize.eyeGap }}
          >
            {/* Left Eye - CSS animation only */}
            <div
              className="bg-black/90 rounded-full animate-blink"
              style={{
                width: faceSize.eye,
                height: faceSize.eye,
              }}
            />
            {/* Right Eye - CSS animation only */}
            <div
              className="bg-black/90 rounded-full animate-blink"
              style={{
                width: faceSize.eye,
                height: faceSize.eye,
              }}
            />
          </div>

          {/* Mouth - static */}
          <div
            className={cn(
              "bg-black/90 rounded-b-full mt-1",
              isThinking && "animate-pulse"
            )}
            style={{
              width: faceSize.mouth,
              height: faceSize.mouthHeight,
            }}
          />
        </div>

        {/* Status indicator ring - only when active, using CSS */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-full border-2 animate-ping"
            style={{
              borderColor: agent.color,
              animationDuration: '1.5s',
            }}
          />
        )}
      </div>

      {/* Label - no animation, static */}
      {showLabel && (
        <div className="mt-2 px-3 py-1.5 bg-[var(--bg)]/80 backdrop-blur-sm rounded-lg text-center border border-[var(--glass-border)]">
          <span
            className="font-mono text-xs font-medium"
            style={{ color: agent.color }}
          >
            {agent.displayName}
          </span>
          {agent.currentTask && (
            <div className="text-xs text-[var(--text-dim)] truncate max-w-24 mt-0.5" title={agent.currentTask.title}>
              {agent.currentTask.title}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
})
