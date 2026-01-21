'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { X, AlertTriangle, Clock, CheckCircle, Play, ExternalLink } from 'lucide-react'
import type { PipelineProject } from '@/lib/types'

const STATUS_CONFIG = {
  'Not Started': { icon: Clock, color: 'var(--text-muted)', bg: 'var(--glass)' },
  'In Progress': { icon: Play, color: 'var(--accent)', bg: 'var(--accent-muted)' },
  'Blocked': { icon: AlertTriangle, color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.15)' },
  'Review': { icon: Clock, color: 'var(--warning)', bg: 'rgba(251, 191, 36, 0.15)' },
  'Complete': { icon: CheckCircle, color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.15)' },
}

const PRIORITY_COLORS = {
  'Critical': 'var(--error)',
  'High': 'var(--warning)',
  'Medium': 'var(--accent)',
  'Low': 'var(--text-muted)',
}

function ProjectCard({ project, onClick }: { project: PipelineProject; onClick: () => void }) {
  const statusConfig = STATUS_CONFIG[project.status]
  const StatusIcon = statusConfig.icon
  const priorityColor = PRIORITY_COLORS[project.priority]

  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl transition-all"
      style={{
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
      }}
      whileHover={{
        scale: 1.01,
        borderColor: 'var(--accent)',
        background: 'var(--bg-elevated)',
      }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: statusConfig.bg }}
        >
          <StatusIcon className="w-5 h-5" style={{ color: statusConfig.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium truncate" style={{ color: 'var(--text-main)' }}>
              {project.title}
            </h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                color: priorityColor,
                background: `${priorityColor}15`,
              }}
            >
              {project.priority}
            </span>
          </div>

          <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
            {project.stage} • {project.agent}
          </p>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--glass-border)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: project.status === 'Blocked'
                    ? 'var(--error)'
                    : 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${project.progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {Math.round(project.progress * 100)}%
            </span>
          </div>

          {/* Blocker Alert */}
          {project.blockers && (
            <div
              className="mt-2 p-2 rounded-lg text-xs flex items-start gap-2"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
              <span style={{ color: 'rgba(239, 68, 68, 0.9)' }}>{project.blockers}</span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
      </div>
    </motion.button>
  )
}

interface ProjectsListPanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (projectId: string) => void
}

export function ProjectsListPanel({ isOpen, onClose, onSelectProject }: ProjectsListPanelProps) {
  const [mounted, setMounted] = useState(false)
  const { pipelineProjects, notificationCounts, refreshPipeline, pipelineLoading } = useDashboardStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Refresh pipeline when panel opens
  useEffect(() => {
    if (isOpen) {
      refreshPipeline()
    }
  }, [isOpen, refreshPipeline])

  // Stats
  const activeCount = pipelineProjects.filter(p => p.isActive).length
  const blockedCount = notificationCounts.blocked
  const reviewCount = notificationCounts.review

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-[390px] top-5 bottom-5 w-[420px] flex flex-col"
            style={{
              zIndex: 9999,
              background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg) 100%)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              boxShadow: '0 25px 80px -20px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Header */}
            <div
              className="flex-shrink-0 p-5"
              style={{ borderBottom: '1px solid var(--glass-border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="heading-md" style={{ color: 'var(--accent)' }}>All Projects</h2>
                  <p className="text-caption text-mono mt-1">Pipeline Overview</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: 'var(--glass)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ background: 'var(--accent-muted)' }}
                >
                  <p className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>{activeCount}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Active</p>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <p className="text-lg font-semibold" style={{ color: 'var(--error)' }}>{blockedCount}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Blocked</p>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ background: 'rgba(251, 191, 36, 0.1)' }}
                >
                  <p className="text-lg font-semibold" style={{ color: 'var(--warning)' }}>{reviewCount}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Review</p>
                </div>
              </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-fade">
              {pipelineLoading && pipelineProjects.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div
                      className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
                      style={{ borderColor: 'var(--glass-border)', borderTopColor: 'var(--accent)' }}
                    />
                    <p className="text-caption" style={{ color: 'var(--text-dim)' }}>Loading projects...</p>
                  </div>
                </div>
              ) : pipelineProjects.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No projects in pipeline</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                      Projects will appear here when added
                    </p>
                  </div>
                </div>
              ) : (
                pipelineProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => {
                      onSelectProject(project.id)
                      onClose()
                    }}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
