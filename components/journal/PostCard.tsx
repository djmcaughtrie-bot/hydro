import Link from 'next/link'
import type { Post } from '@/lib/types'

const PERSONA_COLOURS: Record<string, string> = {
  energy:      'bg-purple-100 text-purple-700',
  performance: 'bg-blue-100 text-blue-700',
  longevity:   'bg-green-100 text-green-800',
}

const CATEGORY_LABELS: Record<string, string> = {
  science:   'Science',
  lifestyle: 'Lifestyle',
  product:   'Product',
  research:  'Research',
  general:   'General',
}

interface Props {
  post: Post
}

export function PostCard({ post }: Props) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <Link
      href={`/journal/${post.slug}`}
      className="group flex flex-col rounded-lg border border-ink-light/20 bg-white p-6 shadow-subtle transition-colors hover:border-teal/40"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {post.category && (
          <span className="rounded px-2 py-0.5 font-mono text-xs font-medium bg-gray-100 text-ink-mid">
            {CATEGORY_LABELS[post.category] ?? post.category}
          </span>
        )}
        {post.persona_tags.slice(0, 2).map(tag => (
          <span key={tag} className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${PERSONA_COLOURS[tag] ?? 'bg-gray-100 text-ink-mid'}`}>
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </span>
        ))}
      </div>

      <h2 className="mb-2 font-display text-xl leading-snug text-ink group-hover:text-teal">
        {post.title}
      </h2>

      {post.excerpt && (
        <p className="mb-4 flex-1 font-sans text-sm leading-relaxed text-ink-mid line-clamp-3">
          {post.excerpt}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between">
        {date && <span className="font-mono text-xs text-ink-light">{date}</span>}
        <span className="font-mono text-xs uppercase tracking-widest text-teal">
          Read &rarr;
        </span>
      </div>
    </Link>
  )
}
