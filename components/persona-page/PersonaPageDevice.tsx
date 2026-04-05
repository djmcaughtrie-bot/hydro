import Image from 'next/image'
import type { Persona } from '@/lib/persona'
import type { PersonaPageContent } from '@/lib/persona-page-content'

interface Props {
  persona: Persona
  device: PersonaPageContent['device']
  imageUrl?: string
}

const eyebrowClass: Record<Persona, string> = {
  energy: 'text-persona-energy',
  performance: 'text-persona-performance',
  longevity: 'text-persona-longevity',
}

const leadBorderClass: Record<Persona, string> = {
  energy: 'border-l-4 border-l-persona-energy',
  performance: 'border-l-4 border-l-persona-performance',
  longevity: 'border-l-4 border-l-persona-longevity',
}

export function PersonaPageDevice({ persona, device, imageUrl }: Props) {
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
              {device.specs.map((spec) => {
                const isLead = spec.key === device.leadSpec
                return (
                  <li
                    key={spec.key}
                    className={
                      isLead
                        ? `rounded-lg bg-white p-4 shadow-subtle ${leadBorderClass[persona]}`
                        : 'rounded-lg border border-ink-light/20 bg-cream/50 p-4'
                    }
                  >
                    <p className={`font-sans text-sm text-ink ${isLead ? 'font-bold' : 'font-semibold'}`}>
                      {spec.label}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-ink-mid">{spec.detail}</p>
                  </li>
                )
              })}
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

          {/* Right: product image */}
          <div className="flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="H2 Revive device"
                width={600}
                height={750}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="aspect-[4/5] w-full max-w-xs rounded-lg bg-ink-light/20" />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
