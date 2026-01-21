import type { Agent, AgentId, AgentTier } from './types'

interface LayoutConfig {
  viewportWidth: number
  viewportHeight: number
  padding: {
    top: number    // % from top
    bottom: number // % from bottom
    left: number   // % from left
    right: number  // % from right
  }
}

interface ComputedPosition {
  x: number  // percentage
  y: number  // percentage
}

interface LayoutResult {
  positions: Record<AgentId, ComputedPosition>
  sizes: Record<AgentTier, 'sm' | 'md' | 'lg'>
}

// Hierarchy structure for layout
const HIERARCHY_ROWS: { tier: AgentTier; agents: AgentId[] }[] = [
  { tier: 'ceo', agents: ['ceo'] },
  { tier: 'leadership', agents: ['chief_of_staff', 'pipeline_manager', 'agent_operations', 'vp_engineering', 'vp_product', 'vp_design_qa'] },
  { tier: 'specialist', agents: ['support_agent', 'autopilot_agent'] }, // Under leadership (sparse row)
  { tier: 'specialist', agents: ['architect', 'developer', 'devops_engineer', 'product_researcher', 'product_manager', 'frontend_designer', 'technical_writer'] }, // Main specialists
  { tier: 'specialist', agents: ['code_reviewer', 'security_engineer', 'data_engineer', 'growth_marketer', 'user_testing'] }, // Bottom specialists
]

// Calculate vertical spacing based on viewport aspect ratio
function calculateVerticalSpacing(config: LayoutConfig): number[] {
  const { viewportHeight, padding } = config
  const availableHeight = 100 - padding.top - padding.bottom
  const numRows = HIERARCHY_ROWS.length

  // Adjust spacing based on aspect ratio
  const aspectRatio = config.viewportWidth / config.viewportHeight

  // Wider screens can have tighter vertical spacing
  if (aspectRatio > 1.8) {
    // Ultra-wide: compress vertically
    return distributeRows(availableHeight, numRows, [1, 1.2, 0.9, 1, 0.9])
  } else if (aspectRatio > 1.4) {
    // Normal wide: balanced
    return distributeRows(availableHeight, numRows, [1, 1.1, 1, 1, 1])
  } else {
    // Tall/narrow: stretch vertically
    return distributeRows(availableHeight, numRows, [1, 1, 1, 1, 1])
  }
}

// Distribute rows with optional weights
function distributeRows(available: number, count: number, weights: number[]): number[] {
  const totalWeight = weights.slice(0, count).reduce((a, b) => a + b, 0)
  const rowPositions: number[] = []
  let currentY = 0

  for (let i = 0; i < count; i++) {
    const rowHeight = (available * weights[i]) / totalWeight
    rowPositions.push(currentY + rowHeight / 2)
    currentY += rowHeight
  }

  return rowPositions
}

// Calculate horizontal positions for agents in a row
function calculateHorizontalPositions(
  agents: AgentId[],
  leftBound: number,
  rightBound: number
): number[] {
  const count = agents.length
  if (count === 0) return []
  if (count === 1) return [(leftBound + rightBound) / 2]

  const availableWidth = rightBound - leftBound
  const spacing = availableWidth / (count - 1)

  return agents.map((_, i) => leftBound + i * spacing)
}

// Calculate optimal sizes based on viewport
function calculateSizes(config: LayoutConfig): Record<AgentTier, 'sm' | 'md' | 'lg'> {
  const { viewportWidth, viewportHeight } = config
  const smallerDimension = Math.min(viewportWidth, viewportHeight)

  // Scale sizes based on viewport
  if (smallerDimension < 600) {
    return { ceo: 'md', vp: 'sm', leadership: 'sm', specialist: 'sm' }
  } else if (smallerDimension < 900) {
    return { ceo: 'lg', vp: 'md', leadership: 'md', specialist: 'sm' }
  } else {
    return { ceo: 'lg', vp: 'md', leadership: 'md', specialist: 'sm' }
  }
}

// Main layout calculator
export function calculateOptimalLayout(config: LayoutConfig): LayoutResult {
  const { padding } = config
  const positions: Record<AgentId, ComputedPosition> = {} as Record<AgentId, ComputedPosition>

  // Calculate row Y positions
  const rowYPositions = calculateVerticalSpacing(config)

  // Calculate horizontal bounds
  const leftBound = padding.left
  const rightBound = 100 - padding.right

  // Position each row
  HIERARCHY_ROWS.forEach((row, rowIndex) => {
    const yPosition = padding.top + rowYPositions[rowIndex]

    // Adjust horizontal bounds for certain rows to create visual hierarchy
    let rowLeftBound = leftBound
    let rowRightBound = rightBound

    // Specialists rows can be grouped by department
    if (rowIndex >= 2) {
      // Keep specialists more compact per department area
      rowLeftBound = leftBound + 2
      rowRightBound = rightBound - 2
    }

    const xPositions = calculateHorizontalPositions(row.agents, rowLeftBound, rowRightBound)

    row.agents.forEach((agentId, agentIndex) => {
      positions[agentId] = {
        x: xPositions[agentIndex],
        y: yPosition,
      }
    })
  })

  // Calculate sizes
  const sizes = calculateSizes(config)

  return { positions, sizes }
}

// Default layout config for standard screens
export function getDefaultLayoutConfig(viewportWidth: number, viewportHeight: number): LayoutConfig {
  // Adjust padding based on aspect ratio
  const aspectRatio = viewportWidth / viewportHeight

  let padding = {
    top: 10,
    bottom: 12,
    left: 12,
    right: 12,
  }

  // Adjust for ultra-wide screens
  if (aspectRatio > 2) {
    padding.left = 20
    padding.right = 20
  }

  // Adjust for narrow/tall screens
  if (aspectRatio < 1) {
    padding.top = 8
    padding.bottom = 15
    padding.left = 8
    padding.right = 8
  }

  return {
    viewportWidth,
    viewportHeight,
    padding,
  }
}

// Hook-friendly function to get positions for a specific viewport
export function getAgentPositions(viewportWidth: number, viewportHeight: number): Record<AgentId, ComputedPosition> {
  const config = getDefaultLayoutConfig(viewportWidth, viewportHeight)
  const layout = calculateOptimalLayout(config)
  return layout.positions
}

// Get size for agent tier based on viewport
export function getAgentSize(tier: AgentTier, viewportWidth: number, viewportHeight: number): 'sm' | 'md' | 'lg' {
  const config = getDefaultLayoutConfig(viewportWidth, viewportHeight)
  const layout = calculateOptimalLayout(config)
  return layout.sizes[tier]
}
