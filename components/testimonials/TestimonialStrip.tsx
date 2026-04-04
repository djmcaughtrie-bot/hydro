import type { Testimonial } from '@/lib/types'
import { TestimonialCard } from './TestimonialCard'

interface Props {
  testimonials: Testimonial[]
}

export function TestimonialStrip({ testimonials }: Props) {
  if (testimonials.length === 0) return null

  const visible = testimonials.slice(0, 3)

  return (
    <section className="py-16 bg-cream">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light mb-6">
          What people are saying
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {visible.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} showPersonaBadge={true} />
          ))}
        </div>
      </div>
    </section>
  )
}
