import type { Agent, AgentId, AgentRole, AgentTier } from './types'

// Agent definitions matching Claude Code's 19-agent hierarchy
export const AGENT_DEFINITIONS: Record<AgentRole, Omit<Agent, 'status' | 'currentTask'>> = {
  // CEO Layer
  ceo: {
    id: 'ceo',
    role: 'ceo',
    displayName: 'CEO (Claude)',
    tier: 'ceo',
    reportsTo: null,
    directReports: ['chief_of_staff', 'pipeline_manager', 'agent_operations', 'vp_engineering', 'vp_product', 'vp_design_qa'],
    color: '#00fff0',
    position: { x: 50, y: 8 },
    tools: ['all'],
    specialty: 'Strategic orchestration, user interaction, task delegation',
  },

  // Leadership Layer - spread out more
  chief_of_staff: {
    id: 'chief_of_staff',
    role: 'chief_of_staff',
    displayName: 'Chief of Staff',
    tier: 'leadership',
    reportsTo: 'ceo',
    directReports: ['support_agent'],
    color: '#ff00c1',
    position: { x: 10, y: 25 },
    tools: ['notion', 'slack', 'calendar'],
    specialty: 'Notion ops, business tracking, admin tasks',
  },
  pipeline_manager: {
    id: 'pipeline_manager',
    role: 'pipeline_manager',
    displayName: 'Pipeline Manager',
    tier: 'leadership',
    reportsTo: 'ceo',
    directReports: ['autopilot_agent'],
    color: '#7000ff',
    position: { x: 25, y: 25 },
    tools: ['notion', 'github'],
    specialty: 'Project lifecycle coordination, pipeline phases',
  },
  agent_operations: {
    id: 'agent_operations',
    role: 'agent_operations',
    displayName: 'Agent Ops',
    tier: 'leadership',
    reportsTo: 'ceo',
    directReports: [],
    color: '#00ffaa',
    position: { x: 40, y: 25 },
    tools: ['notion', 'github', 'analytics'],
    specialty: 'Agent health monitoring, workflow optimization, new agent proposals',
  },

  // VP Layer - better spacing
  vp_engineering: {
    id: 'vp_engineering',
    role: 'vp_engineering',
    displayName: 'VP Engineering',
    tier: 'vp',
    reportsTo: 'ceo',
    directReports: ['architect', 'developer', 'devops_engineer', 'code_reviewer', 'security_engineer'],
    color: '#00ff66',
    position: { x: 55, y: 25 },
    tools: ['github', 'supabase', 'terminal'],
    specialty: 'Technical execution, code quality, architecture decisions',
  },
  vp_product: {
    id: 'vp_product',
    role: 'vp_product',
    displayName: 'VP Product',
    tier: 'vp',
    reportsTo: 'ceo',
    directReports: ['product_researcher', 'product_manager', 'data_engineer', 'growth_marketer'],
    color: '#ffaa00',
    position: { x: 72, y: 25 },
    tools: ['notion', 'perplexity', 'composio'],
    specialty: 'Product strategy, research, growth',
  },
  vp_design_qa: {
    id: 'vp_design_qa',
    role: 'vp_design_qa',
    displayName: 'VP Design & QA',
    tier: 'vp',
    reportsTo: 'ceo',
    directReports: ['frontend_designer', 'user_testing', 'technical_writer'],
    color: '#ff6b6b',
    position: { x: 88, y: 25 },
    tools: ['figma', 'playwright', 'notion'],
    specialty: 'UX, visual design, quality assurance',
  },

  // Support Agents - below their managers
  support_agent: {
    id: 'support_agent',
    role: 'support_agent',
    displayName: 'Support Agent',
    tier: 'specialist',
    reportsTo: 'chief_of_staff',
    directReports: [],
    color: '#ff00c1',
    position: { x: 10, y: 42 },
    tools: ['notion', 'slack'],
    specialty: 'User feedback, FAQs, bug triage',
  },
  autopilot_agent: {
    id: 'autopilot_agent',
    role: 'autopilot_agent',
    displayName: 'Autopilot Agent',
    tier: 'specialist',
    reportsTo: 'pipeline_manager',
    directReports: [],
    color: '#7000ff',
    position: { x: 25, y: 42 },
    tools: ['github', 'notion'],
    specialty: 'Autonomous phase approvals, workflow automation',
  },

  // VP Engineering Team - two rows, well spaced
  architect: {
    id: 'architect',
    role: 'architect',
    displayName: 'Architect',
    tier: 'specialist',
    reportsTo: 'vp_engineering',
    directReports: [],
    color: '#00ff66',
    position: { x: 20, y: 58 },
    tools: ['github', 'supabase', 'mermaid'],
    specialty: 'Tech stack, system design, architecture docs',
  },
  developer: {
    id: 'developer',
    role: 'developer',
    displayName: 'Developer',
    tier: 'specialist',
    reportsTo: 'vp_engineering',
    directReports: [],
    color: '#00ff66',
    position: { x: 32, y: 58 },
    tools: ['github', 'terminal', 'supabase'],
    specialty: 'Build features, implement code, ship products',
  },
  devops_engineer: {
    id: 'devops_engineer',
    role: 'devops_engineer',
    displayName: 'DevOps',
    tier: 'specialist',
    reportsTo: 'vp_engineering',
    directReports: [],
    color: '#00ff66',
    position: { x: 44, y: 58 },
    tools: ['github', 'netlify', 'docker'],
    specialty: 'CI/CD, infrastructure, deployment',
  },
  code_reviewer: {
    id: 'code_reviewer',
    role: 'code_reviewer',
    displayName: 'Code Reviewer',
    tier: 'specialist',
    reportsTo: 'vp_engineering',
    directReports: [],
    color: '#00ff66',
    position: { x: 26, y: 75 },
    tools: ['github'],
    specialty: 'PR reviews, code quality, best practices',
  },
  security_engineer: {
    id: 'security_engineer',
    role: 'security_engineer',
    displayName: 'Security',
    tier: 'specialist',
    reportsTo: 'vp_engineering',
    directReports: [],
    color: '#00ff66',
    position: { x: 40, y: 75 },
    tools: ['github', 'security_scanner'],
    specialty: 'Vulnerability scanning, security audits',
  },

  // VP Product Team - two rows, well spaced
  product_researcher: {
    id: 'product_researcher',
    role: 'product_researcher',
    displayName: 'Researcher',
    tier: 'specialist',
    reportsTo: 'vp_product',
    directReports: [],
    color: '#ffaa00',
    position: { x: 55, y: 58 },
    tools: ['perplexity', 'composio', 'notion'],
    specialty: 'Market research, competitive analysis, GO/NO-GO',
  },
  product_manager: {
    id: 'product_manager',
    role: 'product_manager',
    displayName: 'PM',
    tier: 'specialist',
    reportsTo: 'vp_product',
    directReports: [],
    color: '#ffaa00',
    position: { x: 67, y: 58 },
    tools: ['notion', 'figma'],
    specialty: 'Requirements, MVP scope, specifications',
  },
  data_engineer: {
    id: 'data_engineer',
    role: 'data_engineer',
    displayName: 'Data Engineer',
    tier: 'specialist',
    reportsTo: 'vp_product',
    directReports: [],
    color: '#ffaa00',
    position: { x: 55, y: 75 },
    tools: ['supabase', 'notion'],
    specialty: 'Analytics setup, dashboards, tracking',
  },
  growth_marketer: {
    id: 'growth_marketer',
    role: 'growth_marketer',
    displayName: 'Growth',
    tier: 'specialist',
    reportsTo: 'vp_product',
    directReports: [],
    color: '#ffaa00',
    position: { x: 67, y: 75 },
    tools: ['notion', 'composio'],
    specialty: 'Launch strategy, SEO, marketing',
  },

  // VP Design & QA Team - two rows, well spaced
  frontend_designer: {
    id: 'frontend_designer',
    role: 'frontend_designer',
    displayName: 'Designer',
    tier: 'specialist',
    reportsTo: 'vp_design_qa',
    directReports: [],
    color: '#ff6b6b',
    position: { x: 80, y: 58 },
    tools: ['figma', 'gemini'],
    specialty: 'UI/UX design, mockups, design systems',
  },
  user_testing: {
    id: 'user_testing',
    role: 'user_testing',
    displayName: 'QA Testing',
    tier: 'specialist',
    reportsTo: 'vp_design_qa',
    directReports: [],
    color: '#ff6b6b',
    position: { x: 80, y: 75 },
    tools: ['playwright', 'puppeteer'],
    specialty: 'E2E testing, QA, test reports',
  },
  technical_writer: {
    id: 'technical_writer',
    role: 'technical_writer',
    displayName: 'Tech Writer',
    tier: 'specialist',
    reportsTo: 'vp_design_qa',
    directReports: [],
    color: '#ff6b6b',
    position: { x: 92, y: 58 },
    tools: ['notion', 'github'],
    specialty: 'Documentation, README, user guides',
  },
}

// Helper to get all agents as array
export function getAllAgents(): Agent[] {
  return Object.values(AGENT_DEFINITIONS).map(def => ({
    ...def,
    status: 'idle' as const,
    currentTask: null,
  }))
}

// Helper to get agent by ID
export function getAgentById(id: AgentId): Agent | undefined {
  const def = Object.values(AGENT_DEFINITIONS).find(a => a.id === id)
  if (!def) return undefined
  return {
    ...def,
    status: 'idle',
    currentTask: null,
  }
}

// Get all connections (edges) for the graph
export function getAgentConnections(): { from: AgentId; to: AgentId }[] {
  const connections: { from: AgentId; to: AgentId }[] = []
  
  Object.values(AGENT_DEFINITIONS).forEach(agent => {
    if (agent.reportsTo) {
      connections.push({ from: agent.reportsTo, to: agent.id })
    }
  })
  
  return connections
}

// Get agents by tier
export function getAgentsByTier(tier: Agent['tier']): Agent[] {
  return getAllAgents().filter(a => a.tier === tier)
}
