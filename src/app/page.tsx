'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { createPortal } from 'react-dom'
import { AgentNetwork } from '@/components/AgentNetwork'
import { ChatPanel } from '@/components/ChatPanel'
import { ChatInput } from '@/components/ChatInput'
import { NotificationBar } from '@/components/NotificationBar'
import { AgentDetailPanel } from '@/components/AgentDetailPanel'
import { AgentTasksDrawer } from '@/components/AgentTasksDrawer'
import { AgentHealthDashboard } from '@/components/AgentHealthDashboard'
import { SettingsPage } from '@/components/SettingsPage'
import { SkillsStore } from '@/components/SkillsStore'
import { ProjectDetailView } from '@/components/pipeline/ProjectDetailView'
import { ProjectsPage } from '@/components/ProjectsPage'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useDashboardStore } from '@/lib/store'
import { ExpandableTabs } from '@/components/ui/expandable-tabs'
import { Network, LayoutGrid, Activity, Sparkles, Settings, ClipboardList, Home } from 'lucide-react'
import type { PipelineProject } from '@/lib/types'
import { getStageShortName, getStageColor } from '@/lib/types'

// Get color based on project priority
function getProjectColor(priority: PipelineProject['priority']): string {
  switch (priority) {
    case 'Critical': return '#FF6B6B'
    case 'High': return '#FF9F43'
    case 'Medium': return '#54A0FF'
    case 'Low': return '#5CD85C'
    default: return '#A0A0A0'
  }
}

// Convert project title to URL slug
function toSlug(title: string): string {
  const firstWord = title.split(/[\s\-:,]+/)[0]
  return firstWord.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

// Get project slug - uses explicit slug field or generates from title
function getProjectSlug(project: PipelineProject): string {
  if (project.slug) return project.slug
  return toSlug(project.title)
}

// Agent view mode type
type AgentViewMode = 'full' | 'department' | 'all_projects' | 'tasks'

// Dashboard props interface
interface DashboardProps {
  initialPage?: 'home' | 'dashboard' | 'agents' | 'tasks' | 'health' | 'skills' | 'settings'
  initialAgentView?: AgentViewMode
  projectSlug?: string
}

// Compact project item for sidebar dropdown
function SidebarProjectItem({
  project,
  isSelected,
  onSelect,
}: {
  project: PipelineProject | null
  isSelected: boolean
  onSelect: () => void
}) {
  const isAllProjects = project === null
  const color = project ? getProjectColor(project.priority) : null

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
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
        backgroundColor: isSelected ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent',
        position: 'relative',
        marginBottom: '2px',
      }}
    >
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: '3px',
            backgroundColor: 'var(--accent)',
            borderRadius: '0 3px 3px 0',
          }}
        />
      )}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isAllProjects ? 'rgba(255, 255, 255, 0.06)' : `${color}15`,
          border: `1px solid ${isAllProjects ? 'rgba(255, 255, 255, 0.08)' : `${color}25`}`,
          flexShrink: 0,
        }}
      >
        {isAllProjects ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-secondary)' }}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ) : (
          <span style={{ fontSize: '12px', fontWeight: 600, color: color!, fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}>
            {project.title.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: '13px',
          fontWeight: isSelected ? 500 : 400,
          color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
        }}
      >
        {isAllProjects ? 'All Projects' : project.title}
      </span>
      {isSelected && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </motion.button>
  )
}

// Sidebar project dropdown portal
function SidebarProjectDropdown({
  isOpen,
  onClose,
  onSelectProject,
  onOpenNewProject,
  position,
  selectedProjectId,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (projectId: string | null) => void
  onOpenNewProject: () => void
  position: { top: number; left: number; width: number }
  selectedProjectId: string | null
}) {
  const { pipelineProjects } = useDashboardStore()

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: position.top,
          left: position.left,
          width: position.width,
          backgroundColor: 'rgba(18, 18, 20, 0.95)',
          backdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          boxShadow: '0 12px 40px -8px rgba(0, 0, 0, 0.5)',
          maxHeight: '380px',
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {/* New Product CTA */}
        <motion.button
          onClick={() => { onOpenNewProject(); onClose() }}
          whileHover={{ backgroundColor: 'rgba(255, 107, 53, 0.12)' }}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px dashed rgba(255, 107, 53, 0.3)',
            backgroundColor: 'rgba(255, 107, 53, 0.06)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 107, 53, 0.15)',
              border: '1px solid rgba(255, 107, 53, 0.25)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent)' }}>
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)' }}>New Product</span>
        </motion.button>

        {/* Section label */}
        <div style={{ padding: '8px 12px 6px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Projects
        </div>

        <SidebarProjectItem
          project={null}
          isSelected={selectedProjectId === null}
          onSelect={() => { onSelectProject(null); onClose() }}
        />
        {pipelineProjects.length > 0 && (
          <div style={{ height: '1px', margin: '6px 12px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent)' }} />
        )}
        {pipelineProjects.map((project) => (
          <SidebarProjectItem
            key={project.id}
            project={project}
            isSelected={selectedProjectId === project.id}
            onSelect={() => { onSelectProject(project.id); onClose() }}
          />
        ))}
      </motion.div>
    </>,
    document.body
  )
}

// Helper to convert hex to RGB for glow effects
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
  }
  return '0, 255, 240'
}

export default function Dashboard({ initialPage, initialAgentView, projectSlug }: DashboardProps = {}) {
  const { isConfigured } = useSupabase()
  const currentPage = useDashboardStore((state) => state.currentPage)
  const accentColor = useDashboardStore((state) => state.settings.accentColor)
  const settings = useDashboardStore((state) => state.settings)
  const mainViewMode = useDashboardStore((state) => state.mainViewMode)
  const setMainViewMode = useDashboardStore((state) => state.setMainViewMode)
  const setCurrentPage = useDashboardStore((state) => state.setCurrentPage)
  const setSelectedPipelineProject = useDashboardStore((state) => state.setSelectedPipelineProject)
  const refreshPipeline = useDashboardStore((state) => state.refreshPipeline)
  const pipelineProjects = useDashboardStore((state) => state.pipelineProjects)
  const selectedPipelineProjectId = useDashboardStore((state) => state.selectedPipelineProjectId)

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const projectSelectorRef = useRef<HTMLButtonElement>(null)

  // Track previous route props to detect actual Next.js route changes vs internal navigation
  const prevRouteRef = useRef<{ projectSlug?: string; initialPage?: string }>({})
  const hasInitializedRef = useRef(false)

  // Selected project - computed from store state
  const selectedProject = useMemo(() => {
    if (!selectedPipelineProjectId) return null
    return pipelineProjects.find(p => p.id === selectedPipelineProjectId) || null
  }, [pipelineProjects, selectedPipelineProjectId])

  // Get current project slug for URL building
  const currentProjectSlug = useMemo(() => {
    if (projectSlug) return projectSlug
    if (selectedProject) return getProjectSlug(selectedProject)
    return null
  }, [projectSlug, selectedProject])

  // Load pipeline data on mount
  useEffect(() => {
    refreshPipeline()
  }, [refreshPipeline])

  // Effect: Handle route-based navigation (only when Next.js route actually changes)
  useEffect(() => {
    const prevSlug = prevRouteRef.current.projectSlug
    const prevPage = prevRouteRef.current.initialPage
    const isInitialMount = !hasInitializedRef.current
    const routeChanged = prevSlug !== projectSlug || prevPage !== initialPage

    prevRouteRef.current = { projectSlug, initialPage }

    if (!isInitialMount && !routeChanged) {
      return // Internal navigation - don't override store state
    }

    hasInitializedRef.current = true

    // Find project for this slug
    const projectForSlug = projectSlug && projectSlug !== 'all' && pipelineProjects.length > 0
      ? pipelineProjects.find(p => getProjectSlug(p) === projectSlug)
      : null

    // Set selected project based on slug
    if (projectForSlug) {
      setSelectedPipelineProject(projectForSlug.id)
    } else if (projectSlug === 'all' || !projectSlug) {
      setSelectedPipelineProject(null)
    }

    // Set page and view mode based on initialPage
    if (initialPage) {
      switch (initialPage) {
        case 'home':
          setCurrentPage('dashboard')
          setMainViewMode('projects')
          break
        case 'dashboard':
          setCurrentPage('dashboard')
          setMainViewMode(projectForSlug ? 'project' : 'projects')
          break
        case 'agents':
          setCurrentPage('dashboard')
          setMainViewMode('agents')
          break
        case 'tasks':
          setCurrentPage('tasks')
          break
        case 'health':
          setCurrentPage('agent-health')
          break
        case 'skills':
          setCurrentPage('skills-store')
          break
        case 'settings':
          setCurrentPage('settings')
          break
      }
    } else {
      setCurrentPage('dashboard')
      setMainViewMode('projects')
    }
  }, [initialPage, projectSlug, pipelineProjects, setCurrentPage, setMainViewMode, setSelectedPipelineProject])

  // Effect: When projects load after initial mount, complete the route setup
  useEffect(() => {
    if (pipelineProjects.length === 0) return
    if (!hasInitializedRef.current) return

    const projectForSlug = projectSlug && projectSlug !== 'all'
      ? pipelineProjects.find(p => getProjectSlug(p) === projectSlug)
      : null

    if (projectForSlug && selectedPipelineProjectId !== projectForSlug.id) {
      const currentUrlSlug = window.location.pathname.split('/')[1]
      if (currentUrlSlug === projectSlug) {
        setSelectedPipelineProject(projectForSlug.id)
        if (initialPage === 'dashboard') {
          setMainViewMode('project')
        }
      }
    }
  }, [pipelineProjects, projectSlug, initialPage, selectedPipelineProjectId, setSelectedPipelineProject, setMainViewMode])

  // Apply accent color to CSS custom properties
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent', accentColor)
    root.style.setProperty('--accent-rgb', hexToRgb(accentColor))
    root.style.setProperty('--accent-glow', `${accentColor}40`)
    root.style.setProperty('--accent-muted', `${accentColor}15`)
  }, [accentColor])

  const handleSelectProject = (projectId: string) => {
    setSelectedPipelineProject(projectId)
    setMainViewMode('project')
    const project = pipelineProjects.find(p => p.id === projectId)
    if (project) {
      const slug = getProjectSlug(project)
      window.history.replaceState(null, '', `/${slug}/dashboard`)
    }
  }

  const handleBackToAgents = () => {
    setSelectedPipelineProject(null)
    setMainViewMode('agents')
  }

  const handleBackToProjects = () => {
    setSelectedPipelineProject(null)
    setMainViewMode('projects')
  }

  const handleOpenProjectDropdown = useCallback(() => {
    if (projectSelectorRef.current) {
      const rect = projectSelectorRef.current.getBoundingClientRect()
      setDropdownPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width })
    }
    setIsProjectDropdownOpen(true)
  }, [])

  const triggerSearch = useCallback(() => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    window.dispatchEvent(event)
  }, [])

  // Get project background settings
  const projectBackgroundPreset = selectedProject?.backgroundPreset
  const projectBackgroundColor = selectedProject?.backgroundColor

  // Check if a custom background is active (preset or solid color)
  const hasCustomBackground = (projectBackgroundPreset && projectBackgroundPreset !== 'none') || projectBackgroundColor

  // Build background class and style
  const bgPresetClass = projectBackgroundPreset && projectBackgroundPreset !== 'none'
    ? `bg-preset bg-${projectBackgroundPreset}`
    : ''

  return (
    <main
      className="h-screen w-screen flex relative"
      style={{
        backgroundColor: projectBackgroundColor && (!projectBackgroundPreset || projectBackgroundPreset === 'none')
          ? projectBackgroundColor
          : 'var(--bg)',
      }}
    >
      {/* Project Background Preset Layer */}
      {projectBackgroundPreset && projectBackgroundPreset !== 'none' && (
        <div className={`absolute inset-0 ${bgPresetClass} z-0`} />
      )}

      <div className="flex w-full h-full relative z-10" style={{ padding: '16px', gap: '16px' }}>
        {/* Floating Decorative Elements */}
        <div className="fixed top-20 right-[25%] w-80 h-80 rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />
        <div className="fixed bottom-32 left-[15%] w-96 h-96 rounded-full bg-accent-tertiary/[0.02] blur-[120px] pointer-events-none" />
        <div className="fixed top-1/2 right-[10%] w-64 h-64 rounded-full bg-accent-secondary/[0.02] blur-[80px] pointer-events-none" />

        {/* Left Sidebar */}
        <aside className="w-full max-w-[380px] lg:w-[380px] h-full flex flex-col gap-4 px-5 py-5 z-20 flex-shrink-0">
          {/* Brand Header */}
          <header
            className={`reveal-1 flex-shrink-0 ${hasCustomBackground ? '' : 'liquid-card'}`}
            style={hasCustomBackground ? {
              background: 'rgba(10, 8, 6, 0.6)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.5)',
            } : undefined}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="heading-md text-accent truncate">
                  {settings.appName}
                </h1>
                <p className="text-caption text-mono mt-1">
                  {settings.appTagline || 'Your AI Agent Team'}
                </p>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'}`}
                  style={{ boxShadow: isConfigured ? '0 0 8px var(--success)' : '0 0 8px var(--warning)' }}
                />
                <span className="badge badge-success text-[10px]">
                  {isConfigured ? 'Synced' : 'Local'}
                </span>
              </div>
            </div>

          </header>

          {/* Project Selector */}
          <div
            className="rounded-xl flex-shrink-0"
            style={{
              background: hasCustomBackground
                ? 'rgba(10, 8, 6, 0.6)'
                : 'linear-gradient(180deg, rgba(28, 28, 32, 0.95) 0%, rgba(20, 20, 24, 0.98) 100%)',
              backdropFilter: hasCustomBackground ? 'blur(40px) saturate(180%)' : undefined,
              WebkitBackdropFilter: hasCustomBackground ? 'blur(40px) saturate(180%)' : undefined,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              overflow: 'hidden',
            }}
          >
            <button
              ref={projectSelectorRef}
              onClick={handleOpenProjectDropdown}
              className="w-full text-left hover:bg-white/[0.02] transition-all duration-200 group pl-4 py-4"
              style={{ paddingRight: '24px' }}
            >
                {selectedProject ? (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${getProjectColor(selectedProject.priority)}18`,
                        border: `1px solid ${getProjectColor(selectedProject.priority)}30`,
                      }}
                    >
                      <span style={{ fontSize: '18px', fontWeight: 700, color: getProjectColor(selectedProject.priority) }}>
                        {selectedProject.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-[13px] font-semibold text-[var(--text-main)] truncate">
                          {selectedProject.title.split(' - ')[0]}
                        </h2>
                        <motion.svg animate={{ rotate: isProjectDropdownOpen ? 180 : 0 }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--text-muted)] flex-shrink-0">
                          <path d="M6 9l6 6 6-6" />
                        </motion.svg>
                      </div>
                      {(selectedProject.subtitle || selectedProject.title.includes(' - ')) && (
                        <p className="text-[11px] text-[var(--text-dim)] truncate">
                          {selectedProject.subtitle || selectedProject.title.split(' - ').slice(1).join(' - ')}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md flex-shrink-0"
                      style={{
                        background: `${getStageColor(selectedProject.stageIndex)}15`,
                        border: `1px solid ${getStageColor(selectedProject.stageIndex)}30`,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: getStageColor(selectedProject.stageIndex),
                          boxShadow: `0 0 4px ${getStageColor(selectedProject.stageIndex)}`,
                        }}
                      />
                      <span className="text-[10px] font-semibold" style={{ color: getStageColor(selectedProject.stageIndex) }}>
                        {getStageShortName(selectedProject.stage)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--text-dim)]">
                        <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-semibold text-[var(--text-main)]">All Projects</h2>
                        <motion.svg animate={{ rotate: isProjectDropdownOpen ? 180 : 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--text-muted)]">
                          <path d="M6 9l6 6 6-6" />
                        </motion.svg>
                      </div>
                      <p className="text-[12px] text-[var(--text-dim)] mt-0.5">Product Pipeline</p>
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {pipelineProjects.length}
                    </span>
                  </div>
                )}
            </button>
          </div>

          <AnimatePresence>
            {isProjectDropdownOpen && (
              <SidebarProjectDropdown
                isOpen={isProjectDropdownOpen}
                onClose={() => setIsProjectDropdownOpen(false)}
                onSelectProject={(projectId) => {
                  setSelectedPipelineProject(projectId)
                  if (projectId) {
                    const project = pipelineProjects.find(p => p.id === projectId)
                    if (project) {
                      const slug = getProjectSlug(project)
                      setCurrentPage('dashboard')
                      setMainViewMode('project')
                      window.history.replaceState(null, '', `/${slug}/dashboard`)
                    }
                  } else {
                    setCurrentPage('dashboard')
                    setMainViewMode('projects')
                    window.history.replaceState(null, '', '/all/home')
                  }
                }}
                onOpenNewProject={() => useDashboardStore.getState().setShowNewProjectWizard(true)}
                position={dropdownPosition}
                selectedProjectId={selectedPipelineProjectId}
              />
            )}
          </AnimatePresence>

          {/* Primary Navigation (Project-specific) */}
          {(() => {
            const primaryNavTabs = [
              { title: 'Home', icon: Home, id: 'home' },
              ...(selectedPipelineProjectId ? [{ title: 'Dashboard', icon: LayoutGrid, id: 'dashboard' }] : []),
              { title: 'Agents', icon: Network, id: 'agents' },
              { title: 'Tasks', icon: ClipboardList, id: 'tasks' },
            ]

            // Compute active index for primary nav
            const getPrimaryActiveIndex = () => {
              if (currentPage === 'dashboard' && mainViewMode === 'projects') {
                return primaryNavTabs.findIndex(t => t.id === 'home')
              }
              if (currentPage === 'dashboard' && mainViewMode === 'project') {
                return primaryNavTabs.findIndex(t => t.id === 'dashboard')
              }
              if (currentPage === 'dashboard' && mainViewMode === 'agents') {
                return primaryNavTabs.findIndex(t => t.id === 'agents')
              }
              if (currentPage === 'tasks') {
                return primaryNavTabs.findIndex(t => t.id === 'tasks')
              }
              return null
            }

            return (
              <ExpandableTabs
                tabs={primaryNavTabs}
                activeColor="text-[var(--accent)]"
                activeIndex={getPrimaryActiveIndex()}
                className="flex-shrink-0 mt-3"
                onChange={(index) => {
                  if (index === null) return
                  const slug = currentProjectSlug || 'all'
                  const clickedTab = primaryNavTabs[index]
                  if (!clickedTab) return

                  const tabId = clickedTab.id
                  switch (tabId) {
                    case 'home':
                      setCurrentPage('dashboard')
                      setMainViewMode('projects')
                      window.history.replaceState(null, '', `/${slug}/home`)
                      break
                    case 'dashboard':
                      setCurrentPage('dashboard')
                      setMainViewMode('project')
                      window.history.replaceState(null, '', `/${slug}/dashboard`)
                      break
                    case 'agents':
                      setCurrentPage('dashboard')
                      setMainViewMode('agents')
                      window.history.replaceState(null, '', `/${slug}/agents/network`)
                      break
                    case 'tasks':
                      setCurrentPage('tasks')
                      window.history.replaceState(null, '', `/${slug}/tasks`)
                      break
                  }
                }}
              />
            )
          })()}

          {/* Chat Container - Panel + Input unified */}
          <div className="flex-1 min-h-0 flex flex-col reveal-2 relative">
            {/* Chat Panel */}
            <div className="flex-1 min-h-0">
              <ChatPanel />
            </div>
            {/* Chat Input - directly attached */}
            <div className="mt-0">
              <ChatInput />
            </div>
            {/* Agent Detail Panel - extends to the right of chat */}
            <AgentDetailPanel />
            <AgentTasksDrawer />
          </div>

          {/* Global Navigation (System-wide) */}
          {(() => {
            const globalNavTabs = [
              { title: 'Health', icon: Activity, id: 'health' },
              { title: 'Skills', icon: Sparkles, id: 'skills' },
              { title: 'Settings', icon: Settings, id: 'settings' },
            ]

            // Compute active index for global nav
            const getGlobalActiveIndex = () => {
              if (currentPage === 'agent-health') {
                return globalNavTabs.findIndex(t => t.id === 'health')
              }
              if (currentPage === 'skills-store') {
                return globalNavTabs.findIndex(t => t.id === 'skills')
              }
              if (currentPage === 'settings') {
                return globalNavTabs.findIndex(t => t.id === 'settings')
              }
              return null
            }

            return (
              <ExpandableTabs
                tabs={globalNavTabs}
                activeColor="text-[var(--accent)]"
                activeIndex={getGlobalActiveIndex()}
                className="flex-shrink-0"
                onChange={(index) => {
                  if (index === null) return
                  const slug = currentProjectSlug || 'all'
                  const clickedTab = globalNavTabs[index]
                  if (!clickedTab) return

                  const tabId = clickedTab.id
                  switch (tabId) {
                    case 'health':
                      setCurrentPage('agent-health')
                      window.history.replaceState(null, '', `/${slug}/health`)
                      break
                    case 'skills':
                      setCurrentPage('skills-store')
                      window.history.replaceState(null, '', `/${slug}/skills`)
                      break
                    case 'settings':
                      setCurrentPage('settings')
                      window.history.replaceState(null, '', `/${slug}/settings`)
                      break
                  }
                }}
              />
            )
          })()}
        </aside>

        {/* Notification Bar */}
        <NotificationBar />

        {/* Main Content Area */}
        <section className="flex-1 relative">
          {currentPage === 'dashboard' && mainViewMode === 'agents' && (
            <AgentNetwork initialView={initialAgentView} projectSlug={currentProjectSlug || 'all'} />
          )}
          {currentPage === 'dashboard' && mainViewMode === 'projects' && (
            <ProjectsPage onBack={handleBackToAgents} onSelectProject={handleSelectProject} />
          )}
          {currentPage === 'dashboard' && mainViewMode === 'project' && selectedProject && (
            <ProjectDetailView
              project={selectedProject}
              onBack={handleBackToProjects}
              onUpdate={useDashboardStore.getState().updatePipelineProject}
            />
          )}
          {currentPage === 'dashboard' && mainViewMode === 'project' && !selectedProject && (
            <ProjectsPage onBack={handleBackToAgents} onSelectProject={handleSelectProject} />
          )}
          {currentPage === 'agent-health' && <AgentHealthDashboard />}
          {currentPage === 'skills-store' && <SkillsStore />}
          {currentPage === 'tasks' && (
            <AgentNetwork initialView="tasks" projectSlug={currentProjectSlug || 'all'} />
          )}
          {currentPage === 'settings' && <SettingsPage />}
        </section>
      </div>
    </main>
  )
}
