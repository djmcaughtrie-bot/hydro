import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isValidPersona } from '@/lib/persona'
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
// Metadata
// ---------------------------------------------------------------------------

const PAGE_TITLE: Record<Persona, string> = {
  energy:      'Hydrogen Therapy for Energy & Fatigue | H2 Revive',
  performance: 'Hydrogen Inhalation for Athletes & Recovery | H2 Revive',
  longevity:   'Molecular Hydrogen for Longevity & Healthy Ageing | H2 Revive',
}

const PAGE_DESCRIPTION: Record<Persona, string> = {
  energy:
    'Research suggests molecular hydrogen may support cellular energy and reduce oxidative stress at the mitochondrial level. Explore the evidence and the device. UK-based.',
  performance:
    '600ml/min output. 99.99% H₂ purity. PEM membrane technology. Explore the recovery research and the spec behind the H2 Revive device.',
  longevity:
    'The most selective antioxidant in existence. Research into molecular hydrogen and longevity spans 1,000+ peer-reviewed studies. Explore the evidence.',
}

interface Props {
  params: Promise<{ persona: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { persona } = await params
  if (!isValidPersona(persona)) return {}
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
  const { persona } = await params
  if (!isValidPersona(persona)) notFound()
  const content = PERSONA_PAGE_CONTENT[persona]
  const testimonials = await getTestimonials('persona-page', persona)

  return (
    <>
      {content.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: content.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      )}
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
