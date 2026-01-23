import type { Task, PipelineProject, TaskPriority } from './types'
import { STAGES } from './types'
import { getAgentIdForStage, getStageShortName } from './agentMapping'

/**
 * Generate a unique task ID
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Map pipeline priority to task priority
 */
function mapPriorityToTaskPriority(priority: PipelineProject['priority']): TaskPriority {
  switch (priority) {
    case 'Critical':
      return 'critical'
    case 'High':
      return 'high'
    case 'Medium':
      return 'medium'
    case 'Low':
      return 'low'
    default:
      return 'medium'
  }
}

/**
 * Generate stage-specific task description
 */
function generateTaskDescription(stage: typeof STAGES[number], project: PipelineProject): string {
  const stageDescriptions: Record<string, (project: PipelineProject) => string> = {
    'Intake': (p) => `Review project brief and requirements for "${p.title}". Validate scope, identify key stakeholders, and document initial assumptions.`,
    'Research': (p) => `Conduct market research for "${p.title}". Analyze competitors, identify target audience needs, validate problem-solution fit, and provide GO/NO-GO recommendation.`,
    'Planning': (p) => `Create product specification for "${p.title}". Define MVP scope, write user stories, establish acceptance criteria, and create feature prioritization matrix.`,
    'Architecture': (p) => `Design technical architecture for "${p.title}". Select technology stack, design database schema, plan API structure, and document system components.`,
    'Design': (p) => `Create UI/UX design for "${p.title}". Build wireframes, design mockups, establish design system, and document component specifications.`,
    'Development': (p) => `Build and implement "${p.title}". Develop core features, integrate APIs, implement business logic, and prepare for deployment.`,
    'Testing': (p) => `Test "${p.title}" application. Run E2E tests, cross-browser testing, accessibility audit, and performance benchmarks.`,
    'Security': (p) => `Security audit for "${p.title}". Run vulnerability scans, review authentication flows, check data handling, and provide security clearance.`,
    'Documentation': (p) => `Create documentation for "${p.title}". Write README, user guides, API documentation, and deployment instructions.`,
    'Launched': (p) => `Final deployment review for "${p.title}". Verify production readiness, complete launch checklist, and hand off to operations.`,
  }

  const stageName = getStageShortName(stage)
  const descriptionFn = stageDescriptions[stageName]
  return descriptionFn ? descriptionFn(project) : stage.description
}

/**
 * Generate a task for the current pipeline stage
 * This is called by the CEO when a pipeline starts or advances to a new stage
 */
export function generateTaskForStage(
  project: PipelineProject,
  stageIndex: number
): Task {
  const stage = STAGES[stageIndex]
  if (!stage) {
    throw new Error(`Invalid stage index: ${stageIndex}`)
  }

  const stageName = getStageShortName(stage)
  const agentId = getAgentIdForStage(stageIndex)
  const now = new Date()

  return {
    id: generateTaskId(),
    title: `${stageName}: ${project.title}`,
    description: generateTaskDescription(stage, project),
    status: 'pending',
    priority: mapPriorityToTaskPriority(project.priority),
    assignedTo: agentId,
    projectId: project.id,
    createdAt: now,
    updatedAt: now,
    streamOutput: [],
    progress: 0,
    currentStep: `Initializing ${stageName} phase...`,
  }
}

/**
 * Generate the initial stream output for a task
 */
export function generateInitialStreamOutput(task: Task, stage: typeof STAGES[number]) {
  const stageName = getStageShortName(stage)
  return [
    {
      id: `stream_${Date.now()}_1`,
      timestamp: new Date(),
      agentId: task.assignedTo || 'ceo',
      type: 'thought' as const,
      content: `Starting ${stageName} phase. Analyzing requirements...`,
    },
  ]
}

/**
 * Get deliverable name for a stage
 */
export function getDeliverableName(stage: typeof STAGES[number]): string | null {
  const deliverableNames: Record<string, string> = {
    intake: 'Project Brief',
    research: 'Research Report',
    spec: 'Product Spec',
    architecture: 'Architecture Doc',
    design: 'Design Mockups',
    testReport: 'Test Report',
    securityReport: 'Security Audit',
    documentation: 'Documentation',
  }

  if (!stage.deliverableKey) return null
  return deliverableNames[stage.deliverableKey] || null
}
