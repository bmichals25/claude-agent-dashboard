import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

// Read API key from credentials vault
function getAnthropicKey(): string {
  try {
    const credentialsPath = join(process.cwd(), '..', '.claude', 'credentials.json')
    const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'))
    return credentials.api_keys.anthropic.key
  } catch {
    // Fallback to env var if credentials file not found
    return process.env.ANTHROPIC_API_KEY || ''
  }
}

const client = new Anthropic({
  apiKey: getAnthropicKey(),
})

interface BriefingOptionsRequest {
  projectDescription: string
  projectName: string
}

interface GeneratedOptions {
  targetAudience: string[]
  problemToSolve: string[]
  keyFeature: string[]
  successCriteria: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { projectDescription, projectName }: BriefingOptionsRequest = await request.json()

    if (!projectDescription || typeof projectDescription !== 'string') {
      return NextResponse.json(
        { error: 'Project description is required' },
        { status: 400 }
      )
    }

    const prompt = `Based on this project idea, generate specific multiple choice options for a project briefing survey. The project is called "${projectName}" and is described as: "${projectDescription}"

Generate 4 options for each of these categories. Options should be specific to THIS project, not generic. Each option should be concise (under 60 characters).

Return ONLY valid JSON in this exact format, no other text:
{
  "targetAudience": ["option1", "option2", "option3", "option4"],
  "problemToSolve": ["option1", "option2", "option3", "option4"],
  "keyFeature": ["option1", "option2", "option3", "option4"],
  "successCriteria": ["option1", "option2", "option3", "option4"]
}

For targetAudience: Who would use this product? Be specific about demographics or user types.
For problemToSolve: What pain points does this address? Focus on specific problems.
For keyFeature: What's the most important feature? Focus on core functionality.
For successCriteria: How would you measure success? Include metrics where possible.`

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Extract the text content from the response
    const textContent = message.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse the JSON response
    const options: GeneratedOptions = JSON.parse(textContent.text)

    return NextResponse.json(options)
  } catch (error) {
    console.error('Briefing options API error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    // Return fallback options if AI fails
    const fallbackOptions: GeneratedOptions = {
      targetAudience: [
        'Small business owners',
        'Enterprise teams',
        'Individual consumers',
        'Developers and technical users'
      ],
      problemToSolve: [
        'Time-consuming manual processes',
        'Lack of visibility and insights',
        'Poor user experience',
        'High operational costs'
      ],
      keyFeature: [
        'Automated workflows',
        'Real-time analytics dashboard',
        'Intuitive user interface',
        'Integration capabilities'
      ],
      successCriteria: [
        '50% reduction in time spent',
        '1000+ active users in 3 months',
        '4.5+ star user rating',
        '80% user retention rate'
      ]
    }

    return NextResponse.json(fallbackOptions)
  }
}
