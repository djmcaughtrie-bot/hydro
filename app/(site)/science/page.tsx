import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { StudyGrid } from '@/components/science/StudyGrid'
import { getPageContent } from '@/lib/content'
import type { Study } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Science',
  description:
    '50+ peer-reviewed studies on molecular hydrogen — summarised in plain English. Research on energy, recovery, longevity, inflammation, safety, and respiratory health.',
}

export default async function SciencePage() {
  const supabase = await createClient()

  const [{ data }, content] = await Promise.all([
    supabase
      .from('studies')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    getPageContent('science', ['hero', 'stats', 'mechanism', 'cta'], null),
  ])

  const studies: Study[] = data ?? []

  // Derive stats from live data
  const humanTrials = studies.filter(s =>
    s.study_type === 'Human RCT' || s.study_type === 'Human'
  ).length
  const categorySet = new Set(studies.flatMap(s => s.categories ?? []))

  const hero      = content['hero']      ?? {}
  const stats     = content['stats']     ?? {}
  const mechanism = content['mechanism'] ?? {}
  const cta       = content['cta']       ?? {}

  // Hero
  const heroHeadline = (hero.headline as string) ?? '50+ peer-reviewed studies.\nOne remarkable molecule.'
  const heroBody     = (hero.body     as string) ?? 'Peer-reviewed research on molecular hydrogen — summarised for humans.'

  // Mechanism
  const mechHeadline  = (mechanism.headline   as string) ?? 'A selective antioxidant.'
  const mechBody      = (mechanism.body       as string) ?? 'Molecular hydrogen is the smallest antioxidant in existence. Unlike broad-spectrum antioxidants, research suggests H₂ selectively neutralises only the most damaging free radicals — specifically hydroxyl radicals — leaving beneficial reactive oxygen species intact.'
  const mechStudyText = (mechanism.study_text as string) ?? 'A 2007 study in Nature Medicine by Ohsawa et al.'
  const mechStudyUrl  = (mechanism.study_url  as string) ?? 'https://doi.org/10.1038/nm1577'

  // CTA
  const ctaHeadline = (cta.headline as string) ?? 'Ready to try it?'
  const ctaText     = (cta.cta_text as string) ?? 'Enquire about the device'
  const ctaUrl      = (cta.cta_url  as string) ?? '/product'

  return (
    <>
      {/* Hero */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-teal">
            The Science
          </p>
          <h1 className="font-display text-5xl leading-tight text-white md:text-6xl">
            {heroHeadline}
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base text-ink-light">{heroBody}</p>
          <div className="mt-8 flex flex-wrap gap-8">
            <div>
              <div className="font-mono text-3xl text-teal">{studies.length}</div>
              <div className="font-mono text-xs text-ink-light">{(stats.stat1_label as string) ?? 'studies'}</div>
            </div>
            <div>
              <div className="font-mono text-3xl text-teal">{humanTrials}</div>
              <div className="font-mono text-xs text-ink-light">{(stats.stat2_label as string) ?? 'human trials'}</div>
            </div>
            <div>
              <div className="font-mono text-3xl text-teal">{categorySet.size}</div>
              <div className="font-mono text-xs text-ink-light">{(stats.stat3_label as string) ?? 'categories'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mechanism */}
      <section className="bg-cream py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
              The Mechanism
            </p>
            <h2 className="mb-4 font-display text-2xl text-ink">{mechHeadline}</h2>
            <p className="font-sans text-base leading-relaxed text-ink-mid">
              {mechBody}{' '}
              {mechStudyText && mechStudyUrl && (
                <a
                  href={mechStudyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal underline-offset-2 hover:text-teal-dark hover:underline"
                >
                  {mechStudyText}
                </a>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Study grid */}
      <section className="bg-cream pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <Suspense fallback={<p className="font-sans text-sm text-ink-light">Loading studies...</p>}>
            <StudyGrid studies={studies} />
          </Suspense>
        </div>
      </section>

      {/* MHRA disclaimer */}
      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4">
          <p className="font-sans text-xs leading-relaxed text-amber-800">
            These statements have not been evaluated by the MHRA. This product is not
            intended to diagnose, treat, cure, or prevent any disease. Research
            referenced is cited for educational purposes.
          </p>
        </div>
      </div>

      {/* CTA */}
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-4 font-display text-3xl text-white">{ctaHeadline}</h2>
          <Link
            href={ctaUrl}
            className="inline-flex rounded-pill bg-teal px-8 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
          >
            {ctaText}
          </Link>
        </div>
      </section>
    </>
  )
}
