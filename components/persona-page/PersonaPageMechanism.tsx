import { MECHANISM_SHARED } from '@/lib/persona-page-content'
import type { Persona } from '@/lib/persona'

interface Props {
  persona: Persona
  application: string
}

const eyebrowClass: Record<Persona, string> = {
  energy: 'text-persona-energy',
  performance: 'text-persona-performance',
  longevity: 'text-persona-longevity',
}

const personaLabel: Record<Persona, string> = {
  energy: 'Energy',
  performance: 'Performance',
  longevity: 'Longevity',
}

export function PersonaPageMechanism({ persona, application }: Props) {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Left: shared mechanism */}
          <div>
            <p className={`mb-4 font-mono text-xs uppercase tracking-widest ${eyebrowClass[persona]}`}>
              The mechanism
            </p>
            <h2 className="mb-4 font-display text-3xl text-ink">
              {MECHANISM_SHARED.headline}
            </h2>
            <p className="mb-4 font-sans text-sm leading-relaxed text-ink-mid">
              {MECHANISM_SHARED.intro}
            </p>
            <a
              href={MECHANISM_SHARED.doi}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
            >
              {MECHANISM_SHARED.doiLabel} ↗
            </a>
          </div>

          {/* Right: persona-specific application */}
          <div className="rounded-lg bg-cream p-6">
            <p className={`mb-4 font-mono text-xs uppercase tracking-widest ${eyebrowClass[persona]}`}>
              Applied to {personaLabel[persona]}
            </p>
            <p className="font-sans text-sm leading-relaxed text-ink-mid">
              {application}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
