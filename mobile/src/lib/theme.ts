// Theme constants for the Claude Agent Dashboard mobile app

export const colors = {
  // Background colors
  background: '#030708',
  backgroundLight: '#0a1014',
  surface: '#111820',
  surfaceLight: '#1a2530',

  // Glass effect colors
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassLight: 'rgba(255, 255, 255, 0.06)',

  // Accent colors
  accent: '#00fff0',
  accentPink: '#ff00c1',
  accentPurple: '#7000ff',
  accentGreen: '#00ff66',
  accentOrange: '#ffaa00',
  accentRed: '#ff6b6b',

  // Text colors
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.4)',

  // Status colors
  statusIdle: 'rgba(255, 255, 255, 0.3)',
  statusThinking: '#00fff0',
  statusWorking: '#00ff66',
  statusDelegating: '#ff00c1',
  statusCompleted: '#7000ff',

  // Priority colors
  priorityCritical: '#ff4444',
  priorityHigh: '#ff8800',
  priorityMedium: '#ffcc00',
  priorityLow: '#88cc00',

  // Task status colors
  taskPending: '#666666',
  taskInProgress: '#00fff0',
  taskReview: '#ffaa00',
  taskCompleted: '#00ff66',

  // Event type colors
  eventTaskCreated: '#00fff0',
  eventTaskAssigned: '#7000ff',
  eventTaskCompleted: '#00ff66',
  eventThinking: '#ffaa00',
  eventAction: '#ff00c1',
  eventError: '#ff4444',
  eventDelegation: '#ff00c1',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
} as const

export const fontWeights = {
  light: '200' as const,
  normal: '400' as const,
  semibold: '600' as const,
  bold: '800' as const,
}

// Agent tier sizes for avatars
export const agentSizes = {
  ceo: 80,
  leadership: 64,
  vp: 56,
  specialist: 48,
} as const

// Project preset colors
export const projectColors = [
  '#00fff0',
  '#ff00c1',
  '#7000ff',
  '#00ff66',
  '#ffaa00',
  '#ff6b6b',
  '#00aaff',
  '#ff6600',
  '#aa00ff',
  '#00ffaa',
] as const

// Helper to get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'idle': return colors.statusIdle
    case 'thinking': return colors.statusThinking
    case 'working': return colors.statusWorking
    case 'delegating': return colors.statusDelegating
    case 'completed': return colors.statusCompleted
    default: return colors.statusIdle
  }
}

// Helper to get priority color
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return colors.priorityCritical
    case 'high': return colors.priorityHigh
    case 'medium': return colors.priorityMedium
    case 'low': return colors.priorityLow
    default: return colors.priorityMedium
  }
}

// Helper to get task status color
export function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'pending': return colors.taskPending
    case 'in_progress': return colors.taskInProgress
    case 'review': return colors.taskReview
    case 'completed': return colors.taskCompleted
    default: return colors.taskPending
  }
}

// Helper to get event type color
export function getEventTypeColor(type: string): string {
  switch (type) {
    case 'task_created': return colors.eventTaskCreated
    case 'task_assigned': return colors.eventTaskAssigned
    case 'task_completed': return colors.eventTaskCompleted
    case 'agent_thinking': return colors.eventThinking
    case 'agent_action': return colors.eventAction
    case 'error': return colors.eventError
    case 'delegation': return colors.eventDelegation
    default: return colors.textSecondary
  }
}
