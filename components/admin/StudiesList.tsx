'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import type { Study } from '@/lib/types'

interface StudiesListProps {
  studies: Study[]
}

const evidenceStyles: Record<Study['evidence_level'], React.CSSProperties> = {
  Strong:   { background: '#dcfce7', color: '#166534' },
  Moderate: { background: '#fef9c3', color: '#854d0e' },
  Emerging: { background: '#dbeafe', color: '#1e40af' },
}

export function StudiesList({ studies: initialStudies }: StudiesListProps) {
  const [studies, setStudies] = useState<Study[]>(initialStudies)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const reordered = Array.from(studies)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)
    setStudies(reordered)
    fetch('/api/admin/studies/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reordered.map((s, i) => ({ id: s.id, sort_order: i + 1 }))),
    })
  }

  async function toggleFeatured(study: Study) {
    const next = !study.is_featured
    setStudies(prev => prev.map(s => s.id === study.id ? { ...s, is_featured: next } : s))
    const res = await fetch(`/api/admin/studies/${study.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: next }),
    })
    if (!res.ok) {
      setStudies(prev => prev.map(s => s.id === study.id ? { ...s, is_featured: study.is_featured } : s))
      setErrors(prev => ({ ...prev, [study.id]: 'Failed to update' }))
    }
  }

  async function togglePublished(study: Study) {
    const next = !study.is_published
    setStudies(prev => prev.map(s => s.id === study.id ? { ...s, is_published: next } : s))
    const res = await fetch(`/api/admin/studies/${study.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: next }),
    })
    if (!res.ok) {
      setStudies(prev => prev.map(s => s.id === study.id ? { ...s, is_published: study.is_published } : s))
      setErrors(prev => ({ ...prev, [study.id]: 'Failed to update' }))
    }
  }

  async function handleDelete(study: Study) {
    if (!confirm(`Delete "${study.title}"? This cannot be undone.`)) return
    setStudies(prev => prev.filter(s => s.id !== study.id))
    const res = await fetch(`/api/admin/studies/${study.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setStudies(prev => {
        const idx = initialStudies.findIndex(s => s.id === study.id)
        const next = [...prev]
        next.splice(idx, 0, study)
        return next
      })
      setErrors(prev => ({ ...prev, [study.id]: 'Failed to delete' }))
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="studies">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            {studies.map((study, index) => (
              <Draggable key={study.id} draggableId={study.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    data-testid={`study-row-${study.id}`}
                    className={`flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 ${
                      !study.is_published ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Drag handle */}
                    <div
                      {...provided.dragHandleProps}
                      className="cursor-grab select-none text-gray-300"
                      title="Drag to reorder"
                    >
                      ⠿
                    </div>

                    {/* Title + meta */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-sm font-medium text-ink">{study.title}</p>
                      <p className="font-mono text-xs text-ink-light">
                        {[study.journal, study.year].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="hidden shrink-0 flex-wrap justify-end gap-1.5 md:flex" style={{ maxWidth: 160 }}>
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-xs"
                        style={evidenceStyles[study.evidence_level]}
                      >
                        {study.evidence_level}
                      </span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">
                        {study.study_type}
                      </span>
                    </div>

                    {/* Quick actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(study)}
                        className={`rounded px-2 py-1 font-sans text-xs transition-colors ${
                          study.is_featured
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-500 hover:bg-amber-50'
                        }`}
                      >
                        {study.is_featured ? '★ Featured' : '☆ Feature'}
                      </button>

                      <button
                        type="button"
                        onClick={() => togglePublished(study)}
                        className={`rounded px-2 py-1 font-sans text-xs transition-colors ${
                          study.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500 hover:bg-green-50'
                        }`}
                      >
                        {study.is_published ? '● Live' : '○ Hidden'}
                      </button>

                      <Link
                        href={`/admin/science/${study.id}`}
                        className="rounded border border-gray-200 px-2 py-1 font-sans text-xs text-teal transition-colors hover:border-teal/50"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(study)}
                        className="rounded border border-gray-200 px-2 py-1 font-sans text-xs text-red-500 transition-colors hover:border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>

                    {errors[study.id] && (
                      <p className="ml-2 font-sans text-xs text-red-500">{errors[study.id]}</p>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
