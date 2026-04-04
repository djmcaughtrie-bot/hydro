'use client'

import { useState } from 'react'
import type { SectionConfig } from '@/lib/content-config'

interface ExistingItem {
  id: string
  content_json: Record<string, unknown>
  status: string
  updated_at: string
}

interface Props {
  page: string
  sectionKey: string
  sectionConfig: SectionConfig
  existingItem: ExistingItem | null
  persona?: string | null
}

type ListItem = Record<string, string>

const STATUS_STYLES: Record<string, string> = {
  published:    'bg-green-100 text-green-800',
  draft:        'bg-amber-100 text-amber-800',
  needs_review: 'bg-gray-100 text-gray-600',
  empty:        'bg-gray-100 text-gray-400',
}
const STATUS_LABELS: Record<string, string> = {
  published:    '● Published',
  draft:        '○ Draft',
  needs_review: '⚠ Needs review',
  empty:        '— Empty',
}

function emptyItem(fields: SectionConfig['fields']): ListItem {
  return Object.fromEntries(Object.keys(fields).map(k => [k, '']))
}

function loadItems(existingItem: ExistingItem | null, fields: SectionConfig['fields']): ListItem[] {
  const raw = existingItem?.content_json?.items
  if (Array.isArray(raw) && raw.length > 0) {
    return (raw as Record<string, unknown>[]).map(r =>
      Object.fromEntries(Object.keys(fields).map(k => [k, String(r[k] ?? '')]))
    )
  }
  return [emptyItem(fields)]
}

export function PageSectionListEditor({ page, sectionKey, sectionConfig, existingItem, persona = null }: Props) {
  const [open, setOpen] = useState(!existingItem || existingItem.status !== 'published')
  const [itemId, setItemId] = useState<string | null>(existingItem?.id ?? null)
  const [status, setStatus] = useState<string>(existingItem?.status ?? 'empty')
  const [items, setItems] = useState<ListItem[]>(() => loadItems(existingItem, sectionConfig.fields))
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [publishError, setPublishError] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(
    existingItem ? new Date(existingItem.updated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null
  )

  function updateItem(index: number, key: string, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem(sectionConfig.fields)])
  }

  function removeItem(index: number) {
    setItems(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))
  }

  function moveItem(index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= items.length) return
    setItems(prev => {
      const arr = [...prev]
      ;[arr[index], arr[next]] = [arr[next], arr[index]]
      return arr
    })
  }

  async function saveToServer(id: string | null): Promise<string | null> {
    const content_json = { items }
    if (id) {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_json }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error ?? 'Save failed'); return null }
      return id
    } else {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, section: sectionKey, persona: persona ?? null, content_json }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error ?? 'Save failed'); return null }
      return data.id as string
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setPublishError('')
    try {
      const id = await saveToServer(itemId)
      if (!id) return
      setItemId(id)
      if (status === 'published') setStatus('draft')
      else if (status === 'empty') setStatus('draft')
      setSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    setSaveError('')
    setPublishError('')

    // Always save current values first
    setSaving(true)
    let resolvedId: string | null = null
    try {
      const id = await saveToServer(itemId)
      if (!id) return
      resolvedId = id
      setItemId(id)
      setSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setSaveError('Network error. Please try again.')
      return
    } finally {
      setSaving(false)
    }

    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/content/${resolvedId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setPublishError(data.error ?? 'Publish failed')
      } else {
        setStatus('published')
      }
    } catch {
      setPublishError('Network error. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const fieldKeys = Object.entries(sectionConfig.fields)

  const body = (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-xs font-medium text-ink-light">Item {index + 1}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="rounded px-2 py-1 font-mono text-xs text-ink-light hover:text-ink disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                className="rounded px-2 py-1 font-mono text-xs text-ink-light hover:text-ink disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="rounded px-2 py-1 font-mono text-xs text-red-400 hover:text-red-600 disabled:opacity-30"
                title="Remove item"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {fieldKeys.map(([key, meta]) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-sans text-sm font-medium text-ink">
                    {meta.label}
                    {meta.required && <span className="ml-0.5 text-red-500">*</span>}
                  </label>
                  <span className="font-mono text-xs text-ink-light">{meta.hint}</span>
                </div>
                {meta.multiline ? (
                  <textarea
                    rows={3}
                    value={item[key] ?? ''}
                    onChange={e => updateItem(index, key, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
                  />
                ) : (
                  <input
                    type="text"
                    value={item[key] ?? ''}
                    onChange={e => updateItem(index, key, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 font-sans text-sm text-ink-light transition-colors hover:border-teal/50 hover:text-teal"
      >
        + Add item
      </button>

      {saveError && <p className="font-sans text-xs text-red-500">{saveError}</p>}
      {publishError && <p className="font-sans text-xs text-red-500">{publishError}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg border border-gray-200 px-4 py-2 font-sans text-sm font-medium text-ink transition-colors hover:border-teal/50 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || saving}
          className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {publishing ? 'Publishing…' : '✓ Publish'}
        </button>
        <span className="ml-auto font-mono text-xs text-ink-light">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="font-sans text-sm font-semibold text-ink">{sectionConfig.label}</span>
          <span className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.empty}`}>
            {STATUS_LABELS[status] ?? STATUS_LABELS.empty}
          </span>
          {savedAt && status !== 'published' && (
            <span className="font-mono text-xs text-ink-light">saved {savedAt}</span>
          )}
          {status === 'published' && (
            <span className="font-mono text-xs text-ink-light">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <span className="font-mono text-xs text-ink-light">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="border-t border-gray-100 px-5 py-5">{body}</div>}
    </div>
  )
}
