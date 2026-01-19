import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const AGENTS_DIR = '/Users/benmichals/ClaudeCodeTest/.claude/agents'

function getAgentFilePath(agentId: string): string {
  // Convert agent ID to filename (e.g., 'pipeline_manager' -> 'pipeline-manager.md')
  const filename = agentId.replace(/_/g, '-')
  return path.join(AGENTS_DIR, `${filename}.md`)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('id')

  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID required' }, { status: 400 })
  }

  const filePath = getAgentFilePath(agentId)

  if (!existsSync(filePath)) {
    // Return a template if file doesn't exist
    const displayName = agentId.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const template = `# ${displayName}

## Role
[Describe the agent's role]

## Reports To
[Parent agent]

## Expertise
- [Domain 1]
- [Domain 2]

## Tools
- [MCP/tool 1]
- [MCP/tool 2]

## Handoff Triggers
[When to engage this agent]
`
    return NextResponse.json({ content: template, isNew: true })
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error reading agent config:', error)
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, content } = await request.json()

    if (!id || content === undefined) {
      return NextResponse.json({ error: 'Agent ID and content required' }, { status: 400 })
    }

    const filePath = getAgentFilePath(id)

    await writeFile(filePath, content, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error writing agent config:', error)
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
  }
}
