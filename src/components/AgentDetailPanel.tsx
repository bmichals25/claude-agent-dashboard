'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDashboardStore } from '@/lib/store'
import { useSoundEffects } from '@/hooks/useSoundEffects'
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      {/* Full Page Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-[85vw] h-[85vh] flex flex-col overflow-hidden"
        style={{
          borderRadius: '24px',
          background: 'linear-gradient(180deg, rgba(18, 18, 22, 0.98) 0%, rgba(12, 12, 14, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: 'var(--accent)', boxShadow: '0 0 12px rgba(255, 107, 53, 0.4)' }}
            />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent)' }}>{agentName}</h2>
            <span style={{ fontSize: '12px', fontFamily: '"JetBrains Mono", ui-monospace, monospace', color: 'var(--text-dim)' }}>
              config.md
            </span>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.08)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dim)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '32px',
                  height: '32px',
                  border: '2px solid rgba(255, 255, 255, 0.05)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                }}
              />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div style={{ color: 'var(--error)', fontSize: '14px' }}>{error}</div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full resize-none focus:outline-none"
              style={{
                padding: '24px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '14px',
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                color: 'var(--text-main)',
                lineHeight: 1.7,
              }}
              spellCheck={false}
              placeholder="# Agent Configuration..."
            />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ fontSize: '11px', fontFamily: '"JetBrains Mono", ui-monospace, monospace', color: 'var(--text-dim)' }}>
            {content.split('\n').length} lines
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onClose}
              whileHover={{ background: 'rgba(255, 255, 255, 0.06)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleSave}
              disabled={isSaving || isLoading || !!error}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'rgba(255, 107, 53, 0.15)',
                border: '1px solid rgba(255, 107, 53, 0.3)',
                color: 'var(--accent)',
                cursor: isSaving || isLoading || error ? 'not-allowed' : 'pointer',
                opacity: isSaving || isLoading || error ? 0.5 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
  },
}

// Agent link button
function AgentLink({
  agent,
  onClick,
}: {
  agent: { id: string; displayName: string; color: string }
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      className="group w-full"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Agent color indicator */}
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '4px',
          backgroundColor: agent.color,
          boxShadow: `0 0 8px ${agent.color}50`,
          flexShrink: 0,
        }}
      />

      {/* Name */}
      <span
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          flex: 1,
          transition: 'color 0.2s ease',
        }}
        className="group-hover:text-[var(--text-main)]"
      >
        {agent.displayName}
      </span>

      {/* Arrow */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-dim)' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  )
}

// Tool chip
function ToolChip({ tool, color }: { tool: string; color: string }) {
  return (
    <motion.span
      whileHover={{ borderColor: `${color}40`, background: `${color}10` }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        color: 'var(--text-secondary)',
        cursor: 'default',
        transition: 'all 0.2s ease',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      {tool}
    </motion.span>
  )
}

// Section header
function SectionHeader({ title, count, color }: { title: string; count?: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <div
        style={{
          width: '3px',
          height: '14px',
          borderRadius: '2px',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
        {title}
      </span>
      {count !== undefined && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 600,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            padding: '3px 8px',
            borderRadius: '6px',
            background: `${color}15`,
            color: color,
          }}
        >
          {count}
        </span>
      )}
    </div>
  )
}

export function AgentDetailPanel() {
  const { agents, selectedAgentId, setSelectedAgent } = useDashboardStore()
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { playPanelOpen } = useSoundEffects()
  const prevSelectedAgentId = useRef<string | null>(null)

  // Mount state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Play sound when agent is selected
  useEffect(() => {
    if (selectedAgentId && !prevSelectedAgentId.current) {
      playPanelOpen()
    }
    prevSelectedAgentId.current = selectedAgentId
  }, [selectedAgentId, playPanelOpen])

  const selectedAgent = agents.find(a => a.id === selectedAgentId)
  const reportsToAgent = selectedAgent?.reportsTo
    ? agents.find(a => a.id === selectedAgent.reportsTo)
    : null
  const directReports = selectedAgent?.directReports
    .map(id => agents.find(a => a.id === id))
    .filter(Boolean) || []

  // Use portal to render at viewport level
  if (!mounted) return null

  const panelContent = (
    <AnimatePresence>
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed top-0 left-[380px] z-[100] overflow-hidden"
          style={{ height: '100vh', width: '360px' }}
        >
          <div
            className="relative h-full w-[360px] overflow-y-auto overflow-x-hidden scrollbar-fade"
            style={{
              background: `linear-gradient(180deg, ${selectedAgent.color}06 0%, var(--bg-elevated) 12%, var(--bg-surface) 100%)`,
              borderRight: '1px solid var(--glass-border)',
            }}
          >
              {/* Ambient glow */}
              <div
                className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${selectedAgent.color}12 0%, transparent 70%)`,
                }}
              />

              {/* Header buttons */}
              <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
                {/* Edit config */}
                <motion.button
                  onClick={() => setConfigModalOpen(true)}
                  whileHover={{ scale: 1.05, borderColor: `${selectedAgent.color}40` }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </motion.button>

                {/* Close */}
                <motion.button
                  onClick={() => setSelectedAgent(null)}
                  whileHover={{ scale: 1.05, borderColor: 'var(--glass-border-hover)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Content */}
              <motion.div
                className="relative"
                style={{ padding: '32px 28px' }}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* ═══════════════ HEADER ═══════════════ */}
                <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
                  {/* Avatar with ring */}
                  <div className="relative" style={{ marginBottom: '20px' }}>
                    <motion.div
                      className="absolute -inset-3 rounded-full"
                      style={{ border: `2px solid ${selectedAgent.color}25` }}
                      animate={{
                        scale: selectedAgent.status === 'working' ? [1, 1.08, 1] : 1,
                        opacity: selectedAgent.status === 'working' ? [0.3, 0.6, 0.3] : 0.3,
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <AgentAvatar agent={selectedAgent} size="lg" showLabel={false} trackCursor />
                  </div>

                  {/* Name */}
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: selectedAgent.color, textAlign: 'center', marginBottom: '10px' }}>
                    {selectedAgent.displayName}
                  </h3>

                  {/* Tier badge */}
                  <div
                    style={{
                      padding: '5px 14px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      background: `${selectedAgent.color}12`,
                      border: `1px solid ${selectedAgent.color}25`,
                      color: selectedAgent.color,
                    }}
                  >
                    {selectedAgent.tier}
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                    <motion.div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: selectedAgent.status === 'working'
                          ? 'var(--accent)'
                          : selectedAgent.status === 'thinking'
                            ? 'var(--warning)'
                            : 'var(--text-muted)',
                        boxShadow: selectedAgent.status !== 'idle'
                          ? `0 0 10px ${selectedAgent.status === 'working' ? 'var(--accent)' : 'var(--warning)'}`
                          : 'none',
                      }}
                      animate={{
                        scale: selectedAgent.status !== 'idle' ? [1, 1.4, 1] : 1,
                      }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                        color: selectedAgent.status === 'idle' ? 'var(--text-muted)' : 'var(--text-secondary)',
                      }}
                    >
                      {selectedAgent.status}
                    </span>
                  </div>
                </motion.div>

                {/* ═══════════════ SPECIALTY ═══════════════ */}
                <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
                  <SectionHeader title="Specialty" color={selectedAgent.color} />
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      paddingLeft: '13px',
                    }}
                  >
                    {selectedAgent.specialty}
                  </p>
                </motion.div>

                {/* ═══════════════ ORGANIZATION ═══════════════ */}
                {(reportsToAgent || directReports.length > 0) && (
                  <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
                    <SectionHeader title="Organization" color={selectedAgent.color} />

                    <div style={{ paddingLeft: '13px' }}>
                      {/* Reports To */}
                      {reportsToAgent && (
                        <div style={{ marginBottom: directReports.length > 0 ? '20px' : 0 }}>
                          <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            Reports to
                          </span>
                          <AgentLink
                            agent={reportsToAgent}
                            onClick={() => setSelectedAgent(reportsToAgent.id)}
                          />
                        </div>
                      )}

                      {/* Direct Reports */}
                      {directReports.length > 0 && (
                        <div>
                          <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            Direct Reports ({directReports.length})
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {directReports.map(agent => agent && (
                              <AgentLink
                                key={agent.id}
                                agent={agent}
                                onClick={() => setSelectedAgent(agent.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ═══════════════ TOOLS ═══════════════ */}
                <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
                  <SectionHeader
                    title="Tools"
                    count={selectedAgent.tools.length}
                    color={selectedAgent.color}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '13px' }}>
                    {selectedAgent.tools.map((tool, i) => (
                      <motion.div
                        key={tool}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                      >
                        <ToolChip tool={tool} color={selectedAgent.color} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Bottom padding */}
                <div style={{ height: '20px' }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  )

  return (
    <>
      {createPortal(panelContent, document.body)}

      {/* Config Modal */}
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
