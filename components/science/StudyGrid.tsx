'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { StudyCard } from './StudyCard'
import type { Study } from '@/lib/types'
import { cn } from '@/lib/cn'

// Canonical category order for pills
const CATEGORY_ORDER = ['energy', 'recovery', 'longevity', 'safety', 'inflammation', 'respiratory']

interface StudyGridProps {
  studies: Study[]
  initialCategory?: string
}

export function StudyGrid({ studies, initialCategory }: StudyGridProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const urlCategory = searchParams.get('category')
  const activeCategory = urlCategory ?? initialCategory ?? 'all'

  // Derive unique categories present in studies, in canonical order
  const presentCategories = CATEGORY_ORDER.filter((cat) =>
    studies.some((s) => s.categories.includes(cat))
  )

  const filteredStudies =
    activeCategory === 'all'
      ? studies
      : studies.filter((s) => s.categories.includes(activeCategory))

  function handlePillClick(slug: string) {
    if (slug === 'all') {
      router.push(pathname, { scroll: false })
    } else {
      router.push(`?category=${slug}`, { scroll: false })
    }
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {['all', ...presentCategories].map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => handlePillClick(slug)}
            className={cn(
              'rounded-pill px-4 py-1.5 font-sans text-sm transition-colors',
              activeCategory === slug
                ? 'border border-teal bg-teal text-white'
                : 'border border-ink-light/30 text-ink-mid hover:border-teal/50'
            )}
          >
            {slug === 'all' ? 'All' : slug.charAt(0).toUpperCase() + slug.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredStudies.length === 0 ? (
        <p className="font-sans text-sm text-ink-light">
          No studies found for this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredStudies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      )}
    </div>
  )
}
