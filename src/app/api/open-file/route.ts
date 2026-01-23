import { NextRequest, NextResponse } from 'next/server'

// This endpoint is DISABLED for production/Netlify deployment
// It requires local filesystem access which is not available in serverless environments

const IS_PRODUCTION = process.env.NODE_ENV === 'production' ||
  process.env.NETLIFY === 'true' ||
  process.env.VERCEL === '1'

export async function POST(request: NextRequest) {
  if (IS_PRODUCTION) {
    return NextResponse.json(
      {
        error: 'This feature is not available in production',
        message: 'Opening local files requires running the dashboard locally',
      },
      { status: 503 }
    )
  }

  // Local development fallback - attempt to open file
  // This will only work when running locally with npm run dev
  try {
    const { type, id } = await request.json()

    // In local dev, we can still try to provide a helpful message
    return NextResponse.json({
      error: 'File operations disabled',
      message: `Cannot open ${type}/${id} - this feature is disabled. Agent configs are now stored in Supabase.`,
      hint: 'Use the Agent Config editor in the dashboard instead.',
    }, { status: 503 })
  } catch (error) {
    console.error('Open file error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// GET endpoint - return empty list in production
export async function GET(request: NextRequest) {
  if (IS_PRODUCTION) {
    return NextResponse.json({
      agents: [],
      commands: [],
      skills: [],
      message: 'File listing not available in production - use Supabase dashboard',
    })
  }

  // Return empty list for local development too - configs are now in Supabase
  return NextResponse.json({
    agents: [],
    commands: [],
    skills: [],
    message: 'Agent configs are now stored in Supabase database',
  })
}
