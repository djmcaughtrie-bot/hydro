import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { StudyForm } from '@/components/admin/StudyForm'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('studies').select('title').eq('id', id).single()
  return { title: `${data?.title ?? 'Study'} | H2 Admin` }
}

export default async function EditStudyPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: study } = await supabase.from('studies').select('*').eq('id', id).single()

  if (!study) notFound()

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/science"
          className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
        >
          ← All studies
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Edit study</h1>
      </div>
      <div className="max-w-2xl">
        <StudyForm initialData={study} studyId={study.id} />
      </div>
    </>
  )
}
