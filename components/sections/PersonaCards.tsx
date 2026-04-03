import Link from 'next/link'

const personas = [
  {
    icon: '⚡',
    label: 'Energy',
    description: 'Mental clarity and sustained energy without the crash',
    href: '/product?persona=sarah',
  },
  {
    icon: '🏃',
    label: 'Recovery',
    description: 'Train harder, recover faster, reduce inflammation',
    href: '/product?persona=marcus',
  },
  {
    icon: '🌿',
    label: 'Longevity',
    description: 'Cellular health, oxidative stress, and the long game',
    href: '/product?persona=elena',
  },
]

export function PersonaCards() {
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-8 text-center font-mono text-xs uppercase tracking-widest text-teal">
          Find your story
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {personas.map(({ icon, label, description, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center rounded-lg border border-ink-light/20 bg-white p-6 text-center shadow-subtle transition-colors hover:border-teal"
            >
              <span className="mb-3 text-3xl" aria-hidden="true">
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
