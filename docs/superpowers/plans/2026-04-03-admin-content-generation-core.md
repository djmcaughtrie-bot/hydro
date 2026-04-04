# Admin Phase 3c-Core — Content Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI content generation pipeline, compliance enforcement, content library, and per-field text editing for the H2 Revive admin panel.

**Architecture:** `lib/content-config.ts` drives all page/section/field definitions; `lib/compliance.ts` is a shared utility called at generation, save, and publish; Anthropic API generates copy; `content_items` Supabase table stores all drafts and published items; admin UI follows the existing server-page + client-component pattern established in Phase 3a/3b.

**Tech Stack:** Next.js 14 App Router, TypeScript, `@anthropic-ai/sdk`, Supabase (`content_items` table), Vitest + Testing Library, Tailwind CSS.

---

## Scope

This plan (3c-core) delivers: content generation, compliance at generation/save/publish, content library with filters, per-field text editing. It does **not** include image or video panels — those are covered in the follow-on plan **3c-media**.

---

## File Structure

**Create:**
- `lib/content-config.ts` — all pages/sections/fields; the single config driving generation form, edit form, and API
- `lib/compliance.ts` — `checkCompliance()` utility
- `app/api/generate-content/route.ts` — POST: Anthropic + compliance retry + save to `content_items`
- `app/api/admin/content/[id]/route.ts` — PATCH (compliance on text fields) + DELETE
- `app/api/admin/content/[id]/publish/route.ts` — POST: final compliance gate → publish
- `components/admin/ContentGenerationForm.tsx` — client: selectors + generate button + status
- `components/admin/ContentGenerationFormWithRedirect.tsx` — thin client wrapper: wires `onGenerated` to `router.push`
- `components/admin/ContentLibrary.tsx` — client: library table + page/status filters + delete
- `components/admin/ContentEditForm.tsx` — client: per-field textareas, save draft, publish
- `app/admin/(protected)/content/page.tsx` — server: fetches items, renders form + library
- `app/admin/(protected)/content/[id]/page.tsx` — server: fetches item, renders edit form

**Modify:**
- `lib/types.ts` — add `ContentItem`, `MediaItem`, `ContentStatus`

**Tests:**
- `__tests__/lib/compliance.test.ts`
- `__tests__/api/generate-content.test.ts`
- `__tests__/api/admin/content.test.ts`
- `__tests__/api/admin/content-publish.test.ts`
- `__tests__/components/admin/ContentGenerationForm.test.tsx`
- `__tests__/components/admin/ContentLibrary.test.tsx`
- `__tests__/components/admin/ContentEditForm.test.tsx`

---

## Task 1: Install Anthropic SDK + extend types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Install the Anthropic SDK**

Run: `npm install @anthropic-ai/sdk`

Expected: `@anthropic-ai/sdk` appears in `package.json` dependencies.

- [ ] **Step 2: Add types to lib/types.ts**

Open `lib/types.ts` and append after the existing `Study` interface:

```typescript
export type ContentStatus = 'draft' | 'published' | 'needs_review'

export interface ContentItem {
  id: string
  created_at: string
  updated_at: string
  page: string
  section: string
  persona: string | null
  content_type: string
  content_json: Record<string, unknown>
  status: ContentStatus
  generation_prompt: string | null
  published_at: string | null
}

export interface MediaItem {
  id: string
  created_at: string
  filename: string
  url: string
  width: number
  height: number
  file_size_kb: number
  focal_point: string
  media_type: 'image' | 'video-ambient' | 'video-content'
  uploaded_at: string
}
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts package.json package-lock.json
git commit -m "feat: install @anthropic-ai/sdk, add ContentItem and MediaItem types"
```

---

## Task 2: lib/content-config.ts

**Files:**
- Create: `lib/content-config.ts`

- [ ] **Step 1: Create lib/content-config.ts**

```typescript
export interface FieldMeta {
  label: string
  hint: string
  multiline: boolean
  required: boolean
}

export interface ImageGuidelines {
  desktopDimensions: [number, number]
  mobileDimensions: [number, number]
  maxFileSizeKb: number
}

export interface SectionConfig {
  label: string
  contentType: string
  fields: Record<string, FieldMeta>
  imageGuidelines?: ImageGuidelines
  videoType?: 'ambient' | 'content'
  lazyLoadDefault?: boolean
}

export interface PageConfig {
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
          headline:   { label: 'Headline',   hint: 'H1 · primary SEO title',      multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',   multiline: false, required: true },
          body:       { label: 'Body',       hint: 'paragraph · GEO context',     multiline: true,  required: true },
          cta_text:   { label: 'CTA text',   hint: 'button label',                multiline: false, required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 400 },
        videoType: 'ambient',
        lazyLoadDefault: false,
      },
      features: {
        label: 'Features',
        contentType: 'body',
        fields: {
          headline: { label: 'Section headline', hint: 'H2 · section anchor',     multiline: false, required: true },
          body:     { label: 'Body',             hint: 'paragraph · GEO context', multiline: true,  required: true },
        },
        imageGuidelines: { desktopDimensions: [800, 600], mobileDimensions: [600, 500], maxFileSizeKb: 250 },
      },
      'social-proof': {
        label: 'Social proof',
        contentType: 'testimonial',
        fields: {
          quote:       { label: 'Quote',       hint: 'user testimonial · GEO trust signal', multiline: true,  required: true },
          attribution: { label: 'Attribution', hint: 'name and context',                    multiline: false, required: true },
        },
      },
      faq: {
        label: 'FAQ',
        contentType: 'faq-item',
        fields: {
          question: { label: 'Question', hint: 'FAQ schema · voice search target',  multiline: false, required: true },
          answer:   { label: 'Answer',   hint: 'paragraph · GEO answer target',     multiline: true,  required: true },
        },
      },
    },
  },
  product: {
    label: 'Product',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · product page SEO title', multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',   multiline: false, required: true },
          body:       { label: 'Body',       hint: 'paragraph · GEO context',     multiline: true,  required: true },
          cta_text:   { label: 'CTA text',   hint: 'enquiry button label',        multiline: false, required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 400 },
        lazyLoadDefault: false,
      },
      features: {
        label: 'Features',
        contentType: 'body',
        fields: {
          headline: { label: 'Feature headline', hint: 'H3 · feature name',        multiline: false, required: true },
          body:     { label: 'Feature body',     hint: 'paragraph · GEO context',  multiline: true,  required: true },
        },
        imageGuidelines: { desktopDimensions: [700, 500], mobileDimensions: [600, 450], maxFileSizeKb: 200 },
      },
      'how-it-works': {
        label: 'How it works',
        contentType: 'body',
        fields: {
          headline: { label: 'Step headline', hint: 'H3 · step name',              multiline: false, required: true },
          body:     { label: 'Step body',     hint: 'paragraph · process context', multiline: true,  required: true },
        },
        videoType: 'content',
      },
      cta: {
        label: 'Enquiry CTA',
        contentType: 'cta',
        fields: {
          headline:   { label: 'CTA headline', hint: 'H2 · conversion anchor',    multiline: false, required: true },
          subheading: { label: 'Subheading',   hint: 'supporting context',        multiline: false, required: false },
          cta_text:   { label: 'Button text',  hint: 'enquiry button label',      multiline: false, required: true },
        },
      },
    },
  },
  science: {
    label: 'Science Hub',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · science hub SEO title',  multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',   multiline: false, required: true },
          body:       { label: 'Body',       hint: 'paragraph · intro context',   multiline: true,  required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 700], mobileDimensions: [800, 800], maxFileSizeKb: 350 },
        lazyLoadDefault: false,
      },
      intro: {
        label: 'Introduction',
        contentType: 'body',
        fields: {
          headline: { label: 'Headline', hint: 'H2 · section anchor',            multiline: false, required: true },
          body:     { label: 'Body',     hint: 'paragraph · GEO answer target',  multiline: true,  required: true },
        },
      },
    },
  },
  about: {
    label: 'About',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · about page SEO title',  multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',  multiline: false, required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 800], mobileDimensions: [800, 900], maxFileSizeKb: 350 },
        lazyLoadDefault: false,
      },
      'ceo-story': {
        label: 'CEO story',
        contentType: 'body',
        fields: {
          headline: { label: 'Section headline', hint: 'H2 · narrative anchor',   multiline: false, required: true },
          body:     { label: 'Story body',       hint: 'long-form · GEO context', multiline: true,  required: true },
        },
        imageGuidelines: { desktopDimensions: [700, 900], mobileDimensions: [600, 700], maxFileSizeKb: 250 },
      },
    },
  },
  clinics: {
    label: 'Clinics',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · B2B SEO title',         multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',  multiline: false, required: true },
          body:       { label: 'Body',       hint: 'paragraph · B2B context',    multiline: true,  required: true },
          cta_text:   { label: 'CTA text',   hint: 'enquiry button label',       multiline: false, required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 400 },
        lazyLoadDefault: false,
      },
      benefits: {
        label: 'Benefits',
        contentType: 'body',
        fields: {
          headline: { label: 'Benefit headline', hint: 'H3 · benefit name',      multiline: false, required: true },
          body:     { label: 'Benefit body',     hint: 'paragraph · GEO context',multiline: true,  required: true },
        },
      },
      cta: {
        label: 'Clinic CTA',
        contentType: 'cta',
        fields: {
          headline:   { label: 'CTA headline', hint: 'H2 · conversion anchor',   multiline: false, required: true },
          subheading: { label: 'Subheading',   hint: 'supporting context',       multiline: false, required: false },
          cta_text:   { label: 'Button text',  hint: 'enquiry button label',     multiline: false, required: true },
        },
      },
    },
  },
  faq: {
    label: 'FAQ',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · FAQ page SEO title',    multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',  multiline: false, required: true },
        },
        lazyLoadDefault: false,
      },
      item: {
        label: 'FAQ item',
        contentType: 'faq-item',
        fields: {
          question: { label: 'Question', hint: 'FAQ schema · voice search target', multiline: false, required: true },
          answer:   { label: 'Answer',   hint: 'paragraph · GEO answer target',   multiline: true,  required: true },
        },
      },
    },
  },
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/content-config.ts
git commit -m "feat: add content-config with all pages and sections"
```

---

## Task 3: lib/compliance.ts + tests

**Files:**
- Create: `lib/compliance.ts`
- Create: `__tests__/lib/compliance.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/compliance.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { checkCompliance } from '@/lib/compliance'

describe('checkCompliance', () => {
  it('returns pass:true when no prohibited words present', () => {
    const result = checkCompliance({ headline: 'Hydrogen may support energy levels' })
    expect(result.pass).toBe(true)
  })

  it('returns pass:false with violation when prohibited word found', () => {
    const result = checkCompliance({ body: 'This product treats chronic fatigue.' })
    expect(result.pass).toBe(false)
    if (!result.pass) {
      expect(result.violations).toEqual([{ field: 'body', word: 'treats' }])
    }
  })

  it('catches violations across multiple fields', () => {
    const result = checkCompliance({
      headline: 'Proven to help recovery',
      body: 'This cures inflammation',
    })
    expect(result.pass).toBe(false)
    if (!result.pass) {
      expect(result.violations).toHaveLength(2)
    }
  })

  it('is case-insensitive', () => {
    const result = checkCompliance({ headline: 'TREATS inflammation' })
    expect(result.pass).toBe(false)
  })

  it('catches multi-word prohibited phrases', () => {
    const result = checkCompliance({ body: 'Studies proven to help reduce fatigue' })
    expect(result.pass).toBe(false)
    if (!result.pass) {
      expect(result.violations[0].word).toBe('proven to help')
    }
  })

  it('skips non-string values without throwing', () => {
    const result = checkCompliance({
      count: 42 as unknown as string,
      image_url: null as unknown as string,
    })
    expect(result.pass).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --reporter=verbose __tests__/lib/compliance.test.ts`

Expected: FAIL — `checkCompliance` not found.

- [ ] **Step 3: Write lib/compliance.ts**

```typescript
// Longer phrases must appear before shorter substrings they contain,
// so "proven to help" is checked before "proven to".
const PROHIBITED = [
  'proven to help',
  'proven to',
  'treats',
  'cures',
  'guaranteed',
  'eliminates',
  'heals',
  'clinical grade',
  'medical device',
  'therapeutic treatment',
  'diagnose',
  'prevent disease',
  'from my own experience',
  'no side effects',
]

export type ComplianceResult =
  | { pass: true }
  | { pass: false; violations: { field: string; word: string }[] }

export function checkCompliance(fields: Record<string, unknown>): ComplianceResult {
  const violations: { field: string; word: string }[] = []
  for (const [field, value] of Object.entries(fields)) {
    if (typeof value !== 'string') continue
    const lower = value.toLowerCase()
    for (const word of PROHIBITED) {
      if (lower.includes(word)) {
        violations.push({ field, word })
      }
    }
  }
  return violations.length ? { pass: false, violations } : { pass: true }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --reporter=verbose __tests__/lib/compliance.test.ts`

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/compliance.ts __tests__/lib/compliance.test.ts
git commit -m "feat: add compliance checker with prohibited word scan"
```

---

## Task 4: POST /api/generate-content + tests

**Files:**
- Create: `app/api/generate-content/route.ts`
- Create: `__tests__/api/generate-content.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/generate-content.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockInsertSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: mockInsertSingle })),
      })),
    })),
  })),
}))

const mockAnthropicCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({ messages: { create: mockAnthropicCreate } })),
}))

describe('POST /api/generate-content', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockInsertSingle.mockResolvedValue({ data: { id: 'item-1' }, error: null })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/generate-content/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ page: 'homepage', section: 'hero' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid page/section', async () => {
    const { POST } = await import('@/app/api/generate-content/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ page: 'nonexistent', section: 'hero' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res.status).toBe(400)
  })

  it('saves as draft when compliance passes', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({
        headline: 'Research may support energy levels',
        subheading: 'Science-backed wellness technology',
        body: 'Studies suggest hydrogen inhalation may help.',
        cta_text: 'Explore the science',
        image_suggestion: 'Woman at rest, morning light',
      }) }],
    })
    const { POST } = await import('@/app/api/generate-content/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ page: 'homepage', section: 'hero' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.status).toBe('draft')
  })

  it('retries up to 3 times and saves as needs_review when compliance keeps failing', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({
        headline: 'This treats fatigue permanently',
        subheading: 'Proven to help',
        body: 'Cures inflammation',
        cta_text: 'Try it',
        image_suggestion: 'Device photo',
      }) }],
    })
    const { POST } = await import('@/app/api/generate-content/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ page: 'homepage', section: 'hero' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    const data = await res.json()
    expect(mockAnthropicCreate).toHaveBeenCalledTimes(3)
    expect(data.status).toBe('needs_review')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --reporter=verbose __tests__/api/generate-content.test.ts`

Expected: FAIL.

- [ ] **Step 3: Write app/api/generate-content/route.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCompliance } from '@/lib/compliance'
import { CONTENT_CONFIG } from '@/lib/content-config'

const SYSTEM_PROMPT = `You are the content writer for H2 Revive, a UK wellness brand specialising in molecular hydrogen inhalation therapy. Write in the H2 Revive brand voice:

VOICE PILLARS:
- Curious and confident: share discoveries, not sales pitches
- Human, not clinical: translate science into feeling
- Quietly British: understated authority, no hype, no exclamation marks
- Intellectually honest: hedge claims accurately

ALWAYS USE: "may support", "research suggests", "some users report", "studies explore", "we believe", "the science is pointing toward", "a [year] study in [journal] found"

NEVER USE: "treats", "cures", "proven to", "proven to help", "guaranteed", "eliminates", "heals", "clinical grade", "medical device", "therapeutic treatment", "diagnose", "prevent disease", "from my own experience"

CITATION RULE: Always link to primary sources (PubMed DOI, journal page). Never reference third-party aggregator sites.

COMPLIANCE DISCLAIMER (include near any health claim): "These statements have not been evaluated by the MHRA. This product is not intended to diagnose, treat, cure, or prevent any disease."

BRAND: H2 Revive is a wellness technology brand, not a medical device company. UK-first positioning. CEO-led authentic voice. Science-backed but honest about the state of the evidence.

Respond with valid JSON only. No markdown, no preamble.`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { page, section, persona, additional_context } = await request.json()

  const sectionConfig = CONTENT_CONFIG[page]?.sections[section]
  if (!sectionConfig) return Response.json({ error: 'Invalid page/section' }, { status: 400 })

  const fieldList = [...Object.keys(sectionConfig.fields), 'image_suggestion'].join(', ')
  const generation_prompt = `Generate content for the H2 Revive ${page} page, ${section} section.
${persona ? `Persona: ${persona}` : 'Persona: General audience'}
${additional_context ? `Additional context: ${additional_context}` : ''}

Return a JSON object with exactly these fields: ${fieldList}.
The image_suggestion should be a vivid description for a photographer, 1-2 sentences.`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  async function generate(): Promise<Record<string, unknown>> {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: generation_prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    return JSON.parse(text)
  }

  let content: Record<string, unknown> = {}
  let complianceResult = checkCompliance({})
  let attempts = 0

  while (attempts < 3) {
    content = await generate()
    const textFields = Object.fromEntries(
      Object.entries(content).filter(([, v]) => typeof v === 'string')
    ) as Record<string, string>
    complianceResult = checkCompliance(textFields)
    attempts++
    if (complianceResult.pass) break
  }

  const status = complianceResult.pass ? 'draft' : 'needs_review'
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('content_items')
    .insert({
      page,
      section,
      persona: persona ?? null,
      content_type: sectionConfig.contentType,
      content_json: content,
      status,
      generation_prompt,
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id, status })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --reporter=verbose __tests__/api/generate-content.test.ts`

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/generate-content/route.ts __tests__/api/generate-content.test.ts
git commit -m "feat: add content generation API with Anthropic, compliance retry, and needs_review fallback"
```

---

## Task 5: PATCH + DELETE /api/admin/content/[id] + tests

PATCH runs compliance on `content_json` text fields before saving. DELETE is unconditional.

**Files:**
- Create: `app/api/admin/content/[id]/route.ts`
- Create: `__tests__/api/admin/content.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/admin/content.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: mockUpdate })),
      delete: vi.fn(() => ({ eq: mockDelete })),
    })),
  })),
}))

describe('PATCH /api/admin/content/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpdate.mockResolvedValue({ error: null })
    mockDelete.mockResolvedValue({ error: null })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { PATCH } = await import('@/app/api/admin/content/[id]/route')
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ content_json: { headline: 'Test' } }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(401)
  })

  it('returns 422 when content_json contains prohibited words', async () => {
    const { PATCH } = await import('@/app/api/admin/content/[id]/route')
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ content_json: { headline: 'This treats fatigue' } }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.violations).toBeDefined()
  })

  it('returns 200 when content_json is compliant', async () => {
    const { PATCH } = await import('@/app/api/admin/content/[id]/route')
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ content_json: { headline: 'Research may support energy' } }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(200)
  })

  it('skips compliance when patching non-content fields', async () => {
    const { PATCH } = await import('@/app/api/admin/content/[id]/route')
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'draft' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(200)
  })

  it('DELETE returns 200 on success', async () => {
    const { DELETE } = await import('@/app/api/admin/content/[id]/route')
    const res = await DELETE(
      new Request('http://localhost', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --reporter=verbose __tests__/api/admin/content.test.ts`

Expected: FAIL.

- [ ] **Step 3: Write app/api/admin/content/[id]/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCompliance } from '@/lib/compliance'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  if (body.content_json) {
    const textFields = Object.fromEntries(
      Object.entries(body.content_json as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'string')
    ) as Record<string, string>
    const result = checkCompliance(textFields)
    if (!result.pass) {
      return Response.json({ error: 'Compliance violation', violations: result.violations }, { status: 422 })
    }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('content_items')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)

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

  const { error } = await adminClient.from('content_items').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --reporter=verbose __tests__/api/admin/content.test.ts`

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/content/[id]/route.ts __tests__/api/admin/content.test.ts
git commit -m "feat: add content PATCH and DELETE routes with per-save compliance check"
```

---

## Task 6: POST /api/admin/content/[id]/publish + tests

**Files:**
- Create: `app/api/admin/content/[id]/publish/route.ts`
- Create: `__tests__/api/admin/content-publish.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/admin/content-publish.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockUpdateEq = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })),
      update: vi.fn(() => ({ eq: mockUpdateEq })),
    })),
  })),
}))

describe('POST /api/admin/content/[id]/publish', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpdateEq.mockResolvedValue({ error: null })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/admin/content/[id]/publish/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 when content item not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const { POST } = await import('@/app/api/admin/content/[id]/publish/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'missing' }) }
    )
    expect(res.status).toBe(404)
  })

  it('returns 422 when content has compliance violations', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'item-1', content_json: { headline: 'This treats fatigue' } },
      error: null,
    })
    const { POST } = await import('@/app/api/admin/content/[id]/publish/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.violations).toBeDefined()
  })

  it('sets status=published and published_at when content is compliant', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'item-1', content_json: { headline: 'Research may support energy levels' } },
      error: null,
    })
    const { POST } = await import('@/app/api/admin/content/[id]/publish/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(200)
    expect(mockUpdateEq).toHaveBeenCalledWith('item-1')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --reporter=verbose __tests__/api/admin/content-publish.test.ts`

Expected: FAIL.

- [ ] **Step 3: Write app/api/admin/content/[id]/publish/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCompliance } from '@/lib/compliance'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const adminClient = createAdminClient()

  const { data: item, error: fetchError } = await adminClient
    .from('content_items')
    .select('id, content_json')
    .eq('id', id)
    .single()

  if (fetchError || !item) return Response.json({ error: 'Not found' }, { status: 404 })

  const textFields = Object.fromEntries(
    Object.entries(item.content_json as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'string')
  ) as Record<string, string>

  const result = checkCompliance(textFields)
  if (!result.pass) {
    return Response.json({ error: 'Compliance violation', violations: result.violations }, { status: 422 })
  }

  const { error: updateError } = await adminClient
    .from('content_items')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })
  return Response.json({ ok: true })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --reporter=verbose __tests__/api/admin/content-publish.test.ts`

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/content/[id]/publish/route.ts __tests__/api/admin/content-publish.test.ts
git commit -m "feat: add publish route with final compliance gate"
```

---

## Task 7: ContentGenerationForm + tests

**Files:**
- Create: `components/admin/ContentGenerationForm.tsx`
- Create: `__tests__/components/admin/ContentGenerationForm.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/admin/ContentGenerationForm.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentGenerationForm } from '@/components/admin/ContentGenerationForm'

const mockFetch = vi.fn()
const mockOnGenerated = vi.fn()

describe('ContentGenerationForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders page selector, section selector, persona selector, and generate button', () => {
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    expect(screen.getByLabelText(/page/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/section/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/persona/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
  })

  it('populates section options when a page is selected', async () => {
    const user = userEvent.setup()
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    await user.selectOptions(screen.getByLabelText(/page/i), 'homepage')
    const sectionSelect = screen.getByLabelText(/section/i) as HTMLSelectElement
    // homepage has 4 sections (hero, features, social-proof, faq) plus placeholder
    expect(sectionSelect.options.length).toBeGreaterThanOrEqual(2)
  })

  it('calls POST /api/generate-content with correct body on submit', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'item-1', status: 'draft' }),
    })
    const user = userEvent.setup()
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    await user.selectOptions(screen.getByLabelText(/page/i), 'homepage')
    await user.selectOptions(screen.getByLabelText(/section/i), 'hero')
    await user.selectOptions(screen.getByLabelText(/persona/i), 'sarah')
    await user.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/generate-content',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"page":"homepage"'),
        })
      )
    })
  })

  it('calls onGenerated with item id and status on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'item-1', status: 'draft' }),
    })
    const user = userEvent.setup()
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    await user.selectOptions(screen.getByLabelText(/page/i), 'homepage')
    await user.selectOptions(screen.getByLabelText(/section/i), 'hero')
    await user.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalledWith('item-1', 'draft')
    })
  })

  it('shows needs_review warning when status is needs_review', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'item-1', status: 'needs_review' }),
    })
    const user = userEvent.setup()
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    await user.selectOptions(screen.getByLabelText(/page/i), 'homepage')
    await user.selectOptions(screen.getByLabelText(/section/i), 'hero')
    await user.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => {
      expect(screen.getByText(/needs review/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --reporter=verbose __tests__/components/admin/ContentGenerationForm.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Write components/admin/ContentGenerationForm.tsx**

```tsx
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
    ? Object.entries(CONTENT_CONFIG[page].sections).map(([key, cfg]) => ({ value: key, label: cfg.label }))
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --reporter=verbose __tests__/components/admin/ContentGenerationForm.test.tsx`

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ContentGenerationForm.tsx __tests__/components/admin/ContentGenerationForm.test.tsx
git commit -m "feat: add ContentGenerationForm with page/section/persona selectors and generation status"
```

---

## Task 8: ContentLibrary + tests

**Files:**
- Create: `components/admin/ContentLibrary.tsx`
- Create: `__tests__/components/admin/ContentLibrary.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/admin/ContentLibrary.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentLibrary } from '@/components/admin/ContentLibrary'
import type { ContentItem } from '@/lib/types'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const mockFetch = vi.fn()

const items: ContentItem[] = [
  {
    id: 'item-1',
    created_at: '2026-04-01T12:00:00Z',
    updated_at: '2026-04-01T12:00:00Z',
    page: 'homepage',
    section: 'hero',
    persona: 'sarah',
    content_type: 'headline',
    content_json: { headline: 'Your biology already knows how to perform' },
    status: 'published',
    generation_prompt: null,
    published_at: '2026-04-01T12:00:00Z',
  },
  {
    id: 'item-2',
    created_at: '2026-04-02T12:00:00Z',
    updated_at: '2026-04-02T12:00:00Z',
    page: 'product',
    section: 'features',
    persona: 'marcus',
    content_type: 'body',
    content_json: { headline: '600ml/min delivery rate' },
    status: 'draft',
    generation_prompt: null,
    published_at: null,
  },
]

describe('ContentLibrary', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders all content items', () => {
    render(<ContentLibrary items={items} />)
    expect(screen.getByText('Homepage / Hero')).toBeInTheDocument()
    expect(screen.getByText('Product / Features')).toBeInTheDocument()
  })

  it('shows headline preview from content_json', () => {
    render(<ContentLibrary items={items} />)
    expect(screen.getByText(/Your biology already knows/)).toBeInTheDocument()
  })

  it('filters items by page', async () => {
    const user = userEvent.setup()
    render(<ContentLibrary items={items} />)
    await user.selectOptions(screen.getByLabelText(/filter by page/i), 'homepage')
    expect(screen.getByText('Homepage / Hero')).toBeInTheDocument()
    expect(screen.queryByText('Product / Features')).not.toBeInTheDocument()
  })

  it('filters items by status', async () => {
    const user = userEvent.setup()
    render(<ContentLibrary items={items} />)
    await user.selectOptions(screen.getByLabelText(/filter by status/i), 'published')
    expect(screen.getByText('Homepage / Hero')).toBeInTheDocument()
    expect(screen.queryByText('Product / Features')).not.toBeInTheDocument()
  })

  it('delete button calls DELETE after confirm', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('confirm', () => true)
    const user = userEvent.setup()
    render(<ContentLibrary items={items} />)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/content/item-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --reporter=verbose __tests__/components/admin/ContentLibrary.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Write components/admin/ContentLibrary.tsx**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ContentItem } from '@/lib/types'
import { CONTENT_CONFIG } from '@/lib/content-config'

interface Props {
  items: ContentItem[]
}

const STATUS_STYLES: Record<string, string> = {
  published:    'bg-green-100 text-green-800',
  draft:        'bg-amber-100 text-amber-800',
  needs_review: 'bg-gray-100 text-gray-600',
}
const STATUS_LABELS: Record<string, string> = {
  published:    '● Published',
  draft:        '○ Draft',
  needs_review: '⚠ Review',
}
const PERSONA_STYLES: Record<string, string> = {
  sarah:  'bg-blue-100 text-blue-800',
  marcus: 'bg-amber-100 text-amber-800',
  elena:  'bg-purple-100 text-purple-800',
}

function getPreview(item: ContentItem): string {
  const json = item.content_json as Record<string, unknown>
  const text = String(json.headline ?? json.subheading ?? json.question ?? json.body ?? '')
  return text.length > 60 ? text.slice(0, 60) + '…' : text
}

function getPageSectionLabel(item: ContentItem): string {
  const pageLabel = CONTENT_CONFIG[item.page]?.label ?? item.page
  const sectionLabel = CONTENT_CONFIG[item.page]?.sections[item.section]?.label ?? item.section
  return `${pageLabel} / ${sectionLabel}`
}

export function ContentLibrary({ items: initialItems }: Props) {
  const [items, setItems] = useState<ContentItem[]>(initialItems)
  const [pageFilter, setPageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const pages = Object.entries(CONTENT_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))

  const filtered = items.filter(item => {
    if (pageFilter && item.page !== pageFilter) return false
    if (statusFilter && item.status !== statusFilter) return false
    return true
  })

  async function handleDelete(item: ContentItem) {
    if (!confirm('Delete this content item? This cannot be undone.')) return
    setItems(prev => prev.filter(i => i.id !== item.id))
    const res = await fetch(`/api/admin/content/${item.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setItems(prev => {
        const idx = initialItems.findIndex(i => i.id === item.id)
        const next = [...prev]
        next.splice(idx, 0, item)
        return next
      })
      setErrors(prev => ({ ...prev, [item.id]: 'Failed to delete' }))
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
          Content library{' '}
          <span className="font-normal text-gray-400">{items.length} items</span>
        </p>
        <div className="flex gap-2">
          <select
            aria-label="Filter by page"
            value={pageFilter}
            onChange={e => setPageFilter(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 font-sans text-xs text-ink"
          >
            <option value="">All pages</option>
            {pages.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 font-sans text-xs text-ink"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="needs_review">Needs review</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-sans text-sm text-ink-light">No content items yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="hidden grid-cols-[2fr_2fr_80px_80px_100px_110px] gap-2 border-b border-gray-100 px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink-light md:grid">
            <div>Page / Section</div>
            <div>Preview</div>
            <div>Persona</div>
            <div>Type</div>
            <div>Status</div>
            <div></div>
          </div>

          {filtered.map(item => (
            <div
              key={item.id}
              data-testid={`content-row-${item.id}`}
              className="flex flex-wrap items-center gap-2 border-b border-gray-50 px-4 py-3 last:border-b-0 md:grid md:grid-cols-[2fr_2fr_80px_80px_100px_110px]"
            >
              <p className="w-full font-sans text-sm font-medium text-ink md:w-auto">
                {getPageSectionLabel(item)}
              </p>
              <p className="hidden truncate font-sans text-xs text-ink-light md:block">
                {getPreview(item)}
              </p>
              <div>
                {item.persona ? (
                  <span className={`rounded px-1.5 py-0.5 font-mono text-xs capitalize ${PERSONA_STYLES[item.persona] ?? 'bg-gray-100 text-gray-600'}`}>
                    {item.persona}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-ink-light">General</span>
                )}
              </div>
              <p className="font-mono text-xs text-ink-light">{item.content_type}</p>
              <div>
                <span className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${STATUS_STYLES[item.status] ?? ''}`}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/content/${item.id}`}
                  className="rounded border border-gray-200 px-2 py-1 font-sans text-xs text-teal transition-colors hover:border-teal/50"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="rounded border border-gray-200 px-2 py-1 font-sans text-xs text-red-500 transition-colors hover:border-red-200 hover:bg-red-50"
                >
                  Delete
                </button>
                {errors[item.id] && (
                  <span className="font-sans text-xs text-red-500">{errors[item.id]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --reporter=verbose __tests__/components/admin/ContentLibrary.test.tsx`

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ContentLibrary.tsx __tests__/components/admin/ContentLibrary.test.tsx
git commit -m "feat: add ContentLibrary with page/status filters and optimistic delete"
```

---

## Task 9: /admin/content page (server shell)

**Files:**
- Create: `components/admin/ContentGenerationFormWithRedirect.tsx`
- Create: `app/admin/(protected)/content/page.tsx`

No tests needed — server shell; component logic is already tested.

- [ ] **Step 1: Create the redirect wrapper**

Create `components/admin/ContentGenerationFormWithRedirect.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { ContentGenerationForm } from './ContentGenerationForm'

export function ContentGenerationFormWithRedirect() {
  const router = useRouter()
  return (
    <ContentGenerationForm
      onGenerated={(id) => router.push(`/admin/content/${id}`)}
    />
  )
}
```

- [ ] **Step 2: Create the page**

Create `app/admin/(protected)/content/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContentLibrary } from '@/components/admin/ContentLibrary'
import { ContentGenerationFormWithRedirect } from '@/components/admin/ContentGenerationFormWithRedirect'
import type { ContentItem } from '@/lib/types'

export const metadata: Metadata = { title: 'Content | H2 Admin' }

export default async function ContentPage() {
  const supabase = createAdminClient()
  const { data: items } = await supabase
    .from('content_items')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Content generation</h1>
      </div>

      <div className="mb-8">
        <ContentGenerationFormWithRedirect />
      </div>

      <ContentLibrary items={(items ?? []) as ContentItem[]} />
    </>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/(protected)/content/page.tsx components/admin/ContentGenerationFormWithRedirect.tsx
git commit -m "feat: add /admin/content server page with generation form and content library"
```

---

## Task 10: ContentEditForm + tests

Per-field textareas driven by config, inline compliance errors on save, Publish button with compliance gate.

**Files:**
- Create: `components/admin/ContentEditForm.tsx`
- Create: `__tests__/components/admin/ContentEditForm.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/admin/ContentEditForm.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentEditForm } from '@/components/admin/ContentEditForm'
import type { ContentItem } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

const mockFetch = vi.fn()

const item: ContentItem = {
  id: 'item-1',
  created_at: '2026-04-01T12:00:00Z',
  updated_at: '2026-04-01T12:00:00Z',
  page: 'homepage',
  section: 'hero',
  persona: 'sarah',
  content_type: 'headline',
  content_json: {
    headline: 'Your biology already knows how to perform',
    subheading: 'Molecular hydrogen for energy',
    body: 'Research suggests hydrogen may support cellular function.',
    cta_text: 'Explore the science',
    image_suggestion: 'Woman at rest, morning light',
  },
  status: 'draft',
  generation_prompt: null,
  published_at: null,
}

describe('ContentEditForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders a field for each key defined in config for homepage/hero', () => {
    render(<ContentEditForm item={item} />)
    expect(screen.getByLabelText(/headline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subheading/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/body/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cta text/i)).toBeInTheDocument()
  })

  it('pre-fills fields with values from content_json', () => {
    render(<ContentEditForm item={item} />)
    expect(screen.getByDisplayValue('Your biology already knows how to perform')).toBeInTheDocument()
  })

  it('calls PATCH /api/admin/content/item-1 with content_json on save', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<ContentEditForm item={item} />)
    await user.click(screen.getByRole('button', { name: /save draft/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/content/item-1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"content_json"'),
        })
      )
    })
  })

  it('shows inline compliance error per field when PATCH returns 422', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        violations: [{ field: 'headline', word: 'treats' }],
      }),
    })
    const user = userEvent.setup()
    render(<ContentEditForm item={item} />)
    await user.click(screen.getByRole('button', { name: /save draft/i }))
    await waitFor(() => {
      expect(screen.getByText(/treats/i)).toBeInTheDocument()
    })
  })

  it('calls POST /api/admin/content/item-1/publish on publish click', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<ContentEditForm item={item} />)
    await user.click(screen.getByRole('button', { name: /publish/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/content/item-1/publish',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('shows compliance violation error when publish returns 422', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        violations: [{ field: 'body', word: 'cures' }],
      }),
    })
    const user = userEvent.setup()
    render(<ContentEditForm item={item} />)
    await user.click(screen.getByRole('button', { name: /publish/i }))
    await waitFor(() => {
      expect(screen.getByText(/cures/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --reporter=verbose __tests__/components/admin/ContentEditForm.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Write components/admin/ContentEditForm.tsx**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ContentItem, ContentStatus } from '@/lib/types'
import { CONTENT_CONFIG } from '@/lib/content-config'

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
  const sectionConfig = CONTENT_CONFIG[item.page]?.sections[item.section]
  const fieldDefs = sectionConfig?.fields ?? {}

  const [fields, setFields] = useState<Record<string, string>>(() => {
    const json = item.content_json as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(fieldDefs).map(key => [key, String(json[key] ?? '')])
    )
  })

  const [status, setStatus] = useState<ContentStatus>(item.status)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [publishError, setPublishError] = useState('')
  // Per-field compliance errors: { fieldName: 'prohibited word' }
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const imageHint = (item.content_json as Record<string, unknown>).image_suggestion as string | undefined

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setFieldErrors({})
    const res = await fetch(`/api/admin/content/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_json: { ...item.content_json, ...fields } }),
    })
    const data = await res.json()
    setSaving(false)
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
  }

  async function handlePublish() {
    setPublishing(true)
    setPublishError('')
    setFieldErrors({})
    const res = await fetch(`/api/admin/content/${item.id}/publish`, { method: 'POST' })
    const data = await res.json()
    setPublishing(false)
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
  }

  const pageLabel = CONTENT_CONFIG[item.page]?.label ?? item.page
  const sectionLabel = sectionConfig?.label ?? item.section
  const personaLabel = item.persona ? (PERSONA_LABELS[item.persona] ?? item.persona) : null

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

        {/* Right: AI image suggestion + meta */}
        <div>
          {imageHint && (
            <div className="mb-6 rounded-lg border border-teal-light bg-teal-light/40 p-4">
              <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-teal-dark">
                ✦ AI image suggestion
              </p>
              <p className="font-sans text-sm text-ink-mid">{imageHint}</p>
            </div>
          )}

          {/* Placeholder: ImagePanel (Plan 3c-media) */}
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center">
            <p className="font-sans text-xs text-ink-light">Image &amp; video panels — Plan 3c-media</p>
          </div>

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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --reporter=verbose __tests__/components/admin/ContentEditForm.test.tsx`

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ContentEditForm.tsx __tests__/components/admin/ContentEditForm.test.tsx
git commit -m "feat: add ContentEditForm with per-field textareas, inline compliance errors, and publish"
```

---

## Task 11: /admin/content/[id] edit page (server shell)

**Files:**
- Create: `app/admin/(protected)/content/[id]/page.tsx`

No tests needed — thin server shell; component logic is already tested.

- [ ] **Step 1: Create the edit page**

Create `app/admin/(protected)/content/[id]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContentEditForm } from '@/components/admin/ContentEditForm'
import { CONTENT_CONFIG } from '@/lib/content-config'
import type { ContentItem } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('content_items')
    .select('page, section')
    .eq('id', id)
    .single()
  if (!data) return { title: 'Edit content | H2 Admin' }
  const pageLabel = CONTENT_CONFIG[data.page]?.label ?? data.page
  const sectionLabel = CONTENT_CONFIG[data.page]?.sections[data.section]?.label ?? data.section
  return { title: `${pageLabel} / ${sectionLabel} | H2 Admin` }
}

export default async function ContentEditPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: item } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single()

  if (!item) notFound()

  return (
    <div className="max-w-4xl">
      <ContentEditForm item={item as ContentItem} />
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run --reporter=verbose`

Expected: All tests pass. Confirm test count includes the new tests from this plan.

- [ ] **Step 4: Commit**

```bash
git add app/admin/(protected)/content/[id]/page.tsx
git commit -m "feat: add /admin/content/[id] edit page — Phase 3c-core complete"
```

---

## Follow-on: Plan 3c-media

The following components are implemented in the separate **3c-media** plan. The `ContentEditForm` has a placeholder where they will slot in:

- `media` Supabase table (SQL migration)
- `GET/POST /api/admin/media` — image/video upload + library
- `components/admin/FocalPointSelector.tsx` — 3×3 crop selector
- `components/admin/ImageLibraryPicker.tsx` — library grid modal
- `components/admin/ImagePanel.tsx` — upload, resize, alt text, mobile slot
- `components/admin/VideoPanel.tsx` — ambient/content video with playback toggles
