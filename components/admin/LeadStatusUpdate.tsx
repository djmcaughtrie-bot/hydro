'use client'

import { useState } from 'react'

interface LeadStatusUpdateProps {
  leadId: string
  initialStatus: string
}

const STATUSES = ['new', 'contacted', 'converted', 'closed'] as const

export function LeadStatusUpdate({ leadId, initialStatus }: LeadStatusUpdateProps) {
  const [status, setStatus] = useState(initialStatus)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<'saved' | 'error' | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setMessage(res.ok ? 'saved' : 'error')
    } catch {
      setMessage('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
      >
        {STATUSES.map(s => (
          <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save status'}
      </button>
      {message === 'saved' && (
        <span className="font-sans text-sm text-green-600">Saved</span>
      )}
      {message === 'error' && (
        <span className="font-sans text-sm text-red-600">Error saving</span>
      )}
    </div>
  )
}
