# Admin Panel Phase 3b Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Science Hub management in the admin panel — full CRUD for studies with drag-to-reorder, inline publish/feature toggles, and a shared add/edit form.

**Architecture:** Server component fetches all studies and passes to `StudiesList` client component which handles drag reorder via `@hello-pangea/dnd`. A shared `StudyForm` client component is used for both add (`/admin/science/new`) and edit (`/admin/science/[id]`). Four API routes handle create, update, delete, and bulk reorder. All data ops use `createAdminClient()` (service role); auth checks use `createClient()`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase service role, `@hello-pangea/dnd`, Vitest + Testing Library.

---

## File map

| File | Action | Responsibility |
|------|--------|---------------|
| `@hello-pangea/dnd` | Install | Drag-and-drop for study reordering |
| `app/api/admin/studies/route.ts` | Create | POST: create study with sort_order = max + 1 |
| `app/api/admin/studies/[id]/route.ts` | Create | PATCH: partial update \| DELETE: permanent delete |
| `app/api/admin/studies/reorder/route.ts` | Create | PATCH: bulk update sort_order after drag |
| `components/admin/StudyForm.tsx` | Create | Shared add/edit form with client-side validation |
| `components/admin/StudiesList.tsx` | Create | Drag-and-drop list with inline quick-action buttons |
| `app/admin/(protected)/science/page.tsx` | Create | Server: fetch studies → render StudiesList |
| `app/admin/(protected)/science/new/page.tsx` | Create | Server: render blank StudyForm |
| `app/admin/(protected)/science/[id]/page.tsx` | Create | Server: fetch study → render pre-populated StudyForm |

---

## Important project context

- **`lib/supabase/admin.ts`** exports `createAdminClient()` — service role, bypasses RLS. All study data ops use this.
- **`lib/supabase/server.ts`** exports `createClient()` — reads session from cookies. Used for auth checks only.
- **`lib/types.ts`** exports `Study` interface — use it everywhere. Fields: `id`, `title`, `authors`, `journal`, `year`, `summary`, `key_finding`, `study_type`, `evidence_level`, `categories: string[]`, `doi_url`, `pubmed_url`, `is_featured`, `is_published?`, `sort_order?`.
- **`lib/cn.ts`** exports `cn()` utility for conditional classes.
- **Route groups**: `app/admin/(protected)/` maps to `/admin/...` URLs. Auth gate in `app/admin/(protected)/layout.tsx` covers all new routes automatically.
- **Evidence badge colours** must use inline `style` (not Tailwind classes) to match the public Science Hub: Strong `{background:'#dcfce7',color:'#166534'}`, Moderate `{background:'#fef9c3',color:'#854d0e'}`, Emerging `{background:'#dbeafe',color:'#1e40af'}`.
- **Test patterns**: `vi.mock('next/navigation', ...)`, `vi.mock('next/link', ...)`, `global.fetch = mockFetch`. See existing tests in `__tests__/components/admin/` for examples.

---

## Task 1: Install @hello-pangea/dnd

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install the package**

Run: `npm install @hello-pangea/dnd`
Expected: package added to `node_modules` and `package.json`

- [ ] **Step 2: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @hello-pangea/dnd for drag-and-drop reorder"
```

---

## Task 2: API routes

**Files:**
- Create: `app/api/admin/studies/route.ts`
- Create: `app/api/admin/studies/[id]/route.ts`
- Create: `app/api/admin/studies/reorder/route.ts`

- [ ] **Step 1: Create POST /api/admin/studies**

```typescript
// app/api/admin/studies/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const adminClient = createAdminClient()

  const { data: maxRow } = await adminClient
    .from('studies')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sort_order = (maxRow?.sort_order ?? 0) + 1

  const { data, error } = await adminClient
    .from('studies')
    .insert({ ...body, sort_order })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id })
}
```

- [ ] **Step 2: Create PATCH + DELETE /api/admin/studies/[id]**

```typescript
// app/api/admin/studies/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('studies').update(body).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('studies').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
```

- [ ] **Step 3: Create PATCH /api/admin/studies/reorder**

```typescript
// app/api/admin/studies/reorder/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { id: string; sort_order: number }[]
  const adminClient = createAdminClient()

  await Promise.all(
    body.map(({ id, sort_order }) =>
      adminClient.from('studies').update({ sort_order }).eq('id', id)
    )
  )

  return Response.json({ ok: true })
}
```

- [ ] **Step 4: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add "app/api/admin/studies/route.ts" "app/api/admin/studies/[id]/route.ts" "app/api/admin/studies/reorder/route.ts"
git commit -m "feat: add studies API routes (create, update, delete, reorder)"
```

---

## Task 3: StudyForm component

**Files:**
- Create: `components/admin/StudyForm.tsx`
- Create: `__tests__/components/admin/StudyForm.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/admin/StudyForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyForm } from '@/components/admin/StudyForm'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}))

const mockFetch = vi.fn()

describe('StudyForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders title, summary, study type, evidence level, and category fields', () => {
    render(<StudyForm />)
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/summary/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/study type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/evidence level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/energy/i)).toBeInTheDocument()
  })

  it('shows validation error when title is empty on submit', async () => {
    const user = userEvent.setup()
    render(<StudyForm />)
    await user.click(screen.getByRole('button', { name: /save study/i }))
    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
  })

  it('shows validation error when no category selected on submit', async () => {
    const user = userEvent.setup()
    render(<StudyForm />)
    await user.type(screen.getByLabelText(/title/i), 'Test study')
    await user.type(screen.getByLabelText(/summary/i), 'Test summary')
    await user.click(screen.getByRole('button', { name: /save study/i }))
    expect(screen.getByText(/at least one category/i)).toBeInTheDocument()
  })

  it('calls POST /api/admin/studies on submit for new study', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-id' }) })
    const user = userEvent.setup()
    render(<StudyForm />)
    await user.type(screen.getByLabelText(/title/i), 'Test study')
    await user.type(screen.getByLabelText(/summary/i), 'Test summary')
    await user.click(screen.getByLabelText(/energy/i))
    await user.click(screen.getByRole('button', { name: /save study/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('calls PATCH /api/admin/studies/abc on submit for edit', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<StudyForm
      studyId="abc"
      initialData={{
        title: 'Existing',
        summary: 'Existing summary',
        study_type: 'Human RCT',
        evidence_level: 'Strong',
        categories: ['energy'],
        is_featured: false,
        is_published: true,
      }}
    />)
    await user.click(screen.getByRole('button', { name: /save study/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies/abc',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('redirects to /admin/science on successful save', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-id' }) })
    const user = userEvent.setup()
    render(<StudyForm />)
    await user.type(screen.getByLabelText(/title/i), 'Test study')
    await user.type(screen.getByLabelText(/summary/i), 'Test summary')
    await user.click(screen.getByLabelText(/energy/i))
    await user.click(screen.getByRole('button', { name: /save study/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/science')
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/components/admin/StudyForm.test.tsx`
Expected: FAIL — "Cannot find module '@/components/admin/StudyForm'"

- [ ] **Step 3: Implement StudyForm**

```typescript
// components/admin/StudyForm.tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/components/admin/StudyForm.test.tsx`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add components/admin/StudyForm.tsx __tests__/components/admin/StudyForm.test.tsx
git commit -m "feat: add StudyForm component with validation"
```

---

## Task 4: StudiesList component

**Files:**
- Create: `components/admin/StudiesList.tsx`
- Create: `__tests__/components/admin/StudiesList.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/admin/StudiesList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudiesList } from '@/components/admin/StudiesList'
import type { Study } from '@/lib/types'

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({ children }: { children: (p: { innerRef: (el: HTMLElement | null) => void; droppableProps: Record<string, unknown>; placeholder: null }) => React.ReactNode }) =>
    <>{children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null })}</>,
  Draggable: ({ children }: { children: (p: { innerRef: (el: HTMLElement | null) => void; draggableProps: Record<string, unknown>; dragHandleProps: Record<string, unknown> }) => React.ReactNode }) =>
    <>{children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} })}</>,
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const mockFetch = vi.fn()

const studies: Study[] = [
  {
    id: 'study-1',
    title: 'First study',
    authors: 'Author A',
    journal: 'Journal A',
    year: 2023,
    summary: 'Summary A',
    key_finding: 'Finding A',
    study_type: 'Human RCT',
    evidence_level: 'Strong',
    categories: ['energy'],
    doi_url: null,
    pubmed_url: null,
    is_featured: false,
    is_published: true,
    sort_order: 1,
  },
  {
    id: 'study-2',
    title: 'Second study',
    authors: 'Author B',
    journal: 'Journal B',
    year: 2022,
    summary: 'Summary B',
    key_finding: 'Finding B',
    study_type: 'Animal',
    evidence_level: 'Emerging',
    categories: ['recovery'],
    doi_url: null,
    pubmed_url: null,
    is_featured: true,
    is_published: false,
    sort_order: 2,
  },
]

describe('StudiesList', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders all studies', () => {
    render(<StudiesList studies={studies} />)
    expect(screen.getByText('First study')).toBeInTheDocument()
    expect(screen.getByText('Second study')).toBeInTheDocument()
  })

  it('renders unpublished study with opacity class', () => {
    render(<StudiesList studies={studies} />)
    const row = screen.getByTestId('study-row-study-2')
    expect(row).toHaveClass('opacity-60')
  })

  it('featured toggle calls PATCH with is_featured: true for unfeatured study', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<StudiesList studies={studies} />)
    const featureBtn = screen.getAllByRole('button', { name: /feature/i })[0]
    await user.click(featureBtn)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies/study-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ is_featured: true }),
        })
      )
    })
  })

  it('published toggle calls PATCH with is_published: true for hidden study', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<StudiesList studies={studies} />)
    const hiddenBtn = screen.getByRole('button', { name: /hidden/i })
    await user.click(hiddenBtn)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies/study-2',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ is_published: true }),
        })
      )
    })
  })

  it('delete button calls DELETE after confirm', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('confirm', () => true)
    const user = userEvent.setup()
    render(<StudiesList studies={studies} />)
    const deleteBtn = screen.getAllByRole('button', { name: /delete/i })[0]
    await user.click(deleteBtn)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies/study-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/components/admin/StudiesList.test.tsx`
Expected: FAIL — "Cannot find module '@/components/admin/StudiesList'"

- [ ] **Step 3: Implement StudiesList**

```typescript
// components/admin/StudiesList.tsx
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
                      {/* Featured toggle */}
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

                      {/* Published toggle */}
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

                      {/* Edit */}
                      <Link
                        href={`/admin/science/${study.id}`}
                        className="rounded border border-gray-200 px-2 py-1 font-sans text-xs text-teal transition-colors hover:border-teal/50"
                      >
                        Edit
                      </Link>

                      {/* Delete */}
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/components/admin/StudiesList.test.tsx`
Expected: PASS — 5 tests

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass (76 + 6 + 5 = 87 total)

- [ ] **Step 6: Commit**

```bash
git add components/admin/StudiesList.tsx __tests__/components/admin/StudiesList.test.tsx
git commit -m "feat: add StudiesList component with drag reorder and quick actions"
```

---

## Task 5: Science pages

**Files:**
- Create: `app/admin/(protected)/science/page.tsx`
- Create: `app/admin/(protected)/science/new/page.tsx`
- Create: `app/admin/(protected)/science/[id]/page.tsx`

- [ ] **Step 1: Create the studies list page**

```typescript
// app/admin/(protected)/science/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { StudiesList } from '@/components/admin/StudiesList'

export const metadata: Metadata = { title: 'Studies | H2 Admin' }

export default async function StudiesPage() {
  const supabase = createAdminClient()
  const { data: studies } = await supabase
    .from('studies')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">
          Studies
          <span className="ml-2 font-mono text-sm text-ink-light">
            {studies?.length ?? 0}
          </span>
        </h1>
        <Link
          href="/admin/science/new"
          className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          + Add study
        </Link>
      </div>

      {!studies || studies.length === 0 ? (
        <p className="font-sans text-sm text-ink-light">No studies yet.</p>
      ) : (
        <StudiesList studies={studies} />
      )}
    </>
  )
}
```

- [ ] **Step 2: Create the new study page**

```typescript
// app/admin/(protected)/science/new/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { StudyForm } from '@/components/admin/StudyForm'

export const metadata: Metadata = { title: 'Add study | H2 Admin' }

export default function NewStudyPage() {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/science"
          className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
        >
          ← All studies
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Add study</h1>
      </div>
      <div className="max-w-2xl">
        <StudyForm />
      </div>
    </>
  )
}
```

- [ ] **Step 3: Create the edit study page**

```typescript
// app/admin/(protected)/science/[id]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { StudyForm } from '@/components/admin/StudyForm'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('studies').select('title').eq('id', id).single()
  return { title: `${data?.title ?? 'Study'} | H2 Admin` }
}

export default async function EditStudyPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: study } = await supabase.from('studies').select('*').eq('id', id).single()

  if (!study) notFound()

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/science"
          className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
        >
          ← All studies
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Edit study</h1>
      </div>
      <div className="max-w-2xl">
        <StudyForm initialData={study} studyId={study.id} />
      </div>
    </>
  )
}
```

- [ ] **Step 4: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: 87 tests passing

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(protected)/science/page.tsx" "app/admin/(protected)/science/new/page.tsx" "app/admin/(protected)/science/[id]/page.tsx"
git commit -m "feat: add science management pages (list, add, edit)"
```

---

## Final checks

- [ ] **TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Full test suite**

Run: `npx vitest run`
Expected: 87 tests passing

- [ ] **Deploy**

```bash
git push origin master
```

Then verify in Vercel:
1. `/admin/science` — shows studies list with drag handles, featured/live toggles, edit/delete buttons
2. Click "★ Featured" — toggles to "☆ Feature" instantly
3. Click "● Live" — toggles to "○ Hidden" and row dims
4. Click "Edit" → full form at `/admin/science/[id]`, pre-populated
5. Click "+ Add study" → blank form at `/admin/science/new`
6. Save → redirects to `/admin/science`
7. Delete → confirm dialog → study removed from list

> **Note:** Science link in the sidebar was already present — it activates automatically once `/admin/science` exists.
