import Link from 'next/link'

interface PersonaCardsContent {
  energy_copy?: string
  performance_copy?: string
  longevity_copy?: string
}

interface Props { content?: PersonaCardsContent }

const PERSONAS = [
  {
    key:         'energy',
    label:       'Energy',
    accentClass: 'border-t-persona-energy',
    iconBg:      'bg-persona-energy/10',
    iconColor:   'text-persona-energy',
    icon:        '⚡',
    defaultCopy: 'I want more energy and mental clarity',
    href:        '/for/energy',
  },
  {
    key:         'performance',
    label:       'Performance',
    accentClass: 'border-t-persona-performance',
    iconBg:      'bg-persona-performance/10',
    iconColor:   'text-persona-performance',
    icon:        '↑',
    defaultCopy: 'I train hard and want to recover better',
    href:        '/for/performance',
  },
  {
    key:         'longevity',
    label:       'Longevity',
    accentClass: 'border-t-persona-longevity',
    iconBg:      'bg-persona-longevity/10',
    iconColor:   'text-persona-longevity',
    icon:        '◇',
    defaultCopy: "I'm investing in long-term health and longevity",
    href:        '/for/longevity',
  },
] as const

export function PersonaCards({ content }: Props) {
  const items = [
    { ...PERSONAS[0], description: content?.energy_copy      ?? PERSONAS[0].defaultCopy },
    { ...PERSONAS[1], description: content?.performance_copy ?? PERSONAS[1].defaultCopy },
    { ...PERSONAS[2], description: content?.longevity_copy   ?? PERSONAS[2].defaultCopy },
  ]

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-8 text-center font-mono text-xs uppercase tracking-widest text-teal">
          Find your story
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map(({ key, icon, iconBg, iconColor, accentClass, label, description, href }) => (
            <Link
              key={key}
              href={href}
              className={`group flex flex-col items-center rounded-lg border border-ink-light/20 border-t-4 bg-white p-6 text-center shadow-subtle transition-colors hover:border-teal hover:border-t-4 ${accentClass}`}
            >
              <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full font-sans text-lg font-bold ${iconBg} ${iconColor}`} aria-hidden="true">
                {icon}
              </span>
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
