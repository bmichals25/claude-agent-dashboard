import type { PipelineProject } from './types'

// Project match result
export interface ProjectMatch {
  project: PipelineProject
  confidence: number // 0-1
  matchType: 'exact' | 'partial' | 'fuzzy'
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Calculate similarity score (0-1) based on Levenshtein distance
function similarityScore(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 1
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  return 1 - distance / maxLength
}

// Find project by name with fuzzy matching
export function findProjectByName(
  query: string,
  projects: PipelineProject[],
  threshold: number = 0.5
): ProjectMatch | null {
  if (!query || projects.length === 0) return null

  const normalizedQuery = query.toLowerCase().trim()
  let bestMatch: ProjectMatch | null = null

  for (const project of projects) {
    const normalizedTitle = project.title.toLowerCase()

    // 1. Exact match (case insensitive)
    if (normalizedTitle === normalizedQuery) {
      return {
        project,
        confidence: 1,
        matchType: 'exact',
      }
    }

    // 2. Partial match (query contains or is contained in title)
    if (normalizedTitle.includes(normalizedQuery)) {
      const confidence = normalizedQuery.length / normalizedTitle.length
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = {
          project,
          confidence: Math.min(0.95, confidence + 0.3), // Boost partial matches
          matchType: 'partial',
        }
      }
      continue
    }

    if (normalizedQuery.includes(normalizedTitle)) {
      const confidence = normalizedTitle.length / normalizedQuery.length
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = {
          project,
          confidence: Math.min(0.9, confidence + 0.2),
          matchType: 'partial',
        }
      }
      continue
    }

    // 3. Word-level matching
    const queryWords = normalizedQuery.split(/\s+/)
    const titleWords = normalizedTitle.split(/\s+/)
    const matchingWords = queryWords.filter(qw =>
      titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
    )
    if (matchingWords.length > 0) {
      const wordMatchConfidence = matchingWords.length / Math.max(queryWords.length, titleWords.length)
      if (wordMatchConfidence > 0.3 && (!bestMatch || wordMatchConfidence > bestMatch.confidence)) {
        bestMatch = {
          project,
          confidence: wordMatchConfidence + 0.2,
          matchType: 'partial',
        }
      }
    }

    // 4. Fuzzy match using Levenshtein distance
    const fuzzyScore = similarityScore(normalizedQuery, normalizedTitle)
    if (fuzzyScore >= threshold && (!bestMatch || fuzzyScore > bestMatch.confidence)) {
      bestMatch = {
        project,
        confidence: fuzzyScore,
        matchType: 'fuzzy',
      }
    }

    // Also check against slug if available
    if (project.slug) {
      const slugScore = similarityScore(normalizedQuery, project.slug.toLowerCase())
      if (slugScore >= threshold && (!bestMatch || slugScore > bestMatch.confidence)) {
        bestMatch = {
          project,
          confidence: slugScore,
          matchType: 'fuzzy',
        }
      }
    }
  }

  // Only return matches above threshold
  if (bestMatch && bestMatch.confidence >= threshold) {
    return bestMatch
  }

  return null
}

// Find multiple projects matching a query
export function findProjectsMatching(
  query: string,
  projects: PipelineProject[],
  threshold: number = 0.4,
  maxResults: number = 5
): ProjectMatch[] {
  if (!query || projects.length === 0) return []

  const normalizedQuery = query.toLowerCase().trim()
  const matches: ProjectMatch[] = []

  for (const project of projects) {
    const normalizedTitle = project.title.toLowerCase()

    // Calculate match score
    let confidence = 0
    let matchType: ProjectMatch['matchType'] = 'fuzzy'

    // Exact match
    if (normalizedTitle === normalizedQuery) {
      confidence = 1
      matchType = 'exact'
    }
    // Partial match (title contains query)
    else if (normalizedTitle.includes(normalizedQuery)) {
      confidence = 0.8 + (normalizedQuery.length / normalizedTitle.length) * 0.15
      matchType = 'partial'
    }
    // Partial match (query contains title)
    else if (normalizedQuery.includes(normalizedTitle)) {
      confidence = 0.7 + (normalizedTitle.length / normalizedQuery.length) * 0.15
      matchType = 'partial'
    }
    // Fuzzy match
    else {
      confidence = similarityScore(normalizedQuery, normalizedTitle)
      matchType = 'fuzzy'
    }

    if (confidence >= threshold) {
      matches.push({ project, confidence, matchType })
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence)

  return matches.slice(0, maxResults)
}

// Stage aliases for natural language recognition
export const STAGE_ALIASES: Record<string, number> = {
  // Stage 1 - Intake
  intake: 0,
  brief: 0,
  briefing: 0,

  // Stage 2 - Research
  research: 1,
  analysis: 1,
  market: 1,

  // Stage 3 - Planning
  planning: 2,
  spec: 2,
  specification: 2,
  requirements: 2,

  // Stage 4 - Architecture
  architecture: 3,
  arch: 3,
  technical: 3,
  'tech design': 3,

  // Stage 5 - Design
  design: 4,
  ui: 4,
  ux: 4,
  mockups: 4,
  mockup: 4,

  // Stage 6 - Development
  development: 5,
  dev: 5,
  code: 5,
  build: 5,
  coding: 5,

  // Stage 7 - Testing
  testing: 6,
  test: 6,
  qa: 6,
  quality: 6,

  // Stage 8 - Security
  security: 7,
  audit: 7,
  'security audit': 7,

  // Stage 9 - Documentation
  documentation: 8,
  docs: 8,
  readme: 8,

  // Stage 10 - Launched
  launched: 9,
  launch: 9,
  deployed: 9,
  deployment: 9,
  live: 9,
}

// Deliverable type aliases
export const DELIVERABLE_ALIASES: Record<string, keyof PipelineProject['deliverables']> = {
  // Intake
  brief: 'intake',
  intake: 'intake',
  'project brief': 'intake',

  // Research
  research: 'research',
  'research report': 'research',
  'market research': 'research',

  // Spec
  spec: 'spec',
  specification: 'spec',
  'product spec': 'spec',
  requirements: 'spec',
  prd: 'spec',

  // Architecture
  architecture: 'architecture',
  'tech spec': 'architecture',
  'technical design': 'architecture',

  // Design
  design: 'design',
  mockups: 'design',
  mockup: 'design',
  ui: 'design',

  // Codebase
  code: 'codebase',
  codebase: 'codebase',
  repo: 'codebase',
  repository: 'codebase',

  // Test Report
  'test report': 'testReport',
  tests: 'testReport',
  testing: 'testReport',
  'qa report': 'testReport',

  // Security Report
  'security report': 'securityReport',
  security: 'securityReport',
  'security audit': 'securityReport',

  // Documentation
  documentation: 'documentation',
  docs: 'documentation',
  readme: 'documentation',
}

// Deep navigation target
export interface DeepNavigationTarget {
  projectId: string
  targetType: 'stage' | 'deliverable' | 'tab'
  stageIndex?: number
  deliverableKey?: keyof PipelineProject['deliverables']
  tabName?: string
}

// Parse deep navigation targets from message
export function parseDeepNavigation(
  message: string,
  projects: PipelineProject[],
  currentProject?: PipelineProject | null
): DeepNavigationTarget | null {
  const lower = message.toLowerCase().trim()

  // Try to find a project reference first
  let targetProject = currentProject

  // Check if message references a specific project
  const projectPatterns = [
    /(?:for|of|in|on)\s+(?:the\s+)?["']?([^"']+?)["']?\s*(?:project)?$/i,
    /^(?:show|view|open|go to)\s+(?:the\s+)?["']?([^"']+?)["']?\s+(?:project)?/i,
  ]

  for (const pattern of projectPatterns) {
    const match = lower.match(pattern)
    if (match) {
      const projectMatch = findProjectByName(match[1], projects)
      if (projectMatch) {
        targetProject = projectMatch.project
        break
      }
    }
  }

  if (!targetProject) {
    // Try to find project name anywhere in message
    const projectMatch = findProjectByName(lower, projects, 0.5)
    if (projectMatch && projectMatch.confidence > 0.6) {
      targetProject = projectMatch.project
    }
  }

  if (!targetProject) return null

  // Look for stage references
  for (const [alias, stageIndex] of Object.entries(STAGE_ALIASES)) {
    // Match patterns like "show design stage", "go to development", "the architecture"
    const stagePattern = new RegExp(`\\b(?:the\\s+)?${alias}(?:\\s+stage)?\\b`, 'i')
    if (stagePattern.test(lower)) {
      return {
        projectId: targetProject.id,
        targetType: 'stage',
        stageIndex,
      }
    }
  }

  // Look for deliverable references
  for (const [alias, deliverableKey] of Object.entries(DELIVERABLE_ALIASES)) {
    // Match patterns like "show the spec", "view research report"
    const deliverablePattern = new RegExp(`\\b(?:the\\s+)?${alias.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (deliverablePattern.test(lower)) {
      return {
        projectId: targetProject.id,
        targetType: 'deliverable',
        deliverableKey,
      }
    }
  }

  // If we found a project but no specific target, just return the project
  if (targetProject && targetProject !== currentProject) {
    return {
      projectId: targetProject.id,
      targetType: 'stage',
      stageIndex: targetProject.stageIndex,
    }
  }

  return null
}

// Extract project name from a message
export function extractProjectName(message: string): string | null {
  const lower = message.toLowerCase()

  // Common patterns for project references
  const patterns = [
    /(?:open|show|view|go to)\s+(?:the\s+)?["']?([a-zA-Z0-9\s]+?)["']?\s*(?:project)?$/i,
    /(?:project\s+)?["']([^"']+)["']/i,
    /(?:what's|whats|what is|how's|hows|how is)\s+(?:happening with|going on with|the status of)\s+["']?([a-zA-Z0-9\s]+?)["']?$/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}
