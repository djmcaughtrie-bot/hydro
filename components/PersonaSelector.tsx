'use client'

import { usePersona } from '@/hooks/usePersona'
import type { Persona } from '@/lib/persona'
import { PERSONAS } from '@/lib/persona'

const PERSONA_LABELS: Record<Persona, string> = {
  energy:      'Energy',
  performance: 'Performance',
  longevity:   'Longevity',
}

export function PersonaSelector() {
  const { persona, setPersona } = usePersona()

  return (
    <div className="flex flex-wrap gap-2 py-4">
      {PERSONAS.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setPersona(value)}
          className={`rounded-pill border px-4 py-1.5 font-sans text-sm font-medium transition-colors ${
            persona === value
              ? 'border-teal bg-teal text-white'
              : 'border-ink-light/30 text-ink-mid hover:border-teal/50'
          }`}
        >
          {PERSONA_LABELS[value]}
        </button>
      ))}
    </div>
  )
}
