'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { AGENT_DEFINITIONS } from '@/lib/agentCatalog'
import type { AgentHealthMetrics, HealthStatus, AgentId } from '@/lib/types'

const STATUS_CONFIG: Record<HealthStatus, { color: string; bgColor: string; label: string; glow: string }> = {
  excellent: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', label: 'Excellent', glow: 'rgba(16, 185, 129, 0.3)' },
  good: { color: 'var(--accent-tertiary)', bgColor: 'rgba(46, 196, 182, 0.15)', label: 'Good', glow: 'rgba(46, 196, 182, 0.3)' },
  needs_attention: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', label: 'Needs Attention', glow: 'rgba(245, 158, 11, 0.3)' },
  critical: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', label: 'Critical', glow: 'rgba(239, 68, 68, 0.3)' },
}

function HealthCard({ health, index }: { health: AgentHealthMetrics; index: number }) {
  const agent = AGENT_DEFINITIONS[health.agentId]
  const statusConfig = STATUS_CONFIG[health.status]
  const agentColor = agent?.color || '#888'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.4 }}
      style={{
        position: 'relative',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(255, 235, 220, 0.04) 0%, rgba(255, 235, 220, 0.01) 100%)',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${agentColor} 0%, ${agentColor}40 100%)`,
        }}
      />

      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                fontWeight: 700,
                backgroundColor: `${agentColor}20`,
                color: agentColor,
                border: `1px solid ${agentColor}30`,
              }}
            >
              {agent?.displayName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                {agent?.displayName || health.agentId}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
                {agent?.tier || 'unknown'}
              </p>
            </div>
          </div>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: statusConfig.bgColor,
              color: statusConfig.color,
              border: `1px solid ${statusConfig.color}30`,
            }}
          >
            {statusConfig.label}
          </div>
        </div>

        {/* Health Score */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Health Score</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: agentColor }}>
              {health.healthScore}%
              <span style={{
                marginLeft: '4px',
                fontSize: '12px',
                color: health.trend === 'up' ? '#10b981' : health.trend === 'down' ? '#ef4444' : 'var(--text-muted)',
              }}>
                {health.trend === 'up' ? '↑' : health.trend === 'down' ? '↓' : '→'}
              </span>
            </span>
          </div>
          <div style={{ height: '6px', borderRadius: '4px', backgroundColor: 'var(--glass)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${health.healthScore}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.02 }}
              style={{
                height: '100%',
                borderRadius: '4px',
                backgroundColor: agentColor,
                boxShadow: `0 0 10px ${agentColor}50`,
              }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {[
            { label: 'Success Rate', value: `${health.taskSuccessRate}%` },
            { label: 'Quality', value: `${health.qualityScore}/100` },
            { label: 'Efficiency', value: `${health.efficiency}%` },
            { label: 'Error Rate', value: `${health.errorRate}%`, highlight: health.errorRate > 5 },
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--glass)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{metric.label}</div>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: metric.highlight ? '#ef4444' : 'var(--text-main)',
                fontFamily: 'ui-monospace, monospace',
              }}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--glass-border)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
            {health.tasksCompleted}/{health.tasksAssigned} tasks
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
            Avg: {health.avgCompletionTime}min
          </span>
        </div>

        {/* Issues */}
        {health.issues.length > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Issues ({health.issues.length})
            </div>
            {health.issues.slice(0, 1).map((issue) => (
              <div
                key={issue.id}
                style={{
                  fontSize: '11px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: issue.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' :
                    issue.severity === 'high' ? 'rgba(249, 115, 22, 0.1)' :
                    issue.severity === 'medium' ? 'rgba(234, 179, 8, 0.1)' : 'var(--glass)',
                  color: issue.severity === 'critical' ? '#ef4444' :
                    issue.severity === 'high' ? '#f97316' :
                    issue.severity === 'medium' ? '#eab308' : 'var(--text-secondary)',
                  border: `1px solid ${
                    issue.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
                    issue.severity === 'high' ? 'rgba(249, 115, 22, 0.2)' :
                    issue.severity === 'medium' ? 'rgba(234, 179, 8, 0.2)' : 'var(--glass-border)'
                  }`,
                }}
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

function StatCard({ value, label, color, delay = 0 }: {
  value: string | number
  label: string
  color: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        padding: '28px 32px',
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${color}08 0%, transparent 70%)`,
        border: `1px solid ${color}15`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: delay + 0.1 }}
        style={{
          fontSize: '42px',
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          color: color,
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </motion.div>
      <div
        style={{
          fontSize: '11px',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          marginTop: '12px',
        }}
      >
        {label}
      </div>
    </motion.div>
  )
}

export function AgentHealthDashboard() {
  const { agentHealth, healthLastUpdated, refreshAgentHealth, setAgentHealth, setCurrentPage } = useDashboardStore()
  const [filterStatus, setFilterStatus] = useState<HealthStatus | 'all'>('all')

  // Initialize with mock data if empty
  useEffect(() => {
    if (agentHealth.length === 0) {
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

  // Refresh periodically
  useEffect(() => {
    const interval = setInterval(() => refreshAgentHealth(), 60000)
    return () => clearInterval(interval)
  }, [refreshAgentHealth])

  // Stats
  const avgHealth = agentHealth.length > 0
    ? Math.round(agentHealth.reduce((sum, h) => sum + h.healthScore, 0) / agentHealth.length)
    : 0
  const criticalCount = agentHealth.filter(h => h.status === 'critical').length
  const needsAttentionCount = agentHealth.filter(h => h.status === 'needs_attention').length
  const excellentCount = agentHealth.filter(h => h.status === 'excellent').length

  // Filter and sort
  const filteredHealth = filterStatus === 'all'
    ? agentHealth
    : agentHealth.filter(h => h.status === filterStatus)

  const sortedHealth = [...filteredHealth].sort((a, b) => {
    const statusOrder = { critical: 0, needs_attention: 1, good: 2, excellent: 3 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    return a.healthScore - b.healthScore
  })

  return (
    <div className="h-full w-full overflow-auto scrollbar-fade">
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 56px 120px' }}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '48px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Agent Health
              </h1>
              <p
                style={{
                  fontSize: '14px',
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  color: 'var(--text-dim)',
                  marginTop: '6px',
                  letterSpacing: '0.02em',
                }}
              >
                {agentHealth.length} agents · {healthLastUpdated ? `Updated ${healthLastUpdated.toLocaleTimeString()}` : 'Loading...'}
              </p>
            </div>
            <motion.button
              onClick={() => refreshAgentHealth()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'var(--accent-muted)',
                color: 'var(--accent)',
                border: '1px solid rgba(255, 107, 53, 0.25)',
                cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 8a7 7 0 0 1 7-7 7 7 0 0 1 6 3.5M15 8a7 7 0 0 1-7 7 7 7 0 0 1-6-3.5" strokeLinecap="round" />
                <path d="M14 1v4h-4M2 15v-4h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </motion.button>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <StatCard value={`${avgHealth}%`} label="Avg Health" color="var(--accent)" delay={0} />
            <StatCard value={excellentCount} label="Excellent" color="#10b981" delay={0.05} />
            <StatCard value={needsAttentionCount} label="Needs Attention" color={needsAttentionCount > 0 ? '#f59e0b' : 'var(--text-muted)'} delay={0.1} />
            <StatCard value={criticalCount} label="Critical" color={criticalCount > 0 ? '#ef4444' : 'var(--text-muted)'} delay={0.15} />
          </div>
        </motion.header>

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
            padding: '8px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            overflowX: 'auto',
          }}
          className="scrollbar-fade"
        >
          {(['all', 'critical', 'needs_attention', 'good', 'excellent'] as const).map((status) => {
            const isActive = filterStatus === status
            const config = status === 'all' ? null : STATUS_CONFIG[status]
            const count = status === 'all' ? agentHealth.length : agentHealth.filter(h => h.status === status).length
            return (
              <motion.button
                key={status}
                onClick={() => setFilterStatus(status)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: isActive ? (config?.bgColor || 'var(--accent-muted)') : 'transparent',
                  color: isActive ? (config?.color || 'var(--accent)') : 'var(--text-dim)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {status === 'all' ? 'All' : config?.label} ({count})
              </motion.button>
            )
          })}
        </motion.div>

        {/* Agent Health Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          <AnimatePresence mode="popLayout">
            {sortedHealth.map((health, index) => (
              <HealthCard key={health.agentId} health={health} index={index} />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {sortedHealth.length === 0 && (
          <div className="text-center py-16 text-[var(--text-muted)]">
            No agents match the current filter.
          </div>
        )}
      </div>
    </div>
  )
}
