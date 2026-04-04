import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Competitions | H2 Admin' }

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function CompetitionsPage() {
  const supabase = createAdminClient()

  const { data: competitions } = await supabase
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch entry counts for each competition
  const entryCounts: Record<string, number> = {}
  if (competitions && competitions.length > 0) {
    const countResults = await Promise.all(
      competitions.map((c) =>
        supabase
          .from('competition_entries')
          .select('*', { count: 'exact', head: true })
          .eq('competition_id', c.id)
      )
    )
    competitions.forEach((c, i) => {
      entryCounts[c.id] = countResults[i].count ?? 0
    })
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Competitions</h1>
        <Link
          href="/admin/competitions/new"
          className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          New competition
        </Link>
      </div>

      {!competitions || competitions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center">
          <p className="font-sans text-sm text-ink-light">No competitions yet.</p>
          <Link
            href="/admin/competitions/new"
            className="mt-4 inline-block font-mono text-xs text-teal hover:text-teal-dark"
          >
            Create your first competition →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-mono text-xs uppercase tracking-widest text-ink-light">
                  Title
                </th>
                <th className="px-5 py-3 text-left font-mono text-xs uppercase tracking-widest text-ink-light">
                  Prize
                </th>
                <th className="px-5 py-3 text-left font-mono text-xs uppercase tracking-widest text-ink-light">
                  Status
                </th>
                <th className="px-5 py-3 text-left font-mono text-xs uppercase tracking-widest text-ink-light">
                  Starts
                </th>
                <th className="px-5 py-3 text-left font-mono text-xs uppercase tracking-widest text-ink-light">
                  Ends
                </th>
                <th className="px-5 py-3 text-right font-mono text-xs uppercase tracking-widest text-ink-light">
                  Entries
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {competitions.map((competition) => (
                <tr key={competition.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-sans text-sm font-medium text-ink">{competition.title}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-sans text-sm text-ink-mid">{competition.prize}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${
                        competition.is_active
                          ? 'bg-teal-light text-teal-dark'
                          : 'bg-gray-100 text-ink-light'
                      }`}
                    >
                      {competition.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-ink-light">
                      {formatDate(competition.starts_at)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-ink-light">
                      {formatDate(competition.ends_at)}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="font-mono text-sm font-semibold text-ink">
                      {entryCounts[competition.id] ?? 0}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
