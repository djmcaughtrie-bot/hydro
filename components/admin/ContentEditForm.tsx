'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ContentItem, ContentStatus } from '@/lib/types'
import type { ComplianceViolation } from '@/lib/compliance'
import { CONTENT_CONFIG } from '@/lib/content-config'
import type { FieldMeta, SectionConfig } from '@/lib/content-config'
import { ImagePanel } from './ImagePanel'
import { VideoPanel } from './VideoPanel'

interface Props {
  item: ContentItem
}

const STATUS_STYLES: Record<ContentStatus, string> = {
  published:    'bg-green-100 text-green-800',
  draft:        'bg-amber-100 text-amber-800',
  needs_review: 'bg-gray-100 text-gray-600',
}
const STATUS_LABELS: Record<ContentStatus, string> = {
  published:    '● Published',
  draft:        '○ Draft',
  needs_review: '⚠ Needs review',
}
const PERSONA_LABELS: Record<string, string> = {
  energy:      'Energy',
  performance: 'Performance',
  longevity:   'Longevity',
}

export function ContentEditForm({ item }: Props) {
  const pageConfig = CONTENT_CONFIG[item.page as keyof typeof CONTENT_CONFIG]
  const sectionConfig = (pageConfig?.sections as Record<string, SectionConfig> | undefined)?.[item.section]
  const fieldDefs: Record<string, FieldMeta> = sectionConfig?.fields ?? {}

  const [mediaFields, setMediaFields] = useState<Record<string, unknown>>({})

  const [fields, setFields] = useState<Record<string, string>>(() => {
    const json = item.content_json as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(fieldDefs).map(key => [key, String(json[key] ?? '')])
    )
  })

  const [status, setStatus] = useState<ContentStatus>(item.status)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [publishError, setPublishError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [violations, setViolations] = useState<ComplianceViolation[]>([])

  const imageHint = (item.content_json as Record<string, unknown>).image_suggestion as string | undefined

  function applyViolations(vs: ComplianceViolation[], currentFields: Record<string, string>) {
    setViolations(vs)
    const errs: Record<string, string> = {}
    for (const v of vs) {
      const key = Object.keys(currentFields).find(k =>
        v.text && currentFields[k].toLowerCase().includes(v.text.toLowerCase())
      ) ?? '_general'
      errs[key] = v.reason || `Compliance violation: "${v.text}"`
    }
    setFieldErrors(errs)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setFieldErrors({})
    setViolations([])
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_json: { ...item.content_json, ...fields, ...mediaFields } }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 422 && data.violations) {
          applyViolations(data.violations as ComplianceViolation[], fields)
        } else {
          setSaveError(data.error ?? 'Save failed')
        }
      }
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleFix() {
    setFixing(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/admin/content/${item.id}/fix-compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ violations }),
      })
      const data = await res.json()
      if (res.ok && data.content_json) {
        const json = data.content_json as Record<string, unknown>
        setFields(Object.fromEntries(
          Object.keys(fieldDefs).map(key => [key, String(json[key] ?? '')])
        ))
        setViolations([])
        setFieldErrors({})
        setStatus('draft')
      } else {
        setSaveError(data.error ?? 'Fix failed')
      }
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setFixing(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    setPublishError('')
    setFieldErrors({})
    try {
      const res = await fetch(`/api/admin/content/${item.id}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 422 && data.violations) {
          applyViolations(data.violations as ComplianceViolation[], fields)
          setPublishError('Compliance violations must be resolved before publishing.')
        } else {
          setPublishError(data.error ?? 'Publish failed')
        }
      } else {
        setStatus('published')
      }
    } catch {
      setPublishError('Network error. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const pageLabel = pageConfig?.label ?? item.page
  const sectionLabel = sectionConfig?.label ?? item.section
  const personaLabel = item.persona ? (PERSONA_LABELS[item.persona] ?? item.persona) : null
  const mergedContentJson = { ...item.content_json, ...mediaFields }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/content"
            className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
          >
            ← All content
          </Link>
          <h1 className="mt-2 font-display text-2xl text-ink">
            {pageLabel} / {sectionLabel}
            {personaLabel && (
              <span className="ml-2 font-sans text-base font-normal text-ink-light">
                · {personaLabel}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-1 font-mono text-xs font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-4 py-2 font-sans text-sm font-medium text-ink transition-colors hover:border-teal/50 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          {violations.length > 0 && (
            <button
              type="button"
              onClick={handleFix}
              disabled={fixing}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 font-sans text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              {fixing ? 'Fixing…' : '⚡ Fix with AI'}
            </button>
          )}
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
          >
            {publishing ? 'Publishing…' : '✓ Publish'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        {/* Left: content fields */}
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
            Content fields
          </p>

          <div className="space-y-5">
            {Object.entries(fieldDefs).map(([key, meta]) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor={`field-${key}`}
                    className="font-sans text-sm font-medium text-ink"
                  >
                    {meta.label}
                    {meta.required && <span className="ml-0.5 text-red-500">*</span>}
                  </label>
                  <span className="font-mono text-xs text-ink-light">{meta.hint}</span>
                </div>
                {meta.multiline ? (
                  <textarea
                    id={`field-${key}`}
                    rows={4}
                    value={fields[key] ?? ''}
                    onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                    className={`w-full rounded-lg border px-3 py-2 font-sans text-sm text-ink ${
                      fieldErrors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                  />
                ) : (
                  <input
                    id={`field-${key}`}
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
          </div>

          {saveError && <p className="mt-4 font-sans text-sm text-red-500">{saveError}</p>}
          {publishError && <p className="mt-4 font-sans text-sm text-red-500">{publishError}</p>}

          {violations.length > 0 && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-amber-800">
                ⚠ Compliance violations
              </p>
              <div className="space-y-3">
                {violations.map((v, i) => (
                  <div key={i} className="rounded border border-amber-200 bg-white p-3">
                    <p className="font-mono text-xs text-red-600">
                      &ldquo;{v.text}&rdquo;
                    </p>
                    <p className="mt-1 font-sans text-xs text-ink-mid">{v.reason}</p>
                    {v.suggestion && (
                      <p className="mt-1 font-sans text-xs text-teal-dark">
                        → {v.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: AI image suggestion + meta */}
        <div>
          {imageHint && (
            <div className="mb-6 rounded-lg border border-teal-light bg-teal-light/40 p-4">
              <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-teal-dark">
                ✦ AI image suggestion
              </p>
              <p className="font-sans text-sm text-ink-mid">{imageHint}</p>
            </div>
          )}

          {sectionConfig?.imageGuidelines && (
            <div className="mb-6">
              <ImagePanel
                contentJson={mergedContentJson}
                imageGuidelines={sectionConfig.imageGuidelines}
                onChange={(updates) => setMediaFields(prev => ({ ...prev, ...updates }))}
              />
            </div>
          )}

          {sectionConfig?.videoType && (
            <div className="mb-6">
              <VideoPanel
                contentJson={mergedContentJson}
                videoType={sectionConfig.videoType}
                lazyLoadDefault={sectionConfig.lazyLoadDefault ?? true}
                onChange={(updates) => setMediaFields(prev => ({ ...prev, ...updates }))}
              />
            </div>
          )}

          <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
            <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">Meta</p>
            <div className="flex justify-between font-sans text-xs text-ink-light">
              <span>Content type</span>
              <span className="text-ink">{item.content_type}</span>
            </div>
            <div className="flex justify-between font-sans text-xs text-ink-light">
              <span>Updated</span>
              <span className="text-ink">{new Date(item.updated_at).toLocaleDateString('en-GB')}</span>
            </div>
            <div className="flex justify-between font-sans text-xs text-ink-light">
              <span>Compliance</span>
              <span className={item.status === 'needs_review' ? 'text-amber-600' : 'text-green-700'}>
                {item.status === 'needs_review' ? '⚠ Needs review' : '✓ Passed'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
