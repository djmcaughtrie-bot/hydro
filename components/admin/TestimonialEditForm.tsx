'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Testimonial } from '@/lib/types'

const PLACEMENT_OPTIONS = [
  { value: 'homepage',         label: 'Homepage' },
  { value: 'product',          label: 'Product page' },
  { value: 'science-energy',   label: 'Science — Energy' },
  { value: 'science-recovery', label: 'Science — Recovery' },
  { value: 'science-longevity',label: 'Science — Longevity' },
  { value: 'science-safety',   label: 'Science — Safety' },
  { value: 'clinics',          label: 'Clinics' },
]

const PERSONA_OPTIONS = [
  { value: 'energy',      label: 'Energy' },
  { value: 'performance', label: 'Performance' },
  { value: 'longevity',   label: 'Longevity' },
  { value: 'clinic',      label: 'Clinic' },
]

interface Props {
  testimonial?: Testimonial
}

export function TestimonialEditForm({ testimonial }: Props) {
  const router = useRouter()
  const isNew = !testimonial

  const [customerName,       setCustomerName]       = useState(testimonial?.customer_name ?? '')
  const [customerContext,    setCustomerContext]    = useState(testimonial?.customer_context ?? '')
  const [persona,            setPersona]            = useState(testimonial?.persona ?? 'energy')
  const [quote,              setQuote]              = useState(testimonial?.quote ?? '')
  const [shortQuote,         setShortQuote]         = useState(testimonial?.short_quote ?? '')
  const [format,             setFormat]             = useState<'written' | 'video'>(testimonial?.format ?? 'written')
  const [videoUrl,           setVideoUrl]           = useState(testimonial?.video_url ?? '')
  const [placement,          setPlacement]          = useState<string[]>(testimonial?.placement ?? [])
  const [complianceApproved, setComplianceApproved] = useState(testimonial?.compliance_approved ?? false)
  const [consentOnFile,      setConsentOnFile]      = useState(testimonial?.consent_on_file ?? false)
  const [isPublished,        setIsPublished]        = useState(testimonial?.is_published ?? false)

  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState('')

  function togglePlacement(value: string) {
    setPlacement(prev =>
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    )
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const payload = {
      customer_name:       customerName,
      customer_context:    customerContext || null,
      persona,
      quote,
      short_quote:         shortQuote || null,
      format,
      video_url:           videoUrl || null,
      placement,
      compliance_approved: complianceApproved,
      consent_on_file:     consentOnFile,
      is_published:        isPublished,
    }
    try {
      const url = isNew ? '/api/admin/testimonials' : `/api/admin/testimonials/${testimonial.id}`
      const method = isNew ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Save failed')
      } else {
        if (isNew) router.push(`/admin/testimonials/${data.id}`)
        else router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!testimonial) return
    if (!window.confirm('Delete this testimonial? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/testimonials/${testimonial.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/admin/testimonials')
      else setError('Delete failed')
    } catch {
      setError('Network error.')
    } finally {
      setDeleting(false)
    }
  }

  const canPublish = complianceApproved && consentOnFile

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/testimonials" className="font-mono text-xs text-teal hover:text-teal-dark">
            ← All testimonials
          </Link>
          <h1 className="mt-2 font-display text-2xl text-ink">
            {isNew ? 'New testimonial' : testimonial.customer_name}
          </h1>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-red-200 px-4 py-2 font-sans text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {/* Compliance reminder */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="font-sans text-xs leading-relaxed text-amber-800">
          <strong>Before publishing:</strong> Testimonials must not claim to treat, cure, or diagnose any condition.
          Only experience and feeling language is permitted (&ldquo;I noticed&rdquo;, &ldquo;I feel&rdquo;, &ldquo;I find myself&rdquo;).
          Prohibited: treats, cures, proven, eliminates, heals, fixes, therapy, clinical, disease names as outcomes.
          Written consent to publish must be on file.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5 max-w-2xl">
          {/* Customer name */}
          <div>
            <label className="mb-1 block font-sans text-sm font-medium text-ink">
              Customer name <span className="text-red-500">*</span>
            </label>
            <p className="mb-1 font-sans text-xs text-ink-light">First name + surname initial: &ldquo;Sarah M.&rdquo;</p>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Sarah M."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
            />
          </div>

          {/* Customer context */}
          <div>
            <label className="mb-1 block font-sans text-sm font-medium text-ink">Customer context</label>
            <input
              type="text"
              value={customerContext}
              onChange={e => setCustomerContext(e.target.value)}
              placeholder="Marketing Manager, Manchester"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
            />
          </div>

          {/* Persona */}
          <div>
            <label className="mb-1 block font-sans text-sm font-medium text-ink">Persona <span className="text-red-500">*</span></label>
            <select
              value={persona}
              onChange={e => setPersona(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
            >
              {PERSONA_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Full quote */}
          <div>
            <label className="mb-1 block font-sans text-sm font-medium text-ink">
              Full quote <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={quote}
              onChange={e => setQuote(e.target.value)}
              placeholder="The customer's full testimonial text, compliance-reviewed."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
            />
          </div>

          {/* Short quote */}
          <div>
            <label className="mb-1 block font-sans text-sm font-medium text-ink">Short quote</label>
            <p className="mb-1 font-sans text-xs text-ink-light">1-sentence version for tight placements</p>
            <input
              type="text"
              value={shortQuote}
              onChange={e => setShortQuote(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
            />
          </div>

          {/* Format */}
          <div>
            <label className="mb-1 block font-sans text-sm font-medium text-ink">Format</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value as 'written' | 'video')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
            >
              <option value="written">Written</option>
              <option value="video">Video</option>
            </select>
          </div>

          {/* Video URL (conditional) */}
          {format === 'video' && (
            <div>
              <label className="mb-1 block font-sans text-sm font-medium text-ink">Video URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
              />
            </div>
          )}

          {/* Placement */}
          <div>
            <label className="mb-2 block font-sans text-sm font-medium text-ink">Placement</label>
            <div className="space-y-2">
              {PLACEMENT_OPTIONS.map(p => (
                <label key={p.value} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={placement.includes(p.value)}
                    onChange={() => togglePlacement(p.value)}
                    className="h-4 w-4 rounded border-ink-light/40 text-teal focus:ring-teal"
                  />
                  <span className="font-sans text-sm text-ink-mid">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar: compliance gates */}
        <div className="space-y-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
            Publishing gates
          </p>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={complianceApproved}
              onChange={e => setComplianceApproved(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-light/40 text-teal focus:ring-teal"
            />
            <div>
              <p className="font-sans text-sm font-medium text-ink">Compliance approved</p>
              <p className="font-sans text-xs text-ink-light">Quote reviewed against ASA rules</p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={consentOnFile}
              onChange={e => setConsentOnFile(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-light/40 text-teal focus:ring-teal"
            />
            <div>
              <p className="font-sans text-sm font-medium text-ink">Consent on file</p>
              <p className="font-sans text-xs text-ink-light">Written consent to publish obtained</p>
            </div>
          </label>

          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
            !canPublish ? 'border-gray-200 opacity-50' : 'border-teal/30'
          }`}>
            <input
              type="checkbox"
              checked={isPublished}
              disabled={!canPublish}
              onChange={e => setIsPublished(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-light/40 text-teal focus:ring-teal disabled:cursor-not-allowed"
            />
            <div>
              <p className="font-sans text-sm font-medium text-ink">Published</p>
              <p className="font-sans text-xs text-ink-light">
                {canPublish ? 'Visible on site' : 'Requires compliance + consent'}
              </p>
            </div>
          </label>

          {error && <p className="font-sans text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}
