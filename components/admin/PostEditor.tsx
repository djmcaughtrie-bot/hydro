'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Post } from '@/lib/types'
import { ImageLibraryPicker } from './ImageLibraryPicker'
import type { MediaItem } from '@/lib/types'

type PostInput = Omit<Post, 'id' | 'created_at' | 'updated_at' | 'is_published' | 'published_at' | 'preview_token'>

interface Props {
  post?: Post  // undefined = new post
}

const CATEGORIES = [
  { value: '',          label: 'None' },
  { value: 'science',   label: 'Science' },
  { value: 'research',  label: 'Research' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'product',   label: 'Product' },
  { value: 'general',   label: 'General' },
]

const PERSONAS = ['energy', 'performance', 'longevity'] as const

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function PostEditor({ post }: Props) {
  const router = useRouter()
  const isEdit = !!post

  const [title, setTitle]               = useState(post?.title ?? '')
  const [slug, setSlug]                 = useState(post?.slug ?? '')
  const [excerpt, setExcerpt]           = useState(post?.excerpt ?? '')
  const [content, setContent]           = useState(post?.content ?? '')
  const [category, setCategory]         = useState(post?.category ?? '')
  const [personaTags, setPersonaTags]   = useState<string[]>(post?.persona_tags ?? [])
  const [seoTitle, setSeoTitle]         = useState(post?.seo_title ?? '')
  const [seoDesc, setSeoDesc]           = useState(post?.seo_description ?? '')

  // Mid CTA
  const [midCtaHeadline, setMidCtaHeadline] = useState(post?.mid_cta_headline ?? '')
  const [midCtaBody, setMidCtaBody]         = useState(post?.mid_cta_body ?? '')
  const [midCtaLabel, setMidCtaLabel]       = useState(post?.mid_cta_label ?? '')
  const [midCtaUrl, setMidCtaUrl]           = useState(post?.mid_cta_url ?? '')

  // Bottom CTA
  const [bottomCtaHeadline, setBottomCtaHeadline] = useState(post?.bottom_cta_headline ?? '')
  const [bottomCtaBody, setBottomCtaBody]         = useState(post?.bottom_cta_body ?? '')
  const [bottomCtaLabel, setBottomCtaLabel]       = useState(post?.bottom_cta_label ?? '')
  const [bottomCtaUrl, setBottomCtaUrl]           = useState(post?.bottom_cta_url ?? '')

  // Image
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featured_image_url ?? '')
  const [featuredImageAlt, setFeaturedImageAlt] = useState(post?.featured_image_alt ?? '')
  const [showLibrary, setShowLibrary] = useState(false)

  // Scheduler — store as local datetime string for the input
  const [scheduledFor, setScheduledFor] = useState<string>(() => {
    if (!post?.scheduled_for) return ''
    // Convert UTC ISO to local datetime-local format
    const d = new Date(post.scheduled_for)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })

  const [saving, setSaving]       = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [error, setError]         = useState('')
  const [savedAt, setSavedAt]     = useState<string | null>(null)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!isEdit || !slug) setSlug(slugify(value))
  }

  function togglePersona(tag: string) {
    setPersonaTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function buildPayload(): PostInput {
    return {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      persona_tags: personaTags,
      category: category || null,
      featured_image_url: featuredImageUrl || null,
      featured_image_alt: featuredImageAlt || null,
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      mid_cta_headline: midCtaHeadline || null,
      mid_cta_body: midCtaBody || null,
      mid_cta_label: midCtaLabel || null,
      mid_cta_url: midCtaUrl || null,
      bottom_cta_headline: bottomCtaHeadline || null,
      bottom_cta_body: bottomCtaBody || null,
      bottom_cta_label: bottomCtaLabel || null,
      bottom_cta_url: bottomCtaUrl || null,
      seo_title: seoTitle || null,
      seo_description: seoDesc || null,
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const payload = buildPayload()
      let res: Response
      if (isEdit) {
        res = await fetch(`/api/admin/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      setSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
      if (!isEdit) router.push(`/admin/posts/${data.id}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!isEdit) { await handleSave(); return }
    setPublishing(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/posts/${post.id}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Publish failed'); return }
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  async function handleUnpublish() {
    if (!isEdit) return
    setUnpublishing(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/posts/${post.id}/unpublish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Unpublish failed'); return }
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setUnpublishing(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink focus:border-teal focus:outline-none'
  const labelClass = 'mb-1 block font-sans text-sm font-medium text-ink'
  const hintClass  = 'ml-2 font-mono text-xs text-ink-light'

  return (
    <div className="space-y-8">
      {/* Core fields */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 font-sans text-sm font-semibold text-ink">Post details</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Title <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)} className={inputClass} placeholder="Article title" />
          </div>
          <div>
            <label className={labelClass}>
              Slug <span className={hintClass}>URL: /journal/{slug || '...'}</span>
            </label>
            <input type="text" value={slug} onChange={e => setSlug(slugify(e.target.value))} className={inputClass} placeholder="url-friendly-slug" />
          </div>
          <div>
            <label className={labelClass}>Excerpt <span className={hintClass}>shown on browse page and in meta description</span></label>
            <textarea rows={2} value={excerpt} onChange={e => setExcerpt(e.target.value)} className={inputClass} placeholder="One or two sentence summary" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Persona tags</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {PERSONAS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => togglePersona(tag)}
                    className={`rounded-pill px-3 py-1 font-sans text-xs font-medium transition-colors ${
                      personaTags.includes(tag)
                        ? 'bg-teal text-white'
                        : 'border border-gray-200 text-ink-mid hover:border-teal/50'
                    }`}
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured image */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-sans text-sm font-semibold text-ink">Featured image</h2>
        {featuredImageUrl && (
          <div className="mb-4 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featuredImageUrl} alt={featuredImageAlt || 'Featured image'} className="h-48 w-full rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => { setFeaturedImageUrl(''); setFeaturedImageAlt('') }}
              className="absolute right-2 top-2 rounded bg-ink/60 px-2 py-1 font-mono text-xs text-white hover:bg-ink"
            >
              Remove
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="rounded-lg border border-gray-200 px-4 py-2 font-sans text-sm text-ink-mid transition-colors hover:border-teal/50 hover:text-teal"
          >
            {featuredImageUrl ? 'Change image' : '+ Pick from library'}
          </button>
        </div>
        {featuredImageUrl && (
          <div className="mt-3">
            <label className={labelClass}>Alt text <span className={hintClass}>describe the image for screen readers and SEO</span></label>
            <input type="text" value={featuredImageAlt} onChange={e => setFeaturedImageAlt(e.target.value)} className={inputClass} placeholder="e.g. Hydrogen inhalation device in use" />
          </div>
        )}
        {showLibrary && (
          <ImageLibraryPicker
            onSelect={(item: MediaItem) => {
              setFeaturedImageUrl(item.url)
              setShowLibrary(false)
            }}
            onClose={() => setShowLibrary(false)}
          />
        )}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 font-sans text-sm font-semibold text-ink">Content</h2>
        <p className="mb-4 font-mono text-xs text-ink-light">
          Markdown supported: ## Heading, ### Subheading, **bold**, [text](url), - list item
        </p>
        <textarea
          rows={24}
          value={content}
          onChange={e => setContent(e.target.value)}
          className={`${inputClass} font-mono text-xs leading-relaxed`}
          placeholder="Write your article here..."
        />
      </div>

      {/* Mid-article CTA */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 font-sans text-sm font-semibold text-ink">Mid-article CTA</h2>
        <p className="mb-4 font-mono text-xs text-ink-light">Inserted after the 2nd paragraph — conversion point to product or science page</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Headline</label>
            <input type="text" value={midCtaHeadline} onChange={e => setMidCtaHeadline(e.target.value)} className={inputClass} placeholder="e.g. Curious about the research?" />
          </div>
          <div>
            <label className={labelClass}>Button label</label>
            <input type="text" value={midCtaLabel} onChange={e => setMidCtaLabel(e.target.value)} className={inputClass} placeholder="e.g. See the science" />
          </div>
          <div>
            <label className={labelClass}>Supporting text <span className={hintClass}>optional</span></label>
            <input type="text" value={midCtaBody} onChange={e => setMidCtaBody(e.target.value)} className={inputClass} placeholder="One sentence max" />
          </div>
          <div>
            <label className={labelClass}>
              URL <span className={hintClass}>e.g. /product?persona=energy</span>
            </label>
            <input type="text" value={midCtaUrl} onChange={e => setMidCtaUrl(e.target.value)} className={inputClass} placeholder="/product?persona=energy" />
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 font-sans text-sm font-semibold text-ink">Bottom CTA</h2>
        <p className="mb-4 font-mono text-xs text-ink-light">Full-width dark block at the end of the article — next steps</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Headline</label>
            <input type="text" value={bottomCtaHeadline} onChange={e => setBottomCtaHeadline(e.target.value)} className={inputClass} placeholder="e.g. Ready to explore it for yourself?" />
          </div>
          <div>
            <label className={labelClass}>Button label</label>
            <input type="text" value={bottomCtaLabel} onChange={e => setBottomCtaLabel(e.target.value)} className={inputClass} placeholder="e.g. Enquire about the device" />
          </div>
          <div>
            <label className={labelClass}>Supporting text <span className={hintClass}>optional</span></label>
            <input type="text" value={bottomCtaBody} onChange={e => setBottomCtaBody(e.target.value)} className={inputClass} placeholder="One or two sentences" />
          </div>
          <div>
            <label className={labelClass}>
              URL <span className={hintClass}>e.g. /product?persona=longevity</span>
            </label>
            <input type="text" value={bottomCtaUrl} onChange={e => setBottomCtaUrl(e.target.value)} className={inputClass} placeholder="/product" />
          </div>
        </div>
      </div>

      {/* Scheduler */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 font-sans text-sm font-semibold text-ink">Schedule</h2>
        <p className="mb-4 font-mono text-xs text-ink-light">
          Leave blank to publish manually. Set a date/time to auto-publish — the post URL is available for preview immediately.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={e => setScheduledFor(e.target.value)}
            className={`${inputClass} max-w-xs`}
          />
          {scheduledFor && (
            <button type="button" onClick={() => setScheduledFor('')} className="font-mono text-xs text-ink-light hover:text-ink">
              Clear
            </button>
          )}
        </div>
        {isEdit && post?.preview_token && (
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="mb-1 font-mono text-xs font-medium text-ink-light">Preview URL (works before publication)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-xs text-ink">
                /journal/{post.slug}?preview={post.preview_token}
              </code>
              <a
                href={`/journal/${post.slug}?preview=${post.preview_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-mono text-xs text-teal hover:text-teal-dark"
              >
                Open →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-sans text-sm font-semibold text-ink">SEO overrides <span className="font-normal text-ink-light">(optional — falls back to title/excerpt)</span></h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>SEO title <span className={hintClass}>max 60 chars</span></label>
            <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className={inputClass} maxLength={60} placeholder={title || 'Defaults to post title'} />
          </div>
          <div>
            <label className={labelClass}>Meta description <span className={hintClass}>max 160 chars</span></label>
            <textarea rows={2} value={seoDesc} onChange={e => setSeoDesc(e.target.value)} className={inputClass} maxLength={160} placeholder={excerpt || 'Defaults to excerpt'} />
          </div>
        </div>
      </div>

      {/* Actions */}
      {error && <p className="font-sans text-sm text-red-500">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg border border-gray-200 px-4 py-2 font-sans text-sm font-medium text-ink transition-colors hover:border-teal/50 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>

        {isEdit && (
          post.is_published ? (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={unpublishing}
              className="rounded-lg border border-gray-200 px-4 py-2 font-sans text-sm font-medium text-ink-mid transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-50"
            >
              {unpublishing ? 'Unpublishing…' : 'Unpublish'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
            >
              {publishing ? 'Publishing…' : '✓ Publish'}
            </button>
          )
        )}

        {savedAt && (
          <span className="ml-auto font-mono text-xs text-ink-light">saved {savedAt}</span>
        )}
        {isEdit && post.is_published && (
          <a
            href={`/journal/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto font-mono text-xs text-teal hover:text-teal-dark"
          >
            View live →
          </a>
        )}
      </div>
    </div>
  )
}
