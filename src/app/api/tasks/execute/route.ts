import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Create a GitHub repository for the project
async function createGitHubRepo(
  projectTitle: string,
  description: string
): Promise<{ url: string; name: string } | null> {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''

  if (!GITHUB_TOKEN) {
    console.warn('GITHUB_TOKEN not set, skipping repo creation')
    return null
  }

  try {
    // Create a slug from the project title
    const repoName = projectTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)

    console.log(`Creating GitHub repo: ${repoName}`)

    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: description.slice(0, 350),
        private: false,
        auto_init: true, // Creates with README
        has_issues: true,
        has_projects: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('GitHub API error:', error)
      // If repo already exists, try to get it
      if (error.errors?.[0]?.message?.includes('name already exists')) {
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
          },
        })
        const user = await userResponse.json()
        return {
          url: `https://github.com/${user.login}/${repoName}`,
          name: repoName,
        }
      }
      return null
    }

    const repo = await response.json()
    console.log(`GitHub repo created: ${repo.html_url}`)

    return {
      url: repo.html_url,
      name: repo.name,
    }
  } catch (error) {
    console.error('Failed to create GitHub repo:', error)
    return null
  }
}

// Update project's GitHub URL in the dashboard
async function updateProjectGitHubUrl(projectId: string, githubUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pipeline`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: projectId,
        githubUrl,
      }),
    })
    return response.ok
  } catch (error) {
    console.error('Failed to update project GitHub URL:', error)
    return false
  }
}

// Create a Notion page for the deliverable
async function createNotionDeliverable(
  title: string,
  content: string,
  projectTitle: string,
  deliverableType: string
): Promise<string | null> {
  // Read env vars at runtime, not module load time
  const NOTION_TOKEN = process.env.NOTION_TOKEN || ''
  const NOTION_ROOT_PAGE = process.env.NOTION_ROOT_PAGE || ''

  console.log(`createNotionDeliverable called - NOTION_TOKEN: ${NOTION_TOKEN ? 'set (' + NOTION_TOKEN.slice(0, 10) + '...)' : 'NOT SET'}, NOTION_ROOT_PAGE: ${NOTION_ROOT_PAGE || 'NOT SET'}`)

  if (!NOTION_TOKEN || !NOTION_ROOT_PAGE) {
    console.warn('Notion not configured, skipping deliverable creation')
    return null
  }

  try {
    // Convert markdown content to Notion blocks
    const allBlocks = convertMarkdownToNotionBlocks(content)
    console.log(`Converted to ${allBlocks.length} Notion blocks`)

    // Notion API limits to 100 blocks per request
    const firstBatch = allBlocks.slice(0, 100)
    const remainingBlocks = allBlocks.slice(100)

    // Create page with first batch of blocks
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { page_id: NOTION_ROOT_PAGE },
        properties: {
          title: {
            title: [{ text: { content: `${projectTitle} - ${title}` } }]
          }
        },
        children: firstBatch,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Notion API error status:', response.status)
      console.error('Notion API error body:', errorText)
      return null
    }

    const page = await response.json()
    console.log('Notion page created successfully:', page.id, page.url)
    const pageId = page.id

    // Append remaining blocks in batches of 100
    for (let i = 0; i < remainingBlocks.length; i += 100) {
      const batch = remainingBlocks.slice(i, i + 100)

      const appendResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          children: batch,
        }),
      })

      if (!appendResponse.ok) {
        console.error('Failed to append blocks:', await appendResponse.json())
        // Continue anyway, page was created with initial content
      }
    }

    return page.url
  } catch (error) {
    console.error('Failed to create Notion deliverable:', error)
    return null
  }
}

// Convert inline markdown to Notion rich text array
function parseInlineMarkdown(text: string): any[] {
  const richText: any[] = []

  // Regex to match **bold**, *italic*, `code`, and [links](url)
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g

  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index)
      if (beforeText) {
        richText.push({ type: 'text', text: { content: beforeText } })
      }
    }

    if (match[2]) {
      // Bold **text**
      richText.push({
        type: 'text',
        text: { content: match[2] },
        annotations: { bold: true }
      })
    } else if (match[3]) {
      // Italic *text*
      richText.push({
        type: 'text',
        text: { content: match[3] },
        annotations: { italic: true }
      })
    } else if (match[4]) {
      // Code `text`
      richText.push({
        type: 'text',
        text: { content: match[4] },
        annotations: { code: true }
      })
    } else if (match[5] && match[6]) {
      // Link [text](url)
      richText.push({
        type: 'text',
        text: { content: match[5], link: { url: match[6] } }
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex)
    if (remaining) {
      richText.push({ type: 'text', text: { content: remaining } })
    }
  }

  // If no matches found, return plain text
  if (richText.length === 0) {
    return [{ type: 'text', text: { content: text } }]
  }

  return richText
}

// Convert markdown to Notion blocks
function convertMarkdownToNotionBlocks(markdown: string): any[] {
  const blocks: any[] = []
  const lines = markdown.split('\n')
  let currentParagraph: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim()
      if (text) {
        // Split long paragraphs into chunks (Notion limit is 2000 chars per rich text)
        const chunks = splitTextIntoChunks(text, 1800)
        for (const chunk of chunks) {
          blocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: parseInlineMarkdown(chunk)
            }
          })
        }
      }
      currentParagraph = []
    }
  }

  for (const line of lines) {
    // Heading 1
    if (line.startsWith('# ')) {
      flushParagraph()
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: parseInlineMarkdown(line.slice(2).trim())
        }
      })
    }
    // Heading 2
    else if (line.startsWith('## ')) {
      flushParagraph()
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: parseInlineMarkdown(line.slice(3).trim())
        }
      })
    }
    // Heading 3
    else if (line.startsWith('### ')) {
      flushParagraph()
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: parseInlineMarkdown(line.slice(4).trim())
        }
      })
    }
    // Bullet point
    else if (line.match(/^[-*]\s/)) {
      flushParagraph()
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: parseInlineMarkdown(line.slice(2).trim())
        }
      })
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      flushParagraph()
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: parseInlineMarkdown(line.replace(/^\d+\.\s/, '').trim())
        }
      })
    }
    // Empty line
    else if (line.trim() === '') {
      flushParagraph()
    }
    // Regular text
    else {
      currentParagraph.push(line)
    }
  }

  flushParagraph()

  return blocks
}

// Split text into chunks for Notion's character limit
function splitTextIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = []
  let remaining = text

  while (remaining.length > maxLength) {
    // Find a good break point (space, period, comma)
    let breakPoint = remaining.lastIndexOf(' ', maxLength)
    if (breakPoint === -1 || breakPoint < maxLength / 2) {
      breakPoint = maxLength
    }
    chunks.push(remaining.slice(0, breakPoint).trim())
    remaining = remaining.slice(breakPoint).trim()
  }

  if (remaining) {
    chunks.push(remaining)
  }

  return chunks
}

// Get agent-specific system prompt based on the stage
function getAgentSystemPrompt(agentId: string, stageName: string, stageDescription: string, projectTitle: string): string {
  const agentPrompts: Record<string, string> = {
    'ceo': `You are the CEO of an AI agent orchestration system. You are reviewing the project "${projectTitle}" for the ${stageName} phase.
Your task: ${stageDescription}
Create a comprehensive project brief that captures the vision, goals, and initial requirements.`,

    'product_researcher': `You are a Product Researcher AI agent. You are conducting market research for "${projectTitle}".
Your task: ${stageDescription}
Analyze the market, identify competitors, understand target audience needs, and provide a GO/NO-GO recommendation with supporting evidence.`,

    'product_manager': `You are a Product Manager AI agent. You are creating a product specification for "${projectTitle}".
Your task: ${stageDescription}
Define the MVP scope, write clear user stories, establish acceptance criteria, and prioritize features for initial launch.`,

    'architect': `You are a Technical Architect AI agent. You are designing the technical architecture for "${projectTitle}".
Your task: ${stageDescription}
Select the technology stack, design the database schema, plan API structure, and document all system components.`,

    'frontend_designer': `You are a Frontend Designer AI agent. You are creating UI/UX designs for "${projectTitle}".
Your task: ${stageDescription}
Create wireframes, design mockups, establish a design system, and document component specifications.`,

    'developer': `You are a Developer AI agent. You are building "${projectTitle}".
Your task: ${stageDescription}
Implement core features, integrate APIs, build the business logic, and prepare for deployment.`,

    'user_testing': `You are a User Testing AI agent. You are testing "${projectTitle}".
Your task: ${stageDescription}
Run E2E tests, cross-browser testing, accessibility audits, and performance benchmarks. Report all findings.`,

    'security_engineer': `You are a Security Engineer AI agent. You are auditing "${projectTitle}".
Your task: ${stageDescription}
Run vulnerability scans, review authentication flows, check data handling practices, and provide security clearance.`,

    'technical_writer': `You are a Technical Writer AI agent. You are documenting "${projectTitle}".
Your task: ${stageDescription}
Create comprehensive README, user guides, API documentation, and deployment instructions.`,
  }

  return agentPrompts[agentId] || agentPrompts['ceo']
}

// Get progress messages for each stage type
function getProgressMessages(deliverableKey: string): string[] {
  const messages: Record<string, string[]> = {
    'intake': [
      'Reviewing project requirements...',
      'Identifying key stakeholders and goals...',
      'Documenting initial assumptions...',
      'Finalizing project scope...',
    ],
    'research': [
      'Analyzing market landscape...',
      'Researching competitor products...',
      'Identifying target audience segments...',
      'Evaluating problem-solution fit...',
      'Preparing GO/NO-GO recommendation...',
    ],
    'spec': [
      'Defining MVP scope boundaries...',
      'Writing user stories...',
      'Establishing acceptance criteria...',
      'Prioritizing features using MoSCoW...',
      'Documenting dependencies...',
    ],
    'architecture': [
      'Evaluating technology options...',
      'Designing database schema...',
      'Planning API structure...',
      'Mapping system components...',
      'Documenting security considerations...',
    ],
    'design': [
      'Establishing design system foundations...',
      'Creating wireframe layouts...',
      'Defining color and typography...',
      'Documenting component specifications...',
      'Planning responsive breakpoints...',
    ],
    'codebase': [
      'Setting up project structure...',
      'Implementing core components...',
      'Building data models and services...',
      'Integrating APIs and state management...',
      'Adding styling and responsive design...',
      'Finalizing implementation...',
    ],
    'testReport': [
      'Running functional tests...',
      'Checking cross-browser compatibility...',
      'Performing accessibility audit...',
      'Measuring performance benchmarks...',
      'Documenting findings...',
    ],
    'securityReport': [
      'Running vulnerability scans...',
      'Reviewing authentication flows...',
      'Checking data handling practices...',
      'Evaluating OWASP Top 10 compliance...',
      'Preparing security clearance...',
    ],
    'documentation': [
      'Writing project README...',
      'Creating user guide sections...',
      'Documenting API endpoints...',
      'Adding deployment instructions...',
      'Finalizing documentation...',
    ],
    'default': [
      'Processing requirements...',
      'Generating content...',
      'Reviewing output...',
      'Finalizing deliverable...',
    ],
  }

  return messages[deliverableKey] || messages['default']
}

// Get deliverable template based on stage
function getDeliverableTemplate(deliverableKey: string, projectTitle: string): string {
  const templates: Record<string, string> = {
    'intake': `Create a project brief for "${projectTitle}" including:
1. Project Vision
2. Goals and Objectives
3. Target Audience
4. Key Features (initial scope)
5. Success Metrics
6. Initial Assumptions and Constraints`,

    'research': `Create a market research report for "${projectTitle}" including:
1. Executive Summary
2. Market Analysis
3. Competitor Analysis (at least 3 competitors)
4. Target Audience Profile
5. Problem-Solution Fit Analysis
6. SWOT Analysis
7. GO/NO-GO Recommendation with Justification`,

    'spec': `Create a product specification for "${projectTitle}" including:
1. Product Overview
2. MVP Scope Definition
3. User Stories (at least 5)
4. Acceptance Criteria
5. Feature Prioritization (MoSCoW method)
6. Out of Scope Items
7. Dependencies and Risks`,

    'architecture': `Create a technical architecture document for "${projectTitle}" including:
1. System Overview
2. Technology Stack Recommendations
3. Database Schema Design
4. API Structure (endpoints)
5. Component Architecture
6. Security Considerations
7. Scalability Plan`,

    'design': `Create a design specification for "${projectTitle}" including:
1. Design System Overview
2. Color Palette and Typography
3. Key Screen Wireframes (at least 3)
4. Component Library Specs
5. User Flow Diagrams
6. Responsive Design Guidelines
7. Accessibility Requirements`,

    'codebase': `Create the implementation code for "${projectTitle}". Provide:
1. Project Structure (directory tree)
2. Package.json with dependencies
3. Main application entry point code
4. Core component implementations (React/Next.js)
5. Data models and types
6. API routes or services
7. Styling approach (CSS/Tailwind)
8. State management setup
9. Key utility functions
10. Environment configuration

Write actual, working code that could be used to bootstrap the project. Include complete file contents, not just snippets.`,

    'testReport': `Create a test report for "${projectTitle}" including:
1. Test Summary
2. Test Coverage
3. Functional Test Results
4. Cross-browser Compatibility
5. Accessibility Audit (WCAG)
6. Performance Benchmarks
7. Issues Found and Severity
8. Recommendations`,

    'securityReport': `Create a security audit report for "${projectTitle}" including:
1. Security Assessment Summary
2. Vulnerability Scan Results
3. Authentication Review
4. Data Handling Analysis
5. OWASP Top 10 Check
6. Risk Assessment
7. Security Recommendations
8. Clearance Status`,

    'documentation': `Create documentation for "${projectTitle}" including:
1. README (project overview, setup instructions)
2. User Guide (how to use the product)
3. API Documentation (if applicable)
4. Deployment Guide
5. Troubleshooting Guide
6. Change Log`,
  }

  return templates[deliverableKey] || 'Complete the assigned task and provide a comprehensive deliverable.'
}

// Helper to send SSE event
function sendSSE(controller: ReadableStreamDefaultController, type: string, data: Record<string, unknown>) {
  const encoder = new TextEncoder()
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      taskId,
      projectId,
      projectTitle,
      stageIndex,
      stageName,
      stageDescription,
      agentId,
      deliverableKey,
    } = body

    if (!taskId || !projectId || !projectTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial thought
          sendSSE(controller, 'thought', {
            content: `Analyzing requirements for ${stageName}...`
          })
          sendSSE(controller, 'progress', { progress: 5, step: 'Analyzing requirements' })

          // For Development stage, create GitHub repo first
          let githubRepoUrl: string | null = null
          if (deliverableKey === 'codebase') {
            sendSSE(controller, 'action', { content: 'Creating GitHub repository...' })
            sendSSE(controller, 'progress', { progress: 8, step: 'Creating GitHub repository' })

            const repo = await createGitHubRepo(projectTitle, stageDescription)
            if (repo) {
              githubRepoUrl = repo.url
              sendSSE(controller, 'result', { content: `GitHub repository created: ${repo.url}` })

              // Update project with GitHub URL
              sendSSE(controller, 'action', { content: 'Linking repository to project...' })
              await updateProjectGitHubUrl(projectId, repo.url)
              sendSSE(controller, 'result', { content: 'Repository linked to project dashboard' })
            } else {
              sendSSE(controller, 'thought', { content: 'GitHub repo creation skipped (no token or error)' })
            }
            sendSSE(controller, 'progress', { progress: 12, step: 'Repository ready' })
          }

          // Build the prompt
          const systemPrompt = getAgentSystemPrompt(agentId, stageName, stageDescription, projectTitle)
          let deliverablePrompt = deliverableKey
            ? getDeliverableTemplate(deliverableKey, projectTitle)
            : `Complete the ${stageName} phase for "${projectTitle}". ${stageDescription}`

          // For codebase, include the GitHub repo URL in the prompt
          if (deliverableKey === 'codebase' && githubRepoUrl) {
            deliverablePrompt = `The GitHub repository has been created at: ${githubRepoUrl}\n\n${deliverablePrompt}\n\nInclude instructions for cloning and setting up this repository.`
          }

          const fullPrompt = `${deliverablePrompt}

Please structure your response clearly with sections and bullet points where appropriate.
Be thorough but concise. This is a real deliverable that will be used to advance the project.`

          sendSSE(controller, 'action', {
            content: `Starting ${stageName.split('. ')[1] || stageName} work...`
          })
          sendSSE(controller, 'progress', { progress: 15, step: 'Gathering context' })

          // Stage-specific progress messages
          const progressMessages = getProgressMessages(deliverableKey || 'default')
          let messageIndex = 0

          // Call Claude API with streaming
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{ role: 'user', content: fullPrompt }],
            stream: true,
          })

          let fullContent = ''
          let lastProgressUpdate = 15
          let lastMessageUpdate = 0

          // Stream the response
          for await (const event of response) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta
              if ('text' in delta) {
                fullContent += delta.text

                // Send periodic progress updates
                const progress = Math.min(15 + Math.floor((fullContent.length / 4000) * 70), 85)
                if (progress > lastProgressUpdate + 10) {
                  lastProgressUpdate = progress
                  sendSSE(controller, 'progress', {
                    progress,
                    step: `Generating ${deliverableKey || 'deliverable'}...`
                  })
                }

                // Send meaningful status updates (not content fragments)
                if (fullContent.length > lastMessageUpdate + 800 && messageIndex < progressMessages.length) {
                  sendSSE(controller, 'thought', { content: progressMessages[messageIndex] })
                  messageIndex++
                  lastMessageUpdate = fullContent.length
                }
              }
            }
          }

          sendSSE(controller, 'progress', { progress: 90, step: 'Finalizing deliverable' })
          sendSSE(controller, 'action', { content: 'Saving deliverable to Notion...' })

          // Create deliverable in Notion
          if (deliverableKey && fullContent) {
            // Get a readable title for the deliverable
            const deliverableTitles: Record<string, string> = {
              'intake': 'Project Brief',
              'research': 'Research Report',
              'spec': 'Product Specification',
              'architecture': 'Architecture Document',
              'design': 'Design Specification',
              'codebase': 'Implementation Code',
              'testReport': 'Test Report',
              'securityReport': 'Security Audit',
              'documentation': 'Documentation',
            }
            const title = deliverableTitles[deliverableKey] || 'Deliverable'

            // Try to create in Notion, fall back to data URL if Notion fails
            console.log(`Creating Notion deliverable: ${title} for ${projectTitle}`)
            console.log(`Content length: ${fullContent.length} chars`)
            let deliverableUrl = await createNotionDeliverable(title, fullContent, projectTitle, deliverableKey)

            if (!deliverableUrl) {
              // Fallback to data URL if Notion creation fails
              console.error('Notion creation failed, using data URL fallback. Check NOTION_TOKEN and NOTION_ROOT_PAGE env vars.')
              console.error(`NOTION_TOKEN set: ${!!process.env.NOTION_TOKEN}`)
              console.error(`NOTION_ROOT_PAGE set: ${!!process.env.NOTION_ROOT_PAGE}`)
              const base64Content = Buffer.from(fullContent).toString('base64')
              deliverableUrl = `data:text/markdown;base64,${base64Content}`
            } else {
              console.log(`Notion deliverable created: ${deliverableUrl}`)
            }

            sendSSE(controller, 'deliverable', {
              key: deliverableKey,
              url: deliverableUrl,
            })

            sendSSE(controller, 'result', {
              content: `${deliverableKey.charAt(0).toUpperCase() + deliverableKey.slice(1)} deliverable created successfully.`
            })
          } else {
            // For stages without deliverables, just mark as result
            sendSSE(controller, 'result', {
              content: fullContent.slice(0, 500) + (fullContent.length > 500 ? '...' : '')
            })
          }

          sendSSE(controller, 'progress', { progress: 100, step: 'Complete' })
          sendSSE(controller, 'complete', { success: true })

        } catch (error) {
          console.error('Execution error:', error)
          sendSSE(controller, 'error', {
            content: `Execution failed: ${(error as Error).message}`
          })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Task execution API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to execute task' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
