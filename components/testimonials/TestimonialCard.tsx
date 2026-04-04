import type { Testimonial } from '@/lib/types'

const PERSONA_BADGE: Record<string, string> = {
  energy: 'bg-amber-50 text-amber-700',
  performance: 'bg-blue-50 text-blue-700',
  longevity: 'bg-purple-50 text-purple-700',
  clinic: 'bg-green-50 text-green-700',
  general: 'bg-gray-50 text-gray-600',
}

interface Props {
  testimonial: Testimonial
  showPersonaBadge?: boolean
}

export function TestimonialCard({ testimonial, showPersonaBadge = false }: Props) {
  const quote = testimonial.quote_short ?? testimonial.quote_full
  const badgeClass = PERSONA_BADGE[testimonial.persona] ?? 'bg-gray-50 text-gray-600'

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col">
      {/* Decorative opening quote mark */}
      <span className="font-display text-5xl leading-none text-teal select-none" aria-hidden="true">
        &ldquo;
      </span>

      {/* Quote */}
      <p className="mt-2 font-display italic text-ink text-base leading-relaxed flex-1">
        {quote}
      </p>

      {/* Star rating */}
      {testimonial.rating !== null && (
        <div className="mt-4 flex gap-0.5" aria-label={`Rating: ${testimonial.rating} out of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={i < testimonial.rating! ? 'text-teal' : 'text-ink-light'}
            >
              {i < testimonial.rating! ? '★' : '☆'}
            </span>
          ))}
        </div>
      )}

      {/* Attribution */}
      <div className="mt-4">
        <p className="font-sans font-semibold text-ink text-sm">{testimonial.name}</p>
        {testimonial.location && (
          <p className="font-sans text-sm text-ink-light">{testimonial.location}</p>
        )}
      </div>

      {/* Persona badge */}
      {showPersonaBadge && (
        <div className="mt-3">
          <span
            className={`inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
          >
            {testimonial.persona}
          </span>
        </div>
      )}
    </div>
  )
}
