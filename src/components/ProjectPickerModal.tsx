'use client'

import { useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import type { Project, ProjectStats } from '@/lib/types'
import { Plus, ArrowRight, Sparkles, FolderOpen } from 'lucide-react'

interface ProjectPickerModalProps {
  onClose: () => void
  onCreateNew: () => void
}

function ProjectCard({
  project,
  stats,
  onSelect,
  index,
}: {
  project: Project
  stats: ProjectStats
  onSelect: () => void
  index: number
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="group relative w-full text-left"
      style={{
        padding: '16px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      whileHover={{
        background: 'rgba(255, 255, 255, 0.06)',
        borderColor: `${project.color}40`,
        y: -2,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${project.color}15 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex items-center gap-3">
        {/* Project Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 transition-transform group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${project.color}30 0%, ${project.color}10 100%)`,
            color: project.color,
          }}
        >
          {project.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-main)] truncate group-hover:text-white transition-colors">
            {project.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            {stats.activeTasks > 0 ? (
              <span className="flex items-center gap-1 text-[11px]">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: project.color }}
                />
                <span style={{ color: project.color }}>{stats.activeTasks} active</span>
              </span>
            ) : (
              <span className="text-[11px] text-[var(--text-dim)]">No active tasks</span>
            )}
            <span className="text-[11px] text-[var(--text-muted)]">
              · {formatLastActivity(stats.lastActivityAt)}
            </span>
          </div>
        </div>

        {/* Arrow indicator */}
        <ArrowRight
          className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0"
        />
      </div>
    </motion.button>
  )
}

function NewProjectCard({ onClick, index }: { onClick: () => void; index: number }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="group w-full text-left relative"
      style={{
        padding: '16px',
        borderRadius: '16px',
        background: 'transparent',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
      }}
      whileHover={{
        borderColor: 'var(--accent)',
        background: 'rgba(255, 107, 53, 0.05)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Plus className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--accent)] transition-colors" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-main)] transition-colors">
            New Project
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Start something new
          </p>
        </div>
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

  // Get active (non-archived) projects sorted by recent activity, de-duplicated by name
  const activeProjects = useMemo(() => {
    const seen = new Set<string>()
    return projects
      .filter(p => p.status !== 'archived')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .filter(p => {
        const nameLower = p.name.toLowerCase()
        if (seen.has(nameLower)) return false
        seen.add(nameLower)
        return true
      })
      .slice(0, 4) // Show max 4 recent projects for cleaner layout
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
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop with blur */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(12px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleViewAllProjects}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md overflow-hidden"
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(180deg, rgba(30, 30, 35, 0.98) 0%, rgba(20, 20, 24, 0.99) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 48px 100px -24px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        >
          {/* Top gradient accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 107, 53, 0.12) 0%, transparent 70%)',
            }}
          />

          {/* Header */}
          <div className="relative px-6 pt-6 pb-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 mb-3"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, #ff8a50 100%)',
                  boxShadow: '0 4px 12px rgba(255, 107, 53, 0.25)',
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xl font-bold text-white"
              style={{ letterSpacing: '-0.02em' }}
            >
              Welcome back, Ben
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-[var(--text-secondary)] mt-1"
            >
              Pick up where you left off
            </motion.p>
          </div>

          {/* Project List */}
          <div className="px-6 py-4">
            {activeProjects.length > 0 ? (
              <div className="space-y-2">
                {activeProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    stats={getProjectStats(project.id)}
                    onSelect={() => handleSelectProject(project.id)}
                    index={index}
                  />
                ))}
                <NewProjectCard onClick={handleCreateNew} index={activeProjects.length} />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center py-8"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <FolderOpen className="w-7 h-7 text-[var(--text-dim)]" />
                </div>
                <h3 className="text-base font-medium text-[var(--text-main)] mb-2">
                  No projects yet
                </h3>
                <p className="text-sm text-[var(--text-dim)] mb-6">
                  Create your first project to get started
                </p>
                <motion.button
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, #ff8a50 100%)',
                    boxShadow: '0 4px 20px rgba(255, 107, 53, 0.35)',
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(255, 107, 53, 0.45)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  Create Project
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          {activeProjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="px-6 pb-6"
            >
              <motion.button
                onClick={handleViewAllProjects}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                }}
                whileHover={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-main)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                View All Projects
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
