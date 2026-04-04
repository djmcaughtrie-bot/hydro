'use client'

import { useState } from 'react'
import type { SectionConfig } from '@/lib/content-config'
import type { ComplianceViolation } from '@/lib/compliance'
import { ImagePanel } from './ImagePanel'

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
  persona?: string | null   // null = general, string = persona key
  embedded?: boolean        // true = rendered inside PersonaTabs, suppress outer card chrome
}

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

export function PageSectionEditor({ page, sectionKey, sectionConfig, existingItem, persona = null, embedded = false }: Props) {
  const [open, setOpen] = useState(embedded || !existingItem || existingItem.status !== 'published')
  const [mediaFields, setMediaFields] = useState<Record<string, unknown>>({})

  const [itemId, setItemId] = useState<string | null>(existingItem?.id ?? null)
  const [status, setStatus] = useState<string>(existingItem?.status ?? 'empty')

  const [fields, setFields] = useState<Record<string, string>>(() => {
    const json = existingItem?.content_json ?? {}
    return Object.fromEntries(
      Object.keys(sectionConfig.fields).map(key => [key, String(json[key] ?? '')])
    )
  })

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generatePersona, setGeneratePersona] = useState<string>(persona ?? '')
  const [additionalContext, setAdditionalContext] = useState('')

  const [saveError, setSaveError] = useState('')
  const [publishError, setPublishError] = useState('')
  const [generateError, setGenerateError] = useState('')
  const [violations, setViolations] = useState<ComplianceViolation[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [savedAt, setSavedAt] = useState<string | null>(
    existingItem ? new Date(existingItem.updated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null
  )

  function applyViolations(vs: ComplianceViolation[]) {
    setViolations(vs)
    const errs: Record<string, string> = {}
    for (const v of vs) {
      const key = Object.keys(fields).find(k =>
        v.text && fields[k].toLowerCase().includes(v.text.toLowerCase())
      ) ?? '_general'
      errs[key] = v.reason || `Compliance violation: "${v.text}"`
    }
    setFieldErrors(errs)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setViolations([])
    setFieldErrors({})
    try {
      const content_json = { ...(existingItem?.content_json ?? {}), ...fields, ...mediaFields }

      if (itemId) {
        // Update existing
        const res = await fetch(`/api/admin/content/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_json }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 422 && data.violations) {
            applyViolations(data.violations as ComplianceViolation[])
          } else {
            setSaveError(data.error ?? 'Save failed')
          }
          return
        }
        if (status === 'published') setStatus('draft')
      } else {
        // Create new
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page, section: sectionKey, persona: persona ?? null, content_json }),
        })
        const data = await res.json()
        if (!res.ok) {
          setSaveError(data.error ?? 'Save failed')
          return
        }
        setItemId(data.id as string)
        setStatus('draft')
      }

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
    setViolations([])
    setFieldErrors({})

    // Always save current field values first, then publish
    let resolvedId = itemId
    setSaving(true)
    try {
      const content_json = { ...(existingItem?.content_json ?? {}), ...fields, ...mediaFields }
      if (resolvedId) {
        const res = await fetch(`/api/admin/content/${resolvedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_json }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 422 && data.violations) {
            applyViolations(data.violations as ComplianceViolation[])
            setSaveError('Compliance violations must be resolved before publishing.')
          } else {
            setSaveError(data.error ?? 'Save failed')
          }
          return
        }
      } else {
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page, section: sectionKey, persona: persona ?? null, content_json }),
        })
        const data = await res.json()
        if (!res.ok) {
          setSaveError(data.error ?? 'Save failed')
          return
        }
        resolvedId = data.id as string
        setItemId(resolvedId)
      }
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
        if (res.status === 422 && data.violations) {
          applyViolations(data.violations as ComplianceViolation[])
          setPublishError('Compliance violations must be resolved before publishing.')
        } else {
          setPublishError(data.error ?? 'Publish failed')
        }
      } else {
        setStatus('published')
        setViolations([])
        setFieldErrors({})
      }
    } catch {
      setPublishError('Network error. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          section: sectionKey,
          persona: generatePersona || null,
          additional_context: additionalContext,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGenerateError(data.error ?? 'Generation failed')
        return
      }
      // Generation creates a new item in DB — fetch its content
      const { id, status: newStatus } = data as { id: string; status: string }
      const itemRes = await fetch(`/api/admin/content/${id}`, { method: 'GET' })
      if (itemRes.ok) {
        const itemData = await itemRes.json()
        const json = (itemData.content_json ?? {}) as Record<string, unknown>
        setFields(Object.fromEntries(
          Object.keys(sectionConfig.fields).map(key => [key, String(json[key] ?? '')])
        ))
        setItemId(id)
        setStatus(newStatus)
        setSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
      } else {
        // Generation succeeded but we couldn't fetch the item — set ID so user can save
        setItemId(id)
        setStatus(newStatus)
      }
      setShowGenerate(false)
    } catch {
      setGenerateError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const body = (
    <div className="space-y-4">
      {/* Fields */}
      {Object.entries(sectionConfig.fields).map(([key, meta]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor={`${sectionKey}-${persona ?? 'g'}-${key}`} className="font-sans text-sm font-medium text-ink">
              {meta.label}
              {meta.required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            <span className="font-mono text-xs text-ink-light">{meta.hint}</span>
          </div>
          {meta.multiline ? (
            <textarea
              id={`${sectionKey}-${persona ?? 'g'}-${key}`}
              rows={4}
              value={fields[key] ?? ''}
              onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 font-sans text-sm text-ink ${
                fieldErrors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            />
          ) : (
            <input
              id={`${sectionKey}-${persona ?? 'g'}-${key}`}
              type="text"
              value={fields[key] ?? ''}
              onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 font-sans text-sm text-ink ${
                fieldErrors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            />
          )}
          {fieldErrors[key] && (
            <p className="mt-1 font-sans text-xs text-red-500">{fieldErrors[key]}</p>
          )}
        </div>
      ))}

      {/* Image upload */}
      {sectionConfig.imageGuidelines && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <ImagePanel
            contentJson={{ ...(existingItem?.content_json ?? {}), ...mediaFields }}
            imageGuidelines={sectionConfig.imageGuidelines}
            onChange={(updates) => setMediaFields(prev => ({ ...prev, ...updates }))}
          />
        </div>
      )}

      {/* Violations panel */}
      {violations.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-amber-800">
            ⚠ Compliance violations
          </p>
          <div className="space-y-2">
            {violations.map((v, i) => (
              <div key={i} className="rounded border border-amber-200 bg-white p-3">
                <p className="font-mono text-xs text-red-600">&ldquo;{v.text}&rdquo;</p>
                <p className="mt-1 font-sans text-xs text-ink-mid">{v.reason}</p>
                {v.suggestion && (
                  <p className="mt-1 font-sans text-xs text-teal-dark">→ {v.suggestion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {saveError && <p className="mt-3 font-sans text-xs text-red-500">{saveError}</p>}
      {publishError && <p className="mt-3 font-sans text-xs text-red-500">{publishError}</p>}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
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
          disabled={publishing}
          className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {publishing ? 'Publishing…' : '✓ Publish'}
        </button>
        <button
          type="button"
          onClick={() => { setShowGenerate(g => !g); setGenerateError('') }}
          className="ml-auto rounded-lg border border-teal/30 px-4 py-2 font-sans text-sm font-medium text-teal transition-colors hover:bg-teal/5"
        >
          ✦ Generate with AI
        </button>
      </div>

      {/* AI generate panel */}
      {showGenerate && (
        <div className="mt-4 rounded-lg border border-teal-light bg-teal-light/30 p-4">
          <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-teal-dark">
            Generate with AI
          </p>
          <div className="flex flex-wrap gap-3">
            {!persona && (
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1 block font-sans text-xs font-medium text-ink">
                  Persona <span className="text-ink-light">(optional)</span>
                </label>
                <select
                  value={generatePersona}
                  onChange={e => setGeneratePersona(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
                >
                  <option value="">General</option>
                  <option value="energy">Energy</option>
                  <option value="performance">Performance</option>
                  <option value="longevity">Longevity</option>
                </select>
              </div>
            )}
            <div className="flex-[2] min-w-[200px]">
              <label className="mb-1 block font-sans text-xs font-medium text-ink">
                Additional context <span className="text-ink-light">(optional)</span>
              </label>
              <input
                type="text"
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
                placeholder="e.g. focus on the science angle"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
              />
            </div>
          </div>
          {generateError && (
            <p className="mt-2 font-sans text-xs text-red-500">{generateError}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
            >
              {generating ? 'Generating…' : 'Generate'}
            </button>
            <button
              type="button"
              onClick={() => setShowGenerate(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 font-sans text-sm text-ink-light hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (embedded) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.empty}`}>
            {STATUS_LABELS[status] ?? STATUS_LABELS.empty}
          </span>
          {savedAt && status !== 'published' && (
            <span className="font-mono text-xs text-ink-light">saved {savedAt}</span>
          )}
        </div>
        {body}
      </div>
    )
  }

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
        </div>
        <span className="font-mono text-xs text-ink-light">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="border-t border-gray-100 px-5 py-5">{body}</div>}
    </div>
  )
}
