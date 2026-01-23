import { NextResponse } from 'next/server'
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

export async function GET() {
  const supabase = getSupabase()

  if (!supabase) {
    // Return empty if Supabase not configured
    return NextResponse.json({
      installedSkills: [],
      timestamp: new Date().toISOString(),
      warning: 'Supabase not configured - running in local mode',
    })
  }

  try {
    const { data, error } = await supabase
      .from('dashboard_skills')
      .select('*')
      .eq('is_installed', true)
      .order('installed_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch skills:', error)
      return NextResponse.json(
        { error: 'Failed to fetch skills' },
        { status: 500 }
      )
    }

    const installedSkills = (data || []).map(skill => ({
      id: skill.skill_id,
      skillName: skill.skill_name,
      githubUrl: skill.github_url,
      installedAt: skill.installed_at,
    }))

    return NextResponse.json({
      installedSkills,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Skills API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch installed skills' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = getSupabase()

  try {
    const body = await request.json()
    const { skillId, skillName, githubUrl } = body

    if (!skillId || !githubUrl) {
      return NextResponse.json(
        { error: 'Missing skillId or githubUrl' },
        { status: 400 }
      )
    }

    // Convert GitHub URL to raw content URL
    let rawUrl: string

    if (githubUrl.includes('github.com')) {
      if (githubUrl.includes('/tree/')) {
        rawUrl = githubUrl
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/tree/', '/')

        if (!rawUrl.endsWith('.md')) {
          rawUrl = rawUrl.endsWith('/') ? `${rawUrl}SKILL.md` : `${rawUrl}/SKILL.md`
        }
      } else if (githubUrl.includes('/blob/')) {
        rawUrl = githubUrl
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/blob/', '/')
      } else {
        rawUrl = `https://raw.githubusercontent.com/${githubUrl.replace('https://github.com/', '')}/main/SKILL.md`
      }
    } else {
      rawUrl = githubUrl
    }

    // Fetch the skill content
    let skillContent: string | null = null
    const response = await fetch(rawUrl)

    if (response.ok) {
      skillContent = await response.text()
    } else {
      // Try alternative filename patterns
      const alternativeUrls = [
        rawUrl.replace('SKILL.md', 'README.md'),
        rawUrl.replace('SKILL.md', `${skillId}.md`),
        rawUrl.replace('/SKILL.md', '.md'),
      ]

      for (const altUrl of alternativeUrls) {
        const altResponse = await fetch(altUrl)
        if (altResponse.ok) {
          skillContent = await altResponse.text()
          break
        }
      }
    }

    if (!skillContent) {
      return NextResponse.json(
        { error: `Could not fetch skill from ${rawUrl}. Tried alternatives but none worked.` },
        { status: 404 }
      )
    }

    if (!supabase) {
      // Return success with warning for local development
      return NextResponse.json({
        success: true,
        skillId,
        skillName: skillName || skillId,
        message: `Skill "${skillId}" fetched successfully (local mode - not persisted)`,
        warning: 'Supabase not configured - skill not saved to database',
        content: skillContent.substring(0, 500) + '...', // Preview only
      })
    }

    // Save to Supabase
    const { error } = await supabase
      .from('dashboard_skills')
      .upsert({
        skill_id: skillId,
        skill_name: skillName || skillId,
        content: skillContent,
        github_url: githubUrl,
        is_installed: true,
        installed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,skill_id',
      })

    if (error) {
      console.error('Failed to save skill:', error)
      return NextResponse.json(
        { error: 'Failed to save skill to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      skillId,
      skillName: skillName || skillId,
      message: `Skill "${skillId}" installed successfully`,
    })
  } catch (error) {
    console.error('Skills install error:', error)
    return NextResponse.json(
      { error: 'Failed to install skill' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get('skillId')

    if (!skillId) {
      return NextResponse.json(
        { error: 'Missing skillId' },
        { status: 400 }
      )
    }

    // Soft delete - mark as uninstalled
    const { error } = await supabase
      .from('dashboard_skills')
      .update({ is_installed: false })
      .eq('skill_id', skillId)

    if (error) {
      console.error('Failed to uninstall skill:', error)
      return NextResponse.json(
        { error: 'Failed to uninstall skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      skillId,
      message: `Skill "${skillId}" uninstalled successfully`,
    })
  } catch (error) {
    console.error('Skills uninstall error:', error)
    return NextResponse.json(
      { error: 'Failed to uninstall skill' },
      { status: 500 }
    )
  }
}

// GET skill content by ID
export async function PUT(request: Request) {
  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { skillId } = body

    if (!skillId) {
      return NextResponse.json(
        { error: 'Missing skillId' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('dashboard_skills')
      .select('content')
      .eq('skill_id', skillId)
      .eq('is_installed', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      skillId,
      content: data.content,
    })
  } catch (error) {
    console.error('Skills content error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skill content' },
      { status: 500 }
    )
  }
}
