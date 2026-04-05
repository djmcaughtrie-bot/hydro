'use client'

import { useState } from 'react'
import { EmailCapture } from '@/components/forms/EmailCapture'
import type { Persona } from '@/lib/persona'
import type { PersonaPageContent } from '@/lib/persona-page-content'

interface Props {
  persona: Persona
  cta: PersonaPageContent['cta']
}

const bgClass: Record<Persona, string> = {
  energy: 'bg-persona-energy/10',
  performance: 'bg-persona-performance/10',
  longevity: 'bg-persona-longevity/10',
}

export function PersonaPageCTA({ persona, cta }: Props) {
  const [showWaitlist, setShowWaitlist] = useState(false)

  return (
    <section className={`py-16 ${bgClass[persona]}`}>
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mb-4 font-display text-4xl text-ink">
          {cta.headline}
        </h2>
        <p className="mb-8 font-sans text-base text-ink-mid">
          {cta.body}
        </p>
        <a
          href={cta.primaryCta.href}
          className="inline-block rounded-pill bg-teal px-8 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          {cta.primaryCta.label}
        </a>

        {!showWaitlist && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowWaitlist(true)}
              className="font-sans text-sm text-ink-light transition-colors hover:text-ink-mid"
            >
              Not ready yet? Join the waitlist →
            </button>
          </div>
        )}

        {showWaitlist && (
          <div className="mt-8">
            <EmailCapture
              heading="Stay informed"
              subheading="We'll be in touch as things develop."
              source={`/for/${persona}`}
              ctaText="Join the waitlist"
              enquiryType="waitlist"
            />
          </div>
        )}

        <p className="mt-8 font-sans text-xs leading-relaxed text-ink-light/60">
          These statements have not been evaluated by the MHRA. This product is not intended to
          diagnose, treat, cure, or prevent any disease. Research referenced is cited for
          educational purposes.
        </p>
      </div>
    </section>
  )
}
