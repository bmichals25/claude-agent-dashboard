import type { AgentId, Stage } from './types'
import { STAGES } from './types'

// Map stage agent names to AgentId
const AGENT_NAME_TO_ID: Record<string, AgentId> = {
  'CEO (Claude)': 'ceo',
  'Product Researcher': 'product_researcher',
  'Product Manager': 'product_manager',
  'Architect': 'architect',
  'Frontend Designer': 'frontend_designer',
  'Developer': 'developer',
  'User Testing': 'user_testing',
  'Security Engineer': 'security_engineer',
  'Technical Writer': 'technical_writer',
}

/**
 * Get the AgentId for a given stage index
 */
export function getAgentIdForStage(stageIndex: number): AgentId {
  const stage = STAGES[stageIndex]
  if (!stage) return 'ceo'
  return AGENT_NAME_TO_ID[stage.agent] || 'ceo'
}

/**
 * Get the AgentId from a stage name
 */
export function getAgentIdFromStageName(agentName: string): AgentId {
  return AGENT_NAME_TO_ID[agentName] || 'ceo'
}

/**
 * Get stage information by index
 */
export function getStageInfo(stageIndex: number): Stage | null {
  return STAGES[stageIndex] || null
}

/**
 * Get the short name of a stage (e.g., "Research" from "2. Research")
 */
export function getStageShortName(stage: Stage): string {
  return stage.name.split('. ')[1] || stage.name
}

/**
 * Get the total number of stages
 */
export function getTotalStages(): number {
  return STAGES.length
}

/**
 * Check if a stage index is the final stage
 */
export function isFinalStage(stageIndex: number): boolean {
  return stageIndex >= STAGES.length - 1
}
