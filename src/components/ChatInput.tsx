'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { useDashboardStore } from '@/lib/store'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { generateId } from '@/lib/utils'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { getAgentResponses, getRandomResponse } from '@/lib/agentResponses'
import type { Message, Task, PipelineProject, AgentId, CEOActionType } from '@/lib/types'
import {
  detectActionsFromMessage,
  generateActionResponseText,
  createAction,
  CEO_ACTION_DEFINITIONS,
} from '@/lib/ceoActions'
import {
  findProjectByName,
  parseDeepNavigation,
  extractProjectName,
} from '@/lib/projectMatcher'

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

// Navigation intent detection
type NavigationTarget = {
  page: 'dashboard' | 'tasks' | 'agent-health' | 'skills-store' | 'settings' | null
  viewMode?: 'agents' | 'projects' | 'project'
  projectId?: string
  agentId?: string
}

function detectNavigationIntent(message: string, pipelineProjects: PipelineProject[]): NavigationTarget | null {
  const lower = message.toLowerCase().trim()

  // Tasks / Task board
  if (/\b(go to|show|open|take me to|navigate to|switch to)\b.*\b(task|tasks|task board|task operations)\b/i.test(lower) ||
      /\b(task|tasks|task board)\b.*\b(page|view|screen)\b/i.test(lower)) {
    return { page: 'tasks' }
  }

  // Settings
  if (/\b(go to|show|open|take me to|navigate to|switch to)\b.*\b(setting|settings|preferences|config)\b/i.test(lower) ||
      /\b(setting|settings)\b.*\b(page|view|screen)\b/i.test(lower)) {
    return { page: 'settings' }
  }

  // Agent Health
  if (/\b(go to|show|open|take me to|navigate to|switch to)\b.*\b(health|agent health|system health|monitoring)\b/i.test(lower) ||
      /\b(health|agent health)\b.*\b(page|view|screen|dashboard)\b/i.test(lower)) {
    return { page: 'agent-health' }
  }

  // Skills Store
  if (/\b(go to|show|open|take me to|navigate to|switch to)\b.*\b(skill|skills|skills store|store)\b/i.test(lower) ||
      /\b(skill|skills)\b.*\b(page|view|screen|store)\b/i.test(lower)) {
    return { page: 'skills-store' }
  }

  // Projects list
  if (/\b(go to|show|open|take me to|navigate to|switch to)\b.*\b(project|projects|pipeline|all projects)\b/i.test(lower) ||
      /\b(project|projects|pipeline)\b.*\b(page|view|screen|list)\b/i.test(lower)) {
    return { page: 'dashboard', viewMode: 'projects' }
  }

  // Agent Network
  if (/\b(go to|show|open|take me to|navigate to|switch to)\b.*\b(agent|agents|network|team|agent network)\b/i.test(lower) ||
      /\b(agent|agents|network)\b.*\b(page|view|screen)\b/i.test(lower)) {
    return { page: 'dashboard', viewMode: 'agents' }
  }

  // Dashboard / Home
  if (/\b(go to|show|open|take me to|navigate to|switch to)\b.*\b(home|dashboard|main|overview)\b/i.test(lower) ||
      /\b(home|dashboard)\b.*\b(page|view|screen)\b/i.test(lower) ||
      /^(go home|take me home|back to home|back to dashboard)\b/i.test(lower)) {
    return { page: 'dashboard', viewMode: 'agents' }
  }

  // Specific project by name
  const projectMatch = lower.match(/\b(go to|show|open|take me to|navigate to|switch to)\b.*\b(?:project\s+)?["']?([^"']+)["']?\s*(?:project)?\b/i)
  if (projectMatch) {
    const searchName = projectMatch[2].trim().toLowerCase()
    const project = pipelineProjects.find(p =>
      p.title.toLowerCase().includes(searchName) ||
      searchName.includes(p.title.toLowerCase())
    )
    if (project) {
      return { page: 'dashboard', viewMode: 'project', projectId: project.id }
    }
  }

  return null
}

// ===========================================
// CONVERSATION MEMORY BUFFER SYSTEM
// ===========================================

interface ConversationMemory {
  recentExchanges: Array<{
    userMessage: string
    agentResponse: string
    timestamp: Date
  }>
  lastTopic: string | null
  mentionedProjects: string[]
  mentionedAgents: string[]
  context: string
}

// Build conversation memory from recent messages
function buildConversationMemory(messages: Message[], agentId: string, maxExchanges: number = 10): ConversationMemory {
  // Filter messages for this agent's conversation
  const agentMessages = messages.filter(m =>
    m.agentId === agentId || m.targetAgentId === agentId ||
    (m.role === 'user' && !m.targetAgentId) // User messages without target go to CEO
  )

  // Get the last N exchanges (pairs of user + assistant messages)
  const exchanges: ConversationMemory['recentExchanges'] = []
  let lastUserMsg: Message | null = null

  for (const msg of agentMessages.slice(-maxExchanges * 2)) {
    if (msg.role === 'user') {
      lastUserMsg = msg
    } else if (msg.role === 'assistant' && lastUserMsg) {
      exchanges.push({
        userMessage: lastUserMsg.content,
        agentResponse: msg.content,
        timestamp: new Date(msg.timestamp),
      })
      lastUserMsg = null
    }
  }

  // Extract mentioned projects and agents from conversation
  const mentionedProjects: string[] = []
  const mentionedAgents: string[] = []
  let lastTopic: string | null = null

  // Analyze recent messages for context
  const recentText = exchanges.slice(-5).map(e => `${e.userMessage} ${e.agentResponse}`).join(' ')

  // Detect project mentions
  const projectPatterns = /\b(brainrot|tracker|project|pipeline)\b/gi
  const projectMatches = recentText.match(projectPatterns) || []
  mentionedProjects.push(...new Set(projectMatches.map(m => m.toLowerCase())))

  // Detect topic from last exchange
  if (exchanges.length > 0) {
    const lastExchange = exchanges[exchanges.length - 1]
    if (/project|pipeline|task|work/i.test(lastExchange.userMessage)) {
      lastTopic = 'projects'
    } else if (/agent|team|engineer|developer/i.test(lastExchange.userMessage)) {
      lastTopic = 'agents'
    } else if (/status|progress|update/i.test(lastExchange.userMessage)) {
      lastTopic = 'status'
    }
  }

  // Build context summary
  const contextParts: string[] = []
  if (exchanges.length > 0) {
    contextParts.push(`${exchanges.length} recent exchanges`)
  }
  if (mentionedProjects.length > 0) {
    contextParts.push(`discussed: ${mentionedProjects.join(', ')}`)
  }
  if (lastTopic) {
    contextParts.push(`last topic: ${lastTopic}`)
  }

  return {
    recentExchanges: exchanges,
    lastTopic,
    mentionedProjects,
    mentionedAgents,
    context: contextParts.join('; ') || 'new conversation',
  }
}

// Detect if message is a follow-up referencing previous conversation
function isFollowUp(message: string, memory: ConversationMemory): boolean {
  const lower = message.toLowerCase().trim()

  // Check for pronouns/references to previous context
  const followUpPatterns = [
    /^(it|that|this|they|them|those|these)\b/i,       // Starts with pronoun
    /\b(the same|same thing|that one|this one)\b/i,   // References "same"
    /^(and|also|plus|another|more|again)\b/i,         // Continuation words
    /^(what about|how about|speaking of)\b/i,         // Topic continuation
    /^(why|but|so|then)\b/i,                          // Logical continuation
    /\b(you (just |)said|you mentioned|earlier|before)\b/i, // Explicit reference
    /^(ok|okay|yes|yeah|no|nope|sure|right)\b/i,      // Affirmation/response
    /\b(instead|rather|actually)\b/i,                  // Correction/alternative
  ]

  // Only treat as follow-up if there's conversation history
  if (memory.recentExchanges.length === 0) {
    return false
  }

  return followUpPatterns.some(pattern => pattern.test(lower))
}

// Resolve pronoun references from conversation context
function resolveReferences(message: string, memory: ConversationMemory, pipelineProjects: PipelineProject[]): {
  resolvedTopic: string | null
  resolvedProject: PipelineProject | null
  resolvedContext: string
} {
  const lower = message.toLowerCase()
  let resolvedTopic: string | null = null
  let resolvedProject: PipelineProject | null = null

  // Check if "it" or "that" refers to a recently mentioned project
  if (/\b(it|that|this)\b/i.test(lower) && memory.recentExchanges.length > 0) {
    // Look through recent exchanges for project mentions
    for (const exchange of memory.recentExchanges.slice().reverse()) {
      const combinedText = `${exchange.userMessage} ${exchange.agentResponse}`

      // Try to find a project mentioned in recent conversation
      for (const project of pipelineProjects) {
        if (combinedText.toLowerCase().includes(project.title.toLowerCase())) {
          resolvedProject = project
          resolvedTopic = 'project'
          break
        }
      }
      if (resolvedProject) break
    }
  }

  // Build context description
  let resolvedContext = ''
  if (resolvedProject) {
    resolvedContext = `referring to "${resolvedProject.title}" project`
  } else if (memory.lastTopic) {
    resolvedContext = `continuing discussion about ${memory.lastTopic}`
    resolvedTopic = memory.lastTopic
  } else if (memory.recentExchanges.length > 0) {
    const lastExchange = memory.recentExchanges[memory.recentExchanges.length - 1]
    resolvedContext = `following up on: "${lastExchange.userMessage.slice(0, 50)}${lastExchange.userMessage.length > 50 ? '...' : ''}"`
  }

  return { resolvedTopic, resolvedProject, resolvedContext }
}

// Format conversation history for context-aware responses
function formatConversationContext(memory: ConversationMemory, maxHistory: number = 3): string {
  if (memory.recentExchanges.length === 0) {
    return ''
  }

  const recentHistory = memory.recentExchanges.slice(-maxHistory)
  const lines = recentHistory.map(e => {
    const userSnippet = e.userMessage.length > 60 ? e.userMessage.slice(0, 60) + '...' : e.userMessage
    return `You: "${userSnippet}"`
  })

  return `Recent conversation:\n${lines.join('\n')}`
}

// ===========================================
// END CONVERSATION MEMORY BUFFER SYSTEM
// ===========================================

// Detect if a message is requesting an action
function isActionRequest(message: string, pipelineProjects: PipelineProject[]): boolean {
  const lower = message.toLowerCase().trim()

  // Check for explicit action triggers
  const actionPatterns = [
    /\b(create|start|new|add)\s+(a\s+)?(project|pipeline)/i,
    /\b(open|view|show|go to)\s+(the\s+)?project/i,
    /\b(start|pause|resume|stop)\s+(the\s+)?pipeline/i,
    /\b(show|view|open)\s+(agents?|projects?|tasks?|settings?|dashboard)/i,
    /\bi\s+(want|need)\s+to\s+(create|start|view|open)/i,
  ]

  if (actionPatterns.some(p => p.test(lower))) {
    return true
  }

  // Check if message references a project name (fuzzy match)
  const projectName = extractProjectName(message)
  if (projectName) {
    const match = findProjectByName(projectName, pipelineProjects)
    if (match && match.confidence > 0.5) {
      return true
    }
  }

  return false
}

// Detect message intent
function detectIntent(message: string, memory?: ConversationMemory, pipelineProjects?: PipelineProject[]): 'greeting' | 'status' | 'task' | 'question' | 'casual' | 'project' | 'navigation' | 'follow_up' | 'action_request' {
  const lower = message.toLowerCase().trim()

  // Check for action requests (CEO-specific actions)
  if (pipelineProjects && isActionRequest(message, pipelineProjects)) {
    return 'action_request'
  }

  // Check for navigation intent first
  if (/\b(go to|show me|open|take me to|navigate to|switch to|back to)\b/i.test(lower)) {
    return 'navigation'
  }

  // Check for project-related queries first
  if (isProjectQuery(message)) {
    return 'project'
  }

  // Check for conversational follow-up if we have memory
  if (memory && isFollowUp(message, memory)) {
    return 'follow_up'
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

// Build context string describing what user is currently viewing
function buildViewContext(state: {
  currentPage: string
  mainViewMode: string
  selectedAgentId: string | null
  selectedPipelineProjectId: string | null
  pipelineProjects: PipelineProject[]
  agents: { id: string; displayName: string }[]
}): string {
  const { currentPage, mainViewMode, selectedAgentId, selectedPipelineProjectId, pipelineProjects, agents } = state

  const parts: string[] = []

  // Describe current page
  switch (currentPage) {
    case 'dashboard':
      if (mainViewMode === 'projects') {
        parts.push('viewing the Projects list')
      } else if (mainViewMode === 'project' && selectedPipelineProjectId) {
        const project = pipelineProjects.find(p => p.id === selectedPipelineProjectId)
        if (project) {
          parts.push(`viewing the "${project.title}" project (Stage: ${project.stage}, Status: ${project.status})`)
        } else {
          parts.push('viewing a project detail page')
        }
      } else if (mainViewMode === 'agents') {
        parts.push('viewing the Agent Network')
      } else {
        parts.push('on the main dashboard')
      }
      break
    case 'tasks':
      parts.push('viewing the Task Operations board')
      break
    case 'agent-health':
      parts.push('viewing the Agent Health dashboard')
      break
    case 'skills-store':
      parts.push('browsing the Skills Store')
      break
    case 'settings':
      parts.push('in the Settings page')
      break
    default:
      parts.push('on the dashboard')
  }

  // Add agent selection context
  if (selectedAgentId) {
    const agent = agents.find(a => a.id === selectedAgentId)
    if (agent) {
      parts.push(`with ${agent.displayName}'s panel open`)
    }
  }

  return parts.join(', ')
}

export function ChatInput() {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const {
    addMessage,
    addTask,
    updateAgentStatus,
    setStreaming,
    messages,
    selectedAgentId,
    pipelineProjects,
    agents,
    currentPage,
    mainViewMode,
    selectedPipelineProjectId,
    setCurrentPage,
    setMainViewMode,
    setSelectedPipelineProject,
  } = useDashboardStore()
  const hasAgentPanelRight = !!selectedAgentId
  const { saveMessage, saveTask, isConfigured } = useSupabase()
  const { playMessageSend, playMessageReceive } = useSoundEffects()

  // Build current view context for AI awareness
  const viewContext = buildViewContext({
    currentPage,
    mainViewMode,
    selectedAgentId,
    selectedPipelineProjectId,
    pipelineProjects,
    agents,
  })

  // Get current chat agent - selected agent or CEO
  const currentChatAgent = selectedAgentId
    ? agents.find(a => a.id === selectedAgentId)
    : agents.find(a => a.id === 'ceo')

  const chatAgentId = (currentChatAgent?.id || 'ceo') as AgentId
  const chatAgentName = currentChatAgent?.displayName || 'CEO'
  const chatAgentColor = currentChatAgent?.color || '#00fff0'
  const agentResponses = getAgentResponses(chatAgentId)

  // Check if a project with custom background is selected
  const selectedProject = selectedPipelineProjectId
    ? pipelineProjects.find(p => p.id === selectedPipelineProjectId)
    : null
  const hasCustomBackground = selectedProject && (
    (selectedProject.backgroundPreset && selectedProject.backgroundPreset !== 'none') ||
    selectedProject.backgroundColor
  )

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

    // Build conversation memory for context-aware responses
    const conversationMemory = buildConversationMemory(messages, chatAgentId)

    // Detect intent with memory context and pipeline projects
    const intent = detectIntent(trimmed, conversationMemory, pipelineProjects)

    setTimeout(async () => {
      let responseContent: string
      let shouldCreateTask = false
      let responseActions: CEOActionType[] = []

      switch (intent) {
        case 'action_request': {
          // Handle action requests with action buttons
          if (chatAgentId === 'ceo') {
            // Detect actions from the message
            const detectedActions = detectActionsFromMessage(
              trimmed,
              pipelineProjects,
              selectedPipelineProjectId
            )

            // Also check for project-specific actions
            const projectName = extractProjectName(trimmed)
            if (projectName) {
              const projectMatch = findProjectByName(projectName, pipelineProjects)
              if (projectMatch && projectMatch.confidence > 0.5) {
                // Add project view action if not already present
                const viewAction = createAction('project:view', { projectId: projectMatch.project.id })
                if (viewAction && !detectedActions.some(a => a.id === 'project:view')) {
                  detectedActions.unshift({
                    ...viewAction,
                    label: `View ${projectMatch.project.title}`,
                  })
                }
              }
            }

            // Check for deep navigation targets (stage-specific)
            const deepNav = parseDeepNavigation(trimmed, pipelineProjects,
              selectedPipelineProjectId ? pipelineProjects.find(p => p.id === selectedPipelineProjectId) : null
            )
            if (deepNav && deepNav.targetType === 'stage') {
              const stageAction = createAction('project:view-stage', {
                projectId: deepNav.projectId,
                stageIndex: deepNav.stageIndex,
              })
              if (stageAction) {
                const project = pipelineProjects.find(p => p.id === deepNav.projectId)
                const stageName = project ? ['Intake', 'Research', 'Planning', 'Architecture', 'Design', 'Development', 'Testing', 'Security', 'Documentation', 'Launched'][deepNav.stageIndex || 0] : 'stage'
                detectedActions.unshift({
                  ...stageAction,
                  label: `View ${stageName}`,
                })
              }
            }

            // Limit to max 4 actions for clean UX
            responseActions = detectedActions.slice(0, 4)

            // Generate contextual response text
            if (responseActions.length > 0) {
              responseContent = generateActionResponseText(trimmed, responseActions, pipelineProjects)
              if (!responseContent) {
                responseContent = "I can help with that! Click an action below to proceed."
              }
            } else {
              // Fallback to navigation-style response
              responseContent = `I understand you want to take an action. You can ask me to:\n\n• **Create a project** - Start something new\n• **View a project** - Open any project by name\n• **Start/pause pipeline** - Control project execution\n• **Navigate** - Go to tasks, settings, or agent views\n\nWhat would you like to do?`
            }
          } else {
            responseContent = `I can acknowledge your request, but the CEO handles actions like this. Try asking the CEO directly!`
          }
          break
        }
        case 'follow_up':
          // Handle conversational follow-ups with context
          if (chatAgentId === 'ceo') {
            const { resolvedTopic, resolvedProject, resolvedContext } = resolveReferences(trimmed, conversationMemory, pipelineProjects)

            if (resolvedProject) {
              // User is asking about a previously mentioned project
              const p = resolvedProject
              const progressBar = `[${'█'.repeat(Math.floor(p.progress * 10))}${'░'.repeat(10 - Math.floor(p.progress * 10))}]`
              responseContent = `Ah yes, **${p.title}**! ${progressBar} ${Math.round(p.progress * 100)}% complete.\n\nIt's currently in the **${p.stage}** stage with ${p.agent} assigned. Status: ${p.status}${p.blockers ? `\n\n⚠️ Blocker: ${p.blockers}` : ''}\n\nWhat would you like to know or do with it?`
            } else if (resolvedContext) {
              // General follow-up referencing previous conversation
              const lastExchange = conversationMemory.recentExchanges[conversationMemory.recentExchanges.length - 1]
              if (lastExchange) {
                // Smart follow-up response based on previous context
                if (/\b(yes|yeah|ok|okay|sure|yep|right)\b/i.test(trimmed)) {
                  responseContent = `Got it! I'll proceed with that. ${getRandomResponse(agentResponses.acknowledgment)}`
                } else if (/\b(no|nope|nah|not really|never mind)\b/i.test(trimmed)) {
                  responseContent = `No problem, we can leave that for now. Is there something else I can help with?`
                } else if (/\b(why|how come|explain)\b/i.test(trimmed)) {
                  responseContent = `Good question! ${resolvedContext}. Would you like me to go into more detail, or would you prefer I focus on something specific?`
                } else if (/\b(what about|how about|and)\b/i.test(trimmed)) {
                  responseContent = `Building on our conversation - ${resolvedContext}. What aspect would you like to explore?`
                } else {
                  responseContent = `I understand you're ${resolvedContext}. Let me help with that. What specifically would you like to do?`
                }
              } else {
                responseContent = `I'm following along. ${getRandomResponse(agentResponses.clarification)}`
              }
            } else {
              responseContent = `I'm with you. ${getRandomResponse(agentResponses.clarification)}`
            }
          } else {
            responseContent = getRandomResponse(agentResponses.clarification)
          }
          break
        case 'greeting':
          // CEO acknowledges what user is viewing
          if (chatAgentId === 'ceo') {
            // Add memory context to greeting if we have history
            const memoryNote = conversationMemory.recentExchanges.length > 0
              ? ` Good to continue our conversation!`
              : ''
            responseContent = `Hey Ben!${memoryNote} I see you're ${viewContext}. ${getRandomResponse(agentResponses.greeting).replace(/^(Hey|Hi|Hello)[^.!]*[.!]\s*/i, '')}`
          } else {
            responseContent = getRandomResponse(agentResponses.greeting)
          }
          break
        case 'status':
          // Status questions only make sense for CEO, for other agents use greeting
          if (chatAgentId === 'ceo') {
            const activeCount = pipelineProjects.filter(p => p.status === 'In Progress').length
            const blockedCount = pipelineProjects.filter(p => p.status === 'Blocked').length
            let statusMsg = `I see you're ${viewContext}. `
            if (blockedCount > 0) {
              statusMsg += `⚠️ There ${blockedCount === 1 ? 'is' : 'are'} ${blockedCount} blocked project${blockedCount === 1 ? '' : 's'} that may need attention. `
            }
            statusMsg += `We have ${activeCount} project${activeCount === 1 ? '' : 's'} actively in progress. The team is standing by and ready for tasks.`
            responseContent = statusMsg
          } else {
            responseContent = getRandomResponse(agentResponses.greeting)
          }
          break
        case 'navigation':
          // Handle navigation requests (CEO only)
          if (chatAgentId === 'ceo') {
            const navTarget = detectNavigationIntent(trimmed, pipelineProjects)
            if (navTarget) {
              // Execute navigation
              if (navTarget.page) {
                setCurrentPage(navTarget.page)
              }
              if (navTarget.viewMode) {
                setMainViewMode(navTarget.viewMode)
              }
              if (navTarget.projectId) {
                setSelectedPipelineProject(navTarget.projectId)
              }

              // Build response based on where we navigated
              const pageNames: Record<string, string> = {
                'dashboard': 'Dashboard',
                'tasks': 'Task Operations',
                'agent-health': 'Agent Health',
                'skills-store': 'Skills Store',
                'settings': 'Settings',
              }
              const viewNames: Record<string, string> = {
                'agents': 'Agent Network',
                'projects': 'Projects',
                'project': 'project detail',
              }

              let navDescription = pageNames[navTarget.page || 'dashboard']
              if (navTarget.viewMode && navTarget.page === 'dashboard') {
                if (navTarget.viewMode === 'project' && navTarget.projectId) {
                  const project = pipelineProjects.find(p => p.id === navTarget.projectId)
                  navDescription = project ? `the "${project.title}" project` : 'the project'
                } else {
                  navDescription = viewNames[navTarget.viewMode] || navDescription
                }
              }

              responseContent = `Taking you to ${navDescription} now! 🚀`
            } else {
              responseContent = `I'm not sure where you want to go. You can ask me to navigate to:\n\n• **Tasks** - Task Operations board\n• **Projects** - All projects in the pipeline\n• **Agents** - Agent Network view\n• **Health** - Agent Health dashboard\n• **Skills** - Skills Store\n• **Settings** - App settings\n\nOr name a specific project to open it.`
            }
          } else {
            responseContent = `I can't navigate for you, but you can ask the CEO to help with that!`
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
          if (chatAgentId === 'ceo') {
            responseContent = `Got it! While you're ${viewContext}, I'll get this set up. ${getRandomResponse(agentResponses.acknowledgment)}`
          } else {
            responseContent = getRandomResponse(agentResponses.acknowledgment)
          }
          break
        case 'question':
        default:
          // For questions and general messages, call the AI API with context
          if (chatAgentId === 'ceo') {
            try {
              // Get the selected project for context
              const selectedProject = selectedPipelineProjectId
                ? pipelineProjects.find(p => p.id === selectedPipelineProjectId)
                : null

              // Build recent messages for context
              const recentMessages = messages.slice(-6).map(m => ({
                role: m.role,
                content: m.content.slice(0, 200) // Truncate for context window
              }))

              const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: trimmed,
                  context: {
                    project: selectedProject,
                    recentMessages,
                    viewContext,
                  }
                }),
              })

              if (response.ok) {
                const data = await response.json()
                responseContent = data.content || data.fallbackContent || getRandomResponse(agentResponses.clarification)
              } else {
                responseContent = `I see you're ${viewContext}. ${getRandomResponse(agentResponses.clarification)}`
              }
            } catch (error) {
              console.error('AI chat error:', error)
              responseContent = `I see you're ${viewContext}. ${getRandomResponse(agentResponses.clarification)}`
            }
          } else {
            responseContent = getRandomResponse(agentResponses.clarification)
          }
      }

      // Add agent response (include actions if present)
      const agentResponse: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        agentId: chatAgentId,
        ...(responseActions.length > 0 && { actions: responseActions }),
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
  }, [value, addMessage, addTask, updateAgentStatus, setStreaming, saveMessage, saveTask, isConfigured, messages, playMessageSend, playMessageReceive, pipelineProjects, chatAgentId, agentResponses, selectedPipelineProjectId, viewContext])

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
        background: hasCustomBackground
          ? 'rgba(10, 8, 6, 0.6)'
          : `linear-gradient(180deg, ${chatAgentColor}05 0%, var(--bg-surface) 100%)`,
        backdropFilter: hasCustomBackground ? 'blur(40px) saturate(180%)' : undefined,
        WebkitBackdropFilter: hasCustomBackground ? 'blur(40px) saturate(180%)' : undefined,
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
