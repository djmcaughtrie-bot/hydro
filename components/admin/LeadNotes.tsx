'use client'

import { useState } from 'react'

interface NoteEntry {
  text: string
  created_at: string
}

interface LeadNotesProps {
  leadId: string
  initialNotes: NoteEntry[]
}

function formatNoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LeadNotes({ leadId, initialNotes }: LeadNotesProps) {
  const [notes, setNotes] = useState<NoteEntry[]>(initialNotes)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAddNote() {
    if (!text.trim()) return
    setSaving(true)
    const noteText = text.trim()

    await fetch(`/api/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText }),
    })

    setNotes(prev => [{ text: noteText, created_at: new Date().toISOString() }, ...prev])
    setText('')
    setSaving(false)
  }

  return (
    <div>
      <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-widest text-ink-light">
        Notes
      </h3>

      {/* Add note */}
      <div className="mb-6">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder="Add a note..."
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAddNote}
            disabled={saving || !text.trim()}
            className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add note'}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="font-sans text-sm text-ink-light">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note, i) => (
            <li key={i} className="rounded-lg border border-gray-100 bg-white px-4 py-3">
              <p className="mb-1 font-mono text-xs text-ink-light">{formatNoteDate(note.created_at)}</p>
              <p className="font-sans text-sm text-ink-mid">{note.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
