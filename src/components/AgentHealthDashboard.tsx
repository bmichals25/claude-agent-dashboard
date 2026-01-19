'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { AGENT_DEFINITIONS } from '@/lib/agentCatalog'
import type { AgentHealthMetrics, HealthStatus, AgentId } from '@/lib/types'

const STATUS_CONFIG: Record<HealthStatus, { color: string; bg: string; label: string }> = {
  excellent: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Excellent' },
  good: { color: 'text-accent-tertiary', bg: 'bg-accent-tertiary/20', label: 'Good' },
  needs_attention: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Needs Attention' },
  critical: { color: 'text-rose-400', bg: 'bg-rose-500/20', label: 'Critical' },
}

const TREND_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
}

function HealthCard({ health }: { health: AgentHealthMetrics }) {
  const agent = AGENT_DEFINITIONS[health.agentId]
  const statusConfig = STATUS_CONFIG[health.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-card relative overflow-hidden"
    >
      {/* Status indicator bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.bg}`}
        style={{ backgroundColor: agent?.color + '40' }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: agent?.color + '20', color: agent?.color }}
            >
              {agent?.displayName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-main)] text-sm">
                {agent?.displayName || health.agentId}
              </h3>
              <p className="text-xs text-[var(--text-dim)]">{agent?.tier || 'unknown'}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
            {statusConfig.label}
          </div>
        </div>

        {/* Health Score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text-dim)]">Health Score</span>
            <span className="text-sm font-bold" style={{ color: agent?.color }}>
              {health.healthScore}%
              <span className={`ml-1 ${health.trend === 'up' ? 'text-green-400' : health.trend === 'down' ? 'text-red-400' : 'text-[var(--text-dim)]'}`}>
                {TREND_ICONS[health.trend]}
              </span>
            </span>
          </div>
          <div className="h-2 bg-[var(--glass)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${health.healthScore}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: agent?.color }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[var(--glass)]/50 rounded-lg p-2">
            <div className="text-[var(--text-dim)]">Success Rate</div>
            <div className="font-semibold text-[var(--text-main)]">{health.taskSuccessRate}%</div>
          </div>
          <div className="bg-[var(--glass)]/50 rounded-lg p-2">
            <div className="text-[var(--text-dim)]">Quality</div>
            <div className="font-semibold text-[var(--text-main)]">{health.qualityScore}/100</div>
          </div>
          <div className="bg-[var(--glass)]/50 rounded-lg p-2">
            <div className="text-[var(--text-dim)]">Efficiency</div>
            <div className="font-semibold text-[var(--text-main)]">{health.efficiency}%</div>
          </div>
          <div className="bg-[var(--glass)]/50 rounded-lg p-2">
            <div className="text-[var(--text-dim)]">Error Rate</div>
            <div className={`font-semibold ${health.errorRate > 5 ? 'text-red-400' : 'text-[var(--text-main)]'}`}>
              {health.errorRate}%
            </div>
          </div>
        </div>

        {/* Tasks Stats */}
        <div className="mt-3 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs">
          <span className="text-[var(--text-dim)]">
            {health.tasksCompleted}/{health.tasksAssigned} tasks
          </span>
          <span className="text-[var(--text-dim)]">
            Avg: {health.avgCompletionTime}min
          </span>
        </div>

        {/* Issues */}
        {health.issues.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
            <div className="text-xs text-[var(--text-dim)] mb-2">Issues ({health.issues.length})</div>
            {health.issues.slice(0, 2).map((issue) => (
              <div
                key={issue.id}
                className={`text-xs p-2 rounded-lg mb-1 ${
                  issue.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                  issue.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                  issue.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-[var(--glass)]/50 text-[var(--text-secondary)]'
                }`}
              >
                {issue.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function OverviewStats({ health }: { health: AgentHealthMetrics[] }) {
  const avgHealth = health.length > 0
    ? Math.round(health.reduce((sum, h) => sum + h.healthScore, 0) / health.length)
    : 0

  const criticalCount = health.filter(h => h.status === 'critical').length
  const needsAttentionCount = health.filter(h => h.status === 'needs_attention').length
  const excellentCount = health.filter(h => h.status === 'excellent').length
  const totalIssues = health.reduce((sum, h) => sum + h.issues.length, 0)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="liquid-card p-4"
      >
        <div className="text-3xl font-bold text-accent">{avgHealth}%</div>
        <div className="text-xs text-[var(--text-dim)]">Avg Health Score</div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="liquid-card p-4"
      >
        <div className="text-3xl font-bold text-green-400">{excellentCount}</div>
        <div className="text-xs text-[var(--text-dim)]">Excellent Agents</div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="liquid-card p-4"
      >
        <div className={`text-3xl font-bold ${needsAttentionCount > 0 ? 'text-yellow-400' : 'text-[var(--text-dim)]'}`}>
          {needsAttentionCount}
        </div>
        <div className="text-xs text-[var(--text-dim)]">Needs Attention</div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="liquid-card p-4"
      >
        <div className={`text-3xl font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-[var(--text-dim)]'}`}>
          {criticalCount}
        </div>
        <div className="text-xs text-[var(--text-dim)]">Critical Issues</div>
      </motion.div>
    </div>
  )
}

export function AgentHealthDashboard() {
  const { agentHealth, healthLastUpdated, refreshAgentHealth, setAgentHealth } = useDashboardStore()

  // Initialize with mock data if empty (for demo purposes)
  useEffect(() => {
    if (agentHealth.length === 0) {
      // Generate mock health data for all agents
      const mockHealth: AgentHealthMetrics[] = Object.keys(AGENT_DEFINITIONS).map((agentId) => {
        const baseScore = 70 + Math.random() * 25
        const status: HealthStatus =
          baseScore >= 90 ? 'excellent' :
          baseScore >= 80 ? 'good' :
          baseScore >= 70 ? 'needs_attention' : 'critical'

        return {
          agentId: agentId as AgentId,
          healthScore: Math.round(baseScore),
          status,
          taskSuccessRate: Math.round(85 + Math.random() * 15),
          qualityScore: Math.round(80 + Math.random() * 20),
          efficiency: Math.round(90 + Math.random() * 20),
          errorRate: Math.round(Math.random() * 8),
          autonomyLevel: Math.round(75 + Math.random() * 25),
          tasksCompleted: Math.floor(Math.random() * 50),
          tasksAssigned: Math.floor(50 + Math.random() * 20),
          avgCompletionTime: Math.round(15 + Math.random() * 45),
          lastActive: new Date(),
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
          issues: Math.random() > 0.7 ? [{
            id: crypto.randomUUID(),
            severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
            description: 'Task completion time above baseline',
            recommendation: 'Review recent task complexity',
            detectedAt: new Date(),
          }] : [],
        }
      })
      setAgentHealth(mockHealth)
    }
  }, [agentHealth.length, setAgentHealth])

  // Refresh health data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAgentHealth()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [refreshAgentHealth])

  // Sort health data: critical first, then by health score
  const sortedHealth = [...agentHealth].sort((a, b) => {
    const statusOrder = { critical: 0, needs_attention: 1, good: 2, excellent: 3 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    return a.healthScore - b.healthScore
  })

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Agent Health Dashboard</h1>
            <p className="text-sm text-[var(--text-dim)] mt-1">
              Monitor and optimize agent performance • Auto-maintained by Agent Ops
            </p>
          </div>
          <motion.button
            onClick={() => refreshAgentHealth()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-colors"
          >
            Refresh
          </motion.button>
        </div>
        {healthLastUpdated && (
          <p className="text-xs text-[var(--text-dim)] mt-2">
            Last updated: {healthLastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Overview Stats */}
      <OverviewStats health={agentHealth} />

      {/* Agent Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {sortedHealth.map((health, index) => (
            <motion.div
              key={health.agentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <HealthCard health={health} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
