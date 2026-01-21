import type { AgentId } from './types'

// Agent persona and response definitions
export interface AgentPersona {
  greeting: string[]
  acknowledgment: string[]
  clarification: string[]
  taskCreated: (title: string) => string
  specialty: string
}

// Response templates for each agent type
export const AGENT_RESPONSES: Record<AgentId, AgentPersona> = {
  ceo: {
    greeting: [
      "Hello! I'm the CEO agent orchestrating your team. How can I help you today?",
      "Hey there! Ready to coordinate the team. What do you need?",
      "Good to see you! What would you like to work on?",
    ],
    acknowledgment: [
      "Got it. Let me think about the best approach for this...",
      "Understood. I'll analyze this and determine how to proceed.",
      "I hear you. Let me consider the options here.",
    ],
    clarification: [
      "Could you tell me more about what you're looking for? I want to make sure I route this to the right team.",
      "Interesting! Can you elaborate on that? I want to understand the full scope before delegating.",
      "I'd like to help with that. What specific outcome are you hoping for?",
    ],
    taskCreated: (title: string) => `I've created a task for this: "${title}". I'll delegate it to the appropriate team members and keep you updated on progress.`,
    specialty: 'Strategic orchestration and team coordination',
  },

  chief_of_staff: {
    greeting: [
      "Hi! I handle all Notion operations and business tracking. What can I help with?",
      "Hello! I'm your admin support. Need help with documentation or tracking?",
    ],
    acknowledgment: [
      "I'll get that organized right away.",
      "Let me handle that administrative task for you.",
    ],
    clarification: [
      "What specific records or documentation do you need me to work with?",
      "Could you clarify the tracking or admin task you need help with?",
    ],
    taskCreated: (title: string) => `Task logged: "${title}". I'll coordinate the administrative aspects.`,
    specialty: 'Notion operations, business tracking, and administrative support',
  },

  pipeline_manager: {
    greeting: [
      "Hello! I manage project lifecycles and pipeline coordination. What project needs attention?",
      "Hi there! Ready to help with pipeline management. What's on your mind?",
    ],
    acknowledgment: [
      "I'll review the project pipeline and prioritize accordingly.",
      "Let me coordinate that across the relevant phases.",
    ],
    clarification: [
      "Which project or phase are you asking about?",
      "Could you tell me more about the project timeline you're considering?",
    ],
    taskCreated: (title: string) => `Added to pipeline: "${title}". I'll track this through all relevant phases.`,
    specialty: 'Project lifecycle coordination and pipeline management',
  },

  agent_operations: {
    greeting: [
      "Hi! I handle agent oversight and optimization. How can I improve our team's performance?",
      "Hello! I'm here to help with agent coordination and recommendations.",
    ],
    acknowledgment: [
      "I'll analyze the agent performance metrics on this.",
      "Let me review how we can optimize this workflow.",
    ],
    clarification: [
      "Which agents are you concerned about, or should I review the whole team?",
      "What specific performance aspect would you like me to focus on?",
    ],
    taskCreated: (title: string) => `Optimization task: "${title}". I'll coordinate agent improvements.`,
    specialty: 'Agent oversight, optimization, and performance recommendations',
  },

  vp_engineering: {
    greeting: [
      "Hello! I oversee all technical execution and code quality. What engineering challenge can I help with?",
      "Hi! VP Engineering here. Ready to tackle technical problems.",
    ],
    acknowledgment: [
      "I'll coordinate with the engineering team on this.",
      "Let me assign this to the appropriate technical specialist.",
    ],
    clarification: [
      "What's the technical context? Is this architecture, development, or infrastructure related?",
      "Could you give me more details on the technical requirements?",
    ],
    taskCreated: (title: string) => `Engineering task: "${title}". I'll ensure technical excellence.`,
    specialty: 'Technical execution, code quality, and engineering team leadership',
  },

  vp_product: {
    greeting: [
      "Hi! I handle product strategy and research. What product direction can I help with?",
      "Hello! VP Product here. Ready to help with product decisions.",
    ],
    acknowledgment: [
      "I'll have the product team analyze this.",
      "Let me coordinate research and strategy on this.",
    ],
    clarification: [
      "What market or user problem are we trying to solve?",
      "Could you share more about the product goals?",
    ],
    taskCreated: (title: string) => `Product task: "${title}". I'll coordinate strategy and research.`,
    specialty: 'Product strategy, market research, and growth initiatives',
  },

  vp_design_qa: {
    greeting: [
      "Hello! I oversee design and quality assurance. How can I help with UX or testing?",
      "Hi! VP Design & QA here. Ready to ensure quality and great user experience.",
    ],
    acknowledgment: [
      "I'll coordinate design and testing on this.",
      "Let me ensure we maintain quality standards here.",
    ],
    clarification: [
      "Are you focused on design aspects or quality testing?",
      "What specific UX or QA concerns do you have?",
    ],
    taskCreated: (title: string) => `Design/QA task: "${title}". I'll ensure quality and usability.`,
    specialty: 'UX design, visual design, and quality assurance',
  },

  support_agent: {
    greeting: [
      "Hi! I handle user feedback and support issues. What can I help resolve?",
      "Hello! Support agent here. How can I assist you today?",
    ],
    acknowledgment: [
      "I'll look into this support issue right away.",
      "Let me investigate and find a solution.",
    ],
    clarification: [
      "Could you describe the issue you're experiencing in more detail?",
      "What behavior are you expecting versus what's happening?",
    ],
    taskCreated: (title: string) => `Support ticket: "${title}". I'll work on resolving this.`,
    specialty: 'User feedback, FAQs, and issue resolution',
  },

  autopilot_agent: {
    greeting: [
      "Hi! I handle autonomous approvals and automated workflows.",
      "Hello! Autopilot agent ready for automated task coordination.",
    ],
    acknowledgment: [
      "I'll process this through the automated workflow.",
      "Initiating autonomous handling of this request.",
    ],
    clarification: [
      "What level of automation are you looking for on this task?",
      "Should this be fully automated or require checkpoints?",
    ],
    taskCreated: (title: string) => `Autopilot task: "${title}". Running automated workflow.`,
    specialty: 'Autonomous approvals and automated workflow execution',
  },

  architect: {
    greeting: [
      "Hello! I specialize in system architecture and technical design. What should we build?",
      "Hi! Architect here. Ready to design robust technical solutions.",
    ],
    acknowledgment: [
      "Let me design the technical architecture for this.",
      "I'll create a solid architectural foundation.",
    ],
    clarification: [
      "What scale and performance requirements should I design for?",
      "Are there existing systems this needs to integrate with?",
    ],
    taskCreated: (title: string) => `Architecture task: "${title}". Designing the technical blueprint.`,
    specialty: 'System architecture, technical design, and integration patterns',
  },

  developer: {
    greeting: [
      "Hey! I'm the Developer agent. Ready to write some code. What are we building?",
      "Hi! Developer here. Let's ship some features!",
    ],
    acknowledgment: [
      "I'll start implementing this right away.",
      "Let me code up a solution for this.",
    ],
    clarification: [
      "What's the tech stack we're working with?",
      "Any specific implementation constraints I should know about?",
    ],
    taskCreated: (title: string) => `Dev task: "${title}". Starting implementation.`,
    specialty: 'Building and deploying applications',
  },

  devops_engineer: {
    greeting: [
      "Hello! I handle CI/CD and infrastructure. What deployment needs do you have?",
      "Hi! DevOps here. Ready to streamline your infrastructure.",
    ],
    acknowledgment: [
      "I'll configure the deployment pipeline for this.",
      "Let me set up the infrastructure requirements.",
    ],
    clarification: [
      "What environment are we deploying to?",
      "Any specific scaling or reliability requirements?",
    ],
    taskCreated: (title: string) => `DevOps task: "${title}". Configuring infrastructure.`,
    specialty: 'CI/CD pipelines, deployment, and infrastructure management',
  },

  code_reviewer: {
    greeting: [
      "Hello! I review code for quality and best practices. What needs reviewing?",
      "Hi! Code Reviewer here. Ready to ensure code quality.",
    ],
    acknowledgment: [
      "I'll review this code thoroughly.",
      "Let me analyze this for quality and potential issues.",
    ],
    clarification: [
      "What specific aspects should I focus on in this review?",
      "Are there particular patterns or standards to enforce?",
    ],
    taskCreated: (title: string) => `Review task: "${title}". Starting code analysis.`,
    specialty: 'Code quality, PR reviews, and best practices enforcement',
  },

  security_engineer: {
    greeting: [
      "Hello! I handle security scanning and vulnerability assessment. What needs securing?",
      "Hi! Security Engineer here. Let's ensure your system is secure.",
    ],
    acknowledgment: [
      "I'll run a security analysis on this.",
      "Let me assess the security implications.",
    ],
    clarification: [
      "What's the threat model we should consider?",
      "Are there specific security requirements or compliance needs?",
    ],
    taskCreated: (title: string) => `Security task: "${title}". Running security assessment.`,
    specialty: 'Security scanning, vulnerability assessment, and compliance',
  },

  product_researcher: {
    greeting: [
      "Hi! I conduct market research and competitive analysis. What should we investigate?",
      "Hello! Product Researcher ready to gather insights.",
    ],
    acknowledgment: [
      "I'll research this topic thoroughly.",
      "Let me gather data and insights on this.",
    ],
    clarification: [
      "What specific market or user segment should I focus on?",
      "What decisions will this research inform?",
    ],
    taskCreated: (title: string) => `Research task: "${title}". Starting investigation.`,
    specialty: 'Market research, competitor analysis, and GO/NO-GO recommendations',
  },

  product_manager: {
    greeting: [
      "Hello! I handle product specs and MVP scoping. What feature should we define?",
      "Hi! Product Manager here. Let's shape the product requirements.",
    ],
    acknowledgment: [
      "I'll create a detailed specification for this.",
      "Let me scope out the requirements.",
    ],
    clarification: [
      "What's the user story or problem we're solving?",
      "What's the priority and timeline for this feature?",
    ],
    taskCreated: (title: string) => `PM task: "${title}". Defining requirements.`,
    specialty: 'Product specifications, MVP scope, and user stories',
  },

  data_engineer: {
    greeting: [
      "Hello! I handle analytics and data infrastructure. What metrics do you need?",
      "Hi! Data Engineer here. Ready to build data solutions.",
    ],
    acknowledgment: [
      "I'll set up the analytics tracking for this.",
      "Let me configure the data pipeline.",
    ],
    clarification: [
      "What specific metrics or events should we track?",
      "What dashboards or reports do you need?",
    ],
    taskCreated: (title: string) => `Data task: "${title}". Setting up analytics.`,
    specialty: 'Analytics setup, dashboards, and data infrastructure',
  },

  growth_marketer: {
    greeting: [
      "Hi! I handle launch strategy and growth initiatives. What should we promote?",
      "Hello! Growth Marketer ready to expand your reach.",
    ],
    acknowledgment: [
      "I'll develop a marketing strategy for this.",
      "Let me plan the growth approach.",
    ],
    clarification: [
      "What's the target audience for this campaign?",
      "What channels and budget are we working with?",
    ],
    taskCreated: (title: string) => `Growth task: "${title}". Planning marketing strategy.`,
    specialty: 'Launch strategy, SEO, and growth marketing',
  },

  frontend_designer: {
    greeting: [
      "Hello! I create UI/UX designs and mockups. What should we design?",
      "Hi! Frontend Designer here. Ready to craft beautiful interfaces.",
    ],
    acknowledgment: [
      "I'll create mockups and design specs for this.",
      "Let me design the user interface.",
    ],
    clarification: [
      "What's the user flow or screens we need to design?",
      "Are there existing design patterns to follow?",
    ],
    taskCreated: (title: string) => `Design task: "${title}". Creating mockups.`,
    specialty: 'UI/UX mockups, design systems, and component specs',
  },

  user_testing: {
    greeting: [
      "Hello! I run E2E tests and QA. What should we test?",
      "Hi! User Testing agent ready to ensure quality.",
    ],
    acknowledgment: [
      "I'll create and run tests for this.",
      "Let me set up the test plan.",
    ],
    clarification: [
      "What user flows or features need testing?",
      "Are there specific edge cases to consider?",
    ],
    taskCreated: (title: string) => `Test task: "${title}". Running QA tests.`,
    specialty: 'E2E testing, cross-browser testing, and accessibility audits',
  },

  technical_writer: {
    greeting: [
      "Hello! I create documentation and guides. What needs documenting?",
      "Hi! Technical Writer here. Ready to create clear documentation.",
    ],
    acknowledgment: [
      "I'll write comprehensive documentation for this.",
      "Let me create the documentation.",
    ],
    clarification: [
      "Who is the target audience for this documentation?",
      "What format do you prefer - README, guide, or API docs?",
    ],
    taskCreated: (title: string) => `Docs task: "${title}". Writing documentation.`,
    specialty: 'README files, user guides, and API documentation',
  },
}

// Get a random response from an array
export function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)]
}

// Get agent responses for a given agent ID
export function getAgentResponses(agentId: AgentId): AgentPersona {
  return AGENT_RESPONSES[agentId] || AGENT_RESPONSES.ceo
}
