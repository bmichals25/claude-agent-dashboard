'use client'

import { use } from 'react'
import Dashboard from '../../page'

export default function ProjectTasksPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = use(params)
  return <Dashboard initialPage="tasks" projectSlug={projectSlug} />
}
