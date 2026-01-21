'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'

interface FilesResponse {
  agents?: string[]
  commands?: string[]
  skills?: string[]
}

async function openFile(type: 'agent' | 'command', id: string) {
  try {
    const response = await fetch('/api/open-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    })
    return response.ok
  } catch {
    return false
  }
}

const getAgentColor = (name: string): string => {
  const colors: Record<string, string> = {
    'ceo': '#ff6b35',
    'vp': '#00d4aa',
    'chief': '#ff00c1',
    'pipeline': '#7c3aed',
    'architect': '#06b6d4',
    'developer': '#22c55e',
    'devops': '#f59e0b',
    'security': '#ef4444',
    'code': '#8b5cf6',
    'product': '#f97316',
    'data': '#3b82f6',
    'growth': '#ec4899',
    'frontend': '#14b8a6',
    'qa': '#6366f1',
    'support': '#a855f7',
    'autopilot': '#10b981',
    'agent': '#64748b',
  }
  const key = Object.keys(colors).find(k => name.toLowerCase().includes(k))
  return key ? colors[key] : '#64748b'
}

function CommandPalette({
  isOpen,
  onClose,
  position
}: {
  isOpen: boolean
  onClose: () => void
  position: { top: number; left: number; width: number }
}) {
  const [files, setFiles] = useState<FilesResponse>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch('/api/open-file')
        .then(res => res.json())
        .then(data => {
          setFiles(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))

      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const filteredCommands = files.commands?.filter(cmd =>
    cmd.toLowerCase().includes(filter.toLowerCase())
  ) || []

  const filteredAgents = files.agents?.filter(agent =>
    agent.toLowerCase().includes(filter.toLowerCase())
  ) || []

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Click-away layer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Dropdown Panel */}
      <div
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: position.top + 6,
          left: position.left,
          width: position.width,
          maxHeight: 'min(380px, 55vh)',
          backgroundColor: '#151210',
          borderRadius: '12px',
          border: '1px solid rgba(255, 200, 150, 0.08)',
          boxShadow: '0 24px 80px -12px rgba(0, 0, 0, 0.7), 0 0 1px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Search */}
        <div style={{ padding: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 235, 220, 0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 200, 150, 0.06)',
            }}
          >
            <svg style={{ width: '16px', height: '16px', color: '#6b5f52', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#faf5f0',
                fontFamily: 'inherit',
              }}
            />
            {filter && (
              <button
                onClick={() => setFilter('')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  color: '#6b5f52',
                  display: 'flex',
                }}
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 8px 8px',
          }}
        >
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6b5f52', fontSize: '13px' }}>
              Loading...
            </div>
          ) : (
            <>
              {/* Commands Section */}
              {filteredCommands.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ padding: '8px 8px 6px', fontSize: '11px', fontWeight: 600, color: '#4a4039', letterSpacing: '0.5px' }}>
                    COMMANDS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                    {filteredCommands.map(cmd => (
                      <button
                        key={cmd}
                        onClick={() => { openFile('command', cmd); onClose() }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 107, 53, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <span style={{ color: '#ff6b35', fontSize: '14px', fontWeight: 500 }}>/</span>
                        <span style={{ fontSize: '13px', color: '#c4b8aa' }}>{cmd}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Agents Section */}
              {filteredAgents.length > 0 && (
                <div>
                  <div style={{ padding: '8px 8px 6px', fontSize: '11px', fontWeight: 600, color: '#4a4039', letterSpacing: '0.5px' }}>
                    AGENTS
                  </div>
                  {filteredAgents.map(agent => {
                    const color = getAgentColor(agent)
                    const name = agent.replace(/-/g, ' ')
                    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <button
                        key={agent}
                        onClick={() => { openFile('agent', agent); onClose() }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${color}10`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '-0.5px',
                            backgroundColor: `${color}15`,
                            color: color,
                            fontFamily: 'ui-monospace, monospace',
                          }}
                        >
                          {initials}
                        </div>
                        <span style={{ flex: 1, fontSize: '13px', color: '#e8e0d8', textTransform: 'capitalize' }}>
                          {name}
                        </span>
                        <svg style={{ width: '16px', height: '16px', color: '#3d352d', transition: 'color 0.15s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Empty State */}
              {filteredCommands.length === 0 && filteredAgents.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#6b5f52' }}>No results found</div>
                  <div style={{ fontSize: '12px', color: '#4a4039', marginTop: '4px' }}>Try a different search term</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid rgba(255, 200, 150, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '11px',
            color: '#4a4039',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <kbd style={{
              padding: '3px 6px',
              backgroundColor: 'rgba(255, 235, 220, 0.04)',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#6b5f52',
              border: '1px solid rgba(255, 200, 150, 0.08)',
              fontFamily: 'ui-monospace, monospace',
            }}>esc</kbd>
            close
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <kbd style={{
              padding: '3px 6px',
              backgroundColor: 'rgba(255, 235, 220, 0.04)',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#6b5f52',
              border: '1px solid rgba(255, 200, 150, 0.08)',
              fontFamily: 'ui-monospace, monospace',
            }}>⌘K</kbd>
            toggle
          </span>
        </div>
      </div>
    </>,
    document.body
  )
}

export function SkillsBrowser() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 300)
      })
    }
    setIsOpen(true)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        style={{
          width: '100%',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 10px',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.25)'
          e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--glass-border)'
          e.currentTarget.style.backgroundColor = 'var(--bg-surface)'
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-dim)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <span style={{
          flex: 1,
          textAlign: 'left',
          fontSize: '12px',
          color: 'var(--text-dim)',
          fontWeight: 400,
        }}>Search</span>
        <span style={{
          fontSize: '11px',
          fontFamily: 'ui-monospace, monospace',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--glass)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid var(--glass-border)',
          lineHeight: 1,
        }}>⌘K</span>
      </button>

      {mounted && (
        <CommandPalette
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position={position}
        />
      )}
    </>
  )
}
