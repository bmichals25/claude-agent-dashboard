import type { NavigationPage, PipelineProject, CEOActionType, CEOActionCategory } from './types'

// Re-export the action type for convenience
export type CEOAction = CEOActionType

export interface CEOActionDefinition {
  id: string
  label: string
  category: CEOActionCategory
  triggerPhrases: string[]
  requiresProject?: boolean
  requiresStage?: boolean
}

// Core action definitions
export const CEO_ACTION_DEFINITIONS: Record<string, CEOActionDefinition> = {
  // Navigation Actions
  'navigate:dashboard': {
    id: 'navigate:dashboard',
    label: 'Go to Dashboard',
    category: 'navigation',
    triggerPhrases: ['dashboard', 'home', 'main view', 'main page', 'go home'],
  },
  'navigate:tasks': {
    id: 'navigate:tasks',
    label: 'Go to Tasks',
    category: 'navigation',
    triggerPhrases: ['tasks', 'task board', 'my tasks', 'task operations', 'todo'],
  },
  'navigate:settings': {
    id: 'navigate:settings',
    label: 'Go to Settings',
    category: 'navigation',
    triggerPhrases: ['settings', 'preferences', 'config', 'configuration'],
  },

  // Project Actions
  'project:create': {
    id: 'project:create',
    label: 'Create New Project',
    category: 'project',
    triggerPhrases: ['new project', 'create project', 'start project', 'create a project', 'add project'],
  },
  'project:view': {
    id: 'project:view',
    label: 'View Project',
    category: 'project',
    triggerPhrases: ['view project', 'open project', 'show project', 'go to project'],
    requiresProject: true,
  },
  'project:view-stage': {
    id: 'project:view-stage',
    label: 'View Stage',
    category: 'project',
    triggerPhrases: ['view stage', 'show stage', 'go to stage', 'open stage'],
    requiresProject: true,
    requiresStage: true,
  },
  'project:view-deliverable': {
    id: 'project:view-deliverable',
    label: 'View Deliverable',
    category: 'project',
    triggerPhrases: ['view deliverable', 'show deliverable', 'open deliverable', 'view report', 'show spec'],
    requiresProject: true,
  },

  // Pipeline Actions
  'pipeline:start': {
    id: 'pipeline:start',
    label: 'Start Pipeline',
    category: 'pipeline',
    triggerPhrases: ['start pipeline', 'kick off', 'begin pipeline', 'start the pipeline', 'run pipeline'],
    requiresProject: true,
  },
  'pipeline:pause': {
    id: 'pipeline:pause',
    label: 'Pause Pipeline',
    category: 'pipeline',
    triggerPhrases: ['pause', 'pause pipeline', 'hold', 'wait', 'stop temporarily'],
    requiresProject: true,
  },
  'pipeline:resume': {
    id: 'pipeline:resume',
    label: 'Resume Pipeline',
    category: 'pipeline',
    triggerPhrases: ['resume', 'continue', 'unpause', 'resume pipeline', 'continue pipeline'],
    requiresProject: true,
  },

  // UI Actions
  'ui:show-agents': {
    id: 'ui:show-agents',
    label: 'Show Agent Network',
    category: 'ui',
    triggerPhrases: ['show agents', 'agent network', 'view agents', 'agents view', 'team view'],
  },
  'ui:show-projects': {
    id: 'ui:show-projects',
    label: 'Show Projects',
    category: 'ui',
    triggerPhrases: ['show projects', 'projects view', 'all projects', 'project list', 'view projects'],
  },
}

// Action execution context
export interface ActionExecutionContext {
  setCurrentPage: (page: NavigationPage) => void
  setMainViewMode: (mode: 'agents' | 'project' | 'projects') => void
  setSelectedPipelineProject: (projectId: string | null) => void
  setShowNewProjectWizard: (show: boolean) => void
  startPipeline: (projectId: string) => void
  pausePipeline: (projectId: string) => void
  resumePipeline: (projectId: string) => void
  pipelineProjects: PipelineProject[]
  selectedPipelineProjectId: string | null
}

// Execute a CEO action
export function executeCEOAction(
  action: CEOAction,
  context: ActionExecutionContext
): { success: boolean; message: string } {
  const {
    setCurrentPage,
    setMainViewMode,
    setSelectedPipelineProject,
    setShowNewProjectWizard,
    startPipeline,
    pausePipeline,
    resumePipeline,
    pipelineProjects,
    selectedPipelineProjectId,
  } = context

  switch (action.id) {
    // Navigation Actions
    case 'navigate:dashboard':
      setCurrentPage('dashboard')
      setMainViewMode('agents')
      return { success: true, message: 'Navigated to Dashboard' }

    case 'navigate:tasks':
      setCurrentPage('tasks')
      return { success: true, message: 'Navigated to Task Board' }

    case 'navigate:settings':
      setCurrentPage('settings')
      return { success: true, message: 'Navigated to Settings' }

    // Project Actions
    case 'project:create':
      setShowNewProjectWizard(true)
      return { success: true, message: 'Opening project wizard' }

    case 'project:view': {
      const projectId = action.payload?.projectId as string
      if (projectId) {
        setSelectedPipelineProject(projectId)
        setMainViewMode('project')
        setCurrentPage('dashboard')
        const project = pipelineProjects.find(p => p.id === projectId)
        return {
          success: true,
          message: `Viewing ${project?.title || 'project'}`,
        }
      }
      return { success: false, message: 'No project specified' }
    }

    case 'project:view-stage': {
      const projectId = action.payload?.projectId as string
      const stageIndex = action.payload?.stageIndex as number
      if (projectId) {
        setSelectedPipelineProject(projectId)
        setMainViewMode('project')
        setCurrentPage('dashboard')
        // Stage focusing will be handled by the ProjectDetailView component
        return {
          success: true,
          message: `Navigated to stage ${stageIndex !== undefined ? stageIndex + 1 : ''}`,
        }
      }
      return { success: false, message: 'No project specified' }
    }

    // Pipeline Actions
    case 'pipeline:start': {
      const projectId = (action.payload?.projectId as string) || selectedPipelineProjectId
      if (projectId) {
        startPipeline(projectId)
        const project = pipelineProjects.find(p => p.id === projectId)
        return {
          success: true,
          message: `Pipeline started for ${project?.title || 'project'}`,
        }
      }
      return { success: false, message: 'No project selected' }
    }

    case 'pipeline:pause': {
      const projectId = (action.payload?.projectId as string) || selectedPipelineProjectId
      if (projectId) {
        pausePipeline(projectId)
        return { success: true, message: 'Pipeline paused' }
      }
      return { success: false, message: 'No project selected' }
    }

    case 'pipeline:resume': {
      const projectId = (action.payload?.projectId as string) || selectedPipelineProjectId
      if (projectId) {
        resumePipeline(projectId)
        return { success: true, message: 'Pipeline resumed' }
      }
      return { success: false, message: 'No project selected' }
    }

    // UI Actions
    case 'ui:show-agents':
      setCurrentPage('dashboard')
      setMainViewMode('agents')
      return { success: true, message: 'Showing Agent Network' }

    case 'ui:show-projects':
      setCurrentPage('dashboard')
      setMainViewMode('projects')
      return { success: true, message: 'Showing Projects' }

    default:
      return { success: false, message: `Unknown action: ${action.id}` }
  }
}

// Create an action with optional payload
export function createAction(
  actionId: string,
  payload?: Record<string, unknown>
): CEOAction | null {
  const definition = CEO_ACTION_DEFINITIONS[actionId]
  if (!definition) return null

  return {
    id: definition.id,
    label: definition.label,
    category: definition.category,
    payload,
  }
}

// Detect actions from user message
export function detectActionsFromMessage(
  message: string,
  pipelineProjects: PipelineProject[],
  currentProjectId: string | null
): CEOAction[] {
  const lower = message.toLowerCase().trim()
  const detectedActions: CEOAction[] = []

  // Check each action definition for trigger phrase matches
  for (const [actionId, definition] of Object.entries(CEO_ACTION_DEFINITIONS)) {
    const matches = definition.triggerPhrases.some(phrase => {
      // Use word boundary matching for better accuracy
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      return regex.test(lower)
    })

    if (matches) {
      // Handle project-specific actions
      if (definition.requiresProject) {
        // Try to find a project reference in the message or use current project
        const projectId = currentProjectId
        if (projectId) {
          detectedActions.push(createAction(actionId, { projectId })!)
        }
      } else {
        detectedActions.push(createAction(actionId)!)
      }
    }
  }

  // De-duplicate by action ID
  const uniqueActions = detectedActions.filter(
    (action, index, self) => index === self.findIndex(a => a.id === action.id)
  )

  return uniqueActions
}

// Generate response text with context for detected actions
export function generateActionResponseText(
  message: string,
  actions: CEOAction[],
  pipelineProjects: PipelineProject[]
): string {
  if (actions.length === 0) {
    return ''
  }

  const actionCategories = new Set(actions.map(a => a.category))

  // Project creation
  if (actions.some(a => a.id === 'project:create')) {
    return "I'd be happy to help you start a new project! The wizard will guide you through naming, customization, and briefing."
  }

  // Project viewing
  if (actions.some(a => a.id === 'project:view')) {
    const viewAction = actions.find(a => a.id === 'project:view')
    const project = viewAction?.payload?.projectId
      ? pipelineProjects.find(p => p.id === viewAction.payload?.projectId)
      : null
    if (project) {
      return `Opening ${project.title} for you. It's currently in the **${project.stage}** stage at ${Math.round(project.progress * 100)}% progress.`
    }
    return "I'll open that project for you."
  }

  // Pipeline actions
  if (actionCategories.has('pipeline')) {
    if (actions.some(a => a.id === 'pipeline:start')) {
      return "I'll start the pipeline for this project. The assigned agent will begin work on the current stage."
    }
    if (actions.some(a => a.id === 'pipeline:pause')) {
      return "I'll pause the pipeline. You can resume anytime when you're ready to continue."
    }
    if (actions.some(a => a.id === 'pipeline:resume')) {
      return "Resuming the pipeline now. Work will continue from where it left off."
    }
  }

  // Navigation actions
  if (actionCategories.has('navigation')) {
    const navAction = actions.find(a => a.category === 'navigation')
    if (navAction) {
      const destinations: Record<string, string> = {
        'navigate:dashboard': 'the Dashboard',
        'navigate:tasks': 'the Task Board',
        'navigate:settings': 'Settings',
      }
      return `Taking you to ${destinations[navAction.id] || 'your destination'}.`
    }
  }

  // UI actions
  if (actionCategories.has('ui')) {
    if (actions.some(a => a.id === 'ui:show-agents')) {
      return "Switching to the Agent Network view. You'll see all 19 agents and their current status."
    }
    if (actions.some(a => a.id === 'ui:show-projects')) {
      return "Switching to the Projects view. Here you can see all projects in the pipeline."
    }
  }

  // Default response
  return "I can help with that. Click the action below to proceed."
}
