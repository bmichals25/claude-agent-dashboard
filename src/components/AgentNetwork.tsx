'use client'

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { AgentNode } from './AgentNode'
import { getAgentColorWithOpacity } from '@/lib/utils'
import type { AgentId } from '@/lib/types'

// Department definitions
const DEPARTMENTS = [
  {
    id: 'chief_of_staff',
    name: 'Chief of Staff',
    description: 'Admin & Support Operations',
    vpId: 'chief_of_staff' as AgentId,
    members: ['support_agent'] as AgentId[],
    color: '#ff00c1',
  },
  {
    id: 'pipeline_manager',
    name: 'Pipeline Management',
    description: 'Project Lifecycle Coordination',
    vpId: 'pipeline_manager' as AgentId,
    members: ['autopilot_agent'] as AgentId[],
    color: '#7000ff',
  },
  {
    id: 'agent_operations',
    name: 'Agent Operations',
    description: 'Health Monitoring & Optimization',
    vpId: 'agent_operations' as AgentId,
    members: [] as AgentId[],
    color: '#00ffaa',
  },
  {
    id: 'vp_engineering',
    name: 'Engineering',
    description: 'Technical Execution & Architecture',
    vpId: 'vp_engineering' as AgentId,
    members: ['architect', 'developer', 'devops_engineer', 'code_reviewer', 'security_engineer'] as AgentId[],
    color: '#00ff66',
  },
  {
    id: 'vp_product',
    name: 'Product',
    description: 'Strategy, Research & Growth',
    vpId: 'vp_product' as AgentId,
    members: ['product_researcher', 'product_manager', 'data_engineer', 'growth_marketer'] as AgentId[],
    color: '#ffaa00',
  },
  {
    id: 'vp_design_qa',
    name: 'Design & QA',
    description: 'UX, Visual Design & Quality',
    vpId: 'vp_design_qa' as AgentId,
    members: ['frontend_designer', 'user_testing', 'technical_writer'] as AgentId[],
    color: '#ff6b6b',
  },
]

// Department positions for focused view
const getDepartmentPositions = (memberCount: number): { vp: { x: number; y: number }; members: { x: number; y: number }[] } => {
  const vpPos = { x: 50, y: 40 }
  const members: { x: number; y: number }[] = []

  if (memberCount === 0) {
    return { vp: vpPos, members }
  }

  // Spread members in an arc below the VP
  const startX = 50 - (memberCount - 1) * 12
  for (let i = 0; i < memberCount; i++) {
    members.push({
      x: startX + i * 24,
      y: 70,
    })
  }

  return { vp: vpPos, members }
}

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
  const { agents, connections, activeConnections, setSelectedAgent } = useDashboardStore()

  // View mode state
  const [viewMode, setViewMode] = useState<'full' | 'department'>('full')
  const [currentDeptIndex, setCurrentDeptIndex] = useState(0)
  const currentDept = DEPARTMENTS[currentDeptIndex]

  // Navigation handlers
  const goToPrevDept = useCallback(() => {
    setCurrentDeptIndex(i => (i - 1 + DEPARTMENTS.length) % DEPARTMENTS.length)
  }, [])

  const goToNextDept = useCallback(() => {
    setCurrentDeptIndex(i => (i + 1) % DEPARTMENTS.length)
  }, [])

  // Keyboard navigation for department view
  useEffect(() => {
    if (viewMode !== 'department') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevDept()
      } else if (e.key === 'ArrowRight') {
        goToNextDept()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, goToPrevDept, goToNextDept])

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

  // Memoize agent nodes for full view
  const agentNodes = useMemo(() => {
    return agents.map(agent => (
      <AgentNode key={agent.id} agent={agent} />
    ))
  }, [agents])

  // Department view: Get agents with custom positions
  const departmentAgents = useMemo(() => {
    if (viewMode !== 'department') return null

    const ceoAgent = agents.find(a => a.id === 'ceo')
    const vpAgent = agents.find(a => a.id === currentDept.vpId)
    const memberAgents = currentDept.members.map(id => agents.find(a => a.id === id)).filter(Boolean)

    const positions = getDepartmentPositions(memberAgents.length)

    return {
      ceo: ceoAgent ? { ...ceoAgent, position: { x: 50, y: 12 } } : null,
      vp: vpAgent ? { ...vpAgent, position: positions.vp } : null,
      members: memberAgents.map((agent, i) => agent ? { ...agent, position: positions.members[i] } : null).filter(Boolean),
    }
  }, [viewMode, currentDept, agents])

  // Department view connections
  const departmentConnections = useMemo(() => {
    if (viewMode !== 'department' || !departmentAgents) return null

    const lines: { from: { x: number; y: number }; to: { x: number; y: number }; color: string }[] = []

    // CEO to VP
    if (departmentAgents.ceo && departmentAgents.vp) {
      lines.push({
        from: departmentAgents.ceo.position,
        to: departmentAgents.vp.position,
        color: departmentAgents.vp.color,
      })
    }

    // VP to members
    if (departmentAgents.vp) {
      departmentAgents.members.forEach(member => {
        if (member) {
          lines.push({
            from: departmentAgents.vp!.position,
            to: member.position,
            color: member.color,
          })
        }
      })
    }

    return lines
  }, [viewMode, departmentAgents])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseDown={viewMode === 'full' ? handleMouseDown : undefined}
      onMouseMove={viewMode === 'full' ? handleMouseMove : undefined}
      onMouseUp={viewMode === 'full' ? handleMouseUp : undefined}
      onMouseLeave={viewMode === 'full' ? handleMouseUp : undefined}
      style={{ cursor: viewMode === 'full' ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
    >
      {/* View Mode Toggle */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[var(--bg-surface)] rounded-xl p-1 border border-[var(--glass-border)]">
        <button
          onClick={() => setViewMode('full')}
          className={`btn btn-sm ${viewMode === 'full' ? 'btn-secondary' : 'btn-ghost'}`}
        >
          Full View
        </button>
        <button
          onClick={() => setViewMode('department')}
          className={`btn btn-sm ${viewMode === 'department' ? 'btn-secondary' : 'btn-ghost'}`}
        >
          By Department
        </button>
      </div>

      {/* FULL VIEW MODE */}
      <AnimatePresence mode="wait">
        {viewMode === 'full' && (
          <motion.div
            key="full-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
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

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
              <button
                onClick={() => applyZoom(Math.min(transformRef.current.scale * 1.2, 3))}
                className="btn btn-ghost btn-icon btn-sm"
              >
                +
              </button>
              <button
                onClick={() => applyZoom(Math.max(transformRef.current.scale * 0.8, 0.3))}
                className="btn btn-ghost btn-icon btn-sm"
              >
                −
              </button>
              <button
                onClick={resetView}
                className="btn btn-ghost btn-sm"
              >
                Reset
              </button>
              <span data-zoom-display className="text-caption ml-2">
                {Math.round(transform.scale * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEPARTMENT VIEW MODE */}
      <AnimatePresence mode="wait">
        {viewMode === 'department' && departmentAgents && (
          <motion.div
            key="department-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {/* Department Banner with Navigation */}
            <div className="absolute top-20 left-0 right-0 z-10 flex items-center justify-center px-8">
              <div className="flex items-center gap-4 max-w-2xl w-full">
                {/* Left Arrow */}
                <motion.button
                  onClick={goToPrevDept}
                  className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass)] transition-all shadow-lg"
                  whileHover={{ scale: 1.1, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>

                {/* Department Info Banner */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentDept.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 text-center py-4 px-6 rounded-2xl border relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${currentDept.color}15 0%, transparent 100%)`,
                      borderColor: `${currentDept.color}30`,
                    }}
                  >
                    {/* Glow effect */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `radial-gradient(ellipse at center, ${currentDept.color}40 0%, transparent 70%)`,
                      }}
                    />
                    <h2
                      className="heading-lg relative z-10"
                      style={{ color: currentDept.color }}
                    >
                      {currentDept.name}
                    </h2>
                    <p className="text-caption relative z-10 mt-1">
                      {currentDept.description}
                    </p>
                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-2 mt-3 relative z-10">
                      {DEPARTMENTS.map((dept, i) => (
                        <button
                          key={dept.id}
                          onClick={() => setCurrentDeptIndex(i)}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{
                            backgroundColor: i === currentDeptIndex ? currentDept.color : 'var(--text-dim)',
                            transform: i === currentDeptIndex ? 'scale(1.5)' : 'scale(1)',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Right Arrow */}
                <motion.button
                  onClick={goToNextDept}
                  className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass)] transition-all shadow-lg"
                  whileHover={{ scale: 1.1, x: 3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Department Agents Canvas */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDept.id + '-agents'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pt-48"
              >
                {/* SVG connections for department view */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 0 }}
                  preserveAspectRatio="none"
                >
                  {departmentConnections?.map((line, i) => (
                    <line
                      key={i}
                      x1={`${line.from.x}%`}
                      y1={`${line.from.y}%`}
                      x2={`${line.to.x}%`}
                      y2={`${line.to.y}%`}
                      stroke={getAgentColorWithOpacity(line.color, 0.4)}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  ))}
                </svg>

                {/* CEO Agent */}
                {departmentAgents.ceo && (
                  <AgentNode key={departmentAgents.ceo.id} agent={departmentAgents.ceo} />
                )}

                {/* VP Agent */}
                {departmentAgents.vp && (
                  <AgentNode key={departmentAgents.vp.id} agent={departmentAgents.vp} />
                )}

                {/* Member Agents */}
                {departmentAgents.members.map(agent => agent && (
                  <AgentNode key={agent.id} agent={agent} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Keyboard hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-caption flex items-center gap-4">
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--glass-border)] text-xs">←</kbd>
                <kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--glass-border)] text-xs">→</kbd>
                <span>Navigate</span>
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span>{currentDeptIndex + 1} of {DEPARTMENTS.length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(3, 7, 8, 0.5) 100%)',
        }}
      />
    </div>
  )
}
