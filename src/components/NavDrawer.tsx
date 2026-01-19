'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import type { NavigationPage } from '@/lib/types'

const NAV_ITEMS: { id: NavigationPage; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'agent-health', label: 'Agent Health', icon: '⬡' },
  { id: 'analytics', label: 'Analytics', icon: '◈' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export function NavDrawer() {
  const { navDrawerOpen, setNavDrawerOpen, currentPage, setCurrentPage, agentHealth } = useDashboardStore()

  // Calculate overall health status for badge
  const criticalCount = agentHealth.filter(h => h.status === 'critical').length
  const needsAttentionCount = agentHealth.filter(h => h.status === 'needs_attention').length

  const handleNavClick = (page: NavigationPage) => {
    setCurrentPage(page)
    setNavDrawerOpen(false)
  }

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setNavDrawerOpen(!navDrawerOpen)}
        className="fixed top-5 left-5 z-50 w-11 h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex items-center justify-center hover:border-[var(--glass-border-hover)] hover:bg-[var(--bg-surface)] transition-all shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          animate={{ rotate: navDrawerOpen ? 90 : 0 }}
          className="text-[var(--text-secondary)] text-base"
        >
          {navDrawerOpen ? '✕' : '☰'}
        </motion.span>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {navDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNavDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {navDrawerOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-[300px] bg-[var(--bg)] border-r border-[var(--glass-border)] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--glass-border)]">
              <h2 className="heading-lg text-accent mb-1">Navigation</h2>
              <p className="text-caption text-mono">Agent Orchestration System</p>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 p-4 space-y-2">
              {NAV_ITEMS.map(item => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-[var(--accent-muted)] text-accent'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--glass)] hover:text-[var(--text-main)]'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active indicator bar */}
                  {currentPage === item.id && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                  <span className="text-lg w-6 text-center">{item.icon}</span>
                  <span className="font-medium text-[15px]">{item.label}</span>

                  {/* Health Badge */}
                  {item.id === 'agent-health' && (criticalCount > 0 || needsAttentionCount > 0) && (
                    <span className={`ml-auto badge ${
                      criticalCount > 0 ? 'badge-error' : 'badge-warning'
                    }`}>
                      {criticalCount > 0 ? criticalCount : needsAttentionCount}
                    </span>
                  )}
                </motion.button>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-5 border-t border-[var(--glass-border)]">
              <div className="text-caption text-mono text-center">
                19 Agents • Auto-Monitored
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
