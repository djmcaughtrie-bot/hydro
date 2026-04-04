import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArticleBody } from '@/components/journal/ArticleBody'
import { ArticleCta } from '@/components/journal/ArticleCta'
import { isPageHidden } from '@/lib/site-settings'
import type { Post } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: { preview?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('title, excerpt, seo_title, seo_description')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return { title: 'Article not found' }

  return {
    title: data.seo_title ?? data.title,
    description: data.seo_description ?? data.excerpt ?? undefined,
  }
}

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

export default async function PostPage({ params, searchParams }: Props) {
  const { slug } = await params
  const previewToken = searchParams.preview

  // Respect page-level hide toggle (preview token bypasses it)
  if (!previewToken && await isPageHidden('journal')) notFound()

  let post: Post | null = null

  if (previewToken) {
    // Preview mode: fetch by slug + preview_token regardless of published state
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('preview_token', previewToken)
      .single()
    post = (data as Post) ?? null
  } else {
    const supabase = await createClient()
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
    post = (data as Post) ?? null
  }

  if (!post) notFound()

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  // JSON-LD Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? '',
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    publisher: {
      '@type': 'Organization',
      name: 'H2 Revive',
      url: 'https://h2revive.co.uk',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-cream min-h-screen">
        {/* Preview banner */}
        {previewToken && (
          <div className="bg-amber-400 px-6 py-2 text-center">
            <p className="font-mono text-xs font-semibold text-amber-900">
              Preview — this post is not yet published
            </p>
          </div>
        )}

        {/* Article header */}
        <section className="bg-ink py-16">
          <div className="mx-auto max-w-3xl px-6">
            <Link
              href="/journal"
              className="mb-6 inline-block font-mono text-xs text-teal transition-colors hover:text-teal-dark"
            >
              ← Journal
            </Link>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {post.category && (
                <span className="rounded px-2 py-0.5 font-mono text-xs font-medium bg-ink-mid/50 text-ink-light">
                  {CATEGORY_LABELS[post.category] ?? post.category}
                </span>
              )}
              {post.persona_tags.map(tag => (
                <span key={tag} className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${PERSONA_COLOURS[tag] ?? 'bg-ink-mid/50 text-ink-light'}`}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </span>
              ))}
            </div>

            <h1 className="font-display text-4xl leading-tight text-white md:text-5xl">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-4 font-sans text-base text-ink-light">{post.excerpt}</p>
            )}

            {date && (
              <p className="mt-6 font-mono text-xs text-ink-light/60">{date}</p>
            )}
          </div>
        </section>

        {/* Featured image */}
        {post.featured_image_url && (
          <div className="mx-auto max-w-3xl px-6 pt-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt ?? post.title}
              className="w-full rounded-xl object-cover"
              style={{ maxHeight: '480px' }}
            />
          </div>
        )}

        {/* Article body */}
        <article className="mx-auto max-w-3xl px-6 py-12">
          <ArticleBody post={post} />

          <ArticleCta
            headline={post.bottom_cta_headline}
            body={post.bottom_cta_body}
            label={post.bottom_cta_label}
            url={post.bottom_cta_url}
            variant="bottom"
          />

          {/* MHRA disclaimer */}
          <div className="mt-12 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="font-sans text-xs leading-relaxed text-amber-800">
              These statements have not been evaluated by the MHRA. This product is not intended to diagnose, treat, cure, or prevent any disease. Research referenced is cited for educational purposes.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/journal"
              className="font-mono text-xs uppercase tracking-widest text-teal transition-colors hover:text-teal-dark"
            >
              ← Back to Journal
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
