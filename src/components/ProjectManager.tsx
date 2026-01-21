'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { generateId } from '@/lib/utils'
import type { Project } from '@/lib/types'

const PROJECT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
]

function ProjectCard({ project, onSelect, isSelected }: {
  project: Project
  onSelect: () => void
  isSelected: boolean
}) {
  const { tasks } = useDashboardStore()
  const taskCount = tasks.filter(t => t.projectId === project.id).length

  return (
    <motion.button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected 
          ? 'bg-white/10 border-accent' 
          : 'bg-white/5 border-white/10 hover:bg-white/8'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: project.color }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm text-white font-medium truncate">
            {project.name}
          </h4>
          {project.description && (
            <p className="text-xs text-white/50 truncate">
              {project.description}
            </p>
          )}
        </div>
        <span className="text-xs text-white/40">
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </span>
      </div>
    </motion.button>
  )
}

export function ProjectManager({ onSelectProject, selectedProjectId }: {
  onSelectProject: (projectId: string | null) => void
  selectedProjectId: string | null
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0])
  
  const { projects, addProject } = useDashboardStore()
  const { saveProject, isConfigured } = useSupabase()

  const handleCreate = async () => {
    if (!newName.trim()) return

    const project: Project = {
      id: generateId(),
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      status: 'active',
      color: newColor,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    addProject(project)

    if (isConfigured) {
      await saveProject(project)
    }

    // Reset form
    setNewName('')
    setNewDescription('')
    setNewColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)])
    setIsCreating(false)
    
    // Select the new project
    onSelectProject(project.id)
  }

  return (
    <div className="space-y-3">
      {/* Project List */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {/* No Project Option */}
        <motion.button
          onClick={() => onSelectProject(null)}
          className={`w-full text-left p-2 rounded-lg border transition-all ${
            selectedProjectId === null
              ? 'bg-white/10 border-accent'
              : 'bg-white/5 border-white/10 hover:bg-white/8'
          }`}
        >
          <span className="text-xs text-white/60">No Project</span>
        </motion.button>

        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onSelect={() => onSelectProject(project.id)}
            isSelected={selectedProjectId === project.id}
          />
        ))}
      </div>

      {/* Create New Project */}
      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-white/10 rounded-lg p-3 space-y-3"
          >
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Project name"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              autoFocus
            />

            <input
              type="text"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />

            {/* Color Picker */}
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Project color">
              {PROJECT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-accent ${
                    newColor === color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select ${color} color`}
                  aria-pressed={newColor === color}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 px-3 py-1.5 bg-accent/20 text-accent text-xs rounded hover:bg-accent/30 disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-white/60 text-xs rounded hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreating(true)}
            className="w-full px-3 py-2 border border-dashed border-white/20 rounded-lg text-xs text-white/40 hover:text-white/60 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          >
            + New Project
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// Simple dropdown version for ChatInput - uses portal for proper layering
export function ProjectPicker({
  selectedProjectId,
  onSelect
}: {
  selectedProjectId: string | null
  onSelect: (projectId: string | null) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { projects, setMainViewMode, pipelineProjects, refreshPipeline } = useDashboardStore()
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // Refresh pipeline data when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refreshPipeline()
    }
  }, [isOpen, refreshPipeline])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.top - 8, // Position above button
        left: rect.left,
      })
    }
  }, [isOpen])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [isOpen])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          fontSize: '11px',
          color: 'var(--text-dim)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--glass-border-hover)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--glass-border)'
          e.currentTarget.style.color = 'var(--text-dim)'
        }}
      >
        {selectedProject ? (
          <>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: selectedProject.color,
              }}
            />
            <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedProject.name}
            </span>
          </>
        ) : (
          <span>Project</span>
        )}
        <span style={{ fontSize: '8px', opacity: 0.5 }}>▼</span>
      </button>

      {mounted && isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
            }}
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div
            style={{
              position: 'fixed',
              zIndex: 9999,
              top: position.top,
              left: position.left,
              transform: 'translateY(-100%)',
              width: '180px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '6px' }}>
              {/* All Projects Option - Opens Full-Screen Projects Page */}
              <button
                onClick={() => { setMainViewMode('projects'); setIsOpen(false) }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.15s ease',
                  backgroundColor: 'transparent',
                  color: 'var(--accent)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-muted)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>{pipelineProjects.length > 0 ? `All Projects (${pipelineProjects.length})` : 'View Pipeline'}</span>
              </button>
              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />

              <button
                onClick={() => { onSelect(null); setIsOpen(false) }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  backgroundColor: !selectedProjectId ? 'rgba(255, 107, 53, 0.15)' : 'transparent',
                  color: !selectedProjectId ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedProjectId) e.currentTarget.style.backgroundColor = 'var(--glass)'
                }}
                onMouseLeave={(e) => {
                  if (selectedProjectId) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                No Project
              </button>

              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => { onSelect(project.id); setIsOpen(false) }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s ease',
                    backgroundColor: selectedProjectId === project.id ? 'rgba(255, 107, 53, 0.15)' : 'transparent',
                    color: selectedProjectId === project.id ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProjectId !== project.id) e.currentTarget.style.backgroundColor = 'var(--glass)'
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProjectId !== project.id) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: project.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
