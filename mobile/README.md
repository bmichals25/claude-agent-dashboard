# Claude Agent Dashboard - Mobile App

A React Native (Expo) mobile application for visualizing and interacting with Claude Code's 18-agent orchestration system.

## Features

- **Agent Network Visualization**: Interactive SVG-based network showing all 18 agents and their hierarchical connections
- **Animated Agent Avatars**: Morphing blob avatars with blinking eyes and status indicators
- **Real-time Chat**: Send messages to the CEO agent and receive responses
- **Task Management**: View tasks in list or kanban view, with filtering and sorting
- **Event Log**: Real-time activity feed showing agent actions and delegations
- **Agent Details**: Detailed view of each agent with hierarchy, tools, and task statistics

## Tech Stack

- **Expo** ~52.0.0 with Expo Router for navigation
- **React Native** 0.76.3
- **TypeScript** for type safety
- **Zustand** for state management
- **React Native Reanimated** for smooth animations
- **React Native SVG** for network visualization
- **Supabase** for optional data persistence

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your mobile device (for development)

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure Supabase for data persistence:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Supabase credentials.

4. Start the development server:
   ```bash
   npm start
   ```

5. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigator screens
│   │   ├── _layout.tsx    # Tab bar configuration
│   │   ├── index.tsx      # Network screen (home)
│   │   ├── chat.tsx       # Chat screen
│   │   ├── tasks.tsx      # Tasks screen
│   │   └── events.tsx     # Events screen
│   ├── agent/
│   │   └── [id].tsx       # Agent detail modal
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable components
│   │   ├── AgentAvatar.tsx
│   │   ├── AgentNetwork.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── EventLog.tsx
│   │   ├── StatusIndicator.tsx
│   │   └── TaskBoard.tsx
│   └── lib/               # Utilities and state
│       ├── agentCatalog.ts
│       ├── store.ts
│       ├── supabase.ts
│       ├── theme.ts
│       ├── types.ts
│       └── utils.ts
├── assets/                # App icons and splash
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## Screens

### Network (Home)
The main visualization showing all 18 agents connected in a hierarchical graph. Tap any agent to view their details.

### Chat
Communicate with the CEO agent. Messages automatically create tasks that flow through the agent hierarchy.

### Tasks
View and manage tasks in either list or kanban mode. Tasks show:
- Priority level
- Assigned agent
- Progress bar
- Stream of consciousness (agent thoughts/actions)

### Events
Real-time activity log showing all agent events:
- Task creation/completion
- Agent delegation
- Thinking/action updates
- Errors

## Agent Hierarchy

```
CEO (Claude)
├── Chief of Staff
│   └── Support Agent
├── Pipeline Manager
│   └── Autopilot Agent
├── VP Engineering
│   ├── Architect
│   ├── Developer
│   ├── DevOps Engineer
│   ├── Code Reviewer
│   └── Security Engineer
├── VP Product
│   ├── Product Researcher
│   ├── Product Manager
│   ├── Data Engineer
│   └── Growth Marketer
└── VP Design & QA
    ├── Frontend Designer
    ├── User Testing
    └── Technical Writer
```

## Building for Production

### Android
```bash
npx expo build:android
# or for EAS Build
npx eas build --platform android
```

### iOS
```bash
npx expo build:ios
# or for EAS Build
npx eas build --platform ios
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## License

MIT
