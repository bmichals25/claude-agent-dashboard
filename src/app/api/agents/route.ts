import { NextResponse } from 'next/server'
import { getAllAgents, getAgentConnections } from '@/lib/agentCatalog'

export async function GET() {
  try {
    const agents = getAllAgents()
    const connections = getAgentConnections()

    return NextResponse.json({
      agents,
      connections,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Agents API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}
