# Admin Phase 3c — Content Generation Design

## Overview

An AI-powered content generation and management system for the H2 Revive admin panel. Editors trigger content generation via the Anthropic API, review and edit the result, associate images and video, then publish. All playback behaviour, image meta, and compliance validation are managed in the admin — not in third-party hosting platforms.

---

## Goals

- Generate brand-compliant copy for any page/section via the Anthropic API
- Provide a content library showing all draft, published, and flagged items
- Allow per-field editing after generation (SEO/GEO-aware field labels)
- Associate images and video with content items, with full technical SEO and accessibility coverage
- Enforce compliance at generation, on manual save, and on publish
- Lay foundations for future flexibility (new pages = one config entry)

---

## Architecture

### `lib/content-config.ts`
Single source of truth for all pages, their sections, and the fields each section's `content_json` contains. Adding a new page or section requires one entry here — nothing else.

```typescript
export type FieldMeta = {
  label: string
  hint: string        // e.g. "H1 · SEO title weight"
  multiline: boolean
  required: boolean
}

export type SectionConfig = {
  label: string
  contentType: string  // 'headline' | 'body' | 'faq-item' | 'testimonial' | 'cta'
  fields: Record<string, FieldMeta>
  imageGuidelines?: {
    desktopDimensions: [number, number]   // [width, height]
    mobileDimensions: [number, number]
    maxFileSizeKb: number
  }
  videoType?: 'ambient' | 'content' | null
  lazyLoadDefault?: boolean   // false for above-fold sections like hero
}

export type PageConfig = {
  label: string
  sections: Record<string, SectionConfig>
}

export const CONTENT_CONFIG: Record<string, PageConfig> = {
  homepage: {
    label: 'Homepage',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · SEO title weight',     multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet', multiline: false, required: true },
          body:       { label: 'Body',       hint: 'paragraph · GEO context',   multiline: true,  required: true },
          cta_text:   { label: 'CTA text',   hint: 'button label',              multiline: false, required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 400 },
        videoType: 'ambient',
        lazyLoadDefault: false,
      },
      // … additional sections
    },
  },
  product: { label: 'Product', sections: { /* … */ } },
  science: { label: 'Science Hub', sections: { /* … */ } },
  about:   { label: 'About', sections: { /* … */ } },
  clinics: { label: 'Clinics', sections: { /* … */ } },
  faq:     { label: 'FAQ', sections: { /* … */ } },
}
```

### `lib/compliance.ts`
Shared utility called from three places: generate route, content PATCH route, publish action.

```typescript
const PROHIBITED = [
  'treats', 'cures', 'proven to', 'proven to help', 'guaranteed',
  'eliminates', 'heals', 'clinical grade', 'medical device',
  'therapeutic treatment', 'diagnose', 'prevent disease',
  'from my own experience', 'no side effects',
]

export type ComplianceResult =
  | { pass: true }
  | { pass: false; violations: { field: string; word: string }[] }

export function checkCompliance(fields: Record<string, string>): ComplianceResult {
  const violations: { field: string; word: string }[] = []
  for (const [field, value] of Object.entries(fields)) {
    for (const word of PROHIBITED) {
      if (value.toLowerCase().includes(word)) {
        violations.push({ field, word })
      }
    }
  }
  return violations.length ? { pass: false, violations } : { pass: true }
}
```

### Supabase tables

**`content_items`** (existing schema — no changes needed):
```
id, created_at, updated_at, page, section, persona,
content_type, content_json, status, generation_prompt, published_at
```
`status` values: `'draft'` | `'published'` | `'needs_review'`

**`media`** (new table):
```sql
id uuid pk default gen_random_uuid(),
created_at timestamptz default now(),
filename text not null,
url text not null,
width integer not null,
height integer not null,
file_size_kb integer not null,
focal_point text default 'center',  -- 'top-left' | 'top' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right'
media_type text not null,           -- 'image' | 'video-ambient' | 'video-content'
uploaded_at timestamptz default now()
```

### API routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/generate-content` | Call Anthropic, compliance check (max 2 retries), save as draft or `needs_review` |
| PATCH | `/api/admin/content/[id]` | Update fields or status — compliance check on text fields before saving |
| DELETE | `/api/admin/content/[id]` | Permanent delete |
| POST | `/api/admin/content/[id]/publish` | Final compliance gate → set `status = 'published'`, `published_at = now()` |
| GET | `/api/admin/media` | List all media items |
| POST | `/api/admin/media` | Upload image/video to Supabase Storage, extract/store metadata |

### Admin pages

| Route | Type | Purpose |
|-------|------|---------|
| `/admin/content` | Server component | Generation form + content library table |
| `/admin/content/[id]` | Server component + client form | Edit page: per-field textareas, image/video panel, publish controls |

### `content_json` structure

All content fields, image meta, and video options are stored in `content_json`. Standard keys:

```typescript
// Text fields (vary by section — defined in CONTENT_CONFIG)
headline?: string
subheading?: string
body?: string
cta_text?: string
question?: string   // faq-item
answer?: string     // faq-item
// … any other fields defined in config

// AI image suggestion (always returned by Anthropic alongside copy)
image_suggestion?: string   // e.g. "Soft morning light, woman at rest, eyes closed…"

// Desktop image
image_url?: string
image_width?: number      // from media table — for Next.js <Image>
image_height?: number     // from media table — for Next.js <Image>
image_alt?: string        // required when image_url is set
image_title?: string
image_caption?: string

// Mobile image (optional art direction)
mobile_image_url?: string
mobile_image_width?: number
mobile_image_height?: number
mobile_image_alt?: string
mobile_image_title?: string
mobile_image_caption?: string

// Video (ambient or content — only present if section config has videoType)
video_url?: string
video_poster_url?: string
video_poster_width?: number
video_poster_height?: number
video_autoplay?: boolean
video_loop?: boolean
video_controls?: boolean
video_lazy_load?: boolean
video_captions_url?: string   // .vtt — required for content video
video_accessible_title?: string  // aria-label — required for content video
mobile_video_url?: string     // optional separate mobile clip
```

The Anthropic API response must always be a JSON object containing the text fields defined for the section plus an `image_suggestion` string. The system prompt instructs the model to include this field.

### Library "headline preview" fallback

For the content library table preview column, display the first available field in this order: `headline` → `subheading` → `question` → `body` (truncated to 60 chars). Ensures all content types show a meaningful preview.

---

## Generation Pipeline

```
1. Editor selects page → section → persona (optional) → additional context
2. POST /api/generate-content
3. Anthropic API called with system prompt (brand voice + compliance rules baked in)
4. checkCompliance() run on returned content_json
5a. Pass → save as status='draft', return to client
5b. Fail → auto-regenerate (max 2 retries)
5c. Still failing after 2 → save as status='needs_review', flag in UI
6. Editor reviews content in /admin/content/[id]
7. Editor edits fields → PATCH → checkCompliance() → save or block with inline error
8. Editor clicks Publish → POST /api/admin/content/[id]/publish
9. Final checkCompliance() → pass: status='published' | fail: blocked with error
```

---

## `/admin/content` Page

**Generation form (top section):**
- Page selector (from `CONTENT_CONFIG` keys)
- Section selector (populates from selected page's sections)
- Persona selector: General / Sarah / Marcus / Elena (optional)
- Additional context textarea (optional free text passed to Anthropic)
- Generate button — shows status indicator: Generating… → Compliance check… → Saved as draft / ⚠ Needs review

**Content library table (below form):**
- Columns: Page/Section · Headline preview · Persona · Type · Status · Actions
- Status badges: ● Published (green) · ○ Draft (amber) · ⚠ Review (gray)
- Filter by page, filter by status
- Edit button → `/admin/content/[id]`
- Delete button with `confirm()` dialog

---

## `/admin/content/[id]` Edit Page

**Left column — content fields:**
- Fields rendered dynamically from `CONTENT_CONFIG[page].sections[section].fields`
- Each field: label + SEO/GEO hint + textarea (multiline) or input (single line)
- Required fields enforced client-side
- Save draft button — triggers PATCH, compliance check on save
- Inline compliance errors shown per field if violation detected (e.g. "Field 'body' contains prohibited word: 'treats'")

**Right column — media + meta:**

*Image section:*
- AI image suggestion (from Anthropic, generated alongside copy)
- Image preview (if selected) with filename, dimensions, file size
- Browse library / Upload buttons
- On upload: section guidelines shown (recommended dimensions, max KB, format, aspect ratio)
- Size warning if over limit — shows before/after stats, "Resize & Upload" or "Upload anyway"
- Resize flow: 3×3 focal point selector overlaid on image preview → client-side Canvas resize → before/after confirmation
- Mobile image slot (optional): separate portrait/square upload served via `<picture>` element below 768px
- Required image meta fields (appear when image selected):
  - Alt text (required) — labelled "accessibility · SEO signal"
  - Title attribute — labelled "tooltip · image search"
  - Caption (optional) — labelled "figure element · GEO context"
- Mobile image has its own alt text, title, caption fields
- All image meta stored in `content_json` alongside `image_url`, `mobile_image_url`

*Video section (shown only if section config has `videoType`):*

Ambient clip (Supabase Storage):
- Upload or browse library (short clips < 15s, H.264 MP4 + WebM, < 10MB)
- Poster image (required — LCP element)
- Playback toggles: autoplay, loop, show controls, lazy load
- Muted locked on when autoplay enabled
- Lazy load auto-disabled with warning for above-fold sections
- All options stored in `content_json`

Content video (Mux / Cloudflare Stream):
- Stream URL input
- Poster image (required)
- Captions .vtt upload (required — WCAG AA)
- Accessible title/aria-label (required)
- Playback toggles: show controls, lazy load
- Autoplay locked off

*Item meta:*
- Generated date, content type, compliance status badge (✓ Passed / ⚠ Needs review)

**Header bar:**
- Breadcrumb ← All content
- Page/Section/Persona label
- Status badge
- Regenerate button
- Publish button → compliance gate → `status = 'published'`

---

## Image Library (`/api/admin/media`)

- Images stored in Supabase Storage bucket `media`
- Metadata (width, height, file_size_kb, focal_point) stored in `media` table
- Intrinsic dimensions passed to Next.js `<Image width height />` on public pages — prevents CLS
- Same image can have different alt text on different content items (alt stored in `content_json`, not `media`)
- Library grid: filename, thumbnail, dimensions, file size, ✓ Within limits / ⚠ Oversized indicator (based on current section guidelines)

---

## Video Hosting

| Type | Hosting | Use case | Max size |
|------|---------|----------|----------|
| Ambient | Supabase Storage | Hero backgrounds, short loops < 15s | 10 MB |
| Content | Mux / Cloudflare Stream | Product demos, testimonials | No limit |

Ambient video format: H.264 MP4 (primary) + WebM (fallback), stripped audio, compressed.
Content video: adaptive bitrate HLS via stream URL.

---

## Technical SEO & Accessibility Guarantees

| Concern | Approach |
|---------|----------|
| LCP | Poster image required on all video. Hero lazy load disabled. Next.js `<Image>` with intrinsic dimensions. |
| CLS | Width + height stored in `media` table, always passed to `<Image>`. |
| Alt text | Required field, blocked from saving without it. |
| Captions | Required on content video (WCAG AA). |
| Accessible video title | Required `aria-label` on content video player. |
| Autoplay | Muted-only ambient clips. Content video user-initiated only. |
| Image size | Per-section limits enforced on upload with resize tool. |
| Art direction (mobile) | Optional separate mobile image via `<picture>` element. |
| Compliance | Runs at generation, on save, and on publish. |

---

## Compliance

Three enforcement points:

1. **Generation** — Anthropic system prompt has brand voice and compliance rules. Post-generation `checkCompliance()` scan. Auto-regenerates max 2×. Saves as `needs_review` if still failing.
2. **On save** — `checkCompliance()` runs on all text fields in PATCH route. Blocked with per-field inline error if violation found.
3. **On publish** — Final gate in `/api/admin/content/[id]/publish`. Cannot publish content with violations.

---

## Out of Scope (Phase 3c)

- Public pages reading from `content_items` at runtime (Phase 4 consideration)
- Rich text / WYSIWYG editing
- Batch content generation
- Content versioning / history
- Page builder / drag-and-drop composition
- Video transcoding pipeline (editors upload pre-optimised files)
