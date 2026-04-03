'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ContentItem } from '@/lib/types'
import { CONTENT_CONFIG } from '@/lib/content-config'

interface Props {
  items: ContentItem[]
}

const STATUS_STYLES: Record<string, string> = {
  published:    'bg-green-100 text-green-800',
  draft:        'bg-amber-100 text-amber-800',
  needs_review: 'bg-gray-100 text-gray-600',
}
const STATUS_LABELS: Record<string, string> = {
  published:    '● Published',
  draft:        '○ Draft',
  needs_review: '⚠ Review',
}
const PERSONA_STYLES: Record<string, string> = {
  sarah:  'bg-blue-100 text-blue-800',
  marcus: 'bg-amber-100 text-amber-800',
  elena:  'bg-purple-100 text-purple-800',
}

function getPreview(item: ContentItem): string {
  const json = item.content_json as Record<string, unknown>
  const text = String(json.headline ?? json.subheading ?? json.question ?? json.body ?? '')
  return text.length > 60 ? text.slice(0, 60) + '…' : text
}

function getPageSectionLabel(item: ContentItem): string {
  const pageLabel = CONTENT_CONFIG[item.page as keyof typeof CONTENT_CONFIG]?.label ?? item.page
  const sectionLabel = (CONTENT_CONFIG[item.page as keyof typeof CONTENT_CONFIG]?.sections as Record<string, { label: string }>)?.[item.section]?.label ?? item.section
  return `${pageLabel} / ${sectionLabel}`
}

export function ContentLibrary({ items: initialItems }: Props) {
  const [items, setItems] = useState<ContentItem[]>(initialItems)
  const [pageFilter, setPageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const pages = Object.entries(CONTENT_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))

  const filtered = items.filter(item => {
    if (pageFilter && item.page !== pageFilter) return false
    if (statusFilter && item.status !== statusFilter) return false
    return true
  })

  function restoreItem(item: ContentItem) {
    setItems(prev => {
      // Find where this item was relative to its neighbours in the original list
      const origIdx = initialItems.findIndex(i => i.id === item.id)
      // Find the nearest item that still exists in current state (search forward then backward)
      let insertAt = prev.length // default: append
      for (let i = origIdx + 1; i < initialItems.length; i++) {
        const neighbour = initialItems[i]
        const currentIdx = prev.findIndex(ci => ci.id === neighbour.id)
        if (currentIdx !== -1) {
          insertAt = currentIdx
          break
        }
      }
      const next = [...prev]
      next.splice(insertAt, 0, item)
      return next
    })
  }

  async function handleDelete(item: ContentItem) {
    if (!confirm('Delete this content item? This cannot be undone.')) return
    setItems(prev => prev.filter(i => i.id !== item.id))
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        restoreItem(item)
        setErrors(prev => ({ ...prev, [item.id]: 'Failed to delete' }))
      }
    } catch {
      restoreItem(item)
      setErrors(prev => ({ ...prev, [item.id]: 'Failed to delete' }))
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
          Content library{' '}
          <span className="font-normal text-gray-400">{items.length} items</span>
        </p>
        <div className="flex gap-2">
          <select
            aria-label="Filter by page"
            value={pageFilter}
            onChange={e => setPageFilter(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 font-sans text-xs text-ink"
          >
            <option value="">All pages</option>
            {pages.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 font-sans text-xs text-ink"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="needs_review">Needs review</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-sans text-sm text-ink-light">No content items yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="hidden grid-cols-[2fr_2fr_80px_80px_100px_110px] gap-2 border-b border-gray-100 px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink-light md:grid">
            <div>Page / Section</div>
            <div>Preview</div>
            <div>Persona</div>
            <div>Type</div>
            <div>Status</div>
            <div></div>
          </div>

          {filtered.map(item => (
            <div
              key={item.id}
              data-testid={`content-row-${item.id}`}
              className="flex flex-wrap items-center gap-2 border-b border-gray-50 px-4 py-3 last:border-b-0 md:grid md:grid-cols-[2fr_2fr_80px_80px_100px_110px]"
            >
              <p className="w-full font-sans text-sm font-medium text-ink md:w-auto">
                {getPageSectionLabel(item)}
              </p>
              <p className="hidden truncate font-sans text-xs text-ink-light md:block">
                {getPreview(item)}
              </p>
              <div>
                {item.persona ? (
                  <span className={`rounded px-1.5 py-0.5 font-mono text-xs capitalize ${PERSONA_STYLES[item.persona] ?? 'bg-gray-100 text-gray-600'}`}>
                    {item.persona}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-ink-light">General</span>
                )}
              </div>
              <p className="font-mono text-xs text-ink-light">{item.content_type}</p>
              <div>
                <span className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${STATUS_STYLES[item.status] ?? ''}`}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/content/${item.id}`}
                  className="rounded border border-gray-200 px-2 py-1 font-sans text-xs text-teal transition-colors hover:border-teal/50"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="rounded border border-gray-200 px-2 py-1 font-sans text-xs text-red-500 transition-colors hover:border-red-200 hover:bg-red-50"
                >
                  Delete
                </button>
                {errors[item.id] && (
                  <span className="font-sans text-xs text-red-500">{errors[item.id]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
