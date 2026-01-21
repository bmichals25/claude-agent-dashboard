'use client'

import { useRouter } from 'next/navigation'
import { NewProjectWizard } from '@/components/NewProjectWizard'

export default function NewProjectPage() {
  const router = useRouter()

  const handleClose = () => {
    // Navigate back to the pipeline/home page
    router.push('/all/home')
  }

  return <NewProjectWizard onClose={handleClose} />
}
