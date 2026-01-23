import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Default agent config template
function getDefaultTemplate(agentId: string): string {
  const displayName = agentId.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return `# ${displayName}

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
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('id')

  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID required' }, { status: 400 })
  }

  if (!supabase) {
    // Return default template for local development
    return NextResponse.json({
      content: getDefaultTemplate(agentId),
      isNew: true,
      warning: 'Supabase not configured - using default template',
    })
  }

  try {
    const { data, error } = await supabase
      .from('dashboard_agent_configs')
      .select('config_content')
      .eq('agent_id', agentId)
      .single()

    if (error || !data) {
      // Return default template if no config exists
      return NextResponse.json({
        content: getDefaultTemplate(agentId),
        isNew: true,
      })
    }

    return NextResponse.json({ content: data.config_content })
  } catch (error) {
    console.error('Error reading agent config:', error)
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()

  try {
    const { id, content } = await request.json()

    if (!id || content === undefined) {
      return NextResponse.json({ error: 'Agent ID and content required' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({
        success: true,
        warning: 'Supabase not configured - config not persisted',
      })
    }

    const { error } = await supabase
      .from('dashboard_agent_configs')
      .upsert({
        agent_id: id,
        config_content: content,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,agent_id',
      })

    if (error) {
      console.error('Failed to save agent config:', error)
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error writing agent config:', error)
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
  }
}

// Get all agent configs
export async function PUT(request: NextRequest) {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({
      configs: [],
      warning: 'Supabase not configured',
    })
  }

  try {
    const { data, error } = await supabase
      .from('dashboard_agent_configs')
      .select('agent_id, config_content, updated_at')

    if (error) {
      console.error('Failed to fetch agent configs:', error)
      return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 })
    }

    return NextResponse.json({
      configs: data || [],
    })
  } catch (error) {
    console.error('Error fetching agent configs:', error)
    return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 })
  }
}
