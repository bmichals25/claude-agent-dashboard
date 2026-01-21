'use client'

import { use } from 'react'
import { redirect } from 'next/navigation'

export default function ProjectAgentsPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = use(params)
  // Redirect to default agents view (network)
  redirect(`/${projectSlug}/agents/network`)
}
