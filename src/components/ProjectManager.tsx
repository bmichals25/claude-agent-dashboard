'use client'

import { useState } from 'react'
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

// Simple dropdown version for ChatInput
export function ProjectPicker({ 
  selectedProjectId, 
  onSelect 
}: { 
  selectedProjectId: string | null
  onSelect: (projectId: string | null) => void 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { projects } = useDashboardStore()
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedProject ? (
          <>
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedProject.color }}
            />
            <span className="max-w-[100px] truncate">{selectedProject.name}</span>
          </>
        ) : (
          <span>No Project</span>
        )}
        <span className="text-white/30">▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-0 mb-2 w-48 bg-bg/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="p-2 space-y-1">
              <button
                onClick={() => { onSelect(null); setIsOpen(false) }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  !selectedProjectId ? 'bg-accent/20 text-accent' : 'text-white/60 hover:bg-white/5'
                }`}
              >
                No Project
              </button>
              
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => { onSelect(project.id); setIsOpen(false) }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                    selectedProjectId === project.id 
                      ? 'bg-accent/20 text-accent' 
                      : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
