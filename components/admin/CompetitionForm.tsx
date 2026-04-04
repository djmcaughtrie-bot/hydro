'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function CompetitionForm() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prize, setPrize] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!prize.trim()) {
      setError('Prize is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          prize: prize.trim(),
          is_active: isActive,
          starts_at: startsAt || null,
          ends_at: endsAt || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Save failed')
      } else {
        router.push('/admin/competitions')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/competitions"
            className="font-mono text-xs text-teal hover:text-teal-dark"
          >
            ← All competitions
          </Link>
          <h1 className="mt-2 font-display text-2xl text-ink">New competition</h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </div>

      <div className="max-w-2xl space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1 block font-sans text-sm font-medium text-ink">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Win an H2 Revive device"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block font-sans text-sm font-medium text-ink">Description</label>
          <p className="mb-1 font-sans text-xs text-ink-light">
            Optional — shown on the competition page below the prize.
          </p>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell entrants what the competition is about…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>

        {/* Prize */}
        <div>
          <label className="mb-1 block font-sans text-sm font-medium text-ink">
            Prize <span className="text-red-500">*</span>
          </label>
          <p className="mb-1 font-sans text-xs text-ink-light">
            e.g. &ldquo;H2 Revive device worth £1,400&rdquo;
          </p>
          <input
            type="text"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder="H2 Revive device worth £1,400"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-sans text-sm font-medium text-ink">Start date</label>
            <input
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <div>
            <label className="mb-1 block font-sans text-sm font-medium text-ink">End date</label>
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
        </div>

        {/* Active toggle */}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-light/40 text-teal focus:ring-teal"
          />
          <div>
            <p className="font-sans text-sm font-medium text-ink">Active</p>
            <p className="font-sans text-xs text-ink-light">
              Only one competition should be active at a time. Active competitions are visible at
              /win.
            </p>
          </div>
        </label>

        {error && <p className="font-sans text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}
