'use client'

import { motion } from 'motion/react'
import {
  Plus,
  Eye,
  LayoutDashboard,
  ListTodo,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Users,
  FolderKanban,
  Loader2,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import type { CEOActionType as CEOAction } from '@/lib/types'

// Icon mapping for action types
const ACTION_ICONS: Record<string, LucideIcon> = {
  'project:create': Plus,
  'project:view': Eye,
  'project:view-stage': Eye,
  'project:view-deliverable': Eye,
  'navigate:dashboard': LayoutDashboard,
  'navigate:tasks': ListTodo,
  'navigate:settings': Settings,
  'pipeline:start': Play,
  'pipeline:pause': Pause,
  'pipeline:resume': Play,
  'ui:show-agents': Users,
  'ui:show-projects': FolderKanban,
}

interface ActionButtonProps {
  action: CEOAction
  onClick: (action: CEOAction) => void
  isExecuting?: boolean
  isCompleted?: boolean
  variant?: 'primary' | 'secondary'
}

export function ActionButton({
  action,
  onClick,
  isExecuting = false,
  isCompleted = false,
  variant = 'primary',
}: ActionButtonProps) {
  const Icon = ACTION_ICONS[action.id] || Plus
  const agentColor = '#00fff0' // CEO cyan

  const handleClick = () => {
    if (!isExecuting && !isCompleted) {
      onClick(action)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isExecuting || isCompleted}
      className="action-button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '10px',
        background: isCompleted
          ? 'rgba(34, 197, 94, 0.1)'
          : variant === 'primary'
          ? `linear-gradient(135deg, ${agentColor}15, ${agentColor}08)`
          : 'rgba(255, 255, 255, 0.04)',
        border: isCompleted
          ? '1px solid rgba(34, 197, 94, 0.3)'
          : `1px solid ${agentColor}30`,
        color: isCompleted ? '#22c55e' : agentColor,
        fontSize: '12px',
        fontWeight: 500,
        cursor: isExecuting || isCompleted ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: isExecuting ? 0.8 : 1,
      }}
      whileHover={
        !isExecuting && !isCompleted
          ? {
              background: `${agentColor}20`,
              boxShadow: `0 0 20px ${agentColor}20`,
              y: -1,
            }
          : {}
      }
      whileTap={!isExecuting && !isCompleted ? { scale: 0.98 } : {}}
    >
      {isExecuting ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 style={{ width: '14px', height: '14px' }} />
        </motion.div>
      ) : isCompleted ? (
        <CheckCircle2 style={{ width: '14px', height: '14px' }} />
      ) : (
        <Icon style={{ width: '14px', height: '14px' }} />
      )}
      <span>{action.label}</span>
    </motion.button>
  )
}

// Container for multiple action buttons in a message
interface ActionButtonGroupProps {
  actions: CEOAction[]
  onActionClick: (action: CEOAction) => void
  executingActionId?: string | null
  completedActionIds?: Set<string>
}

export function ActionButtonGroup({
  actions,
  onActionClick,
  executingActionId,
  completedActionIds = new Set(),
}: ActionButtonGroupProps) {
  if (!actions || actions.length === 0) return null

  return (
    <motion.div
      className="flex flex-wrap gap-2 mt-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    >
      {actions.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          onClick={onActionClick}
          isExecuting={executingActionId === action.id}
          isCompleted={completedActionIds.has(action.id)}
          variant={actions.indexOf(action) === 0 ? 'primary' : 'secondary'}
        />
      ))}
    </motion.div>
  )
}

// Inline action status indicator (Cursor-style feedback)
interface ActionStatusProps {
  action: string
  status: 'executing' | 'completed' | 'failed'
}

export function ActionStatus({ action, status }: ActionStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'executing':
        return '#00fff0'
      case 'completed':
        return '#22c55e'
      case 'failed':
        return '#ef4444'
      default:
        return '#00fff0'
    }
  }

  return (
    <motion.div
      className="flex items-center gap-2"
      style={{
        padding: '8px 12px',
        borderRadius: '8px',
        background: `${getStatusColor()}08`,
        borderLeft: `2px solid ${getStatusColor()}`,
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {status === 'executing' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 style={{ width: '14px', height: '14px', color: getStatusColor() }} />
        </motion.div>
      )}
      {status === 'completed' && (
        <CheckCircle2 style={{ width: '14px', height: '14px', color: getStatusColor() }} />
      )}
      {status === 'failed' && (
        <span style={{ color: getStatusColor() }}>×</span>
      )}
      <span>
        {status === 'executing' ? `${action}...` : action}
      </span>
    </motion.div>
  )
}
