'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDashboardStore } from '@/lib/store'
import { AgentAvatar } from './AgentAvatar'

interface ConfigModalProps {
  agentId: string
  agentName: string
  isOpen: boolean
  onClose: () => void
}

function ConfigModal({ agentId, agentName, isOpen, onClose }: ConfigModalProps) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setError(null)
      fetch(`/api/agent-config?id=${agentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setContent(data.content || '')
          }
        })
        .catch(() => setError('Failed to load config'))
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, agentId])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/agent-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId, content }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        onClose()
      }
    } catch {
      setError('Failed to save config')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Full Page Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-[90vw] h-[90vh] bg-[var(--bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] bg-[var(--bg-elevated)]/50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <h2 className="text-xl font-bold text-accent">{agentName}</h2>
            <span className="text-[var(--text-dim)] text-sm font-mono">config.md</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--glass)] hover:bg-[var(--glass-border)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[var(--text-dim)] text-lg font-mono">Loading configuration...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[var(--error)] text-lg">{error}</div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full bg-[var(--bg-elevated)]/50 border border-[var(--glass-border)] rounded-xl p-6 text-base text-[var(--text-main)] font-mono resize-none focus:outline-none focus:border-accent/50 leading-relaxed"
              spellCheck={false}
              placeholder="# Agent Configuration..."
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--glass-border)] bg-[var(--bg-elevated)]/50">
          <div className="text-xs text-[var(--text-dim)] font-mono">
            {content.split('\n').length} lines
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors rounded-lg hover:bg-[var(--glass)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading || !!error}
              className="px-5 py-2.5 text-sm bg-accent/15 text-accent border border-accent/30 rounded-lg hover:bg-accent/25 hover:border-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export function AgentDetailPanel() {
  const { agents, selectedAgentId, setSelectedAgent, tasks, taskHistory } =
    useDashboardStore()
  const [configModalOpen, setConfigModalOpen] = useState(false)

  const selectedAgent = agents.find(a => a.id === selectedAgentId)
  const reportsToAgent = selectedAgent?.reportsTo
    ? agents.find(a => a.id === selectedAgent.reportsTo)
    : null
  const directReports = selectedAgent?.directReports
    .map(id => agents.find(a => a.id === id))
    .filter(Boolean) || []

  const agentTasks = tasks.filter(t => t.assignedTo === selectedAgentId)
  const completedTasks = taskHistory.filter(t => t.assignedTo === selectedAgentId)

  return (
    <>
    <AnimatePresence>
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="liquid-card w-80 !bg-[var(--bg-elevated)]/95 !backdrop-blur-xl !p-6"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedAgent(null)}
            className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-transparent rounded"
            aria-label="Close agent detail panel"
          >
            ✕
          </button>

          {/* Agent Avatar - with cursor tracking for lifelike interaction */}
          <div className="flex justify-center mb-4">
            <AgentAvatar agent={selectedAgent} size="lg" showLabel={false} trackCursor />
          </div>

          {/* Name & Role */}
          <h3
            className="text-lg font-bold text-center mb-1"
            style={{ color: selectedAgent.color }}
          >
            {selectedAgent.displayName}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] text-center font-mono uppercase mb-4">
            {selectedAgent.tier}
          </p>

          {/* Specialty */}
          <div className="mb-4">
            <h4 className="text-xs text-[var(--text-dim)] uppercase mb-1">Specialty</h4>
            <p className="text-sm text-[var(--text-secondary)]">{selectedAgent.specialty}</p>
          </div>

          {/* Status */}
          <div className="mb-4">
            <h4 className="text-xs text-[var(--text-dim)] uppercase mb-1">Status</h4>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  selectedAgent.status === 'working'
                    ? 'bg-accent animate-pulse'
                    : selectedAgent.status === 'thinking'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-gray-500'
                }`}
              />
              <span className="text-sm text-[var(--text-secondary)] capitalize">
                {selectedAgent.status}
              </span>
            </div>
          </div>

          {/* Reports To */}
          {reportsToAgent && (
            <div className="mb-4">
              <h4 className="text-xs text-[var(--text-dim)] uppercase mb-1">Reports To</h4>
              <button
                onClick={() => setSelectedAgent(reportsToAgent.id)}
                className="flex items-center gap-2 hover:bg-[var(--glass)] rounded-lg p-1 -m-1 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: reportsToAgent.color }}
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  {reportsToAgent.displayName}
                </span>
              </button>
            </div>
          )}

          {/* Direct Reports */}
          {directReports.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs text-[var(--text-dim)] uppercase mb-1">
                Direct Reports ({directReports.length})
              </h4>
              <div className="space-y-1">
                {directReports.map(agent => agent && (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className="flex items-center gap-2 hover:bg-[var(--glass)] rounded-lg p-1 -m-1 transition-colors w-full text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: agent.color }}
                    />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {agent.displayName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          <div className="mb-4">
            <h4 className="text-xs text-[var(--text-dim)] uppercase mb-2">Tools</h4>
            <div className="flex flex-wrap gap-1">
              {selectedAgent.tools.map(tool => (
                <span
                  key={tool}
                  className="text-xs px-2 py-1 rounded-full bg-[var(--glass)] text-[var(--text-secondary)] font-mono"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Open Config Button */}
          <div className="mb-4">
            <button
              onClick={() => setConfigModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--glass)]/50 hover:bg-[var(--glass)] border border-[var(--glass-border)] hover:border-accent/30 transition-all text-sm text-[var(--text-secondary)] hover:text-white"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Open Agent Config
            </button>
          </div>

          {/* Task Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--glass-border)]">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {agentTasks.length}
              </div>
              <div className="text-xs text-[var(--text-dim)]">Active Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {completedTasks.length}
              </div>
              <div className="text-xs text-[var(--text-dim)]">Completed</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Config Modal - rendered outside AnimatePresence for full-page display */}
    {selectedAgent && (
      <ConfigModal
        agentId={selectedAgent.id}
        agentName={selectedAgent.displayName}
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    )}
    </>
  )
}
