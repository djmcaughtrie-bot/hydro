import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isValidPersona, PERSONAS } from '@/lib/persona'
import type { Persona } from '@/lib/persona'
import { PERSONA_PAGE_CONTENT } from '@/lib/persona-page-content'
import { getTestimonials } from '@/lib/testimonials'
import { PersonaPageHero } from '@/components/persona-page/PersonaPageHero'
import { PersonaPageProblem } from '@/components/persona-page/PersonaPageProblem'
import { PersonaPageMechanism } from '@/components/persona-page/PersonaPageMechanism'
import { PersonaPageEvidence } from '@/components/persona-page/PersonaPageEvidence'
import { PersonaPageSession } from '@/components/persona-page/PersonaPageSession'
import { PersonaPageDevice } from '@/components/persona-page/PersonaPageDevice'
import { PersonaPageFAQ } from '@/components/persona-page/PersonaPageFAQ'
import { PersonaPageCTA } from '@/components/persona-page/PersonaPageCTA'
import { TestimonialBlock } from '@/components/testimonials/TestimonialBlock'
import { SetPersonaOnMount } from '@/components/persona/SetPersonaOnMount'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Static params — lets Next.js know the valid persona slugs
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return PERSONAS.map((persona) => ({ persona }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const PAGE_TITLE: Record<Persona, string> = {
  energy: 'Energy & Mental Clarity | H2 Revive',
  performance: 'Athletic Recovery & Performance | H2 Revive',
  longevity: 'Longevity & Cellular Health | H2 Revive',
}

const PAGE_DESCRIPTION: Record<Persona, string> = {
  energy:
    'Research suggests molecular hydrogen may support cellular energy and mental clarity. Discover the science behind H2 Revive.',
  performance:
    'Serious athletes are exploring molecular hydrogen for recovery. Explore the research and what H2 Revive may offer.',
  longevity:
    'Molecular hydrogen research explores its role in oxidative stress and healthy ageing. See the evidence behind H2 Revive.',
}

interface Props {
  params: { persona: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isValidPersona(params.persona)) return {}
  const persona = params.persona
  return {
    title: PAGE_TITLE[persona],
    description: PAGE_DESCRIPTION[persona],
  }
}

// ---------------------------------------------------------------------------
// Testimonial framing lines
// ---------------------------------------------------------------------------

const TESTIMONIAL_FRAMING: Record<Persona, string> = {
  energy:      'From people who were where you are.',
  performance: 'From people who train the way you do.',
  longevity:   'From people thinking about the same things you are.',
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ForPersonaPage({ params }: Props) {
  if (!isValidPersona(params.persona)) notFound()

  const persona = params.persona
  const content = PERSONA_PAGE_CONTENT[persona]
  const testimonials = await getTestimonials('persona-page', persona)

  return (
    <>
      <PersonaPageHero persona={persona} hero={content.hero} />

      <PersonaPageProblem persona={persona} problem={content.problem} />

      <PersonaPageMechanism
        persona={persona}
        application={content.mechanism.application}
      />

      <PersonaPageEvidence
        persona={persona}
        studies={content.studies}
        scienceLink={content.scienceLink}
      />

      <PersonaPageSession persona={persona} session={content.session} />

      <PersonaPageDevice persona={persona} device={content.device} />

      {testimonials.length > 0 && (
        <section className="bg-cream py-16">
          <div className="mx-auto max-w-5xl px-6">
            <p className="mb-8 font-sans text-sm text-ink-mid">
              {TESTIMONIAL_FRAMING[persona]}
            </p>
            <TestimonialBlock testimonials={testimonials} />
          </div>
        </section>
      )}

      <PersonaPageFAQ persona={persona} faqs={content.faqs} />

      <PersonaPageCTA persona={persona} cta={content.cta} />

      <SetPersonaOnMount persona={persona} />
    </>
  )
}
