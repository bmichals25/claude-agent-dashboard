'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboardStore } from '@/lib/store';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { PipelineProjectCard } from './pipeline/PipelineProjectCard';
import { ActivityBanner } from './pipeline/ActivityBanner';
import { NotificationBadge } from './NotificationBadge';
import { ChatPanel } from './ChatPanel';
import { ChatInput } from './ChatInput';
import { AgentDetailPanel } from './AgentDetailPanel';
import { AlertTriangle, Clock, AlertCircle, Loader2, RefreshCw, Filter } from 'lucide-react';

type FilterType = 'all' | 'active' | 'blocked' | 'review';

export function CEOOverview() {
  const {
    pipelineProjects,
    pipelineActivity,
    pipelineLoading,
    notificationCounts,
    refreshPipeline,
    setSelectedPipelineProject,
    setCurrentPage,
    settings,
    setNavDrawerOpen,
  } = useDashboardStore();
  const { isConfigured } = useSupabase();

  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    refreshPipeline();
    // Set up polling interval
    const interval = setInterval(() => {
      refreshPipeline();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshPipeline]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPipeline();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedPipelineProject(projectId);
    setCurrentPage('project-detail');
  };

  // Filter projects
  const filteredProjects = pipelineProjects.filter(project => {
    switch (filter) {
      case 'active':
        return project.isActive;
      case 'blocked':
        return project.status === 'Blocked';
      case 'review':
        return project.status === 'Review';
      default:
        return true;
    }
  });

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar - Chat & Events (matching agents page) */}
      <aside className="w-full max-w-[380px] lg:w-[380px] h-full flex flex-col gap-4 px-5 py-5 z-20 flex-shrink-0">
        {/* Brand Header */}
        <header className="liquid-card reveal-1 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Nav Toggle - integrated into header */}
            <button
              onClick={() => setNavDrawerOpen(true)}
              className="w-11 h-11 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] flex items-center justify-center hover:border-[var(--glass-border-hover)] hover:bg-[var(--bg-surface)] transition-all flex-shrink-0"
              aria-label="Open navigation"
            >
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="heading-md text-accent truncate">
                {settings.appName}
              </h1>
              <p className="text-caption text-mono mt-1">
                {settings.appTagline}
              </p>
            </div>

            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isConfigured ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'
                }`}
                style={{ boxShadow: isConfigured ? '0 0 8px var(--success)' : '0 0 8px var(--warning)' }}
              />
              <span className="badge badge-success text-[10px]">
                {isConfigured ? 'Synced' : 'Local'}
              </span>
            </div>
          </div>
        </header>

        {/* Chat Container - Panel + Input unified */}
        <div className="flex-1 min-h-0 flex flex-col reveal-2 relative">
          {/* Chat Panel */}
          <div className="flex-1 min-h-0">
            <ChatPanel />
          </div>
          {/* Chat Input - directly attached */}
          <div className="mt-0">
            <ChatInput />
          </div>
          {/* Agent Detail Panel - extends to the right of chat */}
          <AgentDetailPanel />
        </div>
      </aside>

      {/* Right Panel - Pipeline Overview */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header
          className="flex-shrink-0"
          style={{
            padding: '24px 48px 20px',
            borderBottom: '1px solid var(--glass-border)',
            background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg) 100%)',
          }}
        >
          <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="heading-lg" style={{ color: 'var(--accent)' }}>
                  Ben's Product Pipeline
                </h1>
                <p className="text-caption text-mono mt-1">CEO Overview - Active Projects</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Refresh button */}
                <button
                  onClick={handleRefresh}
                  disabled={pipelineLoading}
                  className="btn btn-ghost btn-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Notification Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
            {/* Blocked */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(filter === 'blocked' ? 'all' : 'blocked')}
              className="liquid-card liquid-card-sm text-left transition-all"
              style={{
                borderColor: filter === 'blocked' ? 'rgba(239, 68, 68, 0.4)' : 'var(--glass-border)',
                background: filter === 'blocked' ? 'rgba(239, 68, 68, 0.1)' : 'var(--glass)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239, 68, 68, 0.15)' }}
                  >
                    <AlertTriangle className="w-5 h-5" style={{ color: 'var(--error)' }} />
                  </div>
                  <div>
                    <p className="text-caption text-mono text-upper" style={{ color: 'var(--text-muted)' }}>
                      Blocked
                    </p>
                    <p className="heading-md" style={{ color: 'var(--error)' }}>
                      {notificationCounts.blocked}
                    </p>
                  </div>
                </div>
                {notificationCounts.blocked > 0 && (
                  <NotificationBadge count={notificationCounts.blocked} variant="error" pulse />
                )}
              </div>
            </motion.button>

            {/* Review */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(filter === 'review' ? 'all' : 'review')}
              className="liquid-card liquid-card-sm text-left transition-all"
              style={{
                borderColor: filter === 'review' ? 'rgba(251, 191, 36, 0.4)' : 'var(--glass-border)',
                background: filter === 'review' ? 'rgba(251, 191, 36, 0.1)' : 'var(--glass)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(251, 191, 36, 0.15)' }}
                  >
                    <Clock className="w-5 h-5" style={{ color: 'var(--warning)' }} />
                  </div>
                  <div>
                    <p className="text-caption text-mono text-upper" style={{ color: 'var(--text-muted)' }}>
                      Review
                    </p>
                    <p className="heading-md" style={{ color: 'var(--warning)' }}>
                      {notificationCounts.review}
                    </p>
                  </div>
                </div>
                {notificationCounts.review > 0 && (
                  <NotificationBadge count={notificationCounts.review} variant="warning" />
                )}
              </div>
            </motion.button>

            {/* Agent Issues */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage('agent-health')}
              className="liquid-card liquid-card-sm text-left transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(168, 85, 247, 0.15)' }}
                  >
                    <AlertCircle className="w-5 h-5" style={{ color: '#a855f7' }} />
                  </div>
                  <div>
                    <p className="text-caption text-mono text-upper" style={{ color: 'var(--text-muted)' }}>
                      Agent Issues
                    </p>
                    <p className="heading-md" style={{ color: '#a855f7' }}>
                      {notificationCounts.agentIssues}
                    </p>
                  </div>
                </div>
                {notificationCounts.agentIssues > 0 && (
                  <NotificationBadge count={notificationCounts.agentIssues} variant="default" />
                )}
              </div>
            </motion.button>

            {/* Total Projects */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
              className="liquid-card liquid-card-sm text-left transition-all"
              style={{
                borderColor: filter === 'active' ? 'rgba(255, 107, 53, 0.4)' : 'var(--glass-border)',
                background: filter === 'active' ? 'var(--accent-muted)' : 'var(--glass)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-muted)' }}
                >
                  <Filter className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-caption text-mono text-upper" style={{ color: 'var(--text-muted)' }}>
                    {filter === 'active' ? 'Active' : 'Total'} Projects
                  </p>
                  <p className="heading-md" style={{ color: 'var(--accent)' }}>
                    {filter === 'active'
                      ? pipelineProjects.filter(p => p.isActive).length
                      : pipelineProjects.length
                    }
                  </p>
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto scrollbar-fade">
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px 56px 120px' }} className="space-y-6">
          {/* Activity Banner */}
          <AnimatePresence>
            {pipelineActivity && (
              <ActivityBanner activity={pipelineActivity} />
            )}
          </AnimatePresence>

          {/* Filter indicator */}
          {filter !== 'all' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              <span className="text-caption" style={{ color: 'var(--text-dim)' }}>
                Showing:
              </span>
              <span className="badge badge-accent">
                {filter === 'active' && 'Active Projects'}
                {filter === 'blocked' && 'Blocked Projects'}
                {filter === 'review' && 'Awaiting Review'}
              </span>
              <button
                onClick={() => setFilter('all')}
                className="text-caption hover:text-[var(--text-main)] transition-colors"
                style={{ color: 'var(--text-dim)' }}
              >
                Clear filter
              </button>
            </motion.div>
          )}

          {/* Loading State */}
          {pipelineLoading && pipelineProjects.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
                <p className="text-caption" style={{ color: 'var(--text-dim)' }}>
                  Loading pipeline...
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!pipelineLoading && filteredProjects.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="heading-md mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {filter !== 'all' ? 'No projects match this filter' : 'No projects in pipeline'}
                </p>
                <p className="text-caption" style={{ color: 'var(--text-dim)' }}>
                  {filter !== 'all'
                    ? 'Try selecting a different filter'
                    : 'Projects will appear here when added to the pipeline'}
                </p>
              </div>
            </div>
          )}

          {/* Project Grid */}
          {filteredProjects.length > 0 && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <PipelineProjectCard
                    project={project}
                    onClick={() => handleProjectClick(project.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
