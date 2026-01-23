import { useDashboardStore } from './store'
import { generateTaskForStage } from './ceoTaskGenerator'
import { STAGES } from './types'
import type { StreamEntry, AgentId } from './types'

// Track active execution controllers per project for cancellation
const activeControllers: Map<string, AbortController> = new Map()

/**
 * Add a stream entry to a task
 */
function addStreamEntry(
  taskId: string,
  agentId: AgentId,
  type: StreamEntry['type'],
  content: string
) {
  const entry: StreamEntry = {
    id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    agentId,
    type,
    content,
  }
  useDashboardStore.getState().addStreamEntry(taskId, entry)
}

/**
 * Execute a task by calling the real API endpoint
 * This streams responses back and updates the task in real-time
 */
async function executeTaskViaAPI(projectId: string, taskId: string): Promise<boolean> {
  const store = useDashboardStore.getState()
  const task = store.tasks.find(t => t.id === taskId)
  const project = store.pipelineProjects.find(p => p.id === projectId)

  if (!task || !project) {
    console.error('Task or project not found')
    return false
  }

  // Create abort controller for this execution
  const controller = new AbortController()
  activeControllers.set(projectId, controller)

  try {
    // Call the task execution API
    const response = await fetch('/api/tasks/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId,
        projectId,
        projectTitle: project.title,
        stageIndex: project.stageIndex,
        stageName: STAGES[project.stageIndex]?.name,
        stageDescription: STAGES[project.stageIndex]?.description,
        agentId: task.assignedTo,
        deliverableKey: STAGES[project.stageIndex]?.deliverableKey,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      addStreamEntry(taskId, task.assignedTo || 'ceo', 'error', `Execution failed: ${error}`)
      return false
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    if (!reader) {
      addStreamEntry(taskId, task.assignedTo || 'ceo', 'error', 'No response stream available')
      return false
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete lines (SSE format)
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            // Handle different event types
            switch (data.type) {
              case 'thought':
              case 'action':
              case 'result':
              case 'error':
                addStreamEntry(taskId, task.assignedTo || 'ceo', data.type, data.content)
                break

              case 'progress':
                store.updateTaskProgress(taskId, data.progress, data.step)
                break

              case 'deliverable':
                // Store the deliverable URL
                if (data.url && data.key) {
                  const updatedDeliverables = {
                    ...project.deliverables,
                    [data.key]: data.url,
                  }
                  const updatedProject = { ...project, deliverables: updatedDeliverables }
                  store.setPipelineProjects(
                    store.pipelineProjects.map(p => p.id === projectId ? updatedProject : p)
                  )
                  addStreamEntry(taskId, task.assignedTo || 'ceo', 'result', `Deliverable created: ${data.url}`)
                }
                break

              case 'complete':
                store.updateTaskProgress(taskId, 100, 'Complete')
                return true
            }
          } catch (e) {
            // Skip malformed JSON
            console.warn('Failed to parse SSE data:', line)
          }
        }
      }
    }

    return true
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      addStreamEntry(taskId, task.assignedTo || 'ceo', 'error', 'Execution cancelled')
      return false
    }

    console.error('Task execution error:', error)
    addStreamEntry(taskId, task.assignedTo || 'ceo', 'error', `Error: ${(error as Error).message}`)
    return false
  } finally {
    activeControllers.delete(projectId)
  }
}

/**
 * Check if stage has required deliverable
 */
function hasRequiredDeliverable(projectId: string, stageIndex: number): boolean {
  const store = useDashboardStore.getState()
  const project = store.pipelineProjects.find(p => p.id === projectId)
  if (!project) return false

  const stage = STAGES[stageIndex]
  if (!stage?.deliverableKey) {
    // Stage doesn't require a deliverable
    return true
  }

  const deliverableUrl = project.deliverables[stage.deliverableKey as keyof typeof project.deliverables]
  return !!deliverableUrl
}

/**
 * Start execution for the current stage of a pipeline
 */
export async function startStageExecution(projectId: string): Promise<void> {
  const store = useDashboardStore.getState()
  const execution = store.getPipelineExecution(projectId)
  const project = store.pipelineProjects.find(p => p.id === projectId)

  if (!execution || !project) {
    console.error('Cannot start stage execution: missing execution or project')
    return
  }

  if (execution.status !== 'running') {
    console.log('Pipeline not in running state:', execution.status)
    return
  }

  // Check if we already have a task for this stage
  if (execution.currentTaskId) {
    const existingTask = store.tasks.find(t => t.id === execution.currentTaskId)
    if (existingTask && existingTask.status === 'in_progress') {
      // Already executing
      return
    }
  }

  // Generate task for current stage
  const task = generateTaskForStage(project, execution.currentStageIndex)

  // Add initial stream entry
  const stage = STAGES[execution.currentStageIndex]
  if (stage) {
    task.streamOutput = [{
      id: `stream_${Date.now()}_init`,
      timestamp: new Date(),
      agentId: task.assignedTo || 'ceo',
      type: 'thought',
      content: `Starting ${stage.name.split('. ')[1]} phase for "${project.title}"...`,
    }]
  }

  // Add task to store
  store.addTask(task)

  // Update task to in_progress
  store.updateTask(task.id, { status: 'in_progress' })

  // Link task to pipeline execution
  store.setPipelineExecutionTask(projectId, task.id)

  // Update agent status
  if (task.assignedTo) {
    store.updateAgentStatus(task.assignedTo, 'working', task)
  }

  // Execute the task via API
  const success = await executeTaskViaAPI(projectId, task.id)

  // Check execution status again (might have been paused/stopped)
  const currentExecution = store.getPipelineExecution(projectId)
  if (!currentExecution || currentExecution.status !== 'running') {
    return
  }

  if (success) {
    // Verify deliverable was created if required
    if (!hasRequiredDeliverable(projectId, execution.currentStageIndex)) {
      addStreamEntry(task.id, task.assignedTo || 'ceo', 'error',
        'Stage cannot advance: Required deliverable was not created')
      store.updateTask(task.id, { status: 'review' })
      return
    }

    // Mark task complete
    store.completeTask(task.id)

    // Update agent status
    if (task.assignedTo) {
      store.updateAgentStatus(task.assignedTo, 'completed')
      setTimeout(() => {
        store.updateAgentStatus(task.assignedTo!, 'idle')
      }, 1500)
    }

    // Advance to next stage
    store.advancePipelineStage(projectId)

    // Continue to next stage if pipeline is still running
    const updatedExecution = store.getPipelineExecution(projectId)
    if (updatedExecution && updatedExecution.status === 'running') {
      // Small delay before starting next stage
      setTimeout(() => {
        startStageExecution(projectId)
      }, 1000)
    }
  } else {
    // Task failed - put in review status
    store.updateTask(task.id, { status: 'review' })
    if (task.assignedTo) {
      store.updateAgentStatus(task.assignedTo, 'idle')
    }
  }
}

/**
 * Initialize and start a pipeline from the beginning
 */
export function initializePipeline(projectId: string) {
  const store = useDashboardStore.getState()

  // Start the pipeline (this sets up the execution state)
  store.startPipeline(projectId)

  // Start first stage execution
  startStageExecution(projectId)
}

/**
 * Pause pipeline execution
 */
export function pausePipelineExecution(projectId: string) {
  const store = useDashboardStore.getState()

  // Cancel active API request
  const controller = activeControllers.get(projectId)
  if (controller) {
    controller.abort()
  }

  // Update store state
  store.pausePipeline(projectId)

  // Update current task's agent status
  const execution = store.getPipelineExecution(projectId)
  if (execution?.currentTaskId) {
    const task = store.tasks.find(t => t.id === execution.currentTaskId)
    if (task?.assignedTo) {
      store.updateAgentStatus(task.assignedTo, 'idle')
    }
  }
}

/**
 * Resume pipeline execution
 */
export function resumePipelineExecution(projectId: string) {
  const store = useDashboardStore.getState()

  // Resume in store
  store.resumePipeline(projectId)

  // Restart execution
  startStageExecution(projectId)
}

/**
 * Skip current stage and move to next
 * Only allowed if deliverable exists or stage doesn't require one
 */
export function skipCurrentStage(projectId: string): boolean {
  const store = useDashboardStore.getState()
  const execution = store.getPipelineExecution(projectId)

  if (!execution) return false

  // Check if we can skip (deliverable must exist if required)
  if (!hasRequiredDeliverable(projectId, execution.currentStageIndex)) {
    const stage = STAGES[execution.currentStageIndex]
    console.error(`Cannot skip: ${stage?.name} requires a deliverable`)
    return false
  }

  // Cancel active API request
  const controller = activeControllers.get(projectId)
  if (controller) {
    controller.abort()
  }

  // Skip in store
  store.skipStage(projectId)

  // Continue execution if running
  const updatedExecution = store.getPipelineExecution(projectId)
  if (updatedExecution && updatedExecution.status === 'running') {
    setTimeout(() => {
      startStageExecution(projectId)
    }, 500)
  }

  return true
}

/**
 * Restart current stage from beginning
 */
export function restartCurrentStage(projectId: string) {
  const store = useDashboardStore.getState()

  // Cancel active API request
  const controller = activeControllers.get(projectId)
  if (controller) {
    controller.abort()
  }

  // Restart in store
  store.restartStage(projectId)

  // Start fresh execution
  setTimeout(() => {
    startStageExecution(projectId)
  }, 500)
}

/**
 * Stop pipeline entirely
 */
export function stopPipelineExecution(projectId: string) {
  const store = useDashboardStore.getState()

  // Cancel active API request
  const controller = activeControllers.get(projectId)
  if (controller) {
    controller.abort()
  }

  // Update current task's agent status
  const execution = store.getPipelineExecution(projectId)
  if (execution?.currentTaskId) {
    const task = store.tasks.find(t => t.id === execution.currentTaskId)
    if (task?.assignedTo) {
      store.updateAgentStatus(task.assignedTo, 'idle')
    }
  }

  // Stop in store
  store.stopPipeline(projectId)
}

/**
 * Get execution status for a project
 */
export function getExecutionStatus(projectId: string) {
  return useDashboardStore.getState().getPipelineExecution(projectId)
}

/**
 * Check if a stage can be advanced (has required deliverable)
 */
export function canAdvanceStage(projectId: string, stageIndex: number): boolean {
  return hasRequiredDeliverable(projectId, stageIndex)
}
