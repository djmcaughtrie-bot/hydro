import type { Persona } from '@/lib/persona'
import type { PersonaPageContent } from '@/lib/persona-page-content'

interface Props {
  persona: Persona
  hero: PersonaPageContent['hero']
}

const personaLabel: Record<Persona, string> = {
  energy: 'Energy',
  performance: 'Performance',
  longevity: 'Longevity',
}

const borderClass: Record<Persona, string> = {
  energy: 'border-t-persona-energy',
  performance: 'border-t-persona-performance',
  longevity: 'border-t-persona-longevity',
}

const eyebrowClass: Record<Persona, string> = {
  energy: 'text-persona-energy',
  performance: 'text-persona-performance',
  longevity: 'text-persona-longevity',
}

const ghostHoverClass: Record<Persona, string> = {
  energy: 'hover:border-persona-energy hover:text-white',
  performance: 'hover:border-persona-performance hover:text-white',
  longevity: 'hover:border-persona-longevity hover:text-white',
}

export function PersonaPageHero({ persona, hero }: Props) {
  return (
    <section
      className={`border-t-4 bg-ink py-20 ${borderClass[persona]}`}
    >
      <div className="mx-auto max-w-5xl px-6">
        <p
          className={`mb-4 font-mono text-xs uppercase tracking-widest ${eyebrowClass[persona]}`}
        >
          {personaLabel[persona]}
        </p>
        <h1 className="font-display text-5xl leading-tight text-white md:text-6xl">
          {hero.headline}
        </h1>
        <p className="mt-4 max-w-xl font-sans text-base text-ink-light">
          {hero.subline}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={hero.primaryCta.href}
            className="rounded-pill bg-teal px-6 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
          >
            {hero.primaryCta.label}
          </a>
          <a
            href={hero.secondaryCta.href}
            className={`rounded-pill border border-ink-mid/50 px-6 py-3 font-sans text-sm font-medium text-ink-light transition-colors ${ghostHoverClass[persona]}`}
          >
            {hero.secondaryCta.label}
          </a>
        </div>
      </div>
    </section>
  )
}
