import type { Persona } from '@/lib/persona'
import type { PersonaPageContent } from '@/lib/persona-page-content'

interface Props {
  persona: Persona
  problem: PersonaPageContent['problem']
}

const eyebrowClass: Record<Persona, string> = {
  energy: 'text-persona-energy',
  performance: 'text-persona-performance',
  longevity: 'text-persona-longevity',
}

export function PersonaPageProblem({ persona, problem }: Props) {
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-5xl px-6">
        <p className={`mb-4 font-mono text-xs uppercase tracking-widest ${eyebrowClass[persona]}`}>
          The problem
        </p>
        <h2 className="mb-6 font-display text-3xl text-ink">
          {problem.headline}
        </h2>
        <div className="max-w-2xl">
          {problem.body.map((paragraph, index) => (
            <p
              key={index}
              className="mb-4 font-sans text-base leading-relaxed text-ink-mid"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
