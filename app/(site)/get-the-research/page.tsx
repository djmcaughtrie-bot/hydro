'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LeadMagnetForm } from '@/components/forms/LeadMagnetForm'
import type { Persona } from '@/lib/persona'
import { PERSONAS } from '@/lib/persona'

const CARDS: { persona: Persona; title: string; description: string; badge: string }[] = [
  {
    persona: 'energy',
    title: 'The Cellular Energy Guide',
    badge: 'Energy & Clarity',
    description: 'Understand what\'s actually happening at the cellular level when energy drops. Plain English. No jargon. Grounded in the research.',
  },
  {
    persona: 'performance',
    title: 'The H₂ Recovery Protocol',
    badge: 'Athletic Recovery',
    description: 'Session timing, study citations, spec comparison. A reference card for serious athletes who want to understand the mechanism.',
  },
  {
    persona: 'longevity',
    title: 'The Hydrogen Therapy Research Summary',
    badge: 'Longevity & Ageing',
    description: 'The strongest clinical evidence, formatted for due diligence. The studies, what they show, and what they don\'t.',
  },
]

export default function GetTheResearchPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Persona | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSuccess(persona: Persona) {
    setSubmitted(true)
    setTimeout(() => router.push(`/lead-magnet/${persona}`), 1500)
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal text-center">
          Free research guides
        </p>
        <h1 className="mb-4 font-display text-4xl leading-tight text-ink text-center">
          Get the plain-English research.
        </h1>
        <p className="mb-12 font-sans text-base text-ink-mid text-center max-w-xl mx-auto">
          Pick the guide that matches what you&apos;re exploring. We&apos;ll send it straight to your inbox.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CARDS.map(({ persona, title, badge, description }) => (
            <div
              key={persona}
              onClick={() => !submitted && setSelected(persona)}
              className={`cursor-pointer rounded-lg border bg-white p-6 transition-all ${
                selected === persona
                  ? 'border-teal shadow-md'
                  : 'border-ink-light/20 hover:border-teal/50'
              }`}
            >
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-teal">{badge}</p>
              <p className="mb-3 font-display text-lg text-ink">{title}</p>
              <p className="mb-4 font-sans text-sm leading-relaxed text-ink-mid">{description}</p>

              {selected === persona && !submitted && (
                <div className="mt-4 border-t border-ink-light/20 pt-4">
                  <LeadMagnetForm
                    persona={persona}
                    onSuccess={() => handleSuccess(persona)}
                  />
                </div>
              )}

              {selected === persona && submitted && (
                <div className="mt-4 border-t border-ink-light/20 pt-4">
                  <p className="font-sans text-sm text-teal">✓ On its way — check your inbox.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
