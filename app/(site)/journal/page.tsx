import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PostCard } from '@/components/journal/PostCard'
import type { Post } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Research insights, guides, and science-backed articles on molecular hydrogen, energy, recovery, and longevity from H2 Revive.',
}

const CATEGORIES = [
  { key: '',          label: 'All' },
  { key: 'science',   label: 'Science' },
  { key: 'research',  label: 'Research' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'product',   label: 'Product' },
]

const PERSONAS = [
  { key: '',            label: 'All' },
  { key: 'energy',      label: 'Energy' },
  { key: 'performance', label: 'Performance' },
  { key: 'longevity',   label: 'Longevity' },
]

interface Props {
  searchParams: { category?: string; persona?: string }
}

export default async function JournalPage({ searchParams }: Props) {
  const supabase = await createClient()

  const activeCategory = searchParams.category ?? ''
  const activePersona  = searchParams.persona  ?? ''

  let query = supabase
    .from('posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (activeCategory) query = query.eq('category', activeCategory)
  if (activePersona)  query = query.contains('persona_tags', [activePersona])

  const { data } = await query
  const posts: Post[] = (data ?? []) as Post[]

  function filterUrl(params: Record<string, string>) {
    const p = new URLSearchParams()
    if (params.category) p.set('category', params.category)
    if (params.persona)  p.set('persona', params.persona)
    const str = p.toString()
    return `/journal${str ? `?${str}` : ''}`
  }

  return (
    <div className="bg-cream min-h-screen">
      {/* Header */}
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Journal</p>
          <h1 className="font-display text-5xl leading-tight text-white">
            Research, insights, and ideas.
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base text-ink-light">
            Science-backed articles on molecular hydrogen, energy, recovery, and longevity — written for people who want to understand, not just believe.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="border-b border-ink-light/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(({ key, label }) => (
                <a
                  key={key}
                  href={filterUrl({ category: key, persona: activePersona })}
                  className={`rounded-pill px-3 py-1 font-mono text-xs transition-colors ${
                    activeCategory === key
                      ? 'bg-teal text-white'
                      : 'bg-gray-100 text-ink-mid hover:bg-gray-200'
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="h-4 w-px bg-ink-light/20 hidden sm:block" />
            {/* Persona filter */}
            <div className="flex flex-wrap gap-1">
              {PERSONAS.map(({ key, label }) => (
                <a
                  key={key}
                  href={filterUrl({ category: activeCategory, persona: key })}
                  className={`rounded-pill px-3 py-1 font-mono text-xs transition-colors ${
                    activePersona === key
                      ? 'bg-teal text-white'
                      : 'bg-gray-100 text-ink-mid hover:bg-gray-200'
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-sans text-base text-ink-light">No articles yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
