'use client'

import { use } from 'react'
import { redirect } from 'next/navigation'

export default function ProjectRootPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = use(params)
  redirect(`/${projectSlug}/home`)
}
