import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

// Base paths for Claude Code resources
const CLAUDE_BASE = '/Users/benmichals/ClaudeCodeTest/.claude'
const AGENTS_DIR = path.join(CLAUDE_BASE, 'agents')
const COMMANDS_DIR = path.join(CLAUDE_BASE, 'commands')
const SKILLS_DIR = path.join(CLAUDE_BASE, 'skills') // Legacy, may not exist

// Map agent IDs to their .md file names
const AGENT_FILE_MAP: Record<string, string> = {
  ceo: 'ceo.md', // CEO doesn't have a separate file, but we can create one
  chief_of_staff: 'chief-of-staff.md',
  pipeline_manager: 'pipeline-manager.md',
  vp_engineering: 'vp-engineering.md',
  vp_product: 'vp-product.md',
  vp_design_qa: 'vp-design.md',
  support_agent: 'support-agent.md',
  autopilot_agent: 'autopilot-agent.md',
  architect: 'architect.md',
  developer: 'developer.md',
  devops_engineer: 'devops-engineer.md',
  code_reviewer: 'code-reviewer.md',
  security_engineer: 'security-engineer.md',
  product_researcher: 'product-researcher.md',
  product_manager: 'product-manager.md',
  data_engineer: 'data-engineer.md',
  growth_marketer: 'growth-marketer.md',
  frontend_designer: 'frontend-designer.md',
  user_testing: 'user-testing.md',
  technical_writer: 'technical-writer.md',
}

export async function POST(request: NextRequest) {
  try {
    const { type, id } = await request.json()

    let filePath: string

    if (type === 'agent') {
      const fileName = AGENT_FILE_MAP[id]
      if (!fileName) {
        return NextResponse.json(
          { error: `Unknown agent: ${id}` },
          { status: 404 }
        )
      }
      filePath = path.join(AGENTS_DIR, fileName)
    } else if (type === 'skill' || type === 'command') {
      // Skills/commands are stored as .md files in the commands directory
      filePath = path.join(COMMANDS_DIR, `${id}.md`)
    } else if (type === 'file') {
      // Direct file path (must be within CLAUDE_BASE for security)
      filePath = id
      if (!filePath.startsWith(CLAUDE_BASE)) {
        return NextResponse.json(
          { error: 'Access denied: file outside Claude directory' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: `Unknown type: ${type}` },
        { status: 400 }
      )
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `File not found: ${filePath}` },
        { status: 404 }
      )
    }

    // Open in default editor (macOS)
    await execAsync(`open "${filePath}"`)

    return NextResponse.json({
      success: true,
      filePath,
      message: `Opened ${filePath}`,
    })
  } catch (error) {
    console.error('Open file error:', error)
    return NextResponse.json(
      { error: 'Failed to open file' },
      { status: 500 }
    )
  }
}

// GET endpoint to list available files
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'

  try {
    const result: { agents?: string[]; commands?: string[]; skills?: string[] } = {}

    if (type === 'all' || type === 'agents') {
      if (fs.existsSync(AGENTS_DIR)) {
        result.agents = fs.readdirSync(AGENTS_DIR)
          .filter(f => f.endsWith('.md'))
          .map(f => f.replace('.md', ''))
      }
    }

    if (type === 'all' || type === 'commands' || type === 'skills') {
      if (fs.existsSync(COMMANDS_DIR)) {
        const commands = fs.readdirSync(COMMANDS_DIR)
          .filter(f => f.endsWith('.md'))
          .map(f => f.replace('.md', ''))
        result.commands = commands
        result.skills = commands // Alias for backwards compatibility
      } else {
        result.commands = []
        result.skills = []
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}
