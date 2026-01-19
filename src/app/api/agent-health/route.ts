import { NextResponse } from 'next/server'
import { AGENT_DEFINITIONS } from '@/lib/agentCatalog'
import type { AgentHealthMetrics, HealthStatus, AgentId } from '@/lib/types'

// In a real implementation, this would fetch from a database or external monitoring service
// For now, we generate realistic mock data that simulates agent health metrics
function generateAgentHealthData(): AgentHealthMetrics[] {
  return Object.keys(AGENT_DEFINITIONS).map((agentId) => {
    // Generate realistic health metrics
    const taskSuccessRate = 85 + Math.random() * 15
    const qualityScore = 80 + Math.random() * 20
    const efficiency = 90 + Math.random() * 20
    const errorRate = Math.random() * 8
    const autonomyLevel = 75 + Math.random() * 25

    // Calculate health score using the Agent Operations formula
    // Health Score = (Success × 0.25) + (Quality × 0.25) + (Efficiency × 0.20)
    //              + ((100 - ErrorRate×20) × 0.15) + (Autonomy × 0.15)
    const healthScore = Math.round(
      (taskSuccessRate * 0.25) +
      (qualityScore * 0.25) +
      (efficiency * 0.20) +
      ((100 - errorRate * 20) * 0.15) +
      (autonomyLevel * 0.15)
    )

    // Determine status based on health score
    const status: HealthStatus =
      healthScore >= 90 ? 'excellent' :
      healthScore >= 80 ? 'good' :
      healthScore >= 70 ? 'needs_attention' : 'critical'

    // Generate trend based on random but realistic patterns
    const trend = Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down'

    // Generate issues for agents with lower scores
    const issues = []
    if (healthScore < 80 && Math.random() > 0.5) {
      issues.push({
        id: crypto.randomUUID(),
        severity: healthScore < 70 ? 'high' : 'medium' as 'critical' | 'high' | 'medium' | 'low',
        description: errorRate > 5
          ? 'Error rate above acceptable threshold'
          : efficiency < 95
          ? 'Efficiency below baseline'
          : 'Task completion time above average',
        recommendation: errorRate > 5
          ? 'Review recent error logs and update error handling'
          : efficiency < 95
          ? 'Analyze workflow for optimization opportunities'
          : 'Consider task complexity reduction or parallel processing',
        detectedAt: new Date(),
      })
    }

    if (status === 'critical') {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'critical' as const,
        description: 'Agent health score critically low',
        recommendation: 'Immediate intervention required - review agent configuration and recent tasks',
        detectedAt: new Date(),
      })
    }

    return {
      agentId: agentId as AgentId,
      healthScore,
      status,
      taskSuccessRate: Math.round(taskSuccessRate),
      qualityScore: Math.round(qualityScore),
      efficiency: Math.round(efficiency),
      errorRate: Math.round(errorRate * 10) / 10,
      autonomyLevel: Math.round(autonomyLevel),
      tasksCompleted: Math.floor(Math.random() * 50) + 10,
      tasksAssigned: Math.floor(50 + Math.random() * 20),
      avgCompletionTime: Math.round(15 + Math.random() * 45),
      lastActive: new Date(),
      trend: trend as 'up' | 'down' | 'stable',
      issues,
    }
  })
}

export async function GET() {
  try {
    const healthData = generateAgentHealthData()

    return NextResponse.json(healthData)
  } catch (error) {
    console.error('Agent Health API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent health data' },
      { status: 500 }
    )
  }
}

// POST endpoint for Agent Operations agent to update health metrics
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { agentId, metrics } = body

    if (!agentId || !metrics) {
      return NextResponse.json(
        { error: 'Missing agentId or metrics' },
        { status: 400 }
      )
    }

    // In a real implementation, this would update a database
    // For now, we just acknowledge the update
    console.log(`Agent health update received for ${agentId}:`, metrics)

    return NextResponse.json({
      success: true,
      message: `Health metrics updated for ${agentId}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Agent Health POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update agent health data' },
      { status: 500 }
    )
  }
}
