import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { StudyGrid } from '@/components/science/StudyGrid'
import { getPageContent } from '@/lib/content'
import type { Study } from '@/lib/types'

export const metadata: Metadata = {
  title: 'The Science',
  description:
    '50+ peer-reviewed studies on molecular hydrogen — summarised in plain English. Research on energy, recovery, longevity, inflammation, safety, and respiratory health.',
}

export default async function SciencePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('studies')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const studies: Study[] = data ?? []

  const content = await getPageContent('science', ['hero'], null)
  const hero = content['hero'] ?? {}

  const heroHeadline = (hero.headline as string) ?? '50+ peer-reviewed studies.\nOne remarkable molecule.'
  const heroBody = (hero.body as string) ?? 'Peer-reviewed research on molecular hydrogen — summarised for humans.'

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
            {[
              { value: '52', label: 'studies' },
              { value: '18', label: 'human trials' },
              { value: '6', label: 'categories' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="font-mono text-3xl text-teal">{value}</div>
                <div className="font-mono text-xs text-ink-light">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mechanism explainer */}
      <section className="bg-cream py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
              The Mechanism
            </p>
            <h2 className="mb-4 font-display text-2xl text-ink">
              A selective antioxidant.
            </h2>
            <p className="font-sans text-base leading-relaxed text-ink-mid">
              Molecular hydrogen is the smallest antioxidant in existence. Unlike
              broad-spectrum antioxidants, research suggests H₂ selectively neutralises
              only the most damaging free radicals — specifically hydroxyl radicals —
              leaving beneficial reactive oxygen species intact.{' '}
              <a
                href="https://doi.org/10.1038/nm1577"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal underline-offset-2 hover:text-teal-dark hover:underline"
              >
                A 2007 study in Nature Medicine by Ohsawa et al.
              </a>{' '}
              was the first to document this selective mechanism in a peer-reviewed context.
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
          <h2 className="mb-4 font-display text-3xl text-white">
            Ready to try it?
          </h2>
          <Link
            href="/product"
            className="inline-flex rounded-pill bg-teal px-8 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
          >
            Enquire about the device
          </Link>
        </div>
      </section>
    </>
  )
}
