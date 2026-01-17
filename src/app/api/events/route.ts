import { NextRequest } from 'next/server'

// SSE endpoint for real-time task updates
// In production, this would connect to Claude Code's event stream

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        message: 'Connected to Claude Agent Dashboard',
        timestamp: new Date().toISOString(),
      })}\n\n`
      controller.enqueue(encoder.encode(connectEvent))

      // In production, this would:
      // 1. Subscribe to Claude Code's event stream
      // 2. Forward events to the client

      // For demo, send periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({
          timestamp: new Date().toISOString(),
        })}\n\n`
        controller.enqueue(encoder.encode(heartbeat))
      }, 30000)

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
