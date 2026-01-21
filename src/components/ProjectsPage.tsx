'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { NewProjectWizard } from '@/components/NewProjectWizard'
import type { PipelineProject } from '@/lib/types'

// Status configuration with semantic colors
const STATUS_CONFIG = {
  'Not Started': {
    label: 'Queued',
    color: 'rgba(148, 163, 184, 0.9)',
    bg: 'rgba(148, 163, 184, 0.08)',
    glow: 'rgba(148, 163, 184, 0.15)',
    ring: 'rgba(148, 163, 184, 0.3)'
  },
  'In Progress': {
    label: 'Active',
    color: 'var(--accent)',
    bg: 'rgba(255, 107, 53, 0.08)',
    glow: 'rgba(255, 107, 53, 0.2)',
    ring: 'rgba(255, 107, 53, 0.4)'
  },
  'Blocked': {
    label: 'Blocked',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    glow: 'rgba(239, 68, 68, 0.25)',
    ring: 'rgba(239, 68, 68, 0.5)'
  },
  'Review': {
    label: 'Review',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.08)',
    glow: 'rgba(251, 191, 36, 0.2)',
    ring: 'rgba(251, 191, 36, 0.4)'
  },
  'Complete': {
    label: 'Complete',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.08)',
    glow: 'rgba(34, 197, 94, 0.15)',
    ring: 'rgba(34, 197, 94, 0.4)'
  },
} as const

const PRIORITY_CONFIG = {
  'Critical': { color: '#ef4444', label: 'CRIT' },
  'High': { color: '#fbbf24', label: 'HIGH' },
  'Medium': { color: 'var(--accent)', label: 'MED' },
  'Low': { color: 'rgba(148, 163, 184, 0.7)', label: 'LOW' },
} as const

type FilterStatus = 'all' | 'In Progress' | 'Blocked' | 'Review' | 'Complete' | 'Not Started'

// Circular progress indicator
function ProgressRing({ progress, size = 48, strokeWidth = 3, color }: {
  progress: number
  size?: number
  strokeWidth?: number
  color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress * circumference)

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
    </svg>
  )
}

// Hero stat card
function StatCard({ value, label, color, delay = 0 }: {
  value: number
  label: string
  color: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        padding: '28px 32px',
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${color}08 0%, transparent 70%)`,
        border: `1px solid ${color}15`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: delay + 0.1 }}
        style={{
          fontSize: '42px',
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          color: color,
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </motion.div>
      <div
        style={{
          fontSize: '11px',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          color: 'var(--text-dim)',
          marginTop: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </div>
    </motion.div>
  )
}

// Project card with visual depth
function ProjectCard({
  project,
  index,
  onClick
}: {
  project: PipelineProject
  index: number
  onClick: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const statusConfig = STATUS_CONFIG[project.status]
  const priorityConfig = PRIORITY_CONFIG[project.priority]
  const progressPercent = Math.round(project.progress * 100)

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 0,
        border: 'none',
        cursor: 'pointer',
        background: 'transparent',
        position: 'relative',
      }}
    >
      {/* Card container */}
      <motion.div
        animate={{
          boxShadow: isHovered
            ? `0 20px 50px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px ${statusConfig.ring}, 0 0 40px ${statusConfig.glow}`
            : '0 4px 20px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(145deg, rgba(22, 22, 26, 0.9) 0%, rgba(18, 18, 22, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Status accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: `linear-gradient(180deg, ${statusConfig.color} 0%, ${statusConfig.color}60 100%)`,
            boxShadow: `0 0 20px ${statusConfig.glow}`,
          }}
        />

        {/* Content */}
        <div style={{ padding: '24px 24px 24px 28px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
            {/* Progress ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ProgressRing
                progress={project.progress}
                color={statusConfig.color}
                size={56}
                strokeWidth={4}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  color: statusConfig.color,
                }}
              >
                {progressPercent}
              </div>
            </div>

            {/* Title & meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '6px',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {project.title}
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  color: 'var(--text-dim)',
                }}
              >
                <span style={{ color: statusConfig.color }}>{statusConfig.label}</span>
                <span style={{ opacity: 0.3 }}>·</span>
                <span>{project.stage}</span>
              </div>
            </div>

            {/* Priority badge */}
            <div
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '9px',
                fontWeight: 700,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                letterSpacing: '0.08em',
                color: priorityConfig.color,
                background: `${priorityConfig.color}15`,
                border: `1px solid ${priorityConfig.color}25`,
              }}
            >
              {priorityConfig.label}
            </div>
          </div>

          {/* Agent assignment */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: '#0a0a0a',
              }}
            >
              {project.agent.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {project.agent}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>
                Assigned Agent
              </div>
            </div>

            {/* Arrow indicator */}
            <motion.svg
              animate={{ x: isHovered ? 4 : 0, opacity: isHovered ? 1 : 0.3 }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: 'var(--text-dim)' }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </div>

          {/* Blocker alert */}
          {project.blockers && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                style={{ flexShrink: 0, marginTop: '1px' }}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div style={{ fontSize: '12px', color: 'rgba(239, 68, 68, 0.9)', lineHeight: 1.5 }}>
                {project.blockers}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.button>
  )
}

// Filter tab button
function FilterTab({
  label,
  count,
  isActive,
  color,
  onClick
}: {
  label: string
  count: number
  isActive: boolean
  color: string
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        padding: '10px 18px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        background: isActive
          ? `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`
          : 'transparent',
        color: isActive ? color : 'var(--text-dim)',
        boxShadow: isActive ? `0 0 0 1px ${color}30, 0 4px 20px ${color}10` : 'none',
      }}
    >
      {label}
      <span
        style={{
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          background: isActive ? `${color}20` : 'rgba(255, 255, 255, 0.05)',
          color: isActive ? color : 'var(--text-muted)',
        }}
      >
        {count}
      </span>
    </motion.button>
  )
}

interface ProjectsPageProps {
  onBack: () => void
  onSelectProject: (projectId: string) => void
}

export function ProjectsPage({ onBack, onSelectProject }: ProjectsPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')
  const { pipelineProjects, notificationCounts, refreshPipeline, pipelineLoading, showNewProjectWizard, setShowNewProjectWizard } = useDashboardStore()

  // Refresh pipeline on mount
  useEffect(() => {
    refreshPipeline()
  }, [refreshPipeline])

  // Computed stats
  const stats = useMemo(() => ({
    total: pipelineProjects.length,
    active: pipelineProjects.filter(p => p.status === 'In Progress').length,
    blocked: notificationCounts.blocked,
    review: notificationCounts.review,
    complete: pipelineProjects.filter(p => p.status === 'Complete').length,
    notStarted: pipelineProjects.filter(p => p.status === 'Not Started').length,
  }), [pipelineProjects, notificationCounts])

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return pipelineProjects
    return pipelineProjects.filter(p => p.status === activeFilter)
  }, [pipelineProjects, activeFilter])

  // Overall pipeline progress
  const overallProgress = useMemo(() => {
    if (pipelineProjects.length === 0) return 0
    const totalProgress = pipelineProjects.reduce((sum, p) => sum + p.progress, 0)
    return Math.round((totalProgress / pipelineProjects.length) * 100)
  }, [pipelineProjects])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background effects */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 107, 53, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 90% 80%, rgba(239, 68, 68, 0.04) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      {/* Dot grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      {/* Scrollable content */}
      <div
        className="scrollbar-fade"
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 56px 120px' }}>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: '48px' }}
          >
            {/* Title Row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  Ben's Product Pipeline
                </h1>
                <p
                  style={{
                    fontSize: '14px',
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    color: 'var(--text-dim)',
                    marginTop: '6px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {stats.total} projects · {overallProgress}% overall progress
                </p>
              </div>

              {/* New Product Button */}
              <motion.button
                onClick={() => setShowNewProjectWizard(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'var(--accent)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px var(--accent-glow)',
                }}
              >
                <Plus size={18} style={{ color: 'var(--bg)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--bg)' }}>
                  New Product
                </span>
              </motion.button>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              <StatCard value={stats.total} label="Total Projects" color="var(--text-secondary)" delay={0} />
              <StatCard value={stats.active} label="In Progress" color="var(--accent)" delay={0.05} />
              <StatCard value={stats.blocked} label="Blocked" color="#ef4444" delay={0.1} />
              <StatCard value={stats.review} label="In Review" color="#fbbf24" delay={0.15} />
              <StatCard value={stats.complete} label="Completed" color="#22c55e" delay={0.2} />
            </div>
          </motion.header>

          {/* Filter bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '32px',
              padding: '8px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              width: 'fit-content',
            }}
          >
            <FilterTab
              label="All"
              count={stats.total}
              isActive={activeFilter === 'all'}
              color="var(--text-secondary)"
              onClick={() => setActiveFilter('all')}
            />
            <FilterTab
              label="Active"
              count={stats.active}
              isActive={activeFilter === 'In Progress'}
              color="var(--accent)"
              onClick={() => setActiveFilter('In Progress')}
            />
            <FilterTab
              label="Blocked"
              count={stats.blocked}
              isActive={activeFilter === 'Blocked'}
              color="#ef4444"
              onClick={() => setActiveFilter('Blocked')}
            />
            <FilterTab
              label="Review"
              count={stats.review}
              isActive={activeFilter === 'Review'}
              color="#fbbf24"
              onClick={() => setActiveFilter('Review')}
            />
            <FilterTab
              label="Complete"
              count={stats.complete}
              isActive={activeFilter === 'Complete'}
              color="#22c55e"
              onClick={() => setActiveFilter('Complete')}
            />
          </motion.div>

          {/* Projects grid */}
          <AnimatePresence mode="wait">
            {pipelineLoading && pipelineProjects.length === 0 ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '120px 0',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: '48px',
                      height: '48px',
                      border: '3px solid rgba(255, 255, 255, 0.05)',
                      borderTopColor: 'var(--accent)',
                      borderRadius: '50%',
                      margin: '0 auto 20px',
                    }}
                  />
                  <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Loading pipeline...</p>
                </div>
              </motion.div>
            ) : filteredProjects.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '100px 0',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {activeFilter === 'all' ? 'No projects yet' : `No ${activeFilter.toLowerCase()} projects`}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-dim)', maxWidth: '300px' }}>
                  {activeFilter === 'all'
                    ? 'Projects will appear here when added to the pipeline'
                    : 'Try selecting a different filter to see more projects'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '20px',
                }}
              >
                {filteredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    onClick={() => onSelectProject(project.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Project Wizard Modal */}
      <AnimatePresence>
        {showNewProjectWizard && (
          <NewProjectWizard onClose={() => setShowNewProjectWizard(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
