// app/(site)/science/[category]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTestimonials } from '@/lib/testimonials'
import { StudyCard } from '@/components/science/StudyCard'
import { TestimonialBlock } from '@/components/testimonials/TestimonialBlock'
import { TestimonialCard } from '@/components/testimonials/TestimonialCard'
import { resolvePersonaServer, personaHref } from '@/lib/persona'
import type { Study } from '@/lib/types'

const VALID_CATEGORIES = [
  'energy',
  'recovery',
  'longevity',
  'safety',
  'inflammation',
  'respiratory',
] as const

type Category = (typeof VALID_CATEGORIES)[number]

const categoryMeta: Record<
  Category,
  {
    title: string
    headline: string
    subline: string
    mechanism: string
    persona: 'energy' | 'performance' | 'longevity' | null
    personaQuote: string | null
    personaCta: string | null
    ctaHeadline: string
    testimonialPlacement: string | null
    testimonialPersona: string | null
  }
> = {
  energy: {
    title: 'Energy & Mental Clarity',
    headline: 'The molecule that works where fatigue begins.',
    subline:
      "Research exploring molecular hydrogen's effects on mitochondrial function and cognitive performance.",
    mechanism:
      "Mitochondria produce ATP — the cell's energy currency. Research suggests oxidative stress within mitochondria is a significant driver of fatigue. Studies explore whether molecular hydrogen's selective antioxidant action at the mitochondrial level may support energy metabolism.",
    persona: 'energy',
    personaQuote:
      '"What if the reason nothing\'s working isn\'t you — it\'s that nothing works at the right level?"',
    personaCta: 'Explore for energy & clarity',
    ctaHeadline: 'Ready to try it for yourself?',
    testimonialPlacement: 'science-energy',
    testimonialPersona: 'energy',
  },
  recovery: {
    title: 'Athletic Recovery',
    headline: "The research tool most serious athletes haven't discovered yet.",
    subline:
      "Studies on molecular hydrogen's potential role in post-exercise inflammation and recovery time.",
    mechanism:
      "Intense exercise generates oxidative stress and inflammatory markers. Research suggests molecular hydrogen may support the body's natural antioxidant response post-exercise — studies have measured reductions in blood lactate and inflammation markers including IL-6 and TNF-α.",
    persona: 'performance',
    personaQuote:
      '"600ml/min. 99.99% purity. The recovery tool most serious athletes haven\'t discovered yet."',
    personaCta: 'Explore for recovery',
    ctaHeadline: 'Ready to try it for yourself?',
    testimonialPlacement: 'science-recovery',
    testimonialPersona: 'performance',
  },
  longevity: {
    title: 'Longevity & Cellular Health',
    headline: "The most interesting thing isn't what it does. It's how it decides.",
    subline:
      "Research on molecular hydrogen's potential role in oxidative stress, cellular ageing, and long-term health markers.",
    mechanism:
      "Oxidative stress is one of the primary drivers of cellular ageing. Research explores whether molecular hydrogen's selective targeting of hydroxyl radicals — the most damaging reactive oxygen species — may reduce cumulative cellular damage over time.",
    persona: 'longevity',
    personaQuote:
      '"The most interesting thing about molecular hydrogen isn\'t what it does — it\'s how it decides what to target."',
    personaCta: 'Explore for longevity',
    ctaHeadline: 'Ready to try it for yourself?',
    testimonialPlacement: 'science-longevity',
    testimonialPersona: 'longevity',
  },
  safety: {
    title: 'Safety',
    headline: 'Fifteen years of research. No serious adverse events.',
    subline:
      'The safety evidence base for molecular hydrogen inhalation across human trials.',
    mechanism:
      'Hydrogen gas is naturally produced in the human gut during digestion. Studies involving sustained inhalation at concentrations up to 2.4% over 72 hours have reported no adverse effects. The safety profile is well-documented across both animal and human research.',
    persona: null,
    personaQuote: null,
    personaCta: null,
    ctaHeadline: 'Fifteen years of research. Ready to experience it?',
    testimonialPlacement: 'science-safety',
    testimonialPersona: null,
  },
  inflammation: {
    title: 'Inflammation',
    headline: 'Targeting inflammation at its source.',
    subline:
      "Research on molecular hydrogen's potential effects on systemic and localised inflammatory markers.",
    mechanism:
      "Chronic inflammation underpins a wide range of health concerns. A 2024 Frontiers meta-analysis across 12 lung studies found reductions in TNF-α, IL-1β, CRP, and IL-8 following H₂ inhalation. Research is ongoing across multiple inflammation models.",
    persona: null,
    personaQuote: null,
    personaCta: null,
    ctaHeadline: 'See the science. Then decide.',
    testimonialPlacement: null,
    testimonialPersona: null,
  },
  respiratory: {
    title: 'Respiratory Health',
    headline: 'Research at the interface of breath and biology.',
    subline:
      "Studies exploring molecular hydrogen's potential effects on respiratory function and lung inflammation.",
    mechanism:
      'Inhalation is the most direct delivery route for molecular hydrogen — it enters the bloodstream within minutes via the alveoli. Early research in respiratory contexts has explored effects on lung inflammation markers and airway oxidative stress.',
    persona: null,
    personaQuote: null,
    personaCta: null,
    ctaHeadline: 'Delivered directly to the bloodstream. Ready to explore?',
    testimonialPlacement: null,
    testimonialPersona: null,
  },
}

interface Props {
  params: Promise<{ category: string }>
  searchParams: { persona?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  if (!VALID_CATEGORIES.includes(category as Category)) {
    return { title: 'Not Found' }
  }
  const meta = categoryMeta[category as Category]
  return {
    title: meta.title,
    description: meta.subline,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category as Category)) {
    notFound()
  }

  const slug = category as Category
  const meta = categoryMeta[slug]

  // URL persona takes precedence; fall back to category's mapped persona
  const urlPersona = resolvePersonaServer(searchParams)
  const activePersona = urlPersona ?? meta.persona ?? null

  const supabase = await createClient()
  const studiesPromise = supabase
    .from('studies')
    .select('*')
    .eq('is_published', true)
    .contains('categories', [slug])
    .order('sort_order', { ascending: true })

  const testimonialsPromise = meta.testimonialPlacement
    ? getTestimonials(meta.testimonialPlacement, meta.testimonialPersona)
    : Promise.resolve([])

  const [{ data }, testimonials] = await Promise.all([studiesPromise, testimonialsPromise])

  const studies: Study[] = data ?? []
  const productHref = personaHref('/product', activePersona)

  return (
    <>
      {/* Hero */}
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href={personaHref('/science', activePersona)}
            className="mb-6 inline-block font-mono text-xs text-teal transition-colors hover:text-teal-dark"
          >
            ← All research
          </Link>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
            Science / {slug}
          </p>
          <h1 className="font-display text-4xl leading-tight text-white md:text-5xl">
            {meta.headline}
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base text-ink-light">
            {meta.subline}
          </p>
        </div>
      </section>

      {/* Mechanism */}
      <section className="bg-cream py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
              The Mechanism
            </p>
            <p className="font-sans text-base leading-relaxed text-ink-mid">
              {meta.mechanism}
            </p>
          </div>
        </div>
      </section>

      {/* Persona connection (only when persona !== null) */}
      {meta.persona !== null && meta.personaQuote !== null && meta.personaCta !== null && (
        <section className="bg-teal-light py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <blockquote className="mb-6 font-display text-2xl leading-snug text-ink">
                {meta.personaQuote}
              </blockquote>
              <Link
                href={productHref}
                className="inline-flex rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
              >
                {meta.personaCta}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Study grid */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">
            Research
          </p>
          {studies.length === 0 ? (
            <p className="font-sans text-sm text-ink-light">
              No studies found for this category yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {studies.map((study) => (
                <StudyCard key={study.id} study={study} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials — energy, recovery, longevity: block; safety: single card */}
      {testimonials.length > 0 && slug !== 'safety' && (
        <section className="bg-cream py-12">
          <div className="mx-auto max-w-6xl px-6">
            <p className="mb-6 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
              What people are saying
            </p>
            <TestimonialBlock testimonials={testimonials} />
          </div>
        </section>
      )}

      {testimonials.length > 0 && slug === 'safety' && (
        <section className="py-12 bg-cream">
          <div className="mx-auto max-w-3xl px-6">
            <TestimonialCard testimonial={testimonials[0]} />
          </div>
        </section>
      )}

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
      <section className="bg-ink py-12">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-4 font-display text-3xl text-white">
            {meta.ctaHeadline}
          </h2>
          <Link
            href={productHref}
            className="inline-flex rounded-pill bg-teal px-8 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
          >
            Enquire about the device
          </Link>
        </div>
      </section>
    </>
  )
}
