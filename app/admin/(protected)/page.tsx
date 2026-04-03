import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatCard } from '@/components/admin/StatCard'
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge'

export const metadata: Metadata = { title: 'Dashboard | H2 Admin' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default async function DashboardPage() {
  const supabase = createAdminClient()

  const [
    { count: newCount },
    { count: contactedCount },
    { count: convertedCount },
    { count: closedCount },
    { data: recentLeads },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'converted'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase
      .from('leads')
      .select('id, name, email, persona, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <>
      <h1 className="mb-8 font-display text-2xl text-ink">Dashboard</h1>

      {/* Stat cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="New" count={newCount ?? 0} href="/admin/leads?status=new" />
        <StatCard label="Contacted" count={contactedCount ?? 0} href="/admin/leads?status=contacted" />
        <StatCard label="Converted" count={convertedCount ?? 0} href="/admin/leads?status=converted" />
        <StatCard label="Closed" count={closedCount ?? 0} href="/admin/leads?status=closed" />
      </div>

      {/* Recent leads */}
      <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-widest text-ink-light">
        Recent leads
      </h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {!recentLeads || recentLeads.length === 0 ? (
          <p className="px-5 py-4 font-sans text-sm text-ink-light">No leads yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentLeads.map(lead => (
              <li key={lead.id}>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="font-sans text-sm font-medium text-ink">{lead.name ?? lead.email}</p>
                    <p className="font-mono text-xs text-ink-light">{timeAgo(lead.created_at)}</p>
                  </div>
                  <LeadStatusBadge status={lead.status as 'new' | 'contacted' | 'converted' | 'closed'} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
