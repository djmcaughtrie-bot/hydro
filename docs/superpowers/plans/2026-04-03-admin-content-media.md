# Admin Content Media (3c-media) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add image and video management to the content edit page — media table, upload API, focal-point resize, library picker, ImagePanel, VideoPanel — wired into the existing `ContentEditForm`.

**Architecture:** A new `media` Supabase table stores uploaded image/video metadata (URL, intrinsic dimensions, focal point, file size). Two new API routes handle listing and uploading. Four new client components (`FocalPointSelector`, `ImageLibraryPicker`, `ImagePanel`, `VideoPanel`) are mounted in the right column of `ContentEditForm`, replacing the existing placeholder div. All image/video fields live in `content_json` alongside the text fields and are persisted via the existing PATCH route on save.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Storage), Vitest + @testing-library/react, Canvas API (browser, client-side resize)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/003_media_table.sql` | `media` table DDL + RLS |
| Create | `app/api/admin/media/route.ts` | GET (list) + POST (upload) media |
| Create | `lib/image-resize.ts` | Client-side Canvas resize with focal-point crop |
| Create | `components/admin/FocalPointSelector.tsx` | 3×3 focal point grid UI |
| Create | `components/admin/ImageLibraryPicker.tsx` | Modal grid to browse/select existing media |
| Create | `components/admin/ImagePanel.tsx` | Full image management panel (upload, resize, meta) |
| Create | `components/admin/VideoPanel.tsx` | Video management panel (ambient + content types) |
| Modify | `components/admin/ContentEditForm.tsx` | Wire ImagePanel + VideoPanel into right column |
| Create | `__tests__/api/admin/media.test.ts` | GET + POST route tests |
| Create | `__tests__/lib/image-resize.test.ts` | Resize utility tests |
| Create | `__tests__/components/admin/FocalPointSelector.test.tsx` | Focal point selector tests |
| Create | `__tests__/components/admin/ImageLibraryPicker.test.tsx` | Library picker tests |
| Create | `__tests__/components/admin/ImagePanel.test.tsx` | ImagePanel tests |
| Create | `__tests__/components/admin/VideoPanel.test.tsx` | VideoPanel tests |
| Create | `__tests__/components/admin/ContentEditForm.media.test.tsx` | ContentEditForm media wiring tests |

---

## Task 1: Media Table Migration

**Files:**
- Create: `supabase/migrations/003_media_table.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/003_media_table.sql

create table if not exists media (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  filename      text not null,
  url           text not null,
  width         integer not null default 0,
  height        integer not null default 0,
  file_size_kb  integer not null,
  focal_point   text not null default 'center'
                check (focal_point in (
                  'top-left','top','top-right',
                  'left','center','right',
                  'bottom-left','bottom','bottom-right'
                )),
  media_type    text not null
                check (media_type in ('image','video-ambient','video-content')),
  uploaded_at   timestamptz default now()
);

-- Row Level Security
alter table media enable row level security;

-- Only service role (admin panel) can read/write
create policy "service role full access" on media
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
```

- [ ] **Step 2: Apply migration**

Via Supabase dashboard SQL editor, or with the CLI:
```bash
supabase db push
```
Expected: migration applies without errors. Verify `media` table exists in the Supabase dashboard.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/003_media_table.sql
git commit -m "feat: add media table migration"
```

---

## Task 2: GET /api/admin/media

**Files:**
- Create: `app/api/admin/media/route.ts`
- Create: `__tests__/api/admin/media.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/api/admin/media.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockStorageUpload = vi.fn()
const mockStorageGetPublicUrl = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'media') {
        return {
          select: vi.fn(() => ({ order: mockSelect })),
          insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockInsert })) })),
        }
      }
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      })),
    },
  })),
}))

describe('GET /api/admin/media', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('@/app/api/admin/media/route')
    const res = await GET(new Request('http://localhost/api/admin/media'))
    expect(res.status).toBe(401)
  })

  it('returns media items ordered by uploaded_at desc', async () => {
    const items = [
      { id: 'm-1', filename: 'hero.jpg', url: 'https://cdn.test/hero.jpg',
        width: 1400, height: 900, file_size_kb: 320, focal_point: 'center',
        media_type: 'image', uploaded_at: '2026-04-03T10:00:00Z', created_at: '2026-04-03T10:00:00Z' }
    ]
    mockSelect.mockResolvedValue({ data: items, error: null })
    const { GET } = await import('@/app/api/admin/media/route')
    const res = await GET(new Request('http://localhost/api/admin/media'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(items)
  })

  it('returns 500 when database query fails', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const { GET } = await import('@/app/api/admin/media/route')
    const res = await GET(new Request('http://localhost/api/admin/media'))
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/api/admin/media.test.ts
```
Expected: FAIL — cannot find module `@/app/api/admin/media/route`

- [ ] **Step 3: Implement GET route**

```typescript
// app/api/admin/media/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('media')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/api/admin/media.test.ts
```
Expected: 3 tests pass (FAIL 401, list items, DB 500)

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/media/route.ts __tests__/api/admin/media.test.ts
git commit -m "feat: add GET /api/admin/media route"
```

---

## Task 3: POST /api/admin/media

**Files:**
- Modify: `app/api/admin/media/route.ts`
- Modify: `__tests__/api/admin/media.test.ts`

The POST handler accepts a `multipart/form-data` body with:
- `file` — the file blob
- `width` — string (integer; 0 for video)
- `height` — string (integer; 0 for video)
- `focal_point` — one of the 9 grid values (default `'center'`)
- `media_type` — `'image' | 'video-ambient' | 'video-content' | 'captions'`

For `media_type='captions'`: upload to storage, return `{ url }` only (no media table insert).
For all other types: upload to storage, insert into `media` table, return the `MediaItem`.

- [ ] **Step 1: Add POST tests (append to existing test file)**

```typescript
// Append to __tests__/api/admin/media.test.ts

describe('POST /api/admin/media', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockStorageUpload.mockResolvedValue({ data: { path: 'image/hero.jpg' }, error: null })
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/image/hero.jpg' } })
    mockInsert.mockResolvedValue({
      data: {
        id: 'm-2', filename: 'hero.jpg', url: 'https://cdn.test/image/hero.jpg',
        width: 1400, height: 900, file_size_kb: 320, focal_point: 'center',
        media_type: 'image', uploaded_at: '2026-04-03T10:00:00Z', created_at: '2026-04-03T10:00:00Z',
      },
      error: null,
    })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/admin/media/route')
    const formData = new FormData()
    formData.append('file', new Blob(['data'], { type: 'image/jpeg' }), 'hero.jpg')
    formData.append('width', '1400')
    formData.append('height', '900')
    formData.append('focal_point', 'center')
    formData.append('media_type', 'image')
    const res = await POST(new Request('http://localhost', { method: 'POST', body: formData }))
    expect(res.status).toBe(401)
  })

  it('uploads image, inserts into media table, returns MediaItem', async () => {
    const { POST } = await import('@/app/api/admin/media/route')
    const formData = new FormData()
    formData.append('file', new Blob(['data'], { type: 'image/jpeg' }), 'hero.jpg')
    formData.append('width', '1400')
    formData.append('height', '900')
    formData.append('focal_point', 'center')
    formData.append('media_type', 'image')
    const res = await POST(new Request('http://localhost', { method: 'POST', body: formData }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('m-2')
    expect(body.url).toBe('https://cdn.test/image/hero.jpg')
    expect(mockStorageUpload).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  it('returns url only for captions upload (no media table insert)', async () => {
    mockStorageUpload.mockResolvedValue({ data: { path: 'captions/subs.vtt' }, error: null })
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/captions/subs.vtt' } })
    const { POST } = await import('@/app/api/admin/media/route')
    const formData = new FormData()
    formData.append('file', new Blob(['WEBVTT\n\n'], { type: 'text/vtt' }), 'subs.vtt')
    formData.append('media_type', 'captions')
    const res = await POST(new Request('http://localhost', { method: 'POST', body: formData }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://cdn.test/captions/subs.vtt')
    expect(body.id).toBeUndefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns 400 when no file provided', async () => {
    const { POST } = await import('@/app/api/admin/media/route')
    const formData = new FormData()
    formData.append('media_type', 'image')
    const res = await POST(new Request('http://localhost', { method: 'POST', body: formData }))
    expect(res.status).toBe(400)
  })

  it('returns 500 when storage upload fails', async () => {
    mockStorageUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } })
    const { POST } = await import('@/app/api/admin/media/route')
    const formData = new FormData()
    formData.append('file', new Blob(['data'], { type: 'image/jpeg' }), 'hero.jpg')
    formData.append('width', '1400')
    formData.append('height', '900')
    formData.append('focal_point', 'center')
    formData.append('media_type', 'image')
    const res = await POST(new Request('http://localhost', { method: 'POST', body: formData }))
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 2: Run tests to verify POST tests fail**

```bash
npx vitest run __tests__/api/admin/media.test.ts
```
Expected: GET tests still pass; POST tests FAIL (no POST export)

- [ ] **Step 3: Implement POST handler (append to route file)**

```typescript
// Append to app/api/admin/media/route.ts

const VALID_MEDIA_TYPES = ['image', 'video-ambient', 'video-content', 'captions'] as const
const VALID_FOCAL_POINTS = [
  'top-left','top','top-right','left','center','right','bottom-left','bottom','bottom-right',
] as const

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const rawMediaType = formData.get('media_type') as string | null
  const mediaType = VALID_MEDIA_TYPES.includes(rawMediaType as typeof VALID_MEDIA_TYPES[number])
    ? (rawMediaType as typeof VALID_MEDIA_TYPES[number])
    : 'image'

  const rawFocalPoint = formData.get('focal_point') as string | null
  const focalPoint = VALID_FOCAL_POINTS.includes(rawFocalPoint as typeof VALID_FOCAL_POINTS[number])
    ? rawFocalPoint!
    : 'center'

  const width = parseInt((formData.get('width') as string) ?? '0', 10) || 0
  const height = parseInt((formData.get('height') as string) ?? '0', 10) || 0
  const fileSizeKb = Math.round(file.size / 1024)
  const filename = file.name
  const storagePath = `${mediaType}/${Date.now()}-${filename}`

  const adminClient = createAdminClient()
  const { error: uploadError } = await adminClient.storage
    .from('media')
    .upload(storagePath, file, { contentType: file.type })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = adminClient.storage.from('media').getPublicUrl(storagePath)

  // Captions: return URL only, no media table entry
  if (mediaType === 'captions') {
    return Response.json({ url: publicUrl })
  }

  const { data, error: insertError } = await adminClient
    .from('media')
    .insert({
      filename,
      url: publicUrl,
      width,
      height,
      file_size_kb: fileSizeKb,
      focal_point: focalPoint,
      media_type: mediaType,
    })
    .select()
    .single()

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })
  return Response.json(data)
}
```

- [ ] **Step 4: Run all media tests**

```bash
npx vitest run __tests__/api/admin/media.test.ts
```
Expected: all 8 tests pass (3 GET + 5 POST)

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/media/route.ts __tests__/api/admin/media.test.ts
git commit -m "feat: add POST /api/admin/media upload route"
```

---

## Task 4: FocalPointSelector Component

**Files:**
- Create: `components/admin/FocalPointSelector.tsx`
- Create: `__tests__/components/admin/FocalPointSelector.test.tsx`

A 3×3 grid of buttons. Each button shows a dot (filled when selected). Clicking calls `onChange(point)`.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/admin/FocalPointSelector.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FocalPointSelector } from '@/components/admin/FocalPointSelector'

const POINTS = [
  'top-left','top','top-right',
  'left','center','right',
  'bottom-left','bottom','bottom-right',
]

describe('FocalPointSelector', () => {
  it('renders 9 buttons', () => {
    render(<FocalPointSelector value="center" onChange={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(9)
  })

  it('marks the selected focal point as active', () => {
    render(<FocalPointSelector value="top-left" onChange={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /top-left/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onChange with the clicked focal point', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<FocalPointSelector value="center" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /top-right/i }))
    expect(onChange).toHaveBeenCalledWith('top-right')
  })

  it('all 9 focal point values are reachable', () => {
    render(<FocalPointSelector value="center" onChange={vi.fn()} />)
    for (const point of POINTS) {
      expect(screen.getByRole('button', { name: new RegExp(point, 'i') })).toBeInTheDocument()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/FocalPointSelector.test.tsx
```
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement FocalPointSelector**

```tsx
// components/admin/FocalPointSelector.tsx
'use client'

type FocalPoint =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'center' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right'

interface Props {
  value: FocalPoint
  onChange: (point: FocalPoint) => void
}

const GRID: FocalPoint[][] = [
  ['top-left',    'top',    'top-right'],
  ['left',        'center', 'right'],
  ['bottom-left', 'bottom', 'bottom-right'],
]

export function FocalPointSelector({ value, onChange }: Props) {
  return (
    <div className="inline-grid grid-cols-3 gap-1" role="group" aria-label="Focal point">
      {GRID.map((row) =>
        row.map((point) => (
          <button
            key={point}
            type="button"
            aria-label={point}
            aria-pressed={value === point}
            onClick={() => onChange(point)}
            className={`h-7 w-7 rounded border transition-colors ${
              value === point
                ? 'border-teal bg-teal'
                : 'border-gray-200 bg-white hover:border-teal/50'
            }`}
          >
            <span
              className={`block h-2 w-2 rounded-full mx-auto ${
                value === point ? 'bg-white' : 'bg-gray-300'
              }`}
            />
          </button>
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/admin/FocalPointSelector.test.tsx
```
Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/admin/FocalPointSelector.tsx __tests__/components/admin/FocalPointSelector.test.tsx
git commit -m "feat: add FocalPointSelector component"
```

---

## Task 5: Image Resize Utility

**Files:**
- Create: `lib/image-resize.ts`
- Create: `__tests__/lib/image-resize.test.ts`

Client-side Canvas resize. Scales-to-fill target dimensions, crops from focal point offset.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/image-resize.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock URL APIs
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock'),
  revokeObjectURL: vi.fn(),
})

// Mock Image constructor
const mockImage = {
  naturalWidth: 1400,
  naturalHeight: 900,
  onload: null as (() => void) | null,
  set src(_: string) { this.onload?.() },
}
vi.stubGlobal('Image', vi.fn(() => mockImage))

// Mock Canvas
const mockCtx = { drawImage: vi.fn() }
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
  toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
    cb(new Blob(['resized'], { type: 'image/jpeg' }))
  }),
}
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
  return document.createElement(tag)
})

describe('resizeImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset canvas size so each test starts clean
    mockCanvas.width = 0
    mockCanvas.height = 0
  })

  it('returns a File with the target dimensions in its name context', async () => {
    const { resizeImage } = await import('@/lib/image-resize')
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    const result = await resizeImage(file, 800, 600, 'center')
    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('hero.jpg')
    expect(result.type).toBe('image/jpeg')
  })

  it('sets canvas width and height to target dimensions', async () => {
    const { resizeImage } = await import('@/lib/image-resize')
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    await resizeImage(file, 800, 600, 'center')
    expect(mockCanvas.width).toBe(800)
    expect(mockCanvas.height).toBe(600)
  })

  it('calls ctx.drawImage with cropped region for focal point', async () => {
    const { resizeImage } = await import('@/lib/image-resize')
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    await resizeImage(file, 800, 600, 'center')
    expect(mockCtx.drawImage).toHaveBeenCalledOnce()
    const args = mockCtx.drawImage.mock.calls[0]
    // drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH)
    expect(args[7]).toBe(800) // destWidth
    expect(args[8]).toBe(600) // destHeight
  })

  it('throws when canvas context is unavailable', async () => {
    mockCanvas.getContext.mockReturnValueOnce(null)
    const { resizeImage } = await import('@/lib/image-resize')
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    await expect(resizeImage(file, 800, 600, 'center')).rejects.toThrow('Canvas context unavailable')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/image-resize.test.ts
```
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement resize utility**

Focal point maps to a (xFraction, yFraction) offset (0–1) for where to anchor the crop.

```typescript
// lib/image-resize.ts

type FocalPoint =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'center' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right'

const FOCAL_OFFSETS: Record<FocalPoint, [number, number]> = {
  'top-left':     [0,   0],
  'top':          [0.5, 0],
  'top-right':    [1,   0],
  'left':         [0,   0.5],
  'center':       [0.5, 0.5],
  'right':        [1,   0.5],
  'bottom-left':  [0,   1],
  'bottom':       [0.5, 1],
  'bottom-right': [1,   1],
}

export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  focalPoint: FocalPoint,
): Promise<File> {
  const objectUrl = URL.createObjectURL(file)

  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = objectUrl
  })

  const srcW = img.naturalWidth
  const srcH = img.naturalHeight

  // Scale to cover target dimensions (scale-to-fill, may crop)
  const scaleX = targetWidth / srcW
  const scaleY = targetHeight / srcH
  const scale = Math.max(scaleX, scaleY)

  const scaledW = srcW * scale
  const scaledH = srcH * scale

  // Crop region in source coordinates (pre-scale)
  const cropW = targetWidth / scale
  const cropH = targetHeight / scale

  const [xFrac, yFrac] = FOCAL_OFFSETS[focalPoint] ?? FOCAL_OFFSETS.center
  const sx = (srcW - cropW) * xFrac
  const sy = (srcH - cropH) * yFrac

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, targetWidth, targetHeight)

  URL.revokeObjectURL(objectUrl)

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('Canvas toBlob failed')); return }
        resolve(new File([blob], file.name, { type: file.type }))
      },
      file.type,
      0.88,
    )
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/image-resize.test.ts
```
Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/image-resize.ts __tests__/lib/image-resize.test.ts
git commit -m "feat: add client-side image resize utility with focal point crop"
```

---

## Task 6: ImageLibraryPicker Component

**Files:**
- Create: `components/admin/ImageLibraryPicker.tsx`
- Create: `__tests__/components/admin/ImageLibraryPicker.test.tsx`

A modal overlay that fetches `GET /api/admin/media`, shows a grid of images, and calls `onSelect(item)`. Filters to images only. Shows a size-compliance indicator when `guidelines` are provided (compares `file_size_kb` to `maxFileSizeKb`).

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/admin/ImageLibraryPicker.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageLibraryPicker } from '@/components/admin/ImageLibraryPicker'
import type { MediaItem } from '@/lib/types'

const mockFetch = vi.fn()

const imageItem: MediaItem = {
  id: 'm-1', created_at: '2026-04-03T10:00:00Z', filename: 'hero.jpg',
  url: 'https://cdn.test/hero.jpg', width: 1400, height: 900,
  file_size_kb: 320, focal_point: 'center', media_type: 'image',
  uploaded_at: '2026-04-03T10:00:00Z',
}

const videoItem: MediaItem = {
  id: 'm-2', created_at: '2026-04-03T10:00:00Z', filename: 'ambient.mp4',
  url: 'https://cdn.test/ambient.mp4', width: 0, height: 0,
  file_size_kb: 4000, focal_point: 'center', media_type: 'video-ambient',
  uploaded_at: '2026-04-03T10:00:00Z',
}

describe('ImageLibraryPicker', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('shows loading state then renders image items from API', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [imageItem, videoItem] })
    render(
      <ImageLibraryPicker
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('hero.jpg')).toBeInTheDocument()
    })
    // Video items should not appear in image picker
    expect(screen.queryByText('ambient.mp4')).not.toBeInTheDocument()
  })

  it('calls onSelect when an image is clicked', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [imageItem] })
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ImageLibraryPicker onSelect={onSelect} onClose={vi.fn()} />)
    await waitFor(() => screen.getByText('hero.jpg'))
    await user.click(screen.getByRole('button', { name: /hero\.jpg/i }))
    expect(onSelect).toHaveBeenCalledWith(imageItem)
  })

  it('calls onClose when close button is clicked', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ImageLibraryPicker onSelect={vi.fn()} onClose={onClose} />)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows oversized warning when file exceeds guidelines', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [imageItem] })
    render(
      <ImageLibraryPicker
        onSelect={vi.fn()}
        onClose={vi.fn()}
        guidelines={{ desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 200 }}
      />
    )
    await waitFor(() => screen.getByText('hero.jpg'))
    expect(screen.getByText(/oversized/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/ImageLibraryPicker.test.tsx
```
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement ImageLibraryPicker**

```tsx
// components/admin/ImageLibraryPicker.tsx
'use client'

import { useEffect, useState } from 'react'
import type { MediaItem } from '@/lib/types'
import type { ImageGuidelines } from '@/lib/content-config'

interface Props {
  onSelect: (item: MediaItem) => void
  onClose: () => void
  guidelines?: ImageGuidelines
}

export function ImageLibraryPicker({ onSelect, onClose, guidelines }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/media')
      .then(r => r.json())
      .then((data: MediaItem[]) => {
        setItems(data.filter(i => i.media_type === 'image'))
      })
      .catch(() => setError('Failed to load media library'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40">
      <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
            Image library
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-ink-light hover:text-ink"
          >
            ✕
          </button>
        </div>

        {loading && <p className="font-sans text-sm text-ink-light">Loading…</p>}
        {error && <p className="font-sans text-sm text-red-500">{error}</p>}

        {!loading && items.length === 0 && (
          <p className="font-sans text-sm text-ink-light">No images uploaded yet.</p>
        )}

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((item) => {
            const oversized = guidelines && item.file_size_kb > guidelines.maxFileSizeKb
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.filename}
                onClick={() => onSelect(item)}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-left transition-colors hover:border-teal/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <div className="p-2">
                  <p className="truncate font-mono text-xs text-ink">{item.filename}</p>
                  <p className="font-mono text-xs text-ink-light">
                    {item.width}×{item.height} · {item.file_size_kb}KB
                  </p>
                  {oversized && (
                    <p className="font-mono text-xs text-amber-600">⚠ Oversized</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/admin/ImageLibraryPicker.test.tsx
```
Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/admin/ImageLibraryPicker.tsx __tests__/components/admin/ImageLibraryPicker.test.tsx
git commit -m "feat: add ImageLibraryPicker component"
```

---

## Task 7: ImagePanel Component

**Files:**
- Create: `components/admin/ImagePanel.tsx`
- Create: `__tests__/components/admin/ImagePanel.test.tsx`

Manages desktop + mobile image slots. Each slot has: upload button, browse library button, alt/title/caption fields. Shows size warning and resize flow when an image exceeds the section guideline. Calls `onChange` with partial `content_json` updates.

**Desktop fields in content_json:** `image_url`, `image_width`, `image_height`, `image_alt`, `image_title`, `image_caption`

**Mobile fields in content_json:** `mobile_image_url`, `mobile_image_width`, `mobile_image_height`, `mobile_image_alt`, `mobile_image_title`, `mobile_image_caption`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/admin/ImagePanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImagePanel } from '@/components/admin/ImagePanel'
import type { ImageGuidelines } from '@/lib/content-config'

const mockFetch = vi.fn()
vi.mock('@/lib/image-resize', () => ({
  resizeImage: vi.fn(async (file: File) => file),
}))

const guidelines: ImageGuidelines = {
  desktopDimensions: [1400, 900],
  mobileDimensions: [800, 1000],
  maxFileSizeKb: 400,
}

describe('ImagePanel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })
  })

  it('renders desktop and mobile image slots', () => {
    render(
      <ImagePanel contentJson={{}} imageGuidelines={guidelines} onChange={vi.fn()} />
    )
    expect(screen.getByText(/desktop image/i)).toBeInTheDocument()
    expect(screen.getByText(/mobile image/i)).toBeInTheDocument()
  })

  it('shows existing image url when contentJson has image_url', () => {
    render(
      <ImagePanel
        contentJson={{ image_url: 'https://cdn.test/hero.jpg' }}
        imageGuidelines={guidelines}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByRole('img', { name: /desktop/i })).toBeInTheDocument()
  })

  it('shows alt text field when image_url is present', () => {
    render(
      <ImagePanel
        contentJson={{ image_url: 'https://cdn.test/hero.jpg', image_alt: 'Hero image' }}
        imageGuidelines={guidelines}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('Hero image')).toBeInTheDocument()
  })

  it('calls onChange with image fields when alt text changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ImagePanel
        contentJson={{ image_url: 'https://cdn.test/hero.jpg', image_alt: '' }}
        imageGuidelines={guidelines}
        onChange={onChange}
      />
    )
    const altInput = screen.getByLabelText(/alt text/i)
    await user.clear(altInput)
    await user.type(altInput, 'Woman at rest')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ image_alt: 'Woman at rest' }))
  })

  it('shows size warning when file exceeds maxFileSizeKb', async () => {
    const user = userEvent.setup()
    render(<ImagePanel contentJson={{}} imageGuidelines={guidelines} onChange={vi.fn()} />)
    const input = screen.getByTestId('desktop-file-input')
    // 401KB file (just over the 400KB limit)
    const largeFile = new File(['x'.repeat(401 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    await user.upload(input, largeFile)
    await waitFor(() => {
      expect(screen.getByText(/exceeds/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/ImagePanel.test.tsx
```
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement ImagePanel**

```tsx
// components/admin/ImagePanel.tsx
'use client'

import { useRef, useState } from 'react'
import type { ImageGuidelines } from '@/lib/content-config'
import type { MediaItem } from '@/lib/types'
import { FocalPointSelector } from './FocalPointSelector'
import { ImageLibraryPicker } from './ImageLibraryPicker'
import { resizeImage } from '@/lib/image-resize'

type FocalPoint =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'center' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right'

interface Props {
  contentJson: Record<string, unknown>
  imageGuidelines?: ImageGuidelines
  onChange: (updates: Record<string, unknown>) => void
}

type Slot = 'desktop' | 'mobile'

interface ResizeState {
  file: File
  slot: Slot
  objectUrl: string
  focalPoint: FocalPoint
}

export function ImagePanel({ contentJson, imageGuidelines, onChange }: Props) {
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const [showLibrary, setShowLibrary] = useState(false)
  const [activeSlot, setActiveSlot] = useState<Slot>('desktop')
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const desktopUrl = contentJson.image_url as string | undefined
  const mobileUrl = contentJson.mobile_image_url as string | undefined

  async function handleUpload(file: File, slot: Slot, focalPoint: FocalPoint = 'center') {
    setUploading(true)
    setUploadError('')
    setResizeState(null)

    const [targetW, targetH] = slot === 'desktop'
      ? (imageGuidelines?.desktopDimensions ?? [0, 0])
      : (imageGuidelines?.mobileDimensions ?? [0, 0])

    // Read dimensions from image
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.src = objectUrl
    })
    URL.revokeObjectURL(objectUrl)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('width', String(width))
    formData.append('height', String(height))
    formData.append('focal_point', focalPoint)
    formData.append('media_type', 'image')

    try {
      const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Upload failed'); return }

      if (slot === 'desktop') {
        onChange({ image_url: data.url, image_width: data.width, image_height: data.height })
      } else {
        onChange({ mobile_image_url: data.url, mobile_image_width: data.width, mobile_image_height: data.height })
      }
    } catch {
      setUploadError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileSelect(slot: Slot) {
    return async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const sizeKb = file.size / 1024
      const maxKb = imageGuidelines?.maxFileSizeKb ?? Infinity

      if (sizeKb > maxKb) {
        const objectUrl = URL.createObjectURL(file)
        setResizeState({ file, slot, objectUrl, focalPoint: 'center' })
        return
      }

      await handleUpload(file, slot)
    }
  }

  async function handleResizeAndUpload() {
    if (!resizeState || !imageGuidelines) return
    const { file, slot, focalPoint } = resizeState
    const [targetW, targetH] = slot === 'desktop'
      ? imageGuidelines.desktopDimensions
      : imageGuidelines.mobileDimensions
    const resized = await resizeImage(file, targetW, targetH, focalPoint)
    await handleUpload(resized, slot, focalPoint)
  }

  function handleLibrarySelect(item: MediaItem) {
    setShowLibrary(false)
    if (activeSlot === 'desktop') {
      onChange({
        image_url: item.url, image_width: item.width, image_height: item.height,
        focal_point: item.focal_point,
      })
    } else {
      onChange({
        mobile_image_url: item.url, mobile_image_width: item.width, mobile_image_height: item.height,
      })
    }
  }

  function MetaFields({ slot }: { slot: Slot }) {
    const prefix = slot === 'desktop' ? 'image' : 'mobile_image'
    const url = slot === 'desktop' ? desktopUrl : mobileUrl
    if (!url) return null
    return (
      <div className="mt-3 space-y-2">
        <div>
          <label htmlFor={`${prefix}_alt`} className="font-sans text-xs font-medium text-ink">
            Alt text <span className="text-red-500">*</span>
            <span className="ml-1 font-mono text-xs text-ink-light">accessibility · SEO signal</span>
          </label>
          <input
            id={`${prefix}_alt`}
            type="text"
            value={(contentJson[`${prefix}_alt`] as string) ?? ''}
            onChange={(e) => onChange({ [`${prefix}_alt`]: e.target.value })}
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
          />
        </div>
        <div>
          <label htmlFor={`${prefix}_title`} className="font-sans text-xs font-medium text-ink">
            Title
            <span className="ml-1 font-mono text-xs text-ink-light">tooltip · image search</span>
          </label>
          <input
            id={`${prefix}_title`}
            type="text"
            value={(contentJson[`${prefix}_title`] as string) ?? ''}
            onChange={(e) => onChange({ [`${prefix}_title`]: e.target.value })}
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
          />
        </div>
        <div>
          <label htmlFor={`${prefix}_caption`} className="font-sans text-xs font-medium text-ink">
            Caption
            <span className="ml-1 font-mono text-xs text-ink-light">figure element · GEO context</span>
          </label>
          <input
            id={`${prefix}_caption`}
            type="text"
            value={(contentJson[`${prefix}_caption`] as string) ?? ''}
            onChange={(e) => onChange({ [`${prefix}_caption`]: e.target.value })}
            className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Resize modal */}
      {resizeState && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 font-sans text-sm font-medium text-amber-800">
            ⚠ Image exceeds {imageGuidelines?.maxFileSizeKb}KB limit ({Math.round(resizeState.file.size / 1024)}KB)
          </p>
          <p className="mb-3 font-sans text-xs text-amber-700">
            Choose a focal point, then resize to recommended dimensions.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resizeState.objectUrl} alt="Preview" className="mb-3 max-h-32 rounded object-contain" />
          <FocalPointSelector
            value={resizeState.focalPoint}
            onChange={(fp) => setResizeState(s => s ? { ...s, focalPoint: fp } : s)}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleResizeAndUpload}
              disabled={uploading}
              className="rounded-lg bg-teal px-3 py-1.5 font-sans text-xs font-medium text-white hover:bg-teal-dark disabled:opacity-50"
            >
              {uploading ? 'Resizing…' : 'Resize & Upload'}
            </button>
            <button
              type="button"
              onClick={() => handleUpload(resizeState.file, resizeState.slot)}
              disabled={uploading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
            >
              Upload anyway
            </button>
            <button
              type="button"
              onClick={() => { URL.revokeObjectURL(resizeState.objectUrl); setResizeState(null) }}
              className="rounded-lg px-3 py-1.5 font-sans text-xs text-ink-light hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}

      {/* Desktop slot */}
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
          Desktop image
          {imageGuidelines && (
            <span className="ml-1 font-normal normal-case">
              ({imageGuidelines.desktopDimensions[0]}×{imageGuidelines.desktopDimensions[1]}, max {imageGuidelines.maxFileSizeKb}KB)
            </span>
          )}
        </p>
        {desktopUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={desktopUrl} alt="Desktop preview" aria-label="desktop" className="mb-2 w-full rounded-lg object-cover" style={{ maxHeight: 120 }} />
        ) : (
          <div className="mb-2 flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
            <p className="font-sans text-xs text-ink-light">No image</p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => desktopInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => { setActiveSlot('desktop'); setShowLibrary(true) }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50"
          >
            Browse library
          </button>
        </div>
        <input
          ref={desktopInputRef}
          type="file"
          accept="image/*"
          data-testid="desktop-file-input"
          className="hidden"
          onChange={handleFileSelect('desktop')}
        />
        <MetaFields slot="desktop" />
      </div>

      {/* Mobile slot */}
      <div className="border-t border-gray-100 pt-4">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
          Mobile image
          <span className="ml-1 font-mono text-xs font-normal normal-case text-ink-light">optional — portrait/square art direction</span>
          {imageGuidelines && (
            <span className="ml-1 font-normal normal-case">
              ({imageGuidelines.mobileDimensions[0]}×{imageGuidelines.mobileDimensions[1]})
            </span>
          )}
        </p>
        {mobileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mobileUrl} alt="Mobile preview" className="mb-2 w-full rounded-lg object-cover" style={{ maxHeight: 80 }} />
        ) : (
          <div className="mb-2 flex h-14 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
            <p className="font-sans text-xs text-ink-light">No mobile image</p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => mobileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => { setActiveSlot('mobile'); setShowLibrary(true) }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50"
          >
            Browse library
          </button>
        </div>
        <input
          ref={mobileInputRef}
          type="file"
          accept="image/*"
          data-testid="mobile-file-input"
          className="hidden"
          onChange={handleFileSelect('mobile')}
        />
        <MetaFields slot="mobile" />
      </div>

      {showLibrary && (
        <ImageLibraryPicker
          onSelect={handleLibrarySelect}
          onClose={() => setShowLibrary(false)}
          guidelines={imageGuidelines}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/admin/ImagePanel.test.tsx
```
Expected: 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/admin/ImagePanel.tsx __tests__/components/admin/ImagePanel.test.tsx
git commit -m "feat: add ImagePanel component with upload, resize, library picker, and meta fields"
```

---

## Task 8: VideoPanel Component

**Files:**
- Create: `components/admin/VideoPanel.tsx`
- Create: `__tests__/components/admin/VideoPanel.test.tsx`

Shown only when section config has `videoType`. Two modes:
- **`'ambient'`**: video upload + poster image + playback toggles (autoplay, loop, controls, lazy_load) + optional mobile video. Autoplay forces muted (no explicit muted toggle — it's always muted when autoplay is on). Lazy load is auto-disabled with a warning for above-fold sections.
- **`'content'`**: stream URL input + poster image + captions .vtt upload + accessible title input + controls + lazy_load toggles. Autoplay locked off.

All values written to/read from `content_json`.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/admin/VideoPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VideoPanel } from '@/components/admin/VideoPanel'

const mockFetch = vi.fn()

describe('VideoPanel — ambient', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })
  })

  it('renders ambient video upload controls', () => {
    render(
      <VideoPanel contentJson={{}} videoType="ambient" lazyLoadDefault={true} onChange={vi.fn()} />
    )
    expect(screen.getByText(/ambient video/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /autoplay/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /loop/i })).toBeInTheDocument()
  })

  it('shows lazy-load warning for above-fold sections (lazyLoadDefault=false)', () => {
    render(
      <VideoPanel contentJson={{}} videoType="ambient" lazyLoadDefault={false} onChange={vi.fn()} />
    )
    expect(screen.getByText(/above.fold/i)).toBeInTheDocument()
  })

  it('calls onChange when autoplay toggle changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <VideoPanel contentJson={{}} videoType="ambient" lazyLoadDefault={true} onChange={onChange} />
    )
    await user.click(screen.getByRole('checkbox', { name: /autoplay/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ video_autoplay: true }))
  })
})

describe('VideoPanel — content', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders content video URL input and captions upload', () => {
    render(
      <VideoPanel contentJson={{}} videoType="content" lazyLoadDefault={true} onChange={vi.fn()} />
    )
    expect(screen.getByLabelText(/stream url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/accessible title/i)).toBeInTheDocument()
  })

  it('does not show autoplay for content video', () => {
    render(
      <VideoPanel contentJson={{}} videoType="content" lazyLoadDefault={true} onChange={vi.fn()} />
    )
    expect(screen.queryByRole('checkbox', { name: /autoplay/i })).not.toBeInTheDocument()
  })

  it('calls onChange when stream URL is typed', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <VideoPanel contentJson={{}} videoType="content" lazyLoadDefault={true} onChange={onChange} />
    )
    await user.type(screen.getByLabelText(/stream url/i), 'https://stream.mux.com/abc')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ video_url: expect.stringContaining('mux') }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/VideoPanel.test.tsx
```
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement VideoPanel**

```tsx
// components/admin/VideoPanel.tsx
'use client'

import { useRef, useState } from 'react'

interface Props {
  contentJson: Record<string, unknown>
  videoType: 'ambient' | 'content'
  lazyLoadDefault: boolean
  onChange: (updates: Record<string, unknown>) => void
}

export function VideoPanel({ contentJson, videoType, lazyLoadDefault, onChange }: Props) {
  const videoInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)
  const captionsInputRef = useRef<HTMLInputElement>(null)
  const mobileVideoInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const videoUrl = contentJson.video_url as string | undefined
  const posterUrl = contentJson.video_poster_url as string | undefined
  const autoplay = Boolean(contentJson.video_autoplay)
  const loop = Boolean(contentJson.video_loop)
  const controls = Boolean(contentJson.video_controls)
  const lazyLoad = contentJson.video_lazy_load !== undefined
    ? Boolean(contentJson.video_lazy_load)
    : lazyLoadDefault

  async function uploadFile(file: File, mediaType: 'video-ambient' | 'video-content' | 'image' | 'captions') {
    setUploading(true)
    setUploadError('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('media_type', mediaType)
    formData.append('width', '0')
    formData.append('height', '0')
    formData.append('focal_point', 'center')
    try {
      const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Upload failed'); return null }
      return data as { url: string; id?: string }
    } catch {
      setUploadError('Network error. Please try again.')
      return null
    } finally {
      setUploading(false)
    }
  }

  function Toggle({ name, label, checked, onToggle }: {
    name: string; label: string; checked: boolean; onToggle: (v: boolean) => void
  }) {
    return (
      <label className="flex items-center gap-2 font-sans text-sm text-ink">
        <input
          type="checkbox"
          name={name}
          aria-label={label}
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="rounded border-gray-300"
        />
        {label}
      </label>
    )
  }

  if (videoType === 'ambient') {
    return (
      <div className="space-y-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
          Ambient video
          <span className="ml-1 font-normal normal-case text-ink-light">
            H.264 MP4 + WebM · &lt;15s · max 10MB
          </span>
        </p>

        {videoUrl ? (
          <p className="font-mono text-xs text-teal">{videoUrl}</p>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload video'}
          </button>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          data-testid="video-file-input"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const result = await uploadFile(file, 'video-ambient')
            if (result) onChange({ video_url: result.url })
          }}
        />

        {/* Poster image */}
        <div>
          <p className="mb-1 font-sans text-xs font-medium text-ink">
            Poster image <span className="text-red-500">*</span>
            <span className="ml-1 font-mono text-xs text-ink-light">required · LCP element</span>
          </p>
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={posterUrl} alt="Poster" className="mb-2 max-h-20 rounded object-cover" />
          ) : (
            <div className="mb-2 flex h-14 items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50">
              <p className="font-sans text-xs text-ink-light">No poster</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => posterInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            Upload poster
          </button>
          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const result = await uploadFile(file, 'image')
              if (result) onChange({ video_poster_url: result.url })
            }}
          />
        </div>

        {/* Playback toggles */}
        <div className="space-y-2">
          <Toggle
            name="autoplay" label="Autoplay (muted)"
            checked={autoplay}
            onToggle={(v) => onChange({ video_autoplay: v })}
          />
          <Toggle
            name="loop" label="Loop"
            checked={loop}
            onToggle={(v) => onChange({ video_loop: v })}
          />
          <Toggle
            name="controls" label="Show controls"
            checked={controls}
            onToggle={(v) => onChange({ video_controls: v })}
          />
          <div>
            <Toggle
              name="lazy_load" label="Lazy load"
              checked={lazyLoad}
              onToggle={(v) => onChange({ video_lazy_load: v })}
            />
            {!lazyLoadDefault && (
              <p className="mt-0.5 font-sans text-xs text-amber-600">
                ⚠ Above-fold section — lazy load is off by default for LCP
              </p>
            )}
          </div>
        </div>

        {/* Mobile video */}
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
            Mobile video <span className="font-normal normal-case">optional</span>
          </p>
          <button
            type="button"
            onClick={() => mobileVideoInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            {contentJson.mobile_video_url ? 'Replace mobile video' : 'Upload mobile video'}
          </button>
          <input
            ref={mobileVideoInputRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const result = await uploadFile(file, 'video-ambient')
              if (result) onChange({ mobile_video_url: result.url })
            }}
          />
        </div>

        {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}
      </div>
    )
  }

  // Content video
  return (
    <div className="space-y-4">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
        Content video
        <span className="ml-1 font-normal normal-case text-ink-light">Mux / Cloudflare Stream</span>
      </p>

      <div>
        <label htmlFor="video_url" className="font-sans text-sm font-medium text-ink">
          Stream URL
        </label>
        <input
          id="video_url"
          type="url"
          value={(contentJson.video_url as string) ?? ''}
          onChange={(e) => onChange({ video_url: e.target.value })}
          placeholder="https://stream.mux.com/…"
          className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
        />
      </div>

      {/* Poster image */}
      <div>
        <p className="mb-1 font-sans text-xs font-medium text-ink">
          Poster image <span className="text-red-500">*</span>
          <span className="ml-1 font-mono text-xs text-ink-light">required · LCP element</span>
        </p>
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt="Poster" className="mb-2 max-h-20 rounded object-cover" />
        ) : (
          <div className="mb-2 flex h-14 items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50">
            <p className="font-sans text-xs text-ink-light">No poster</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => posterInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
        >
          Upload poster
        </button>
        <input
          ref={posterInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const result = await uploadFile(file, 'image')
            if (result) onChange({ video_poster_url: result.url })
          }}
        />
      </div>

      {/* Captions */}
      <div>
        <p className="mb-1 font-sans text-xs font-medium text-ink">
          Captions (.vtt) <span className="text-red-500">*</span>
          <span className="ml-1 font-mono text-xs text-ink-light">required · WCAG AA</span>
        </p>
        {contentJson.video_captions_url ? (
          <p className="font-mono text-xs text-teal">{contentJson.video_captions_url as string}</p>
        ) : (
          <button
            type="button"
            onClick={() => captionsInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            Upload captions
          </button>
        )}
        <input
          ref={captionsInputRef}
          type="file"
          accept=".vtt,text/vtt"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const result = await uploadFile(file, 'captions')
            if (result) onChange({ video_captions_url: result.url })
          }}
        />
      </div>

      {/* Accessible title */}
      <div>
        <label htmlFor="video_accessible_title" className="font-sans text-sm font-medium text-ink">
          Accessible title
          <span className="ml-1 font-mono text-xs text-ink-light">aria-label · required</span>
        </label>
        <input
          id="video_accessible_title"
          type="text"
          value={(contentJson.video_accessible_title as string) ?? ''}
          onChange={(e) => onChange({ video_accessible_title: e.target.value })}
          className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
        />
      </div>

      <div className="space-y-2">
        <Toggle
          name="controls" label="Show controls"
          checked={controls}
          onToggle={(v) => onChange({ video_controls: v })}
        />
        <Toggle
          name="lazy_load" label="Lazy load"
          checked={lazyLoad}
          onToggle={(v) => onChange({ video_lazy_load: v })}
        />
      </div>

      {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/admin/VideoPanel.test.tsx
```
Expected: 6 tests pass (3 ambient + 3 content)

- [ ] **Step 5: Commit**

```bash
git add components/admin/VideoPanel.tsx __tests__/components/admin/VideoPanel.test.tsx
git commit -m "feat: add VideoPanel component for ambient and content video management"
```

---

## Task 9: Wire ImagePanel + VideoPanel into ContentEditForm

**Files:**
- Modify: `components/admin/ContentEditForm.tsx`
- Create: `__tests__/components/admin/ContentEditForm.media.test.tsx`

Replace the placeholder div in the right column with `ImagePanel` (when section has `imageGuidelines`) and `VideoPanel` (when section has `videoType`). Add `mediaFields` state to ContentEditForm; merge into PATCH body on save alongside text fields.

Also fix the existing type cast on `sectionConfig` to use `SectionConfig` from `content-config` so `imageGuidelines` and `videoType` are accessible.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/admin/ContentEditForm.media.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentEditForm } from '@/components/admin/ContentEditForm'
import type { ContentItem } from '@/lib/types'

vi.mock('next/navigation', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))
// Mock ImagePanel and VideoPanel to keep these tests focused on wiring only
vi.mock('@/components/admin/ImagePanel', () => ({
  ImagePanel: ({ onChange }: { onChange: (u: Record<string, unknown>) => void }) => (
    <div data-testid="image-panel">
      <button onClick={() => onChange({ image_url: 'https://cdn.test/new.jpg', image_alt: 'New' })}>
        Set image
      </button>
    </div>
  ),
}))
vi.mock('@/components/admin/VideoPanel', () => ({
  VideoPanel: ({ onChange }: { onChange: (u: Record<string, unknown>) => void }) => (
    <div data-testid="video-panel">
      <button onClick={() => onChange({ video_url: 'https://stream.test/abc', video_autoplay: true })}>
        Set video
      </button>
    </div>
  ),
}))

const mockFetch = vi.fn()

const heroItem: ContentItem = {
  id: 'item-1', created_at: '2026-04-01T12:00:00Z', updated_at: '2026-04-01T12:00:00Z',
  page: 'homepage', section: 'hero', persona: null, content_type: 'headline',
  content_json: {
    headline: 'Test headline', subheading: 'Sub', body: 'Body text', cta_text: 'CTA',
  },
  status: 'draft', generation_prompt: null, published_at: null,
}

describe('ContentEditForm — media wiring', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders ImagePanel for sections with imageGuidelines (homepage/hero)', () => {
    render(<ContentEditForm item={heroItem} />)
    expect(screen.getByTestId('image-panel')).toBeInTheDocument()
  })

  it('renders VideoPanel for sections with videoType (homepage/hero has videoType=ambient)', () => {
    render(<ContentEditForm item={heroItem} />)
    expect(screen.getByTestId('video-panel')).toBeInTheDocument()
  })

  it('merges media fields into PATCH body on save', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<ContentEditForm item={heroItem} />)

    // Trigger image update via mocked ImagePanel
    await user.click(screen.getByRole('button', { name: /set image/i }))
    // Save
    await user.click(screen.getByRole('button', { name: /save draft/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/content/item-1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"image_url"'),
        })
      )
    })
  })

  it('does not render ImagePanel for sections without imageGuidelines (homepage/faq)', () => {
    const faqItem: ContentItem = {
      ...heroItem, id: 'item-2', section: 'faq',
      content_json: { question: 'What is H2?', answer: 'Molecular hydrogen.' },
    }
    render(<ContentEditForm item={faqItem} />)
    expect(screen.queryByTestId('image-panel')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/admin/ContentEditForm.media.test.tsx
```
Expected: FAIL — ImagePanel/VideoPanel not in ContentEditForm yet

- [ ] **Step 3: Update ContentEditForm**

Replace the sections after the existing imageHint const (line 50) through the closing div of the right column. The key changes:
1. Import `SectionConfig` from content-config and cast `sectionConfig` to it.
2. Import `ImagePanel` and `VideoPanel`.
3. Add `mediaFields` state.
4. Merge `mediaFields` into the PATCH body in `handleSave`.
5. Replace the placeholder div with `ImagePanel` and `VideoPanel` conditional renders.

```tsx
// components/admin/ContentEditForm.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ContentItem, ContentStatus } from '@/lib/types'
import { CONTENT_CONFIG } from '@/lib/content-config'
import type { FieldMeta, SectionConfig } from '@/lib/content-config'
import { ImagePanel } from './ImagePanel'
import { VideoPanel } from './VideoPanel'

interface Props {
  item: ContentItem
}

const STATUS_STYLES: Record<ContentStatus, string> = {
  published:    'bg-green-100 text-green-800',
  draft:        'bg-amber-100 text-amber-800',
  needs_review: 'bg-gray-100 text-gray-600',
}
const STATUS_LABELS: Record<ContentStatus, string> = {
  published:    '● Published',
  draft:        '○ Draft',
  needs_review: '⚠ Needs review',
}
const PERSONA_LABELS: Record<string, string> = {
  sarah: 'Sarah',
  marcus: 'Marcus',
  elena: 'Elena',
}

export function ContentEditForm({ item }: Props) {
  const pageConfig = CONTENT_CONFIG[item.page as keyof typeof CONTENT_CONFIG]
  const sectionConfig = pageConfig?.sections[item.section] as SectionConfig | undefined
  const fieldDefs: Record<string, FieldMeta> = sectionConfig?.fields ?? {}

  const [fields, setFields] = useState<Record<string, string>>(() => {
    const json = item.content_json as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(fieldDefs).map(key => [key, String(json[key] ?? '')])
    )
  })

  const [mediaFields, setMediaFields] = useState<Record<string, unknown>>({})
  const [status, setStatus] = useState<ContentStatus>(item.status)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [publishError, setPublishError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const imageHint = (item.content_json as Record<string, unknown>).image_suggestion as string | undefined

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setFieldErrors({})
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_json: { ...item.content_json, ...fields, ...mediaFields },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 422 && data.violations) {
          const errs: Record<string, string> = {}
          for (const v of data.violations as { field: string; word: string }[]) {
            errs[v.field] = `Contains prohibited word: "${v.word}"`
          }
          setFieldErrors(errs)
        } else {
          setSaveError(data.error ?? 'Save failed')
        }
      }
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    setPublishError('')
    setFieldErrors({})
    try {
      const res = await fetch(`/api/admin/content/${item.id}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 422 && data.violations) {
          const errs: Record<string, string> = {}
          for (const v of data.violations as { field: string; word: string }[]) {
            errs[v.field] = `Contains prohibited word: "${v.word}"`
          }
          setFieldErrors(errs)
          setPublishError('Compliance violations must be resolved before publishing.')
        } else {
          setPublishError(data.error ?? 'Publish failed')
        }
      } else {
        setStatus('published')
      }
    } catch {
      setPublishError('Network error. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const pageLabel = pageConfig?.label ?? item.page
  const sectionLabel = sectionConfig?.label ?? item.section
  const personaLabel = item.persona ? (PERSONA_LABELS[item.persona] ?? item.persona) : null
  const mergedContentJson = { ...item.content_json, ...mediaFields }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/content"
            className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
          >
            ← All content
          </Link>
          <h1 className="mt-2 font-display text-2xl text-ink">
            {pageLabel} / {sectionLabel}
            {personaLabel && (
              <span className="ml-2 font-sans text-base font-normal text-ink-light">
                · {personaLabel}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-1 font-mono text-xs font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-4 py-2 font-sans text-sm font-medium text-ink transition-colors hover:border-teal/50 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
          >
            {publishing ? 'Publishing…' : '✓ Publish'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        {/* Left: content fields */}
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
            Content fields
          </p>

          <div className="space-y-5">
            {Object.entries(fieldDefs).map(([key, meta]) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor={`field-${key}`}
                    className="font-sans text-sm font-medium text-ink"
                  >
                    {meta.label}
                    {meta.required && <span className="ml-0.5 text-red-500">*</span>}
                  </label>
                  <span className="font-mono text-xs text-ink-light">{meta.hint}</span>
                </div>
                {meta.multiline ? (
                  <textarea
                    id={`field-${key}`}
                    rows={4}
                    value={fields[key] ?? ''}
                    onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                    className={`w-full rounded-lg border px-3 py-2 font-sans text-sm text-ink ${
                      fieldErrors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                  />
                ) : (
                  <input
                    id={`field-${key}`}
                    type="text"
                    value={fields[key] ?? ''}
                    onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                    className={`w-full rounded-lg border px-3 py-2 font-sans text-sm text-ink ${
                      fieldErrors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                  />
                )}
                {fieldErrors[key] && (
                  <p className="mt-1 font-sans text-xs text-red-500">{fieldErrors[key]}</p>
                )}
              </div>
            ))}
          </div>

          {saveError && <p className="mt-4 font-sans text-sm text-red-500">{saveError}</p>}
          {publishError && <p className="mt-4 font-sans text-sm text-red-500">{publishError}</p>}
        </div>

        {/* Right: media + meta */}
        <div>
          {imageHint && (
            <div className="mb-6 rounded-lg border border-teal-light bg-teal-light/40 p-4">
              <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-teal-dark">
                ✦ AI image suggestion
              </p>
              <p className="font-sans text-sm text-ink-mid">{imageHint}</p>
            </div>
          )}

          {sectionConfig?.imageGuidelines && (
            <div className="mb-6">
              <ImagePanel
                contentJson={mergedContentJson}
                imageGuidelines={sectionConfig.imageGuidelines}
                onChange={(updates) => setMediaFields(prev => ({ ...prev, ...updates }))}
              />
            </div>
          )}

          {sectionConfig?.videoType && (
            <div className="mb-6">
              <VideoPanel
                contentJson={mergedContentJson}
                videoType={sectionConfig.videoType}
                lazyLoadDefault={sectionConfig.lazyLoadDefault ?? true}
                onChange={(updates) => setMediaFields(prev => ({ ...prev, ...updates }))}
              />
            </div>
          )}

          <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
            <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">Meta</p>
            <div className="flex justify-between font-sans text-xs text-ink-light">
              <span>Content type</span>
              <span className="text-ink">{item.content_type}</span>
            </div>
            <div className="flex justify-between font-sans text-xs text-ink-light">
              <span>Updated</span>
              <span className="text-ink">{new Date(item.updated_at).toLocaleDateString('en-GB')}</span>
            </div>
            <div className="flex justify-between font-sans text-xs text-ink-light">
              <span>Compliance</span>
              <span className={item.status === 'needs_review' ? 'text-amber-600' : 'text-green-700'}>
                {item.status === 'needs_review' ? '⚠ Needs review' : '✓ Passed'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run all ContentEditForm tests (both files)**

```bash
npx vitest run __tests__/components/admin/ContentEditForm.test.tsx __tests__/components/admin/ContentEditForm.media.test.tsx
```
Expected: all 10 tests pass (6 original + 4 media wiring)

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add components/admin/ContentEditForm.tsx __tests__/components/admin/ContentEditForm.media.test.tsx
git commit -m "feat: wire ImagePanel and VideoPanel into ContentEditForm"
```

---

## Self-Review

**Spec coverage:**
- ✅ `media` Supabase table — Task 1
- ✅ `GET /api/admin/media` — Task 2
- ✅ `POST /api/admin/media` (upload, metadata, focal point, captions) — Task 3
- ✅ `FocalPointSelector` — Task 4
- ✅ Client-side Canvas resize with focal point crop — Task 5
- ✅ `ImageLibraryPicker` with size compliance indicator — Task 6
- ✅ `ImagePanel` (desktop + mobile slots, upload, resize flow, alt/title/caption meta) — Task 7
- ✅ `VideoPanel` (ambient: upload, poster, toggles, mobile video; content: URL, poster, captions, aria-label) — Task 8
- ✅ Wired into `ContentEditForm` with `mediaFields` state merging — Task 9
- ✅ Supabase Storage bucket `media` referenced throughout (must be created in Supabase dashboard before use)

**Note on Storage bucket setup:** The Supabase Storage bucket `media` must be created manually in the Supabase dashboard (Storage → New bucket → name: `media`, Public: true). This cannot be done via a SQL migration.

**Placeholder scan:** None found.

**Type consistency:**
- `FocalPoint` type defined in `FocalPointSelector.tsx`, `lib/image-resize.ts`, and `ImagePanel.tsx` — all identical, could be extracted to `lib/types.ts` in a future cleanup, but YAGNI for now.
- `SectionConfig` imported from `lib/content-config.ts` in `ContentEditForm.tsx` — matches what Task 2 (3c-core) implemented.
- `MediaItem` imported from `lib/types.ts` in `ImageLibraryPicker.tsx` and `ImagePanel.tsx` — matches the interface added in 3c-core Task 1.
