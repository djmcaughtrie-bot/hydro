import type { Testimonial } from '@/lib/types'
import { TestimonialCard } from './TestimonialCard'

interface Props {
  testimonials: Testimonial[]
  showPersonaBadge?: boolean
  className?: string
}

export function TestimonialBlock({ testimonials, showPersonaBadge, className }: Props) {
  if (testimonials.length === 0) return null

  const visible = testimonials.slice(0, 3)

  return (
    <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${className ?? ''}`}>
      {visible.map((t) => (
        <TestimonialCard key={t.id} testimonial={t} showPersonaBadge={showPersonaBadge} />
      ))}
    </div>
  )
}
