import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { STAGES } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// System prompt for the CEO agent
const CEO_SYSTEM_PROMPT = `You are the CEO of an AI agent orchestration system. Your name is Claude and you oversee a team of 19 specialized AI agents organized into a hierarchy.

Your leadership team includes:
- Chief of Staff (admin, Notion operations)
- Pipeline Manager (project lifecycle)
- Agent Operations (agent oversight)
- VP Engineering (technical execution - manages Architect, Developer, DevOps, Code Reviewer, Security Engineer)
- VP Product (product strategy - manages Product Researcher, Product Manager, Data Engineer, Growth Marketer)
- VP Design & QA (quality - manages Frontend Designer, User Testing, Technical Writer)

You communicate directly with the user (Ben) and delegate work to appropriate agents through your VPs.

When the user asks about tasks or project status:
1. Reference the specific project context provided
2. Be specific about what stage the project is in and what comes next
3. Mention which agent would handle the next phase
4. Be concise but informative

Pipeline stages are:
1. Intake - CEO reviews project brief
2. Research - Product Researcher does market analysis
3. Planning - Product Manager writes spec
4. Architecture - Architect designs technical approach
5. Design - Frontend Designer creates mockups
6. Development - Developer builds the app
7. Testing - User Testing runs QA
8. Security - Security Engineer audits
9. Documentation - Technical Writer creates docs
10. Launched - Production deployment

Be helpful, direct, and knowledgeable about the current project state. Don't be overly verbose.`

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      // Return a helpful fallback response when API key is not configured
      return new Response(
        JSON.stringify({
          id: `msg-${Date.now()}`,
          agentId: 'ceo',
          content: `I'd love to help, but my AI capabilities aren't fully configured yet. To enable intelligent responses, add your ANTHROPIC_API_KEY to .env.local.\n\nIn the meantime, I can see you're asking about: "${message.slice(0, 50)}..."`,
          timestamp: new Date().toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build context message
    let contextMessage = ''
    if (context) {
      if (context.project) {
        const p = context.project
        const stage = STAGES[p.stageIndex]
        const nextStage = STAGES[p.stageIndex + 1]
        contextMessage = `\n\nCurrent project context:
- Project: "${p.title}"
- Current Stage: ${p.stage} (${p.stageIndex + 1}/10)
- Status: ${p.status}
- Progress: ${Math.round(p.progress * 100)}%
- Assigned Agent: ${p.agent}
- Stage Description: ${stage?.description || 'N/A'}
${p.blockers ? `- Blockers: ${p.blockers}` : ''}
${nextStage ? `- Next Stage: ${nextStage.name} (handled by ${nextStage.agent})` : '- This is the final stage!'}`
      }
      if (context.recentMessages?.length > 0) {
        contextMessage += `\n\nRecent conversation:\n${context.recentMessages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}`
      }
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: CEO_SYSTEM_PROMPT + contextMessage,
      messages: [
        { role: 'user', content: message }
      ],
    })

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text')
    const responseText = textContent?.type === 'text' ? textContent.text : 'I apologize, I couldn\'t generate a response.'

    return new Response(
      JSON.stringify({
        id: `msg-${Date.now()}`,
        agentId: 'ceo',
        content: responseText,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to get AI response',
        fallbackContent: 'I encountered an issue processing that request. Please try again.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
