'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { AgentAvatar } from './AgentAvatar'

export function AgentDetailPanel() {
  const { agents, selectedAgentId, setSelectedAgent, tasks, taskHistory } =
    useDashboardStore()

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
    <AnimatePresence>
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="liquid-card max-w-xs"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedAgent(null)}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>

          {/* Agent Avatar */}
          <div className="flex justify-center mb-4">
            <AgentAvatar agent={selectedAgent} size="lg" showLabel={false} />
          </div>

          {/* Name & Role */}
          <h3
            className="text-lg font-bold text-center mb-1"
            style={{ color: selectedAgent.color }}
          >
            {selectedAgent.displayName}
          </h3>
          <p className="text-xs text-white/60 text-center font-mono uppercase mb-4">
            {selectedAgent.tier}
          </p>

          {/* Specialty */}
          <div className="mb-4">
            <h4 className="text-xs text-white/40 uppercase mb-1">Specialty</h4>
            <p className="text-sm text-white/80">{selectedAgent.specialty}</p>
          </div>

          {/* Status */}
          <div className="mb-4">
            <h4 className="text-xs text-white/40 uppercase mb-1">Status</h4>
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
              <span className="text-sm text-white/80 capitalize">
                {selectedAgent.status}
              </span>
            </div>
          </div>

          {/* Reports To */}
          {reportsToAgent && (
            <div className="mb-4">
              <h4 className="text-xs text-white/40 uppercase mb-1">Reports To</h4>
              <button
                onClick={() => setSelectedAgent(reportsToAgent.id)}
                className="flex items-center gap-2 hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: reportsToAgent.color }}
                />
                <span className="text-sm text-white/80">
                  {reportsToAgent.displayName}
                </span>
              </button>
            </div>
          )}

          {/* Direct Reports */}
          {directReports.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs text-white/40 uppercase mb-1">
                Direct Reports ({directReports.length})
              </h4>
              <div className="space-y-1">
                {directReports.map(agent => agent && (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className="flex items-center gap-2 hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors w-full text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: agent.color }}
                    />
                    <span className="text-sm text-white/80">
                      {agent.displayName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          <div className="mb-4">
            <h4 className="text-xs text-white/40 uppercase mb-2">Tools</h4>
            <div className="flex flex-wrap gap-1">
              {selectedAgent.tools.map(tool => (
                <span
                  key={tool}
                  className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70 font-mono"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Task Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {agentTasks.length}
              </div>
              <div className="text-xs text-white/40">Active Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {completedTasks.length}
              </div>
              <div className="text-xs text-white/40">Completed</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
