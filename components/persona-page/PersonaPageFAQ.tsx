import { Accordion } from '@/components/ui/Accordion'
import type { Persona } from '@/lib/persona'
import type { PersonaPageContent } from '@/lib/persona-page-content'

interface Props {
  persona: Persona
  faqs: PersonaPageContent['faqs']
}

const eyebrowClass: Record<Persona, string> = {
  energy: 'text-persona-energy',
  performance: 'text-persona-performance',
  longevity: 'text-persona-longevity',
}

export function PersonaPageFAQ({ persona, faqs }: Props) {
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-2xl px-6">
        <p className={`mb-4 font-mono text-xs uppercase tracking-widest ${eyebrowClass[persona]}`}>
          FAQ
        </p>
        <h2 className="mb-8 font-display text-3xl text-ink">
          Questions worth asking.
        </h2>
        <Accordion items={faqs} />
      </div>
    </section>
  )
}
