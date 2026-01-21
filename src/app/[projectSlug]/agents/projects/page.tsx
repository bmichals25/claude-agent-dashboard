'use client'

import { use } from 'react'
import Dashboard from '../../../page'

export default function AgentsProjectsPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = use(params)
  return <Dashboard initialPage="agents" initialAgentView="all_projects" projectSlug={projectSlug} />
}
