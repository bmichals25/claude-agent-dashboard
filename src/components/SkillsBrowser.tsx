'use client'

import { useState, useEffect } from 'react'
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

export function SkillsBrowser() {
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<FilesResponse>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && Object.keys(files).length === 0) {
      setLoading(true)
      fetch('/api/open-file')
        .then(res => res.json())
        .then(data => {
          setFiles(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [isOpen, files])

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        Skills & Agents
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-72 max-h-96 overflow-auto rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl z-50"
          >
            {loading ? (
              <div className="p-4 text-center text-white/60">Loading...</div>
            ) : (
              <div className="p-2">
                {/* Commands/Skills Section */}
                {files.commands && files.commands.length > 0 && (
                  <div className="mb-3">
                    <div className="px-2 py-1 text-xs text-white/40 uppercase font-mono">
                      Slash Commands ({files.commands.length})
                    </div>
                    <div className="space-y-1">
                      {files.commands.map(cmd => (
                        <button
                          key={cmd}
                          onClick={() => openFile('command', cmd)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
                        >
                          <span className="text-accent font-mono">/</span>
                          <span className="text-sm text-white/80 group-hover:text-white flex-1">
                            {cmd}
                          </span>
                          <svg
                            className="w-4 h-4 text-white/30 group-hover:text-white/60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agents Section */}
                {files.agents && files.agents.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-white/40 uppercase font-mono">
                      Agent Configs ({files.agents.length})
                    </div>
                    <div className="space-y-1 max-h-48 overflow-auto">
                      {files.agents.map(agent => (
                        <button
                          key={agent}
                          onClick={() => openFile('agent', agent)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
                        >
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-sm text-white/80 group-hover:text-white flex-1 truncate">
                            {agent.replace(/-/g, ' ')}
                          </span>
                          <svg
                            className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(!files.agents || files.agents.length === 0) &&
                 (!files.commands || files.commands.length === 0) && (
                  <div className="p-4 text-center text-white/60 text-sm">
                    No files found
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
