'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import type { NavigationPage } from '@/lib/types'

const NAV_ITEMS: { id: NavigationPage; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'dashboard',
    label: 'Command Center',
    description: 'Agents & Projects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="11" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" />
      </svg>
    )
  },
  {
    id: 'agent-health',
    label: 'Agent Health',
    description: 'Performance monitoring',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 9h3l2-5 3 10 2-5h6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'skills-store',
    label: 'Skills Store',
    description: 'Browse & install skills',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 1L1 5l8 4 8-4-8-4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1 13l8 4 8-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1 9l8 4 8-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Insights & metrics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 14V8M6 14V4M10 14V10M14 14V6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'System configuration',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="9" r="2.5" />
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.05 3.05l1.41 1.41M13.54 13.54l1.41 1.41M3.05 14.95l1.41-1.41M13.54 4.46l1.41-1.41" strokeLinecap="round" />
      </svg>
    )
  },
]

export function NavDrawer() {
  const { navDrawerOpen, setNavDrawerOpen, currentPage, setCurrentPage, agentHealth, settings, notificationCounts } = useDashboardStore()
  const { playNav, playClick } = useSoundEffects()

  const criticalCount = agentHealth.filter(h => h.status === 'critical').length
  const needsAttentionCount = agentHealth.filter(h => h.status === 'needs_attention').length
  const healthyCount = agentHealth.filter(h => h.status === 'excellent' || h.status === 'good').length
  const pipelineBadgeCount = notificationCounts.blocked + notificationCounts.review

  const handleNavClick = (page: NavigationPage) => {
    playNav()
    setCurrentPage(page)
    setNavDrawerOpen(false)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {navDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setNavDrawerOpen(false)}
            className="fixed inset-0 z-40"
            style={{
              background: 'radial-gradient(ellipse at 0% 50%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)',
              backdropFilter: 'blur(8px)',
            }}
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
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-full z-50 flex flex-col"
            style={{
              width: '300px',
              background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg) 100%)',
              borderRight: '1px solid var(--glass-border)',
              boxShadow: '20px 0 60px -20px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <header style={{ padding: '40px 32px 32px 32px' }}>
              {/* Brand Mark */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="relative"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
                    boxShadow: '0 4px 20px var(--accent-glow)',
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center text-[var(--bg)] font-bold text-sm"
                  >
                    CA
                  </div>
                </div>
                <div>
                  <div
                    className="font-semibold tracking-tight"
                    style={{ color: 'var(--text-main)', fontSize: '15px' }}
                  >
                    {settings.appName}
                  </div>
                  <div
                    className="font-mono uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)', fontSize: '9px', marginTop: '2px' }}
                  >
                    {settings.appTagline}
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div
                className="flex items-center gap-4"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--success)',
                      boxShadow: '0 0 8px var(--success)',
                    }}
                  />
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {healthyCount} online
                  </span>
                </div>
                {criticalCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--error)',
                        boxShadow: '0 0 8px var(--error)',
                      }}
                    />
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--error)' }}>
                      {criticalCount} critical
                    </span>
                  </div>
                )}
              </div>
            </header>

            {/* Divider with label */}
            <div className="flex items-center gap-3" style={{ padding: '0 32px', marginBottom: '16px' }}>
              <span
                className="font-mono uppercase tracking-widest"
                style={{ fontSize: '9px', color: 'var(--text-muted)' }}
              >
                Navigation
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
            </div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col gap-1" style={{ padding: '0 16px' }}>
              {NAV_ITEMS.map((item, index) => {
                const isActive = currentPage === item.id
                const showBadge = (item.id === 'agent-health' && (criticalCount > 0 || needsAttentionCount > 0)) ||
                            (item.id === 'dashboard' && pipelineBadgeCount > 0)

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="relative w-full text-left group"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: isActive
                        ? 'linear-gradient(135deg, var(--accent-muted) 0%, rgba(255, 107, 53, 0.05) 100%)'
                        : 'transparent',
                      border: isActive ? '1px solid rgba(255, 107, 53, 0.2)' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                    whileHover={{
                      backgroundColor: isActive ? undefined : 'var(--glass)',
                      x: 4,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-indicator"
                        className="absolute"
                        style={{
                          left: '0',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '3px',
                          height: '24px',
                          borderRadius: '0 4px 4px 0',
                          background: 'var(--accent)',
                          boxShadow: '0 0 12px var(--accent-glow)',
                        }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      />
                    )}

                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className="flex items-center justify-center transition-colors"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: isActive ? 'rgba(255, 107, 53, 0.15)' : 'var(--glass)',
                          border: `1px solid ${isActive ? 'rgba(255, 107, 53, 0.3)' : 'var(--glass-border)'}`,
                          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                        }}
                      >
                        {item.icon}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium tracking-tight"
                          style={{
                            fontSize: '14px',
                            color: isActive ? 'var(--accent)' : 'var(--text-main)',
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="font-mono truncate"
                          style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          {item.description}
                        </div>
                      </div>

                      {/* Badge */}
                      {showBadge && (
                        <div
                          className="flex items-center justify-center font-mono font-bold"
                          style={{
                            minWidth: '20px',
                            height: '20px',
                            padding: '0 6px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            background: item.id === 'dashboard'
                              ? notificationCounts.blocked > 0 ? 'var(--error)' : 'var(--warning)'
                              : criticalCount > 0 ? 'var(--error)' : 'var(--warning)',
                            color: 'var(--bg)',
                            boxShadow: item.id === 'dashboard'
                              ? notificationCounts.blocked > 0
                                ? '0 0 12px rgba(239, 68, 68, 0.4)'
                                : '0 0 12px rgba(234, 179, 8, 0.4)'
                              : criticalCount > 0
                                ? '0 0 12px rgba(239, 68, 68, 0.4)'
                                : '0 0 12px rgba(234, 179, 8, 0.4)',
                          }}
                        >
                          {item.id === 'dashboard'
                            ? pipelineBadgeCount
                            : criticalCount > 0 ? criticalCount : needsAttentionCount
                          }
                        </div>
                      )}

                      {/* Arrow indicator */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <path
                          d="M5 3l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </motion.button>
                )
              })}
            </nav>

            {/* Footer */}
            <footer style={{ padding: '24px 32px 32px 32px' }}>
              {/* Divider */}
              <div
                className="mb-5"
                style={{ height: '1px', background: 'var(--glass-border)' }}
              />

              {/* System status */}
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
                      boxShadow: '0 2px 8px var(--accent-glow)',
                    }}
                  >
                    <span className="text-[var(--bg)] font-bold" style={{ fontSize: '10px' }}>N</span>
                  </div>
                  <div>
                    <div
                      className="font-mono"
                      style={{ fontSize: '11px', color: 'var(--text-main)' }}
                    >
                      19 Agents
                    </div>
                    <div
                      className="font-mono"
                      style={{ fontSize: '9px', color: 'var(--text-muted)' }}
                    >
                      Auto-monitored
                    </div>
                  </div>
                </div>

                {/* Live indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className="animate-pulse"
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--success)',
                      boxShadow: '0 0 8px var(--success)',
                    }}
                  />
                  <span
                    className="font-mono uppercase"
                    style={{ fontSize: '9px', color: 'var(--success)' }}
                  >
                    Live
                  </span>
                </div>
              </div>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
