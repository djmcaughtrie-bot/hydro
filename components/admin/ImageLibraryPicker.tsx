'use client'

import { useEffect, useState } from 'react'
import type { MediaItem } from '@/lib/types'
import type { ImageGuidelines } from '@/lib/content-config'

interface Props {
  onSelect: (item: MediaItem) => void
  onClose: () => void
  guidelines?: ImageGuidelines
}

export function ImageLibraryPicker({ onSelect, onClose, guidelines }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/media')
      .then(r => {
        if (!r.ok) throw new Error('API error')
        return r.json()
      })
      .then((data: MediaItem[]) => {
        setItems(data.filter(i => i.media_type === 'image'))
      })
      .catch(() => setError('Failed to load media library'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40">
      <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
            Image library
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-ink-light hover:text-ink"
          >
            ✕
          </button>
        </div>

        {loading && <p className="font-sans text-sm text-ink-light">Loading…</p>}
        {error && <p className="font-sans text-sm text-red-500">{error}</p>}

        {!loading && items.length === 0 && (
          <p className="font-sans text-sm text-ink-light">No images uploaded yet.</p>
        )}

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((item) => {
            const oversized = guidelines && item.file_size_kb > guidelines.maxFileSizeKb
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.filename}
                onClick={() => onSelect(item)}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-left transition-colors hover:border-teal/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <div className="p-2">
                  <p className="truncate font-mono text-xs text-ink">{item.filename}</p>
                  <p className="font-mono text-xs text-ink-light">
                    {item.width}×{item.height} · {item.file_size_kb}KB
                  </p>
                  {oversized && (
                    <p className="font-mono text-xs text-amber-600">⚠ Oversized</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
