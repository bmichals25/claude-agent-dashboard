# Claude Agent Dashboard

Real-time visualization dashboard for Claude Code's 18-agent orchestration system. Watch task delegation flow through the agent hierarchy in real-time.

## Features

- **Live Agent Network**: Visual graph showing all 18 agents and their connections
- **Real-time Task Flow**: Watch tasks get delegated from CEO → VPs → Specialists
- **Chat Interface**: Communicate with Claude through the beautiful glass-morphism UI
- **Task Board**: Kanban-style view of all active and completed tasks
- **Transparency First**: See exactly what's happening behind the scenes

## Agent Hierarchy

```
                         ┌─────────────────┐
                         │   CEO (Claude)  │
                         │   Orchestrator  │
                         └────────┬────────┘
                                  │
     ┌────────────────┬───────────┼───────────┬────────────────┐
     │                │           │           │                │
     ▼                ▼           ▼           ▼                ▼
┌─────────┐    ┌───────────┐  ┌────────┐  ┌────────┐    ┌───────────┐
│Chief of │    │ Pipeline  │  │   VP   │  │   VP   │    │    VP     │
│ Staff   │    │  Manager  │  │  Eng   │  │Product │    │Design & QA│
└────┬────┘    └─────┬─────┘  └───┬────┘  └───┬────┘    └─────┬─────┘
     │               │            │           │               │
     ▼               ▼            │           │               │
┌─────────┐    ┌───────────┐     │           │               │
│ Support │    │ Autopilot │     │           │               │
│  Agent  │    │   Agent   │     │           │               │
└─────────┘    └───────────┘     │           │               │
                                 │           │               │
     ┌───────────────────────────┘           │               │
     │                                       │               │
     ▼                                       ▼               ▼
┌──────────────────────┐      ┌─────────────────────┐  ┌──────────────────┐
│ VP Engineering Team  │      │  VP Product Team    │  │VP Design/QA Team │
├──────────────────────┤      ├─────────────────────┤  ├──────────────────┤
│ - Architect          │      │ - Product Researcher│  │ - Frontend       │
│ - Developer          │      │ - Product Manager   │  │   Designer       │
│ - DevOps Engineer    │      │ - Data Engineer     │  │ - User Testing   │
│ - Code Reviewer      │      │ - Growth Marketer   │  │ - Technical      │
│ - Security Engineer  │      │                     │  │   Writer         │
└──────────────────────┘      └─────────────────────┘  └──────────────────┘
```

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **Supabase** - Real-time database (optional)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Architecture

### Real-time Communication

The dashboard connects to Claude Code via Server-Sent Events (SSE):

1. **Chat Messages** → POST to `/api/chat`
2. **Task Updates** → SSE stream from `/api/events`
3. **Agent Status** → Real-time via Supabase Realtime (optional)

### Event Types

```typescript
type AgentEvent = 
  | { type: 'task_created'; agent: string; task: Task }
  | { type: 'task_delegated'; from: string; to: string; task: Task }
  | { type: 'task_started'; agent: string; task: Task }
  | { type: 'task_completed'; agent: string; task: Task }
  | { type: 'agent_thinking'; agent: string; thought: string }
```

## License

MIT
