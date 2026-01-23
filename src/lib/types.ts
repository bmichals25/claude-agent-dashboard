// Agent Types
export type AgentId =
  | 'ceo'
  | 'chief_of_staff'
  | 'pipeline_manager'
  | 'agent_operations'
  | 'vp_engineering'
  | 'vp_product'
  | 'vp_design_qa'
  | 'support_agent'
  | 'autopilot_agent'
  | 'architect'
  | 'developer'
  | 'devops_engineer'
  | 'code_reviewer'
  | 'security_engineer'
  | 'product_researcher'
  | 'product_manager'
  | 'data_engineer'
  | 'growth_marketer'
  | 'frontend_designer'
  | 'user_testing'
  | 'technical_writer'

// Navigation Types
export type NavigationPage = 'ceo-overview' | 'project-detail' | 'dashboard' | 'agent-health' | 'skills-store' | 'analytics' | 'settings' | 'tasks'

// ========== PIPELINE TYPES ==========

export interface StageDeliverable {
  url: string | null;
  label: string;
  description: string;
}

export interface PipelineProject {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string; // Short URL slug (e.g., "postpilot" instead of full title)
  logoUrl?: string; // Product logo image URL
  backgroundColor?: string; // Page background color (hex)
  backgroundPreset?: 'none' | 'aurora' | 'nebula' | 'ember' | 'ocean' | 'midnight'; // Animated gradient preset
  heroBackgroundImage?: string; // Hero section background image URL
  stage: string;
  stageIndex: number;
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Review' | 'Complete';
  progress: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  agent: string;
  blockers: string;
  githubUrl: string;
  deployUrl: string;
  notes: string;
  url: string;
  isActive: boolean;
  deliverables: {
    intake: string | null;
    research: string | null;
    spec: string | null;
    architecture: string | null;
    design: string | null;
    codebase: string | null;
    testReport: string | null;
    securityReport: string | null;
    documentation: string | null;
  };
}

export interface PipelineActivity {
  projectId: string;
  projectTitle: string;
  currentPhase: string;
  currentAgent: string;
  startedAt: Date;
  progress: number;
}

export interface NotificationCounts {
  blocked: number;
  review: number;
  agentIssues: number;
  total: number;
}

export type StageIconName =
  | 'inbox'
  | 'search'
  | 'clipboard-list'
  | 'blocks'
  | 'palette'
  | 'code'
  | 'flask-conical'
  | 'shield-check'
  | 'file-text'
  | 'rocket';

export interface Stage {
  name: string;
  icon: StageIconName;
  color: string;
  agent: string;
  deliverableKey: string | null;
  description: string;
}

export const STAGES: Stage[] = [
  {
    name: '1. Intake',
    icon: 'inbox',
    color: 'gray',
    agent: 'CEO (Claude)',
    deliverableKey: 'intake',
    description: 'Project brief and requirements gathering'
  },
  {
    name: '2. Research',
    icon: 'search',
    color: 'blue',
    agent: 'Product Researcher',
    deliverableKey: 'research',
    description: 'Market research, competitor analysis, GO/NO-GO recommendation'
  },
  {
    name: '3. Planning',
    icon: 'clipboard-list',
    color: 'purple',
    agent: 'Product Manager',
    deliverableKey: 'spec',
    description: 'Product specification, MVP scope, user stories'
  },
  {
    name: '4. Architecture',
    icon: 'blocks',
    color: 'pink',
    agent: 'Architect',
    deliverableKey: 'architecture',
    description: 'Technical architecture, database schema, API design'
  },
  {
    name: '5. Design',
    icon: 'palette',
    color: 'orange',
    agent: 'Frontend Designer',
    deliverableKey: 'design',
    description: 'UI/UX mockups, design system, component specs'
  },
  {
    name: '6. Development',
    icon: 'code',
    color: 'yellow',
    agent: 'Developer',
    deliverableKey: 'codebase',
    description: 'Build and deploy application'
  },
  {
    name: '7. Testing',
    icon: 'flask-conical',
    color: 'green',
    agent: 'User Testing',
    deliverableKey: 'testReport',
    description: 'E2E tests, cross-browser, accessibility, performance'
  },
  {
    name: '8. Security',
    icon: 'shield-check',
    color: 'red',
    agent: 'Security Engineer',
    deliverableKey: 'securityReport',
    description: 'Vulnerability scan, security clearance'
  },
  {
    name: '9. Documentation',
    icon: 'file-text',
    color: 'brown',
    agent: 'Technical Writer',
    deliverableKey: 'documentation',
    description: 'README, user guide, API docs'
  },
  {
    name: '10. Launched',
    icon: 'rocket',
    color: 'emerald',
    agent: 'CEO (Claude)',
    deliverableKey: null,
    description: 'Production deployment complete'
  },
];

// Stage color system
export const STAGE_COLORS: Record<string, string> = {
  gray: '#6b7280',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  red: '#ef4444',
  brown: '#a16207',
  emerald: '#10b981',
};

// Helper to get stage info by index
export function getStageByIndex(index: number): Stage | undefined {
  return STAGES[index];
}

// Helper to get stage number from stage name (e.g., "5. Design" -> 5)
export function getStageNumber(stageName: string): number {
  const match = stageName.match(/^(\d+)\./);
  return match ? parseInt(match[1], 10) : 0;
}

// Helper to get stage short name (e.g., "5. Design" -> "Design")
export function getStageShortName(stageName: string): string {
  const parts = stageName.split('. ');
  return parts.length > 1 ? parts[1] : stageName;
}

// Get stage color by index
export function getStageColor(index: number): string {
  const stage = STAGES[index];
  if (!stage) return STAGE_COLORS.gray;
  return STAGE_COLORS[stage.color] || STAGE_COLORS.gray;
}

export const PIPELINE_STATUS_COLORS = {
  'Not Started': 'bg-[var(--text-muted)]',
  'In Progress': 'bg-blue-500',
  'Blocked': 'bg-[var(--error)]',
  'Review': 'bg-[var(--warning)]',
  'Complete': 'bg-[var(--success)]',
} as const;

export const PIPELINE_PRIORITY_COLORS = {
  'Critical': 'text-[var(--error)]',
  'High': 'text-[var(--accent)]',
  'Medium': 'text-[var(--warning)]',
  'Low': 'text-[var(--text-dim)]',
} as const;

// Settings Types
export interface AppSettings {
  appName: string
  appTagline: string
  theme: 'dark' | 'light' | 'system'
  accentColor: string
  showNotifications: boolean
  autoScrollChat: boolean
  soundEnabled: boolean
  soundVolume: number // 0.0 to 1.0
}

// Agent Health Types
export type HealthStatus = 'excellent' | 'good' | 'needs_attention' | 'critical'

export interface AgentHealthMetrics {
  agentId: AgentId
  healthScore: number // 0-100
  status: HealthStatus
  taskSuccessRate: number // percentage
  qualityScore: number // 0-100
  efficiency: number // percentage relative to baseline
  errorRate: number // percentage
  autonomyLevel: number // percentage
  tasksCompleted: number
  tasksAssigned: number
  avgCompletionTime: number // in minutes
  lastActive: Date
  trend: 'up' | 'down' | 'stable'
  issues: AgentIssue[]
}

export interface AgentIssue {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  recommendation: string
  detectedAt: Date
}

export type AgentRole = AgentId

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'delegating' | 'completed'

export type AgentTier = 'ceo' | 'leadership' | 'vp' | 'specialist'

export interface Agent {
  id: AgentId
  role: AgentRole
  displayName: string
  tier: AgentTier
  reportsTo: AgentId | null
  directReports: AgentId[]
  status: AgentStatus
  currentTask: Task | null
  color: string
  position: { x: number; y: number }
  tools: string[]
  specialty: string
}

// Project Types
export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  createdAt: Date
  updatedAt: Date
  color: string
  projectType?: 'quick' | 'ceo_orchestrated'
  briefingAnswers?: BriefingAnswers
}

// Project Stats for dashboard overview
export interface ProjectStats {
  activeTasks: number
  completedTasks: number
  totalTasks: number
  activeAgents: AgentId[]
  lastActivityAt: Date | null
  progressPercent: number
}

// CEO Orchestration Types - Project-specific clarifying questions
export interface BriefingAnswers {
  projectDescription?: string
  targetAudience?: string
  problemToSolve?: string
  keyFeature?: string
  successCriteria?: string
}

// Briefing question configuration
export interface BriefingQuestion {
  key: keyof BriefingAnswers
  question: string
  placeholder: string
  hint?: string
  isMultipleChoice?: boolean
}

// AI-generated options for multiple choice questions
export interface GeneratedBriefingOptions {
  targetAudience: string[]
  problemToSolve: string[]
  keyFeature: string[]
  successCriteria: string[]
}

export interface CEOProposal {
  summary: string
  phases: CEOProposalPhase[]
  totalDuration: string
  agentCount: number
  estimatedTasks: number
}

export interface CEOProposalPhase {
  name: string
  duration: string
  agents: AgentId[]
  description: string
}

// Task Types
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed'

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

// Stream output entry - represents agent's stream of consciousness
export interface StreamEntry {
  id: string
  timestamp: Date
  agentId: AgentId
  type: 'thought' | 'action' | 'result' | 'error'
  content: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo?: AgentId
  delegatedFrom?: AgentId
  projectId: string | null
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  // Stream of consciousness - live agent thoughts/actions
  streamOutput: StreamEntry[]
  // Progress tracking
  progress: number // 0-100
  currentStep?: string
}

// Event Types for Real-time Updates
export type AgentEventType =
  | 'task_created'
  | 'task_assigned'
  | 'task_completed'
  | 'agent_thinking'
  | 'agent_action'
  | 'error'
  | 'delegation'
  | 'pipeline_started'

export interface AgentEvent {
  id: string
  type: AgentEventType
  timestamp: Date
  agentId?: AgentId
  taskId?: string
  message: string
  data?: Record<string, unknown>
}

// CEO Action Types (imported inline to avoid circular deps)
export type CEOActionCategory = 'navigation' | 'project' | 'pipeline' | 'task' | 'ui'

export interface CEOActionType {
  id: string
  label: string
  category: CEOActionCategory
  payload?: Record<string, unknown>
}

// Message Types (for chat)
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: AgentId
  targetAgentId?: AgentId  // Who user is talking to (null = CEO)
  actions?: CEOActionType[]  // Optional action buttons for CEO responses
}

// Alias for backward compatibility
export type ChatMessage = Message

// SSE Event Structure
export interface SSEEvent {
  event: string | null
  data: string
}

// Sort/Filter options for Task Board
export type TaskSortBy = 'created' | 'updated' | 'priority' | 'agent' | 'project' | 'status'
export type TaskSortOrder = 'asc' | 'desc'

export interface TaskFilters {
  agentId?: AgentId | null
  projectId?: string | null
  status?: TaskStatus | null
  priority?: TaskPriority | null
}

// Pipeline Execution Status for orchestration
export type PipelineExecutionStatus = 'idle' | 'running' | 'paused' | 'stopped'

// Pipeline execution state stored per project
export interface PipelineExecutionState {
  projectId: string
  status: PipelineExecutionStatus
  currentTaskId: string | null
  currentStageIndex: number
  startedAt: Date | null
  pausedAt: Date | null
}
