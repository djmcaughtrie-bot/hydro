import type { Metadata } from 'next'
import Link from 'next/link'
import { StudyForm } from '@/components/admin/StudyForm'

export const metadata: Metadata = { title: 'Add study | H2 Admin' }

export default function NewStudyPage() {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/science"
          className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
        >
          ← All studies
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Add study</h1>
      </div>
      <div className="max-w-2xl">
        <StudyForm />
      </div>
    </>
  )
}
