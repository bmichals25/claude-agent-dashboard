import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// The skills directory - using the actual location
const SKILLS_DIR = '/Users/benmichals/ClaudeCodeTest/.claude/skills'

// Map skill filenames to their IDs for matching with the store
function normalizeSkillId(filename: string): string {
  // Remove .md extension and normalize
  return filename.replace(/\.md$/, '').toLowerCase()
}

export async function GET() {
  try {
    // Ensure the skills directory exists
    try {
      await fs.access(SKILLS_DIR)
    } catch {
      // Directory doesn't exist, return empty array
      return NextResponse.json({ installedSkills: [] })
    }

    // Read the skills directory
    const files = await fs.readdir(SKILLS_DIR)

    // Filter for .md files and extract skill IDs
    const installedSkills = files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        id: normalizeSkillId(file),
        filename: file,
        path: path.join(SKILLS_DIR, file),
      }))

    return NextResponse.json({
      installedSkills,
      skillsDir: SKILLS_DIR,
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
    // e.g., https://github.com/anthropics/skills/tree/main/skills/pdf
    // becomes https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf/SKILL.md
    let rawUrl: string

    if (githubUrl.includes('github.com')) {
      // Handle different GitHub URL formats
      if (githubUrl.includes('/tree/')) {
        // Format: github.com/owner/repo/tree/branch/path
        rawUrl = githubUrl
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/tree/', '/')

        // Check if it ends with a skill folder, add SKILL.md
        if (!rawUrl.endsWith('.md')) {
          rawUrl = rawUrl.endsWith('/') ? `${rawUrl}SKILL.md` : `${rawUrl}/SKILL.md`
        }
      } else if (githubUrl.includes('/blob/')) {
        // Format: github.com/owner/repo/blob/branch/path/file.md
        rawUrl = githubUrl
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/blob/', '/')
      } else {
        // Format: github.com/owner/repo - assume main branch and look for SKILL.md
        rawUrl = `https://raw.githubusercontent.com/${githubUrl.replace('https://github.com/', '')}/main/SKILL.md`
      }
    } else {
      rawUrl = githubUrl
    }

    // Fetch the skill content
    const response = await fetch(rawUrl)

    if (!response.ok) {
      // Try alternative filename patterns
      const alternativeUrls = [
        rawUrl.replace('SKILL.md', 'README.md'),
        rawUrl.replace('SKILL.md', `${skillId}.md`),
        rawUrl.replace('/SKILL.md', '.md'),
      ]

      let skillContent: string | null = null
      for (const altUrl of alternativeUrls) {
        const altResponse = await fetch(altUrl)
        if (altResponse.ok) {
          skillContent = await altResponse.text()
          break
        }
      }

      if (!skillContent) {
        return NextResponse.json(
          { error: `Could not fetch skill from ${rawUrl}. Tried alternatives but none worked.` },
          { status: 404 }
        )
      }

      // Use the found content
      const filename = `${skillName || skillId}.md`
      const filepath = path.join(SKILLS_DIR, filename)

      // Ensure directory exists
      await fs.mkdir(SKILLS_DIR, { recursive: true })

      // Write the skill file
      await fs.writeFile(filepath, skillContent, 'utf-8')

      return NextResponse.json({
        success: true,
        skillId,
        filename,
        path: filepath,
        message: `Skill "${skillId}" installed successfully`,
      })
    }

    const skillContent = await response.text()

    // Determine filename
    const filename = `${skillName || skillId}.md`
    const filepath = path.join(SKILLS_DIR, filename)

    // Ensure directory exists
    await fs.mkdir(SKILLS_DIR, { recursive: true })

    // Write the skill file
    await fs.writeFile(filepath, skillContent, 'utf-8')

    return NextResponse.json({
      success: true,
      skillId,
      filename,
      path: filepath,
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
  try {
    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get('skillId')

    if (!skillId) {
      return NextResponse.json(
        { error: 'Missing skillId' },
        { status: 400 }
      )
    }

    // Find the skill file
    const files = await fs.readdir(SKILLS_DIR)
    const skillFile = files.find(f =>
      normalizeSkillId(f) === skillId.toLowerCase() ||
      f.toLowerCase() === `${skillId.toLowerCase()}.md`
    )

    if (!skillFile) {
      return NextResponse.json(
        { error: `Skill "${skillId}" not found` },
        { status: 404 }
      )
    }

    const filepath = path.join(SKILLS_DIR, skillFile)
    await fs.unlink(filepath)

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
