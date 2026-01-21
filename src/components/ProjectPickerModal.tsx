'use client'

import { useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import type { Project, ProjectStats } from '@/lib/types'

interface ProjectPickerModalProps {
  onClose: () => void
  onCreateNew: () => void
}

function ProjectCard({
  project,
  stats,
  onSelect,
}: {
  project: Project
  stats: ProjectStats
  onSelect: () => void
}) {
  const formatLastActivity = (date: Date | null) => {
    if (!date) return 'No activity'
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <motion.button
      onClick={onSelect}
      className="group relative w-full text-left p-4 rounded-2xl border transition-all"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--glass-border)',
      }}
      whileHover={{
        scale: 1.02,
        borderColor: project.color,
        boxShadow: `0 8px 32px ${project.color}20`,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Color indicator */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: project.color }}
      />

      <div className="flex items-start gap-3 pt-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-semibold flex-shrink-0"
          style={{
            backgroundColor: `${project.color}20`,
            color: project.color,
          }}
        >
          {project.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--text-main)] truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-[var(--text-dim)] truncate mt-0.5">
              {project.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-[var(--text-muted)]">
              {stats.activeTasks > 0 ? (
                <span style={{ color: 'var(--accent)' }}>
                  {stats.activeTasks} active
                </span>
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>Idle</span>
              )}
            </span>
            <span className="text-xs text-[var(--text-dim)]">
              {stats.activeAgents.length} agent{stats.activeAgents.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-[var(--text-dim)]">
              {formatLastActivity(stats.lastActivityAt)}
            </span>
          </div>

          {/* Progress bar */}
          {stats.totalTasks > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${stats.progressPercent}%`,
                    backgroundColor: project.color,
                  }}
                />
              </div>
              <span className="text-[10px] text-[var(--text-dim)] mt-1">
                {stats.progressPercent}% complete
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  )
}

function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-3"
      style={{
        borderColor: 'var(--glass-border)',
        minHeight: '100px',
      }}
      whileHover={{
        scale: 1.02,
        borderColor: 'var(--accent)',
        backgroundColor: 'rgba(255, 107, 53, 0.05)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: 'var(--glass)',
          color: 'var(--text-secondary)',
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          New Project
        </h3>
        <p className="text-xs text-[var(--text-dim)]">
          Start a new venture
        </p>
      </div>
    </motion.button>
  )
}

export function ProjectPickerModal({ onClose, onCreateNew }: ProjectPickerModalProps) {
  const {
    projects,
    setActiveProject,
    setHasShownProjectPicker,
    getProjectStats,
  } = useDashboardStore()

  // Get active (non-archived) projects sorted by recent activity
  const activeProjects = useMemo(() => {
    return projects
      .filter(p => p.status !== 'archived')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6) // Show max 6 recent projects
  }, [projects])

  const handleSelectProject = useCallback((projectId: string) => {
    setActiveProject(projectId)
    setHasShownProjectPicker(true)
    onClose()
  }, [setActiveProject, setHasShownProjectPicker, onClose])

  const handleViewAllProjects = useCallback(() => {
    setActiveProject(null) // All Projects view
    setHasShownProjectPicker(true)
    onClose()
  }, [setActiveProject, setHasShownProjectPicker, onClose])

  const handleCreateNew = useCallback(() => {
    setHasShownProjectPicker(true)
    onCreateNew()
    onClose()
  }, [setHasShownProjectPicker, onCreateNew, onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleViewAllProjects}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl mx-4 rounded-3xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.6)',
          }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="p-6 pb-4">
            <h2 className="text-xl font-semibold text-[var(--text-main)]">
              Welcome back, Ben
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Which project would you like to focus on?
            </p>
          </div>

          {/* Project Grid */}
          <div className="px-6 pb-6">
            {activeProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    stats={getProjectStats(project.id)}
                    onSelect={() => handleSelectProject(project.id)}
                  />
                ))}
                <NewProjectCard onClick={handleCreateNew} />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[var(--glass)] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[var(--text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                  No projects yet
                </h3>
                <p className="text-xs text-[var(--text-dim)] mb-4">
                  Get started by creating your first project
                </p>
                <NewProjectCard onClick={handleCreateNew} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex justify-center">
            <motion.button
              onClick={handleViewAllProjects}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: 'var(--glass)',
                color: 'var(--text-secondary)',
              }}
              whileHover={{
                backgroundColor: 'var(--glass-hover)',
                color: 'var(--text-main)',
              }}
            >
              View All Projects
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
