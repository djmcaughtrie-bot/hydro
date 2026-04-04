import Link from 'next/link'

interface PersonaCardsContent {
  energy_copy?: string
  performance_copy?: string
  longevity_copy?: string
}

interface Props { content?: PersonaCardsContent }

const ICONS = { energy: '⚡', performance: '🏃', longevity: '🌿' }

export function PersonaCards({ content }: Props) {
  const personas = [
    {
      key:         'energy',
      icon:        ICONS.energy,
      label:       'Energy',
      description: content?.energy_copy ?? 'I want more energy and mental clarity',
      href:        '/product?persona=energy',
    },
    {
      key:         'performance',
      icon:        ICONS.performance,
      label:       'Performance',
      description: content?.performance_copy ?? 'I train hard and want to recover better',
      href:        '/product?persona=performance',
    },
    {
      key:         'longevity',
      icon:        ICONS.longevity,
      label:       'Longevity',
      description: content?.longevity_copy ?? "I'm investing in long-term health and longevity",
      href:        '/product?persona=longevity',
    },
  ]

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-8 text-center font-mono text-xs uppercase tracking-widest text-teal">
          Find your story
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {personas.map(({ key, icon, label, description, href }) => (
            <Link
              key={key}
              href={href}
              className="group flex flex-col items-center rounded-lg border border-ink-light/20 bg-white p-6 text-center shadow-subtle transition-colors hover:border-teal"
            >
              <span className="mb-3 text-3xl" aria-hidden="true">{icon}</span>
              <p className="mb-2 font-display text-lg text-ink">{label}</p>
              <p className="font-sans text-sm text-ink-light">{description}</p>
              <p className="mt-4 font-mono text-xs uppercase tracking-widest text-teal">
                Learn more &rarr;
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
