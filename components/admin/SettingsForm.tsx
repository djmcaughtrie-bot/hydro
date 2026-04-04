'use client'

import { useState } from 'react'
import { SETTINGS_KEYS } from '@/lib/site-settings'

interface SettingsFormProps {
  initialValues: Record<string, boolean>
}

const TOGGLES: { key: string; label: string; description: string }[] = [
  {
    key: SETTINGS_KEYS.WIN_PAGE_ENABLED,
    label: 'Competition page',
    description: 'Show the /win competition page on the public site. Disable when no competition is running.',
  },
  {
    key: SETTINGS_KEYS.TESTIMONIALS_ENABLED,
    label: 'Testimonials',
    description: 'Show testimonial sections on product, homepage, and science pages.',
  },
  {
    key: SETTINGS_KEYS.LEAD_MAGNETS_ENABLED,
    label: 'Lead magnets',
    description: 'Show the /get-the-research lead magnet page.',
  },
]

export function SettingsForm({ initialValues }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, boolean>>(initialValues)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, boolean>>({})

  async function handleToggle(key: string) {
    const prevValue = values[key] ?? true
    const newValue = !prevValue
    setValues(prev => ({ ...prev, [key]: newValue }))
    setSaving(prev => ({ ...prev, [key]: true }))
    setError(prev => ({ ...prev, [key]: false }))

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: String(newValue) }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(prev => ({ ...prev, [key]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000)
    } catch {
      setValues(prev => ({ ...prev, [key]: prevValue }))
      setError(prev => ({ ...prev, [key]: true }))
      setTimeout(() => setError(prev => ({ ...prev, [key]: false })), 3000)
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="rounded-lg border border-ink-light/20 bg-white">
      <ul className="divide-y divide-ink-light/10">
        {TOGGLES.map(({ key, label, description }) => {
          const value = values[key] ?? true
          return (
            <li key={key} className="flex items-center justify-between px-6 py-5">
              <div className="pr-8">
                <p className="font-sans text-sm font-medium text-ink">{label}</p>
                <p className="mt-0.5 font-sans text-xs text-ink-light">{description}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {saved[key] && (
                  <span className="font-mono text-xs text-teal">Saved ✓</span>
                )}
                {error[key] && (
                  <span className="font-mono text-xs text-red-500">Failed to save</span>
                )}
                {saving[key] && (
                  <span className="font-mono text-xs text-ink-light">Saving…</span>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={value}
                  onClick={() => handleToggle(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-teal' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
