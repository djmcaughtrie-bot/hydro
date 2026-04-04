import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge'
import { LeadsFilter } from '@/components/admin/LeadsFilter'
import { StatCard } from '@/components/admin/StatCard'

export const metadata: Metadata = { title: 'Leads | H2 Admin' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function LeadsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const supabase = createAdminClient()

  const [
    { count: newCount },
    { count: contactedCount },
    { count: convertedCount },
    { count: closedCount },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'converted'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
  ])

  let query = supabase
    .from('leads')
    .select('id, name, email, persona, source_page, status, created_at')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: leads } = await query

  return (
    <>
      <h1 className="mb-6 font-display text-2xl text-ink">Leads</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="New"       count={newCount       ?? 0} href="/admin/leads?status=new" />
        <StatCard label="Contacted" count={contactedCount ?? 0} href="/admin/leads?status=contacted" />
        <StatCard label="Converted" count={convertedCount ?? 0} href="/admin/leads?status=converted" />
        <StatCard label="Closed"    count={closedCount    ?? 0} href="/admin/leads?status=closed" />
      </div>

      <div className="mb-6">
        <LeadsFilter activeStatus={status} />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {!leads || leads.length === 0 ? (
          <p className="px-5 py-6 font-sans text-sm text-ink-light">No leads found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {leads.map(lead => (
              <li key={lead.id}>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-medium text-ink">{lead.name ?? '—'}</p>
                    <p className="font-mono text-xs text-ink-light">{lead.email}</p>
                  </div>
                  <div className="hidden shrink-0 font-mono text-xs text-ink-light md:block">
                    {lead.source_page ?? '—'}
                  </div>
                  <div className="shrink-0 font-mono text-xs text-ink-light">
                    {timeAgo(lead.created_at)}
                  </div>
                  <div className="shrink-0">
                    <LeadStatusBadge status={lead.status as 'new' | 'contacted' | 'converted' | 'closed'} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
