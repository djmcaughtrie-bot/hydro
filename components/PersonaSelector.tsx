'use client'

import Link from 'next/link'

type Persona = 'energy' | 'performance' | 'longevity'

const PERSONAS: { value: Persona; label: string }[] = [
  { value: 'energy',      label: 'Energy' },
  { value: 'performance', label: 'Performance' },
  { value: 'longevity',   label: 'Longevity' },
]

interface Props {
  current: Persona | null
}

export function PersonaSelector({ current }: Props) {
  return (
    <div className="flex flex-wrap gap-2 py-4">
      <Link
        href="?"
        className={`rounded-pill border px-4 py-1.5 font-sans text-sm font-medium transition-colors ${
          current === null
            ? 'border-teal bg-teal text-white'
            : 'border-ink-light/30 text-ink-mid hover:border-teal/50'
        }`}
      >
        General
      </Link>
      {PERSONAS.map(({ value, label }) => (
        <Link
          key={value}
          href={`?persona=${value}`}
          className={`rounded-pill border px-4 py-1.5 font-sans text-sm font-medium transition-colors ${
            current === value
              ? 'border-teal bg-teal text-white'
              : 'border-ink-light/30 text-ink-mid hover:border-teal/50'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
