import type { Metadata } from 'next'
import Link from 'next/link'
import { TrustBar } from '@/components/sections/TrustBar'
import { PersonaCards } from '@/components/sections/PersonaCards'
import { PersonaSelector } from '@/components/PersonaSelector'
import { getPageContent } from '@/lib/content'
import { resolvePersonaServer } from '@/lib/persona'
import { getTestimonials } from '@/lib/testimonials'
import { TestimonialStrip } from '@/components/testimonials/TestimonialStrip'
import { createClient } from '@/lib/supabase/server'
import type { Study } from '@/lib/types'
import { EmailCapture } from '@/components/forms/EmailCapture'

export const dynamic = 'force-dynamic'

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
  const personaParam = persona ? `?persona=${persona}` : ''

  const supabase = await createClient()

  const [content, energyT, performanceT, longevityT, { data: featuredStudiesData }] = await Promise.all([
    getPageContent('homepage', ['hero', 'features', 'social-proof', 'device-cta', 'trust-bar', 'persona-cards'], persona),
    getTestimonials('homepage', 'energy'),
    getTestimonials('homepage', 'performance'),
    getTestimonials('homepage', 'longevity'),
    supabase
      .from('studies')
      .select('id, title, summary, key_finding, evidence_level, study_type, doi_url, pubmed_url')
      .eq('is_featured', true)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .limit(3),
  ])

  const featuredStudies: Pick<Study, 'id' | 'title' | 'summary' | 'key_finding' | 'evidence_level' | 'study_type' | 'doi_url' | 'pubmed_url'>[] = featuredStudiesData ?? []

  // One per persona, in a fixed order so the strip always reads Energy → Performance → Longevity
  const testimonials = [energyT[0], performanceT[0], longevityT[0]].filter(Boolean)

  const hero         = content['hero']           ?? {}
  const features     = content['features']       ?? {}
  const ceoIntro     = content['social-proof']   ?? {}
  const deviceCta    = content['device-cta']     ?? {}
  const trustBar     = content['trust-bar']      ?? {}
  const personaCards = content['persona-cards']  ?? {}

  // Hero
  const heroHeadline      = (hero.headline           as string) || 'The smallest molecule in existence. The biggest idea in British wellness.'
  const heroBody          = (hero.body                as string) || 'Research-backed. UK-based. Built for the serious.'
  const heroPrimaryCta    = (hero.cta_text            as string) || 'Explore the device'
  const heroPrimaryUrl    = (hero.cta_url             as string) || `/product${personaParam}`
  const heroSecondaryCta  = (hero.cta_secondary_text  as string) || 'See the science'
  const heroSecondaryUrl  = (hero.cta_secondary_url   as string) || '/science'
  const heroDesktopImage  = (hero.desktop_image_url   as string) || ''

  // Science teaser
  const featuresHeadline = (features.headline as string) || '1,000+ peer-reviewed studies. One remarkable molecule.'
  const featuresBody     = (features.body     as string) || 'Molecular hydrogen is the smallest antioxidant in existence. It crosses the blood-brain barrier, enters mitochondria, and selectively neutralises only the most harmful free radicals.'
  const featuresCta      = (features.cta_text as string) || ''
  const featuresUrl      = (features.cta_url  as string) || '/science'

  // CEO intro
  const ceoQuote         = (ceoIntro.quote       as string) || 'I started H2 Revive because I believe the British market deserves honest, research-backed wellness technology. No overclaiming. Just the science.'
  const ceoAttribution   = (ceoIntro.attribution as string) || ''
  const ceoCta           = (ceoIntro.cta_text    as string) || 'Our story'
  const ceoCtaUrl        = (ceoIntro.cta_url     as string) || '/about'
  const ceoImage         = (ceoIntro.desktop_image_url as string) || ''

  // Device CTA
  const deviceHeadline   = (deviceCta.headline as string) || 'The device built around the science.'
  const deviceBody       = (deviceCta.body     as string) || 'CE certified. 2-year UK warranty. Up to 1,200\u00a0ppb H\u2082 concentration.'
  const deviceCtaText    = (deviceCta.cta_text as string) || 'Enquire now'
  const deviceCtaUrl     = (deviceCta.cta_url  as string) || `/product${personaParam}`
  const deviceImage      = (deviceCta.desktop_image_url as string) || ''

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
                  href={heroPrimaryUrl}
                  className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
                >
                  {heroPrimaryCta}
                </Link>
                {heroSecondaryCta && (
                  <Link
                    href={heroSecondaryUrl}
                    className="inline-flex items-center rounded-pill border border-ink-mid/50 px-6 py-2.5 font-sans text-sm font-medium text-ink-mid transition-colors hover:border-teal hover:text-teal"
                  >
                    {heroSecondaryCta}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-ink-light/20">
              {heroDesktopImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroDesktopImage} alt="H2 Revive device" className="h-full w-full object-cover" />
              ) : (
                <span className="font-sans text-sm text-ink-light">Product image</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <TrustBar content={Object.keys(trustBar).length ? trustBar as Parameters<typeof TrustBar>[0]['content'] : undefined} />

      {/* Persona cards */}
      <PersonaCards content={Object.keys(personaCards).length ? personaCards as Parameters<typeof PersonaCards>[0]['content'] : undefined} />

      {/* CEO intro */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-3">
            <div className="flex justify-center">
              {ceoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ceoImage}
                  alt={ceoAttribution || 'CEO'}
                  className="h-40 w-40 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-ink-light/20">
                  <span className="font-sans text-xs text-ink-light">CEO portrait</span>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <blockquote className="font-display text-2xl leading-snug text-ink">
                &ldquo;{ceoQuote}&rdquo;
              </blockquote>
              {ceoAttribution && (
                <p className="mt-2 font-sans text-sm text-ink-light">{ceoAttribution}</p>
              )}
              <Link
                href={ceoCtaUrl}
                className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-teal hover:text-teal-dark"
              >
                {ceoCta} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Email capture — below CEO intro */}
      <section className="bg-ink py-12">
        <div className="mx-auto max-w-6xl px-6">
          <EmailCapture
            heading="Stay informed as we launch."
            subheading="Research updates, launch news, and early access — nothing else."
            source="homepage"
            enquiryType="waitlist"
            darkBackground
          />
        </div>
      </section>

      {/* Science teaser */}
      <section className="bg-teal-light py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <h2 className="mb-4 font-display text-4xl text-ink">{featuresHeadline}</h2>
            <p className="mx-auto max-w-xl font-sans text-base text-ink-mid">{featuresBody}</p>
          </div>
          {featuredStudies.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {featuredStudies.map((study) => (
                  <div key={study.id} className="rounded-lg border border-teal/20 bg-white p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded bg-teal/10 px-1.5 py-0.5 font-mono text-xs text-teal">
                        {study.evidence_level}
                      </span>
                      <span className="rounded bg-ink-light/10 px-1.5 py-0.5 font-mono text-xs text-ink-mid">
                        {study.study_type}
                      </span>
                    </div>
                    <h3 className="mb-2 font-sans text-sm font-semibold leading-snug text-ink">
                      {study.title}
                    </h3>
                    <p className="mb-3 font-sans text-xs leading-relaxed text-ink-mid">
                      {study.summary}
                    </p>
                    {(study.doi_url || study.pubmed_url) && (
                      <a
                        href={study.doi_url ?? study.pubmed_url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
                      >
                        {study.doi_url ? 'DOI ↗' : 'PubMed ↗'}
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href={featuresUrl}
                  className="inline-flex items-center font-mono text-xs uppercase tracking-widest text-teal hover:text-teal-dark"
                >
                  {featuresCta || 'Explore the research'} &rarr;
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <Link
                href={featuresUrl}
                className="inline-flex items-center font-mono text-xs uppercase tracking-widest text-teal hover:text-teal-dark"
              >
                {featuresCta || 'Explore the research'} &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialStrip testimonials={testimonials} />

      {/* Device CTA */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-ink-mid/30">
              {deviceImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={deviceImage} alt="H2 Revive device" className="h-full w-full object-cover" />
              ) : (
                <span className="font-sans text-sm text-ink-light">Product image</span>
              )}
            </div>
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                The device
              </p>
              <h2 className="mb-4 font-display text-4xl text-white">{deviceHeadline}</h2>
              <p className="mb-8 font-sans text-base text-ink-light">{deviceBody}</p>
              <Link
                href={deviceCtaUrl}
                className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
              >
                {deviceCtaText}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
