# H2 Revive — Admin Panel Phase 3b Design Spec
**Date:** 2026-04-03
**Status:** Approved
**Scope:** Science Hub management — full CRUD for studies, drag-to-reorder, inline quick actions

---

## 1. Context

Phase 3b extends the admin panel with Science Hub management. The operator can add, edit, publish/unpublish, feature, delete, and reorder studies without touching Supabase directly.

The `studies` table already exists (created in Phase 1, seeded in the Science Hub phase). Phase 3a's auth gate, sidebar, and `createAdminClient()` are all in place and used here unchanged.

---

## 2. Architecture

### New files

```
app/admin/(protected)/science/
  page.tsx                    ← studies list with drag reorder + quick actions (server → client)
  new/
    page.tsx                  ← add study form (client)
  [id]/
    page.tsx                  ← edit study form, pre-populated (server fetch → client form)

components/admin/
  StudiesList.tsx             ← drag-and-drop list with inline toggles + delete (client)
  StudyForm.tsx               ← shared add/edit form with validation (client)

app/api/admin/studies/
  route.ts                    ← POST: create study
  [id]/
    route.ts                  ← PATCH: update fields | DELETE: permanent delete
  reorder/
    route.ts                  ← PATCH: bulk update sort_order after drag
```

### Existing files unchanged
- `lib/supabase/admin.ts` — used for all data ops
- `lib/supabase/server.ts` — used for auth checks
- `components/admin/AdminSidebar.tsx` — Science link (`/admin/science`) already present, will resolve once page exists
- `app/admin/(protected)/layout.tsx` — auth gate already covers new routes

### Route map

| Route | Component | Auth? |
|-------|-----------|-------|
| `/admin/science` | `StudiesPage` | Protected |
| `/admin/science/new` | `NewStudyPage` | Protected |
| `/admin/science/[id]` | `EditStudyPage` | Protected |

---

## 3. Studies list page (`app/admin/(protected)/science/page.tsx`)

Server component. Fetches all studies ordered by `sort_order` ascending, passes array to `StudiesList` client component.

```typescript
const { data: studies } = await adminClient
  .from('studies')
  .select('*')
  .order('sort_order', { ascending: true })
```

Layout:
- Page heading: "Studies" + count in `font-mono text-sm text-ink-light`
- "Add study" button → navigates to `/admin/science/new`
- `<StudiesList studies={studies} />` below

### StudiesList (`components/admin/StudiesList.tsx`)

`'use client'`. Uses `@hello-pangea/dnd` for drag reorder.

Each row contains:
- Drag handle (⠿) — cursor: grab
- Title (truncated) + journal · year below in `text-ink-light`
- Evidence level badge (styled same as public `StudyCard` — inline style, not Tailwind, for consistency)
- Study type badge
- **Featured toggle** — amber pill when on (`★ Featured`), gray when off (`☆ Feature`) — PATCH `{ is_featured: bool }`
- **Live/Hidden toggle** — green pill when published (`● Live`), gray when hidden (`○ Hidden`) — PATCH `{ is_published: bool }`; hidden rows rendered at `opacity-60`
- **Edit link** → `/admin/science/[id]`
- **Delete button** — red, triggers browser `confirm()` dialog before firing DELETE

**Drag reorder behaviour:**
- `DragDropContext` wraps the list; `Droppable` + `Draggable` per row
- `onDragEnd`: optimistically reorder local state, then PATCH `/api/admin/studies/reorder` with `[{ id, sort_order }]` for the full reordered array
- No loading state needed — optimistic update is instant; silent failure acceptable (list stays reordered locally)

**Toggle behaviour:**
- Optimistic update: flip the value in local state immediately
- PATCH in background; on error: revert the local state and show a brief inline error

---

## 4. Add/Edit form (`components/admin/StudyForm.tsx`)

`'use client'`. Shared by both add (`/admin/science/new`) and edit (`/admin/science/[id]`).

Props:
```typescript
interface StudyFormProps {
  initialData?: Partial<Study>   // undefined = new study
  studyId?: string               // undefined = new study
}
```

### Fields

| Field | Input type | Required | Notes |
|-------|-----------|----------|-------|
| `title` | text | ✓ | Full width |
| `authors` | text | — | Full width |
| `journal` | text | — | 2/3 width |
| `year` | number | — | 1/3 width, min 1900 |
| `study_type` | select | ✓ | Human RCT / Human / Animal / Meta-analysis |
| `evidence_level` | select | ✓ | Strong / Moderate / Emerging |
| `summary` | textarea | ✓ | 3 rows, hint: "plain English, 2–3 sentences" |
| `key_finding` | text | — | Single headline |
| `categories` | checkboxes | ✓ (≥1) | energy / recovery / longevity / safety / inflammation / respiratory — pill style |
| `doi_url` | url | — | |
| `pubmed_url` | url | — | |
| `is_published` | checkbox | — | Default: true |
| `is_featured` | checkbox | — | Default: false |

### Validation

Client-side only (no Zod — inline state). Required fields: `title`, `summary`, `study_type`, `evidence_level`, at least one `categories` item. Error message appears below each failing field on submit attempt.

### Submit behaviour

**New study (`studyId` undefined):**
- POST `/api/admin/studies` with full body
- On success: `router.push('/admin/science')`

**Edit (`studyId` defined):**
- PATCH `/api/admin/studies/[studyId]` with full body
- On success: `router.push('/admin/science')`

Both show a loading state on the button ("Saving...") and an inline error if the API returns an error.

### Page wrappers

`app/admin/(protected)/science/new/page.tsx` — server component, renders:
```typescript
<StudyForm />
```

`app/admin/(protected)/science/[id]/page.tsx` — server component, fetches study by id (`notFound()` if missing), renders:
```typescript
<StudyForm initialData={study} studyId={study.id} />
```

---

## 5. API routes

All routes: auth-check via `createClient()` (standard), data ops via `createAdminClient()` (service role). Unauthenticated → `{ error: 'Unauthorized' }` status 401.

### POST `/api/admin/studies` (`app/api/admin/studies/route.ts`)

Body: all study fields. Assigns `sort_order` = current max + 1 (new studies go to bottom of list).

```typescript
const { data: maxRow } = await adminClient
  .from('studies')
  .select('sort_order')
  .order('sort_order', { ascending: false })
  .limit(1)
  .single()
const sort_order = (maxRow?.sort_order ?? 0) + 1
```

Returns: `{ id: string }` — the new study's uuid.

### PATCH `/api/admin/studies/[id]` (`app/api/admin/studies/[id]/route.ts`)

Partial update — accepts any subset of study fields. Used for:
- Full form save (all fields)
- Quick-action featured toggle `{ is_featured: bool }`
- Quick-action published toggle `{ is_published: bool }`

Returns: `{ ok: true }`

### DELETE `/api/admin/studies/[id]`

Permanent delete. No soft-delete. Returns: `{ ok: true }`

### PATCH `/api/admin/studies/reorder` (`app/api/admin/studies/reorder/route.ts`)

Body: `[{ id: string, sort_order: number }]`

Bulk-updates sort_order for all provided entries using individual `.update().eq('id', id)` calls in a `Promise.all`. Returns: `{ ok: true }`

---

## 6. Testing

### Unit tests

**`StudyForm`** (`__tests__/components/admin/StudyForm.test.tsx`):
- Renders all required fields
- Shows validation error when title is empty on submit
- Shows validation error when no category selected on submit
- Calls POST `/api/admin/studies` on submit with correct body (new study)
- Calls PATCH `/api/admin/studies/[id]` on submit with correct body (edit)
- Redirects to `/admin/science` on successful save

**`StudiesList`** (`__tests__/components/admin/StudiesList.test.tsx`):
- Renders all studies passed as props
- Featured toggle button calls PATCH with `{ is_featured: true/false }`
- Published toggle button calls PATCH with `{ is_published: true/false }`
- Delete button shows confirm and calls DELETE on confirm
- Unpublished studies rendered with reduced opacity class

---

## 7. Design tokens

Consistent with Phase 3a. No new tokens needed.

Evidence badge colours (inline style, matching public `StudyCard`):
- Strong: `{ background: '#dcfce7', color: '#166534' }`
- Moderate: `{ background: '#fef9c3', color: '#854d0e' }`
- Emerging: `{ background: '#dbeafe', color: '#1e40af' }`

---

## 8. Out of scope

- CSV export of studies
- Bulk operations (bulk publish, bulk delete)
- Study image/attachment upload
- Duplicate study action
- AI-assisted summary generation (Phase 3c)
