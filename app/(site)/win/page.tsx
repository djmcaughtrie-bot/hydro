import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompetitionEntryForm } from '@/components/forms/CompetitionEntryForm'
import { getFeatureFlag, SETTINGS_KEYS } from '@/lib/site-settings'

export const metadata: Metadata = {
  title: 'Win an H2 Revive Device | H2 Revive',
  description: 'Enter our competition for a chance to win a premium molecular hydrogen inhalation device.',
}

export default async function WinPage() {
  const winEnabled = await getFeatureFlag(SETTINGS_KEYS.WIN_PAGE_ENABLED)
  if (!winEnabled) redirect('/')

  const supabase = await createClient()

  const { data: competition } = await supabase
    .from('competitions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!competition) {
    return (
      <main className="min-h-screen bg-cream px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl text-ink">No active competition at the moment.</h1>
          <p className="mt-6 font-sans text-base text-ink-mid">
            Follow us to be first to know about our next giveaway.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block font-mono text-sm text-teal hover:text-teal-dark"
          >
            ← Back to homepage
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="px-6 pb-16 pt-24 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-teal">
            Competition
          </p>
          <h1 className="font-display text-5xl leading-tight text-ink md:text-6xl">
            {competition.title}
          </h1>
        </div>
      </section>

      {/* Prize callout */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-teal px-8 py-10 text-center text-white">
            <p className="font-mono text-xs uppercase tracking-widest opacity-80">The prize</p>
            <p className="mt-3 font-display text-3xl md:text-4xl">{competition.prize}</p>
          </div>
        </div>
      </section>

      {/* Description */}
      {competition.description && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-2xl">
            <p className="font-sans text-base leading-relaxed text-ink-mid">
              {competition.description}
            </p>
          </div>
        </section>
      )}

      {/* Entry form */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-md">
          <h2 className="mb-8 font-display text-2xl text-ink">Enter now</h2>
          <CompetitionEntryForm
            competitionId={competition.id}
            prize={competition.prize}
          />
          <p className="mt-6 font-sans text-xs text-ink-light">
            By entering, you agree to our{' '}
            <Link href="/win/terms" className="underline hover:text-teal">
              competition terms
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
