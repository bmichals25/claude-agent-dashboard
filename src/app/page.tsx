'use client'

import { AgentNetwork } from '@/components/AgentNetwork'
import { ChatPanel } from '@/components/ChatPanel'
import { ChatInput } from '@/components/ChatInput'
import { TaskBoard } from '@/components/TaskBoard'
import { EventLog } from '@/components/EventLog'
import { AgentDetailPanel } from '@/components/AgentDetailPanel'

export default function Dashboard() {
  return (
    <main className="h-screen w-screen flex">
      {/* Left Sidebar - Chat & Events */}
      <aside className="w-[400px] h-full flex flex-col gap-4 p-6 z-20">
        {/* Brand Header */}
        <div className="liquid-card">
          <h1 className="text-sm uppercase tracking-[0.4em] text-accent font-extrabold">
            Claude Agent
          </h1>
          <p className="text-xs text-white/50 mt-1">
            18-Agent Orchestration Dashboard
          </p>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 min-h-0">
          <ChatPanel />
        </div>

        {/* Event Log */}
        <EventLog />

        {/* Chat Input */}
        <ChatInput />
      </aside>

      {/* Main Canvas - Agent Network */}
      <section className="flex-1 relative">
        <AgentNetwork />

        {/* Agent Detail Panel (floats on left of canvas) */}
        <div className="absolute top-6 left-6 z-30">
          <AgentDetailPanel />
        </div>
      </section>

      {/* Task Board (slides from right) */}
      <TaskBoard />
    </main>
  )
}
