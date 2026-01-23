import { AgentTier } from './types'
import { agentSizes } from './theme'

// Generate UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Format timestamp for display
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Format relative time (e.g., "2 minutes ago")
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(d)
}

// Get avatar size based on agent tier
export function getAvatarSize(tier: AgentTier): number {
  return agentSizes[tier] || agentSizes.specialist
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// Capitalize first letter
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Format agent ID to display name (e.g., "vp_engineering" -> "VP Engineering")
export function formatAgentName(agentId: string): string {
  return agentId
    .split('_')
    .map(word => {
      if (word.toLowerCase() === 'vp' || word.toLowerCase() === 'ceo') {
        return word.toUpperCase()
      }
      return capitalize(word)
    })
    .join(' ')
}

// Get priority label
export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
  return labels[priority] || priority
}

// Get status label
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    review: 'Review',
    completed: 'Completed',
    idle: 'Idle',
    thinking: 'Thinking',
    working: 'Working',
    delegating: 'Delegating',
  }
  return labels[status] || status
}

// Get event type icon name (for @expo/vector-icons)
export function getEventTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    task_created: 'add-circle',
    task_assigned: 'person-add',
    task_completed: 'checkmark-circle',
    agent_thinking: 'bulb',
    agent_action: 'flash',
    error: 'alert-circle',
    delegation: 'arrow-forward-circle',
  }
  return icons[type] || 'ellipse'
}

// Clamp a number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Linear interpolation
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}
