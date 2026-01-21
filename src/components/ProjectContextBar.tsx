'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import type { Project } from '@/lib/types'

interface ProjectContextBarProps {
  onOpenNewProject: () => void
}

// Refined project item with hover state tracking
function ProjectItem({
  project,
  isSelected,
  activeTasks,
  onSelect,
}: {
  project: Project | null
  isSelected: boolean
  activeTasks: number
  onSelect: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const isAllProjects = project === null

  return (
    <motion.button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{
        backgroundColor: isSelected
          ? 'rgba(255, 107, 53, 0.08)'
          : isHovered
          ? 'rgba(255, 255, 255, 0.03)'
          : 'transparent',
      }}
      transition={{ duration: 0.15 }}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Selection indicator bar */}
      <motion.div
        initial={false}
        animate={{
          scaleY: isSelected ? 1 : 0,
          opacity: isSelected ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: '3px',
          backgroundColor: 'var(--accent)',
          borderRadius: '0 2px 2px 0',
          boxShadow: '0 0 12px rgba(255, 107, 53, 0.5)',
        }}
      />

      {/* Icon/Avatar */}
      <motion.div
        animate={{
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ duration: 0.2 }}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isAllProjects
            ? 'rgba(255, 255, 255, 0.06)'
            : `${project.color}15`,
          border: `1px solid ${isAllProjects ? 'rgba(255, 255, 255, 0.08)' : `${project.color}25`}`,
          flexShrink: 0,
        }}
      >
        {isAllProjects ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: 'var(--text-secondary)' }}
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ) : (
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: project.color,
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            }}
          >
            {project.name.charAt(0).toUpperCase()}
          </span>
        )}
      </motion.div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'color 0.15s ease',
          }}
        >
          {isAllProjects ? 'All Projects' : project.name}
        </div>
        {!isAllProjects && (
          <div
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              color: 'var(--text-dim)',
              marginTop: '2px',
              letterSpacing: '0.02em',
            }}
          >
            {activeTasks > 0 ? (
              <span style={{ color: 'rgba(255, 107, 53, 0.9)' }}>
                {activeTasks} active
              </span>
            ) : (
              <span style={{ opacity: 0.6 }}>idle</span>
            )}
          </div>
        )}
      </div>

      {/* Activity indicator */}
      {activeTasks > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            minWidth: '20px',
            height: '20px',
            borderRadius: '6px',
            backgroundColor: isAllProjects ? 'var(--accent)' : project?.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            color: '#0a0a0a',
            boxShadow: `0 2px 8px ${isAllProjects ? 'rgba(255, 107, 53, 0.3)' : `${project?.color}40`}`,
          }}
        >
          {activeTasks}
        </motion.div>
      )}
    </motion.button>
  )
}

function ProjectDropdown({
  isOpen,
  onClose,
  onSelectProject,
  onOpenNewProject,
  onOpenAllProjects,
  position,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (projectId: string | null) => void
  onOpenNewProject: () => void
  onOpenAllProjects: () => void
  position: { top: number; left: number }
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const { projects, activeProjectId, getProjectStats, tasks } = useDashboardStore()

  const activeProjects = useMemo(() => {
    return projects.filter(p => p.status !== 'archived')
  }, [projects])

  const archivedProjects = useMemo(() => {
    return projects.filter(p => p.status === 'archived')
  }, [projects])

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return activeProjects
    return activeProjects.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [activeProjects, searchQuery])

  const [showArchived, setShowArchived] = useState(false)

  const totalActiveTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'in_progress').length
  }, [tasks])

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Backdrop with subtle blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />

      {/* Dropdown Container */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: position.top,
          left: position.left,
          width: '300px',
        }}
      >
        {/* Main Card */}
        <div
          style={{
            backgroundColor: 'rgba(18, 18, 20, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            boxShadow: `
              0 0 0 1px rgba(255, 255, 255, 0.03) inset,
              0 20px 50px -12px rgba(0, 0, 0, 0.5),
              0 0 80px -20px rgba(255, 107, 53, 0.15)
            `,
            overflow: 'hidden',
          }}
        >
          {/* Header with search */}
          <div
            style={{
              padding: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {/* Search icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none',
                }}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  color: 'var(--text-main)',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.3)'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'
                }}
              />

              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>

          {/* Project list */}
          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              padding: '6px',
            }}
          >
            {/* New Product - Prominent CTA */}
            <motion.button
              onClick={() => {
                onOpenNewProject()
                onClose()
              }}
              whileHover={{
                backgroundColor: 'rgba(255, 107, 53, 0.12)',
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px',
                borderRadius: '10px',
                border: '1px dashed rgba(255, 107, 53, 0.3)',
                backgroundColor: 'rgba(255, 107, 53, 0.05)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '6px',
              }}
            >
              {/* Plus Icon */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 107, 53, 0.15)',
                  border: '1px solid rgba(255, 107, 53, 0.25)',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ color: 'var(--accent)' }}
                >
                  <path d="M12 5v14m-7-7h14" />
                </svg>
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--accent)',
                  }}
                >
                  New Product
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                    color: 'var(--text-dim)',
                    marginTop: '2px',
                  }}
                >
                  Start a new product idea
                </div>
              </div>

              {/* Arrow */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'var(--text-dim)' }}
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>

            {/* All Projects - Opens Pipeline Panel */}
            <ProjectItem
              project={null}
              isSelected={activeProjectId === null}
              activeTasks={totalActiveTasks}
              onSelect={() => {
                onOpenAllProjects()
                onClose()
              }}
            />

            {/* Separator */}
            {filteredProjects.length > 0 && (
              <div
                style={{
                  height: '1px',
                  margin: '6px 12px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent)',
                }}
              />
            )}

            {/* Active Projects */}
            {filteredProjects.map((project) => {
              const stats = getProjectStats(project.id)
              return (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isSelected={activeProjectId === project.id}
                  activeTasks={stats.activeTasks}
                  onSelect={() => {
                    onSelectProject(project.id)
                    onClose()
                  }}
                />
              )
            })}

            {/* Empty state */}
            {filteredProjects.length === 0 && searchQuery && (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--text-dim)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                }}
              >
                No projects match &quot;{searchQuery}&quot;
              </div>
            )}

            {/* Archived Section */}
            {archivedProjects.length > 0 && (
              <>
                <div
                  style={{
                    height: '1px',
                    margin: '8px 12px',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent)',
                  }}
                />
                <motion.button
                  onClick={() => setShowArchived(!showArchived)}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '8px',
                  }}
                >
                  <motion.svg
                    animate={{ rotate: showArchived ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    <path d="M9 5l7 7-7 7" />
                  </motion.svg>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                      color: 'var(--text-dim)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Archived
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                      color: 'var(--text-dim)',
                      opacity: 0.6,
                    }}
                  >
                    ({archivedProjects.length})
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showArchived && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {archivedProjects.map((project) => (
                        <motion.button
                          key={project.id}
                          onClick={() => {
                            onSelectProject(project.id)
                            onClose()
                          }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 0.5, x: 0 }}
                          whileHover={{ opacity: 0.8 }}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            textAlign: 'left',
                          }}
                        >
                          <div
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '2px',
                              backgroundColor: project.color,
                              opacity: 0.6,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-dim)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {project.name}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Footer - New Project */}
          <div
            style={{
              padding: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(255, 255, 255, 0.01)',
            }}
          >
            <motion.button
              onClick={() => {
                onOpenNewProject()
                onClose()
              }}
              whileHover={{
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderColor: 'rgba(255, 107, 53, 0.25)',
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'var(--accent)' }}
              >
                <path d="M12 5v14m-7-7h14" />
              </svg>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.02em',
                }}
              >
                New Project
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  )
}

export function ProjectContextBar({ onOpenNewProject }: ProjectContextBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const {
    tasks,
    activeProjectId,
    setActiveProject,
    getProjectStats,
    getActiveProject,
    setMainViewMode,
  } = useDashboardStore()

  const handleOpenAllProjects = useCallback(() => {
    setMainViewMode('projects')
  }, [setMainViewMode])

  const activeProject = getActiveProject()

  const displayStats = useMemo(() => {
    if (!activeProjectId) {
      const activeTasks = tasks.filter(t => t.status === 'in_progress').length
      const activeAgents = [...new Set(
        tasks.filter(t => t.assignedTo && t.status === 'in_progress').map(t => t.assignedTo!)
      )]
      return { activeTasks, activeAgents: activeAgents.length }
    }
    const stats = getProjectStats(activeProjectId)
    return { activeTasks: stats.activeTasks, activeAgents: stats.activeAgents.length }
  }, [activeProjectId, tasks, getProjectStats])

  const handleOpenDropdown = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 10,
        left: rect.left,
      })
    }
    setIsDropdownOpen(true)
  }, [])

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '40px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Project Selector Button */}
        <motion.button
          ref={buttonRef}
          onClick={handleOpenDropdown}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px 10px 12px',
            backgroundColor: 'rgba(18, 18, 20, 0.8)',
            backdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            cursor: 'pointer',
            boxShadow: `
              0 0 0 1px rgba(255, 255, 255, 0.02) inset,
              0 4px 24px -4px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          {/* Project Icon */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activeProject
                ? `${activeProject.color}15`
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${activeProject ? `${activeProject.color}25` : 'rgba(255, 255, 255, 0.06)'}`,
            }}
          >
            {activeProject ? (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: activeProject.color,
                  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                }}
              >
                {activeProject.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: 'var(--text-secondary)' }}
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </div>

          {/* Text */}
          <div style={{ textAlign: 'left', minWidth: '100px' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-main)',
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeProject?.name || 'All Projects'}
              </span>
            </div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                color: 'var(--text-dim)',
                marginTop: '2px',
                letterSpacing: '0.03em',
              }}
            >
              {displayStats.activeTasks > 0 ? (
                <span style={{ color: 'rgba(255, 107, 53, 0.8)' }}>
                  {displayStats.activeTasks} active
                </span>
              ) : (
                'idle'
              )}
              {displayStats.activeAgents > 0 && (
                <span style={{ opacity: 0.5 }}> · {displayStats.activeAgents} agent{displayStats.activeAgents !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* Chevron */}
          <motion.svg
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: 'var(--text-dim)', marginLeft: '4px' }}
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </motion.button>
      </div>

      {/* Dropdown Portal */}
      <AnimatePresence>
        {isDropdownOpen && (
          <ProjectDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onSelectProject={setActiveProject}
            onOpenNewProject={onOpenNewProject}
            onOpenAllProjects={handleOpenAllProjects}
            position={dropdownPosition}
          />
        )}
      </AnimatePresence>
    </>
  )
}
