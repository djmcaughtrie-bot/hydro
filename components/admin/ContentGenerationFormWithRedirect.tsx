'use client'

import { useRouter } from 'next/navigation'
import { ContentGenerationForm } from './ContentGenerationForm'

export function ContentGenerationFormWithRedirect() {
  const router = useRouter()
  return (
    <ContentGenerationForm
      onGenerated={(id) => router.push(`/admin/content/${id}`)}
    />
  )
}
