import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createAdminClient } from '@/lib/supabase/admin'

const StudiesList = dynamic(
  () => import('@/components/admin/StudiesList').then(m => ({ default: m.StudiesList })),
  { ssr: false, loading: () => <p className="font-sans text-sm text-ink-light">Loading studies…</p> }
)

export const metadata: Metadata = { title: 'Studies | H2 Admin' }

export default async function StudiesPage() {
  const supabase = createAdminClient()
  const { data: studies } = await supabase
    .from('studies')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">
          Studies
          <span className="ml-2 font-mono text-sm text-ink-light">
            {studies?.length ?? 0}
          </span>
        </h1>
        <Link
          href="/admin/science/new"
          className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          + Add study
        </Link>
      </div>

      {!studies || studies.length === 0 ? (
        <p className="font-sans text-sm text-ink-light">No studies yet.</p>
      ) : (
        <StudiesList studies={studies} />
      )}
    </>
  )
}
