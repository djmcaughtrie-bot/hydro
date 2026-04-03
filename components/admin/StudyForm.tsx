'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Study } from '@/lib/types'

interface StudyFormProps {
  initialData?: Partial<Study>
  studyId?: string
}

const STUDY_TYPES = ['Human RCT', 'Human', 'Animal', 'Meta-analysis'] as const
const EVIDENCE_LEVELS = ['Strong', 'Moderate', 'Emerging'] as const
const CATEGORIES = ['energy', 'recovery', 'longevity', 'safety', 'inflammation', 'respiratory'] as const

export function StudyForm({ initialData, studyId }: StudyFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    authors: initialData?.authors ?? '',
    journal: initialData?.journal ?? '',
    year: initialData?.year ?? new Date().getFullYear(),
    study_type: (initialData?.study_type ?? 'Human RCT') as Study['study_type'],
    evidence_level: (initialData?.evidence_level ?? 'Strong') as Study['evidence_level'],
    summary: initialData?.summary ?? '',
    key_finding: initialData?.key_finding ?? '',
    categories: initialData?.categories ?? ([] as string[]),
    doi_url: initialData?.doi_url ?? '',
    pubmed_url: initialData?.pubmed_url ?? '',
    is_published: initialData?.is_published !== undefined ? initialData.is_published : true,
    is_featured: initialData?.is_featured ?? false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  function toggleCategory(cat: string) {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }))
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.summary.trim()) errs.summary = 'Summary is required'
    if (form.categories.length === 0) errs.categories = 'At least one category is required'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    setApiError(null)

    const url = studyId ? `/api/admin/studies/${studyId}` : '/api/admin/studies'
    const method = studyId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        year: form.year ? Number(form.year) : null,
        authors: form.authors || null,
        journal: form.journal || null,
        key_finding: form.key_finding || null,
        doi_url: form.doi_url || null,
        pubmed_url: form.pubmed_url || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setApiError(data.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    router.push('/admin/science')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
        />
        {errors.title && <p className="mt-1 font-sans text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* Authors */}
      <div>
        <label htmlFor="authors" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
          Authors
        </label>
        <input
          id="authors"
          type="text"
          value={form.authors}
          onChange={e => setForm(p => ({ ...p, authors: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      {/* Journal + Year */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label htmlFor="journal" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
            Journal
          </label>
          <input
            id="journal"
            type="text"
            value={form.journal}
            onChange={e => setForm(p => ({ ...p, journal: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>
        <div>
          <label htmlFor="year" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
            Year
          </label>
          <input
            id="year"
            type="number"
            min={1900}
            max={2100}
            value={form.year}
            onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>
      </div>

      {/* Study type + Evidence level */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="study_type" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
            Study type <span className="text-red-500">*</span>
          </label>
          <select
            id="study_type"
            value={form.study_type}
            onChange={e => setForm(p => ({ ...p, study_type: e.target.value as Study['study_type'] }))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
          >
            {STUDY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="evidence_level" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
            Evidence level <span className="text-red-500">*</span>
          </label>
          <select
            id="evidence_level"
            value={form.evidence_level}
            onChange={e => setForm(p => ({ ...p, evidence_level: e.target.value as Study['evidence_level'] }))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
          >
            {EVIDENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div>
        <label htmlFor="summary" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
          Summary <span className="text-red-500">*</span>{' '}
          <span className="normal-case tracking-normal text-ink-light/60">plain English, 2–3 sentences</span>
        </label>
        <textarea
          id="summary"
          rows={3}
          value={form.summary}
          onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
        />
        {errors.summary && <p className="mt-1 font-sans text-xs text-red-500">{errors.summary}</p>}
      </div>

      {/* Key finding */}
      <div>
        <label htmlFor="key_finding" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
          Key finding{' '}
          <span className="normal-case tracking-normal text-ink-light/60">single headline</span>
        </label>
        <input
          id="key_finding"
          type="text"
          value={form.key_finding}
          onChange={e => setForm(p => ({ ...p, key_finding: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      {/* Categories */}
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-light">
          Categories <span className="text-red-500">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <label
              key={cat}
              className={`flex cursor-pointer items-center gap-1.5 rounded-pill border px-3 py-1 font-sans text-sm transition-colors ${
                form.categories.includes(cat)
                  ? 'border-teal bg-teal-light text-teal-dark'
                  : 'border-gray-200 text-ink-mid hover:border-teal/50'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={form.categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                aria-label={cat.charAt(0).toUpperCase() + cat.slice(1)}
              />
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </label>
          ))}
        </div>
        {errors.categories && <p className="mt-1 font-sans text-xs text-red-500">{errors.categories}</p>}
      </div>

      {/* DOI + PubMed */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="doi_url" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
            DOI URL
          </label>
          <input
            id="doi_url"
            type="url"
            value={form.doi_url}
            onChange={e => setForm(p => ({ ...p, doi_url: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
            placeholder="https://doi.org/..."
          />
        </div>
        <div>
          <label htmlFor="pubmed_url" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
            PubMed URL
          </label>
          <input
            id="pubmed_url"
            type="url"
            value={form.pubmed_url}
            onChange={e => setForm(p => ({ ...p, pubmed_url: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
            placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
          />
        </div>
      </div>

      {/* Published + Featured */}
      <div className="flex gap-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-ink">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <span><strong>Published</strong> — visible on Science Hub</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-ink">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <span><strong>Featured</strong> — shown on homepage</span>
        </label>
      </div>

      {apiError && (
        <p className="font-sans text-sm text-red-500">{apiError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save study'}
        </button>
        <a
          href="/admin/science"
          className="inline-flex items-center rounded-lg border border-gray-200 px-5 py-2.5 font-sans text-sm text-ink-mid transition-colors hover:border-gray-300"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
