import type { Persona } from '@/lib/persona'
import type { PersonaPageContent } from '@/lib/persona-page-content'
import { SESSION_STEPS } from '@/lib/persona-page-content'

interface Props {
  persona: Persona
  session: PersonaPageContent['session']
}

const eyebrowClass: Record<Persona, string> = {
  energy: 'text-persona-energy',
  performance: 'text-persona-performance',
  longevity: 'text-persona-longevity',
}

export function PersonaPageSession({ persona, session }: Props) {
  return (
    <section className="bg-ink py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Left: visual steps */}
          <div>
            <ol className="space-y-8">
              {SESSION_STEPS.map((step) => (
                <li key={step.n} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-mid/40 font-mono text-sm text-ink-light">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-sans text-sm font-medium text-white">{step.title}</p>
                    <p className="mt-1 font-sans text-sm leading-relaxed text-ink-light">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: persona-specific session content */}
          <div>
            <p className={`mb-4 font-mono text-xs uppercase tracking-widest ${eyebrowClass[persona]}`}>
              What a session looks like
            </p>
            <h2 className="mb-4 font-display text-3xl text-white">
              {session.headline}
            </h2>
            <p className="font-sans text-base leading-relaxed text-ink-light">
              {session.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
