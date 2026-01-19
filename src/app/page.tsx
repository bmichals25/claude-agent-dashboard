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
      <aside className="w-full max-w-[380px] lg:w-[380px] h-full flex flex-col gap-5 pl-16 pr-5 py-5 z-20 flex-shrink-0">
        {/* Brand Header */}
        <header className="liquid-card reveal-1">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="heading-md text-accent truncate">
                Claude Agent
              </h1>
              <p className="text-caption text-mono mt-1">
                19-Agent Orchestration
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
          {/* Skills Browser */}
          <div className="divider" />
          <SkillsBrowser />
        </header>

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
    <div className="flex-1 pl-16 pr-6">
      <AgentHealthDashboard />
    </div>
  )
}

function AnalyticsContent() {
  return (
    <div className="flex-1 pl-16 pr-6 py-6">
      <div className="liquid-card">
        <h1 className="heading-lg mb-3">Analytics</h1>
        <p className="text-body">Coming soon - Performance analytics and insights</p>
      </div>
    </div>
  )
}

function SettingsContent() {
  return (
    <div className="flex-1 pl-16 pr-6 py-6">
      <div className="liquid-card">
        <h1 className="heading-lg mb-3">Settings</h1>
        <p className="text-body">Coming soon - Dashboard configuration</p>
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
