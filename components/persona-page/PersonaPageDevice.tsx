import type { Persona } from '@/lib/persona'
import type { PersonaPageContent } from '@/lib/persona-page-content'

interface Props {
  persona: Persona
  device: PersonaPageContent['device']
}

const eyebrowClass: Record<Persona, string> = {
  energy: 'text-persona-energy',
  performance: 'text-persona-performance',
  longevity: 'text-persona-longevity',
}

const specs = [
  { label: '99.99% H₂ purity', description: 'Pharmaceutical-grade output.' },
  { label: '600ml/min flow rate', description: 'Matches study protocols.' },
  { label: 'PEM/SPE membrane', description: 'No alkaline electrolysis byproducts.' },
]

export function PersonaPageDevice({ persona, device }: Props) {
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Left: specs and CTA */}
          <div>
            <p className={`mb-4 font-mono text-xs uppercase tracking-widest ${eyebrowClass[persona]}`}>
              The device
            </p>
            <p className="mb-6 font-sans text-base text-ink-mid">
              {device.leadLine}
            </p>
            <ul className="mb-8 space-y-3">
              {specs.map((spec) => (
                <li
                  key={spec.label}
                  className="rounded-lg bg-white p-4 shadow-subtle"
                >
                  <p className="font-sans text-sm font-semibold text-ink">{spec.label}</p>
                  <p className="mt-0.5 font-sans text-xs text-ink-mid">{spec.description}</p>
                </li>
              ))}
            </ul>
            <a
              href={`/product?persona=${persona}`}
              className="inline-block rounded-pill bg-teal px-6 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
            >
              {device.ctaLabel}
            </a>
            <p className="mt-3 font-sans text-xs text-ink-light">
              2-year UK warranty. Full UK support.
            </p>
          </div>

          {/* Right: product image placeholder */}
          <div className="flex items-center justify-center">
            <div className="flex aspect-[4/5] w-full max-w-xs items-center justify-center rounded-lg bg-ink-light/20">
              <span className="font-sans text-sm text-ink-light">Product image</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
