import { NextRequest, NextResponse } from 'next/server'
import { getAgentById } from '@/lib/agentCatalog'
import type { AgentId } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params
    const agent = getAgentById(agentId as AgentId)

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      agent,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Agent API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}
