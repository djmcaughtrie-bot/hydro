import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge'
import { LeadStatusUpdate } from '@/components/admin/LeadStatusUpdate'
import { LeadNotes } from '@/components/admin/LeadNotes'

interface NoteEntry {
  text: string
  created_at: string
}

const personaLabels: Record<string, string> = {
  energy:      'Energy',
  performance: 'Performance',
  longevity:   'Longevity',
  clinic:      'Clinic',
  general:     'General',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: lead } = await supabase.from('leads').select('name, email').eq('id', id).single()
  return { title: `${lead?.name ?? lead?.email ?? 'Lead'} | H2 Admin` }
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single()

  if (!lead) notFound()

  const notes: NoteEntry[] = JSON.parse(lead.notes ?? '[]')

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/leads"
          className="mb-4 inline-block font-mono text-xs text-teal transition-colors hover:text-teal-dark"
        >
          ← All leads
        </Link>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1">
            <h1 className="font-display text-2xl text-ink">{lead.name ?? '—'}</h1>
            <p className="mt-1 font-sans text-sm text-ink-mid">
              {lead.email}
              {lead.phone && ` · ${lead.phone}`}
            </p>
          </div>
          <LeadStatusBadge status={lead.status as 'new' | 'contacted' | 'converted' | 'closed'} />
        </div>
      </div>

      {/* Metadata grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Persona',       value: lead.persona ? (personaLabels[lead.persona] ?? lead.persona) : '—' },
          { label: 'Enquiry type',  value: lead.enquiry_type ?? '—' },
          { label: 'Source page',   value: lead.source_page ?? '—' },
          { label: 'Received',      value: formatDate(lead.created_at) },
          ...(lead.utm_source   ? [{ label: 'UTM source',   value: lead.utm_source   }] : []),
          ...(lead.utm_medium   ? [{ label: 'UTM medium',   value: lead.utm_medium   }] : []),
          ...(lead.utm_campaign ? [{ label: 'UTM campaign', value: lead.utm_campaign }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-gray-100 bg-white px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-light">{label}</p>
            <p className="mt-1 font-sans text-sm text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Message */}
      {lead.message !== null && lead.message !== undefined && (
        <div className="mb-8">
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-widest text-ink-light">
            Message
          </h2>
          <blockquote className="border-l-2 border-ink-light/30 pl-4 font-sans text-sm italic text-ink-mid">
            {lead.message}
          </blockquote>
        </div>
      )}

      {/* Status update */}
      <div className="mb-8">
        <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-widest text-ink-light">
          Status
        </h2>
        <LeadStatusUpdate leadId={lead.id} initialStatus={lead.status} />
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <LeadNotes leadId={lead.id} initialNotes={notes} />
      </div>
    </>
  )
}
