'use client'

import { AgentNetwork } from '@/components/AgentNetwork'
import { ChatPanel } from '@/components/ChatPanel'
import { ChatInput } from '@/components/ChatInput'
import { TaskBoard } from '@/components/TaskBoard'
import { EventLog } from '@/components/EventLog'
import { AgentDetailPanel } from '@/components/AgentDetailPanel'
import { SkillsBrowser } from '@/components/SkillsBrowser'
import { NavDrawer } from '@/components/NavDrawer'
import { AgentHealthDashboard } from '@/components/AgentHealthDashboard'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useDashboardStore } from '@/lib/store'

function DashboardContent() {
  const { isConfigured } = useSupabase()

  return (
    <>
      {/* Floating Decorative Elements - Break the Grid */}
      <div className="fixed top-20 right-[25%] w-80 h-80 rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />
      <div className="fixed bottom-32 left-[15%] w-96 h-96 rounded-full bg-accent-tertiary/[0.02] blur-[120px] pointer-events-none" />
      <div className="fixed top-1/2 right-[10%] w-64 h-64 rounded-full bg-accent-secondary/[0.02] blur-[80px] pointer-events-none" />

      {/* Left Sidebar - Chat & Events */}
      <aside className="w-full max-w-[400px] lg:w-[400px] h-full flex flex-col gap-4 p-4 lg:p-6 z-20 flex-shrink-0">
        {/* Brand Header */}
        <div className="liquid-card ml-12 reveal-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-accent">
                Claude Agent
              </h1>
              <p className="text-xs text-[var(--text-dim)] mt-0.5 font-mono">
                19-Agent Orchestration
              </p>
            </div>
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConfigured ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--warning)]'
                }`}
              />
              <span className="text-xs text-[var(--text-dim)] font-mono">
                {isConfigured ? 'Synced' : 'Local'}
              </span>
            </div>
          </div>
          {/* Skills Browser */}
          <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
            <SkillsBrowser />
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 min-h-0 reveal-2">
          <ChatPanel />
        </div>

        {/* Event Log */}
        <div className="reveal-3">
          <EventLog />
        </div>

        {/* Chat Input */}
        <div className="reveal-4">
          <ChatInput />
        </div>
      </aside>

      {/* Main Canvas - Agent Network */}
      <section className="flex-1 relative reveal-scale-1">
        <AgentNetwork />

        {/* Agent Detail Panel (floats on left of canvas) */}
        <div className="absolute top-6 left-6 z-40">
          <AgentDetailPanel />
        </div>
      </section>

      {/* Task Board (slides from right) */}
      <TaskBoard />
    </>
  )
}

function AgentHealthContent() {
  return (
    <div className="flex-1 ml-14">
      <AgentHealthDashboard />
    </div>
  )
}

function AnalyticsContent() {
  return (
    <div className="flex-1 ml-14 p-6">
      <div className="liquid-card p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-white/50">Coming soon - Performance analytics and insights</p>
      </div>
    </div>
  )
}

function SettingsContent() {
  return (
    <div className="flex-1 ml-14 p-6">
      <div className="liquid-card p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-white/50">Coming soon - Dashboard configuration</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const currentPage = useDashboardStore((state) => state.currentPage)

  return (
    <main className="h-screen w-screen flex">
      {/* Navigation Drawer */}
      <NavDrawer />

      {/* Page Content */}
      {currentPage === 'dashboard' && <DashboardContent />}
      {currentPage === 'agent-health' && <AgentHealthContent />}
      {currentPage === 'analytics' && <AnalyticsContent />}
      {currentPage === 'settings' && <SettingsContent />}
    </main>
  )
}
