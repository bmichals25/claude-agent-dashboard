'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { generateId } from '@/lib/utils'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { getAgentResponses, getRandomResponse } from '@/lib/agentResponses'
import type { Message, Task, PipelineProject, AgentId } from '@/lib/types'

// Detect if a message is likely a task request
function isLikelyTaskRequest(message: string): boolean {
  const taskIndicators = [
    /^(create|make|build|implement|add|fix|update|change|modify|remove|delete|write|design|develop)/i,
    /^(can you|could you|please|i need|i want|help me)/i,
    /\b(task|todo|feature|bug|issue)\b/i,
    /^(do|run|execute|deploy|test|review)/i,
  ]
  return taskIndicators.some(pattern => pattern.test(message.trim()))
}

// Detect if message is about projects
function isProjectQuery(message: string): 'list' | 'blocked' | 'active' | 'detail' | 'summary' | null {
  const lower = message.toLowerCase().trim()

  if (/\b(list|show|all|every)\b.*\b(project|pipeline)/i.test(lower) || /\bproject(s)?\b/i.test(lower) && /\b(list|show|all|what)\b/i.test(lower)) {
    return 'list'
  }
  if (/\b(blocked|blocker|stuck|issue|problem)\b/i.test(lower)) {
    return 'blocked'
  }
  if (/\b(active|in progress|ongoing|current|working)\b/i.test(lower)) {
    return 'active'
  }
  if (/\b(summary|overview|status|report)\b.*\b(project|pipeline)/i.test(lower) || /\b(pipeline|project)\b.*\b(summary|overview|status|report)\b/i.test(lower)) {
    return 'summary'
  }
  if (/\b(detail|about|tell me|info|information)\b.*\b(project)/i.test(lower)) {
    return 'detail'
  }
  return null
}

// Format project list for display
function formatProjectList(projects: PipelineProject[]): string {
  if (projects.length === 0) {
    return "There are no projects in the pipeline currently."
  }

  const lines = projects.map((p, i) => {
    const statusEmoji = p.status === 'Blocked' ? '🔴' : p.status === 'Review' ? '🟡' : p.status === 'Complete' ? '✅' : '🟢'
    return `${i + 1}. **${p.title}** ${statusEmoji}\n   Stage: ${p.stage} | Agent: ${p.agent} | Priority: ${p.priority}`
  })

  return `Here are all ${projects.length} projects in the pipeline:\n\n${lines.join('\n\n')}`
}

// Format blocked projects
function formatBlockedProjects(projects: PipelineProject[]): string {
  const blocked = projects.filter(p => p.status === 'Blocked')

  if (blocked.length === 0) {
    return "Great news! There are no blocked projects right now. All systems are flowing smoothly."
  }

  const lines = blocked.map(p => {
    return `🔴 **${p.title}**\n   Blocker: ${p.blockers || 'Not specified'}\n   Stage: ${p.stage} | Agent: ${p.agent}`
  })

  return `There ${blocked.length === 1 ? 'is' : 'are'} ${blocked.length} blocked project${blocked.length === 1 ? '' : 's'}:\n\n${lines.join('\n\n')}\n\nI can help escalate or reassign these if needed.`
}

// Format active projects
function formatActiveProjects(projects: PipelineProject[]): string {
  const active = projects.filter(p => p.isActive && p.status !== 'Complete')

  if (active.length === 0) {
    return "There are no active projects at the moment. Ready to start something new?"
  }

  const lines = active.map(p => {
    const progressBar = `[${'█'.repeat(Math.floor(p.progress * 10))}${'░'.repeat(10 - Math.floor(p.progress * 10))}]`
    return `🟢 **${p.title}**\n   ${progressBar} ${Math.round(p.progress * 100)}%\n   Stage: ${p.stage} | Agent: ${p.agent}`
  })

  return `There ${active.length === 1 ? 'is' : 'are'} ${active.length} active project${active.length === 1 ? '' : 's'}:\n\n${lines.join('\n\n')}`
}

// Format pipeline summary
function formatPipelineSummary(projects: PipelineProject[]): string {
  const total = projects.length
  const active = projects.filter(p => p.isActive).length
  const blocked = projects.filter(p => p.status === 'Blocked').length
  const review = projects.filter(p => p.status === 'Review').length
  const complete = projects.filter(p => p.status === 'Complete').length
  const inProgress = projects.filter(p => p.status === 'In Progress').length

  const criticalCount = projects.filter(p => p.priority === 'Critical').length
  const highCount = projects.filter(p => p.priority === 'High').length

  let summary = `**Pipeline Overview**\n\n`
  summary += `📊 **Total Projects:** ${total}\n`
  summary += `🟢 **Active:** ${active}\n`
  summary += `⏳ **In Progress:** ${inProgress}\n`
  summary += `🟡 **Awaiting Review:** ${review}\n`
  summary += `🔴 **Blocked:** ${blocked}\n`
  summary += `✅ **Complete:** ${complete}\n\n`

  if (criticalCount > 0 || highCount > 0) {
    summary += `**Priority Alerts:**\n`
    if (criticalCount > 0) summary += `🚨 ${criticalCount} critical priority project${criticalCount === 1 ? '' : 's'}\n`
    if (highCount > 0) summary += `⚠️ ${highCount} high priority project${highCount === 1 ? '' : 's'}\n`
  }

  if (blocked > 0) {
    const blockedProjects = projects.filter(p => p.status === 'Blocked')
    summary += `\n**Blocked Projects Requiring Attention:**\n`
    blockedProjects.forEach(p => {
      summary += `- ${p.title}: ${p.blockers || 'No blocker details'}\n`
    })
  }

  return summary
}

// Detect message intent
function detectIntent(message: string): 'greeting' | 'status' | 'task' | 'question' | 'casual' | 'project' {
  const lower = message.toLowerCase().trim()

  // Check for project-related queries first
  if (isProjectQuery(message)) {
    return 'project'
  }

  if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy|yo)\b/i.test(lower)) {
    return 'greeting'
  }
  if (/\b(status|how are you|what's happening|what's going on|update|report)\b/i.test(lower)) {
    return 'status'
  }
  if (isLikelyTaskRequest(message)) {
    return 'task'
  }
  if (/\?$/.test(message.trim()) || /^(what|how|why|when|where|who|which|can|could|is|are|do|does)\b/i.test(lower)) {
    return 'question'
  }
  return 'casual'
}

export function ChatInput() {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { addMessage, addTask, updateAgentStatus, setStreaming, messages, selectedAgentId, pipelineProjects, agents } = useDashboardStore()
  const hasAgentPanelRight = !!selectedAgentId
  const { saveMessage, saveTask, isConfigured } = useSupabase()
  const { playMessageSend, playMessageReceive } = useSoundEffects()

  // Get current chat agent - selected agent or CEO
  const currentChatAgent = selectedAgentId
    ? agents.find(a => a.id === selectedAgentId)
    : agents.find(a => a.id === 'ceo')

  const chatAgentId = (currentChatAgent?.id || 'ceo') as AgentId
  const chatAgentName = currentChatAgent?.displayName || 'CEO'
  const chatAgentColor = currentChatAgent?.color || '#00fff0'
  const agentResponses = getAgentResponses(chatAgentId)

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed) return

    // Play iMessage-style send swoosh
    playMessageSend()

    // Add user message with targetAgentId
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      targetAgentId: chatAgentId,
    }
    addMessage(userMessage)
    setValue('')

    // Persist to Supabase
    if (isConfigured) {
      await saveMessage(userMessage)
    }

    // Simulate agent thinking
    updateAgentStatus(chatAgentId, 'thinking')
    setStreaming(true)

    // Detect intent and respond appropriately
    const intent = detectIntent(trimmed)

    setTimeout(async () => {
      let responseContent: string
      let shouldCreateTask = false

      switch (intent) {
        case 'greeting':
          responseContent = getRandomResponse(agentResponses.greeting)
          break
        case 'status':
          // Status questions only make sense for CEO, for other agents use greeting
          if (chatAgentId === 'ceo') {
            responseContent = "All systems operational. The team is standing by and ready for tasks."
          } else {
            responseContent = getRandomResponse(agentResponses.greeting)
          }
          break
        case 'project':
          // Handle project-related queries with real data (CEO handles these)
          const projectQueryType = isProjectQuery(trimmed)
          switch (projectQueryType) {
            case 'list':
              responseContent = formatProjectList(pipelineProjects)
              break
            case 'blocked':
              responseContent = formatBlockedProjects(pipelineProjects)
              break
            case 'active':
              responseContent = formatActiveProjects(pipelineProjects)
              break
            case 'summary':
              responseContent = formatPipelineSummary(pipelineProjects)
              break
            default:
              responseContent = formatPipelineSummary(pipelineProjects)
          }
          break
        case 'task':
          shouldCreateTask = true
          responseContent = getRandomResponse(agentResponses.acknowledgment)
          break
        case 'question':
          responseContent = getRandomResponse(agentResponses.clarification)
          break
        default:
          responseContent = getRandomResponse(agentResponses.greeting)
      }

      // Add agent response
      const agentResponse: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        agentId: chatAgentId,
      }
      addMessage(agentResponse)

      // Play iMessage-style receive ding for response
      playMessageReceive()

      if (isConfigured) {
        await saveMessage(agentResponse)
      }

      // If it's a task request, create the task after a brief delay
      if (shouldCreateTask) {
        setTimeout(async () => {
          const taskTitle = trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed

          const task: Task = {
            id: generateId(),
            title: taskTitle,
            description: trimmed,
            status: 'pending',
            priority: 'medium',
            assignedTo: chatAgentId,
            delegatedFrom: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt: undefined,
            projectId: null,
            streamOutput: [],
            progress: 0,
          }
          addTask(task)

          // Play iMessage-style receive sound for response
          playMessageReceive()

          if (isConfigured) {
            await saveTask(task)
          }

          // Confirm task creation
          const confirmMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: agentResponses.taskCreated(taskTitle),
            timestamp: new Date(),
            agentId: chatAgentId,
          }
          addMessage(confirmMessage)

          if (isConfigured) {
            await saveMessage(confirmMessage)
          }

          updateAgentStatus(chatAgentId, 'idle')
          setStreaming(false)
        }, 800)
      } else {
        updateAgentStatus(chatAgentId, 'idle')
        setStreaming(false)
      }
    }, 600)
  }, [value, addMessage, addTask, updateAgentStatus, setStreaming, saveMessage, saveTask, isConfigured, messages, playMessageSend, playMessageReceive, pipelineProjects, chatAgentId, agentResponses])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="transition-all duration-300"
      style={{
        padding: '12px 16px 16px 16px',
        background: `linear-gradient(180deg, ${chatAgentColor}05 0%, var(--bg-surface) 100%)`,
        borderRadius: hasAgentPanelRight ? '0 0 0 16px' : '0 0 16px 16px',
        border: '1px solid var(--glass-border)',
        borderTop: 'none',
        borderRight: hasAgentPanelRight ? 'none' : undefined,
        marginTop: '-1px',
      }}
    >
      <motion.div
        className="relative"
        style={{
          borderRadius: '12px',
          border: isFocused ? `1px solid ${chatAgentColor}50` : '1px solid var(--glass-border)',
          background: 'var(--bg-surface)',
          transition: 'border-color 0.2s ease',
        }}
        animate={{
          boxShadow: isFocused
            ? `0 0 20px ${chatAgentColor}20`
            : `0 0 0px ${chatAgentColor}00`,
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Message ${chatAgentName}...`}
          rows={2}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--text-main)',
            fontFamily: 'inherit',
          }}
        />
      </motion.div>

      <div className="flex items-center justify-between mt-4 gap-3">
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'ui-monospace, monospace',
            color: 'var(--text-muted)',
          }}
        >
          {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
        </span>

        <motion.button
          onClick={handleSubmit}
          disabled={!value.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            background: value.trim() ? chatAgentColor : 'var(--glass)',
            color: value.trim() ? 'var(--bg)' : 'var(--text-muted)',
            border: 'none',
            cursor: value.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            boxShadow: value.trim() ? `0 0 15px ${chatAgentColor}40` : 'none',
          }}
          whileHover={value.trim() ? { scale: 1.02 } : {}}
          whileTap={value.trim() ? { scale: 0.98 } : {}}
        >
          Send
        </motion.button>
      </div>
    </div>
  )
}
