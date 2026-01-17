import type { SSEEvent } from './types'

/**
 * Minimal Server-Sent Events reader that yields completed events.
 * - Supports `event:` and multi-line `data:` fields.
 * - Yields `{ event: null, data }` if no `event:` field was provided.
 */
export async function* readSSE(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<SSEEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()

  let buf = ''
  let curEvent: string | null = null
  let curData = ''

  const emit = async function* (): AsyncGenerator<SSEEvent> {
    const data = curData.trim()
    if (!data) return
    yield { event: curEvent, data }
  }

  const reset = () => {
    curEvent = null
    curData = ''
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })

    while (true) {
      const idx = buf.indexOf('\n')
      if (idx < 0) break
      const line = buf.slice(0, idx).replace(/\r$/, '')
      buf = buf.slice(idx + 1)

      if (line === '') {
        // Blank line terminates an event
        yield* emit()
        reset()
        continue
      }

      if (line.startsWith('event:')) {
        curEvent = line.slice('event:'.length).trim()
        continue
      }
      if (line.startsWith('data:')) {
        const part = line.slice('data:'.length).trim()
        curData = curData ? `${curData}\n${part}` : part
        continue
      }
    }
  }

  // EOF: emit any trailing event without requiring a blank line
  yield* emit()
}

/**
 * Connect to SSE endpoint and process events
 */
export async function connectToEventStream(
  url: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  const abortController = new AbortController()

  const connect = async () => {
    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        headers: {
          Accept: 'text/event-stream',
        },
      })

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      for await (const event of readSSE(response.body)) {
        onEvent(event)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.(error)
        // Reconnect after delay
        setTimeout(connect, 3000)
      }
    }
  }

  connect()

  // Return cleanup function
  return () => {
    abortController.abort()
  }
}
