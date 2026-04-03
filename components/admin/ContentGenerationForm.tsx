'use client'

import { useState } from 'react'
import { CONTENT_CONFIG } from '@/lib/content-config'

interface Props {
  onGenerated: (id: string, status: string) => void
}

const PERSONAS = [
  { value: '',       label: 'General' },
  { value: 'sarah',  label: 'Sarah — Energy' },
  { value: 'marcus', label: 'Marcus — Performance' },
  { value: 'elena',  label: 'Elena — Longevity' },
]

type GenStatus = 'idle' | 'generating' | 'done' | 'error'

export function ContentGenerationForm({ onGenerated }: Props) {
  const [page, setPage] = useState('')
  const [section, setSection] = useState('')
  const [persona, setPersona] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [genStatus, setGenStatus] = useState<GenStatus>('idle')
  const [resultStatus, setResultStatus] = useState('')
  const [error, setError] = useState('')

  const pages = Object.entries(CONTENT_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))
  const sections = page
    ? Object.entries(CONTENT_CONFIG[page as keyof typeof CONTENT_CONFIG].sections).map(([key, cfg]) => ({ value: key, label: cfg.label }))
    : []

  function handlePageChange(newPage: string) {
    setPage(newPage)
    setSection('')
  }

  async function handleGenerate() {
    if (!page || !section) return
    setGenStatus('generating')
    setError('')
    setResultStatus('')
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          section,
          persona: persona || undefined,
          additional_context: additionalContext || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setGenStatus('done')
      setResultStatus(data.status)
      onGenerated(data.id, data.status)
    } catch (err) {
      setGenStatus('error')
      setError(err instanceof Error ? err.message : 'Generation failed')
    }
  }

  const busy = genStatus === 'generating'

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
        Generate new content
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="gen-page" className="mb-1 block font-sans text-xs font-medium text-ink-mid">
            Page
          </label>
          <select
            id="gen-page"
            value={page}
            onChange={e => handlePageChange(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
          >
            <option value="">Select page…</option>
            {pages.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="gen-section" className="mb-1 block font-sans text-xs font-medium text-ink-mid">
            Section
          </label>
          <select
            id="gen-section"
            value={section}
            onChange={e => setSection(e.target.value)}
            disabled={!page}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink disabled:opacity-50"
          >
            <option value="">Select section…</option>
            {sections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="gen-persona" className="mb-1 block font-sans text-xs font-medium text-ink-mid">
            Persona <span className="font-normal text-ink-light">(optional)</span>
          </label>
          <select
            id="gen-persona"
            value={persona}
            onChange={e => setPersona(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink"
          >
            {PERSONAS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="gen-context" className="mb-1 block font-sans text-xs font-medium text-ink-mid">
          Additional context <span className="font-normal text-ink-light">(optional)</span>
        </label>
        <input
          id="gen-context"
          type="text"
          value={additionalContext}
          onChange={e => setAdditionalContext(e.target.value)}
          placeholder="e.g. Focus on morning energy use case, mention the 20-minute session"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-light"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!page || !section || busy}
          className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {busy ? 'Generating…' : '✦ Generate'}
        </button>

        {genStatus === 'done' && resultStatus === 'needs_review' && (
          <p className="font-sans text-xs text-amber-600">⚠ Needs review — compliance check failed after 3 attempts</p>
        )}
        {genStatus === 'done' && resultStatus === 'draft' && (
          <p className="font-sans text-xs text-teal">✓ Saved as draft — opening editor…</p>
        )}
        {genStatus === 'error' && (
          <p className="font-sans text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}
