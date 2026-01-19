'use client'

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react'
import { useDashboardStore } from '@/lib/store'
import { AgentNode } from './AgentNode'
import { getAgentColorWithOpacity } from '@/lib/utils'

// Memoized connection line component
const ConnectionLine = memo(function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  color,
  isActive
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  isActive: boolean
}) {
  return (
    <line
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      stroke={getAgentColorWithOpacity(color, isActive ? 0.5 : 0.2)}
      strokeWidth={isActive ? 2.5 : 1.5}
      strokeLinecap="round"
    />
  )
})

export function AgentNetwork() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })
  const zoomSyncTimeout = useRef<NodeJS.Timeout | null>(null)
  const { agents, connections, activeConnections } = useDashboardStore()

  // Use ref for transform during drag to avoid re-renders
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  // Helper to update zoom via direct DOM manipulation
  const applyZoom = useCallback((newScale: number) => {
    transformRef.current = { ...transformRef.current, scale: newScale }

    const canvas = containerRef.current?.querySelector('[data-canvas]') as HTMLElement
    if (canvas) {
      canvas.style.transform = `translate(${transformRef.current.x}px, ${transformRef.current.y}px) scale(${newScale})`
    }

    const zoomDisplay = containerRef.current?.querySelector('[data-zoom-display]') as HTMLElement
    if (zoomDisplay) {
      zoomDisplay.textContent = `${Math.round(newScale * 100)}%`
    }

    // Debounced state sync
    if (zoomSyncTimeout.current) clearTimeout(zoomSyncTimeout.current)
    zoomSyncTimeout.current = setTimeout(() => {
      setTransform({ ...transformRef.current })
    }, 150)
  }, [])

  // Handle mouse wheel zoom - direct DOM update for performance
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    const newScale = Math.min(Math.max(transformRef.current.scale * delta, 0.3), 3)
    applyZoom(newScale)
  }, [applyZoom])

  // Handle pan start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-agent-node]')) return
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true)
      panStartRef.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y
      }
    }
  }, [])

  // Handle pan move - use RAF for smooth updates
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return

    const newX = e.clientX - panStartRef.current.x
    const newY = e.clientY - panStartRef.current.y
    transformRef.current = { ...transformRef.current, x: newX, y: newY }

    // Direct DOM update for smoother panning
    const canvas = containerRef.current?.querySelector('[data-canvas]') as HTMLElement
    if (canvas) {
      canvas.style.transform = `translate(${newX}px, ${newY}px) scale(${transformRef.current.scale})`
    }
  }, [isPanning])

  // Handle pan end - sync state
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      setTransform({ ...transformRef.current })
    }
  }, [isPanning])

  // Reset view
  const resetView = useCallback(() => {
    transformRef.current = { x: 0, y: 0, scale: 1 }
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Memoize connections rendering
  const connectionElements = useMemo(() => {
    return connections.map(({ from, to }) => {
      const fromAgent = agents.find(a => a.id === from)
      const toAgent = agents.find(a => a.id === to)

      if (!fromAgent || !toAgent) return null

      const key = `${from}-${to}`
      const isActive = activeConnections.has(key)

      return (
        <ConnectionLine
          key={key}
          x1={fromAgent.position.x}
          y1={fromAgent.position.y}
          x2={toAgent.position.x}
          y2={toAgent.position.y}
          color={fromAgent.color}
          isActive={isActive}
        />
      )
    })
  }, [connections, agents, activeConnections])

  // Memoize agent nodes
  const agentNodes = useMemo(() => {
    return agents.map(agent => (
      <AgentNode key={agent.id} agent={agent} />
    ))
  }, [agents])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Transformable canvas layer */}
      <div
        data-canvas
        className="absolute inset-0 origin-center"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          willChange: isPanning ? 'transform' : 'auto',
        }}
      >
        {/* SVG Layer for connections */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
          preserveAspectRatio="none"
        >
          {connectionElements}
        </svg>

        {/* Agent Nodes */}
        {agentNodes}
      </div>

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(3, 7, 8, 0.5) 100%)',
        }}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => applyZoom(Math.min(transformRef.current.scale * 1.2, 3))}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors text-lg font-bold"
        >
          +
        </button>
        <button
          onClick={() => applyZoom(Math.max(transformRef.current.scale * 0.8, 0.3))}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors text-lg font-bold"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="px-3 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors text-xs font-medium"
        >
          Reset
        </button>
        <span data-zoom-display className="text-xs text-white/40 ml-2">
          {Math.round(transform.scale * 100)}%
        </span>
      </div>
    </div>
  )
}
