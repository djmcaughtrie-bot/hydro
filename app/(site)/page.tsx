import type { Metadata } from 'next'
import Link from 'next/link'
import { TrustBar } from '@/components/sections/TrustBar'
import { PersonaCards } from '@/components/sections/PersonaCards'
import { PersonaSelector } from '@/components/PersonaSelector'
import { getPageContent } from '@/lib/content'
import { resolvePersonaServer } from '@/lib/persona'
import { getTestimonials } from '@/lib/testimonials'
import { TestimonialStrip } from '@/components/testimonials/TestimonialStrip'

export const metadata: Metadata = {
  title: 'H2 Revive — Hydrogen Inhalation Technology',
  description:
    "The UK's dedicated hydrogen inhalation wellness brand. Research-backed molecular hydrogen technology for energy, recovery, and longevity.",
}

interface Props {
  searchParams: { persona?: string }
}

export default async function HomePage({ searchParams }: Props) {
  const persona = resolvePersonaServer(searchParams)

  const [content, testimonials] = await Promise.all([
    getPageContent(
      'homepage',
      ['hero', 'features', 'social-proof'],
      persona
    ),
    getTestimonials('homepage'),
  ])

  const hero = content['hero'] ?? {}
  const features = content['features'] ?? {}
  const socialProof = content['social-proof'] ?? {}

  const heroHeadline = (hero.headline as string) ?? 'The smallest molecule in existence. The biggest idea in British wellness.'
  const heroBody = (hero.body as string) ?? 'Clinically studied. UK-based. Built for the serious.'
  const heroCta = (hero.cta_text as string) ?? 'Explore the device'

  const featuresHeadline = (features.headline as string) ?? '50+ peer-reviewed studies. One remarkable molecule.'
  const featuresBody = (features.body as string) ?? 'Molecular hydrogen is the smallest antioxidant in existence. It crosses the blood-brain barrier, enters mitochondria, and selectively neutralises only the most harmful free radicals.'

  return (
    <div>
      {/* Hero */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                Hydrogen inhalation technology
              </p>
              <h1 className="mb-4 font-display text-5xl leading-tight text-ink sm:text-6xl">
                {heroHeadline}
              </h1>
              <p className="mb-6 font-sans text-base text-ink-mid">{heroBody}</p>
              <PersonaSelector />
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/product${persona ? `?persona=${persona}` : ''}`}
                  className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
                >
                  {heroCta}
                </Link>
                <span
                  className="inline-flex cursor-not-allowed items-center rounded-pill border border-ink-mid/30 px-6 py-2.5 font-sans text-sm font-medium text-ink-light"
                  title="Coming soon"
                  aria-disabled="true"
                >
                  See the science
                </span>
              </div>
            </div>
            <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-ink-light/20">
              <span className="font-sans text-sm text-ink-light">Product image</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <TrustBar />

      {/* Persona cards */}
      <PersonaCards />

      {/* CEO intro */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-3">
            <div className="flex justify-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-ink-light/20">
                <span className="font-sans text-xs text-ink-light">CEO portrait</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <blockquote className="font-display text-2xl leading-snug text-ink">
                {socialProof.quote
                  ? `\u201c${socialProof.quote as string}\u201d`
                  : '\u201cI started H2 Revive because I believe the British market deserves honest, research-backed wellness technology. No overclaiming. Just the science.\u201d'}
              </blockquote>
              <Link
                href="/about"
                className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-teal hover:text-teal-dark"
              >
                Our story &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Science teaser */}
      <section className="bg-teal-light py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-4 font-display text-4xl text-ink">{featuresHeadline}</h2>
          <p className="mx-auto mb-8 max-w-xl font-sans text-base text-ink-mid">{featuresBody}</p>
          <span
            className="inline-flex cursor-not-allowed font-mono text-xs uppercase tracking-widest text-ink-light"
            title="Coming soon"
          >
            Explore the research &mdash; coming soon
          </span>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialStrip testimonials={testimonials} />

      {/* Product hero */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-ink-mid/30">
              <span className="font-sans text-sm text-ink-light">Product image</span>
            </div>
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                The device
              </p>
              <h2 className="mb-4 font-display text-4xl text-white">
                The device built around the science.
              </h2>
              <p className="mb-8 font-sans text-base text-ink-light">
                CE certified. 2-year UK warranty. Up to 1,200&nbsp;ppb H&#8322; concentration.
              </p>
              <Link
                href={`/product${persona ? `?persona=${persona}` : ''}`}
                className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
              >
                Enquire now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
