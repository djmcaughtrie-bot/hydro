# Content Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire published `content_items` rows to the five public pages, with graceful hardcoded fallback, and rename personas from name-based slugs (`sarah/marcus/elena`) to focus-based slugs (`energy/performance/longevity`).

**Architecture:** A shared `lib/content.ts` utility (`getPageContent`) runs one Supabase query per page, returning a `Record<section, content_json>`. Public pages read `searchParams.persona`, call `getPageContent`, and merge results over hardcoded copy field-by-field. A `PersonaSelector` client component renders pill links for the two pages where persona switches meaningfully.

**Tech Stack:** Next.js 14 App Router (server components), Supabase JS v2, TypeScript, Tailwind CSS, Vitest + @testing-library/react

---

### Task 1: DB Migration — Rename Personas

**Files:**
- Create: `supabase/migrations/005_rename_personas.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/005_rename_personas.sql

-- 1. Migrate existing content_items data before dropping constraint
UPDATE public.content_items SET persona = 'energy'      WHERE persona = 'sarah';
UPDATE public.content_items SET persona = 'performance' WHERE persona = 'marcus';
UPDATE public.content_items SET persona = 'longevity'   WHERE persona = 'elena';

-- 2. Replace check constraint on content_items
ALTER TABLE public.content_items
  DROP CONSTRAINT IF EXISTS content_items_persona_check;
ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_persona_check
  CHECK (persona IN ('energy', 'performance', 'longevity'));

-- 3. Migrate existing leads data
UPDATE public.leads SET persona = 'energy'      WHERE persona = 'sarah';
UPDATE public.leads SET persona = 'performance' WHERE persona = 'marcus';
UPDATE public.leads SET persona = 'longevity'   WHERE persona = 'elena';

-- 4. Replace check constraint on leads
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_persona_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_persona_check
  CHECK (persona IN ('energy', 'performance', 'longevity', 'clinic', 'general'));
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Open Supabase dashboard → SQL Editor → paste and run the file contents.
Expected: "Success. No rows returned." for each statement.

- [ ] **Step 3: Commit migration file**

```bash
git add supabase/migrations/005_rename_personas.sql
git commit -m "feat: add migration to rename personas to energy/performance/longevity"
```

---

### Task 2: Rename Personas in Code

**Files:**
- Modify: `components/forms/WaitlistForm.tsx`
- Modify: `components/forms/EnquiryForm.tsx`
- Modify: `components/sections/PersonaCards.tsx`
- Modify: `components/admin/ContentEditForm.tsx`
- Modify: `components/admin/ContentGenerationForm.tsx`
- Modify: `components/admin/ContentLibrary.tsx`
- Modify: `app/(site)/product/page.tsx`
- Modify: `app/(site)/science/[category]/page.tsx`
- Modify: `app/admin/(protected)/leads/[id]/page.tsx`
- Modify: `__tests__/components/admin/ContentEditForm.test.tsx`
- Modify: `__tests__/components/admin/ContentLibrary.test.tsx`
- Modify: `__tests__/components/admin/ContentGenerationForm.test.tsx`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `components/forms/WaitlistForm.tsx`**

Find and replace:
```typescript
// Before
persona: z.enum(['sarah', 'marcus', 'elena']).optional(),
// ...
{ value: 'sarah', label: 'I want more energy and mental clarity' },
{ value: 'marcus', label: 'I train hard and want to recover better' },
{ value: 'elena', label: "I'm investing in longevity" },
```
```typescript
// After
persona: z.enum(['energy', 'performance', 'longevity']).optional(),
// ...
{ value: 'energy',      label: 'I want more energy and mental clarity' },
{ value: 'performance', label: 'I train hard and want to recover better' },
{ value: 'longevity',   label: "I'm investing in longevity" },
```

- [ ] **Step 2: Update `components/forms/EnquiryForm.tsx`**

```typescript
// Before
persona: z.enum(['sarah', 'marcus', 'elena']).optional(),
// ...
{ value: 'sarah' as const, label: 'Energy' },
{ value: 'marcus' as const, label: 'Recovery' },
{ value: 'elena' as const, label: 'Longevity' },
// ...
defaultPersona?: 'sarah' | 'marcus' | 'elena'
```
```typescript
// After
persona: z.enum(['energy', 'performance', 'longevity']).optional(),
// ...
{ value: 'energy'      as const, label: 'Energy' },
{ value: 'performance' as const, label: 'Performance' },
{ value: 'longevity'   as const, label: 'Longevity' },
// ...
defaultPersona?: 'energy' | 'performance' | 'longevity'
```

- [ ] **Step 3: Update `components/sections/PersonaCards.tsx`**

```typescript
// Before
{ href: '/product?persona=sarah',  ... },
{ href: '/product?persona=marcus', ... },
{ href: '/product?persona=elena',  ... },
```
```typescript
// After
{ href: '/product?persona=energy',      ... },
{ href: '/product?persona=performance', ... },
{ href: '/product?persona=longevity',   ... },
```

- [ ] **Step 4: Update `components/admin/ContentEditForm.tsx`**

```typescript
// Before
const PERSONA_LABELS: Record<string, string> = {
  sarah:  'Sarah',
  marcus: 'Marcus',
  elena:  'Elena',
}
```
```typescript
// After
const PERSONA_LABELS: Record<string, string> = {
  energy:      'Energy',
  performance: 'Performance',
  longevity:   'Longevity',
}
```

- [ ] **Step 5: Update `components/admin/ContentGenerationForm.tsx`**

```typescript
// Before
const PERSONAS = [
  { value: '',       label: 'General' },
  { value: 'sarah',  label: 'Sarah — Energy' },
  { value: 'marcus', label: 'Marcus — Performance' },
  { value: 'elena',  label: 'Elena — Longevity' },
]
```
```typescript
// After
const PERSONAS = [
  { value: '',            label: 'General' },
  { value: 'energy',      label: 'Energy' },
  { value: 'performance', label: 'Performance' },
  { value: 'longevity',   label: 'Longevity' },
]
```

- [ ] **Step 6: Update `components/admin/ContentLibrary.tsx`**

```typescript
// Before
const PERSONA_COLOURS: Record<string, string> = {
  sarah:  'bg-blue-100 text-blue-800',
  marcus: 'bg-amber-100 text-amber-800',
  elena:  'bg-purple-100 text-purple-800',
}
```
```typescript
// After
const PERSONA_COLOURS: Record<string, string> = {
  energy:      'bg-blue-100 text-blue-800',
  performance: 'bg-amber-100 text-amber-800',
  longevity:   'bg-purple-100 text-purple-800',
}
```

- [ ] **Step 7: Update `app/(site)/product/page.tsx`**

Replace the `outcomesTabs` object keys and `personaKeys` array:

```typescript
// Before
const outcomesTabs = {
  sarah: {
    label: 'Energy',
    content: "Molecular hydrogen has been studied...",
  },
  marcus: {
    label: 'Recovery',
    content: "Athletes exploring molecular hydrogen...",
  },
  elena: {
    label: 'Longevity',
    content: "Oxidative stress is one of the primary drivers...",
  },
} as const

type Persona = keyof typeof outcomesTabs
const personaKeys: Persona[] = ['sarah', 'marcus', 'elena']
// ...
const persona: Persona = personaKeys.includes(raw as Persona) ? (raw as Persona) : 'sarah'
```
```typescript
// After
const outcomesTabs = {
  energy: {
    label: 'Energy',
    content: "Molecular hydrogen has been studied for its potential effects on mitochondrial efficiency and cognitive function. Research suggests it may support mental clarity and sustained energy levels by addressing oxidative stress at the cellular level — without the stimulant effects of caffeine.",
  },
  performance: {
    label: 'Performance',
    content: "Athletes exploring molecular hydrogen report faster perceived recovery and reduced post-exercise inflammation markers. Studies suggest it may support the body's natural antioxidant response after intense training, potentially reducing muscle soreness and improving readiness for the next session.",
  },
  longevity: {
    label: 'Longevity',
    content: "Oxidative stress is one of the primary drivers of cellular ageing. Molecular hydrogen is a selective antioxidant — it targets only the most harmful free radicals, leaving beneficial reactive oxygen species intact. Research explores its potential role in supporting long-term cellular health.",
  },
} as const

type Persona = keyof typeof outcomesTabs
const personaKeys: Persona[] = ['energy', 'performance', 'longevity']
// ...
const persona: Persona = personaKeys.includes(raw as Persona) ? (raw as Persona) : 'energy'
```

Also update the tab links in JSX (they reference `persona=${key}` which is fine since key is now the new value), and update the `defaultPersona` prop passed to `EnquiryForm`:
```tsx
// Before
<EnquiryForm source="product" defaultPersona={persona} />
// After — no change needed, persona variable now holds the new values
<EnquiryForm source="product" defaultPersona={persona} />
```

- [ ] **Step 8: Update `app/(site)/science/[category]/page.tsx`**

Find the hardcoded persona mappings and update them:
```typescript
// Before
persona: 'sarah',  // (energy category)
persona: 'marcus', // (performance category)
persona: 'elena',  // (longevity category)
// and the type:
persona: 'sarah' | 'marcus' | 'elena' | null
```
```typescript
// After
persona: 'energy',      // (energy category)
persona: 'performance', // (performance category)
persona: 'longevity',   // (longevity category)
// and the type:
persona: 'energy' | 'performance' | 'longevity' | null
```

- [ ] **Step 9: Update `app/admin/(protected)/leads/[id]/page.tsx`**

```typescript
// Before
const PERSONA_LABELS: Record<string, string> = {
  sarah:   'Sarah — Energy',
  marcus:  'Marcus — Recovery',
  elena:   'Elena — Longevity',
  clinic:  'Clinic',
  general: 'General',
}
```
```typescript
// After
const PERSONA_LABELS: Record<string, string> = {
  energy:      'Energy',
  performance: 'Performance',
  longevity:   'Longevity',
  clinic:      'Clinic',
  general:     'General',
}
```

- [ ] **Step 10: Update test files**

In `__tests__/components/admin/ContentEditForm.test.tsx`, line ~19:
```typescript
// Before
persona: 'sarah',
// After
persona: 'energy',
```

In `__tests__/components/admin/ContentLibrary.test.tsx`, lines ~22 and ~35:
```typescript
// Before
persona: 'sarah',
// ...
persona: 'marcus',
// After
persona: 'energy',
// ...
persona: 'performance',
```

In `__tests__/components/admin/ContentGenerationForm.test.tsx`, line ~41:
```typescript
// Before
await user.selectOptions(screen.getByLabelText(/persona/i), 'sarah')
// After
await user.selectOptions(screen.getByLabelText(/persona/i), 'energy')
```

- [ ] **Step 11: Update CLAUDE.md**

In the Supabase schema section, update the persona check comment:
```
-- Before
persona text,          -- 'sarah' | 'marcus' | 'elena' | 'clinic' | 'general'
-- After
persona text,          -- 'energy' | 'performance' | 'longevity' | 'clinic' | 'general'
```

In the messaging framework section, update the persona names:
```
-- Before: Sarah Mitchell, Marcus Chen, Elena Rossi
-- After: Energy persona, Performance persona, Longevity persona
```

- [ ] **Step 12: Run all tests — expect 159 passing**

```bash
npx vitest run
```
Expected: `Tests  159 passed (159)`

If any test fails, it is because a persona value string wasn't updated. Fix it before proceeding.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: rename personas from sarah/marcus/elena to energy/performance/longevity"
```

---

### Task 3: `lib/content.ts` — Data Utility

**Files:**
- Create: `__tests__/lib/content.test.ts`
- Create: `lib/content.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/content.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn(() => mockSelect()),
        is: vi.fn(() => mockSelect()),
      })),
    })),
  })),
}))

describe('getPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns empty object when no published rows exist', async () => {
    mockSelect.mockResolvedValue({ data: [] })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero'], null)
    expect(result).toEqual({})
  })

  it('returns general content when persona is null', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { section: 'hero', persona: null, content_json: { headline: 'General headline' } },
      ],
    })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero'], null)
    expect(result['hero']).toEqual({ headline: 'General headline' })
  })

  it('returns persona-specific content over general for same section', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { section: 'hero', persona: null,     content_json: { headline: 'General headline' } },
        { section: 'hero', persona: 'energy', content_json: { headline: 'Energy headline' } },
      ],
    })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero'], 'energy')
    expect(result['hero']).toEqual({ headline: 'Energy headline' })
  })

  it('returns both general and persona-specific for different sections', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { section: 'hero',     persona: null,     content_json: { headline: 'General hero' } },
        { section: 'features', persona: 'energy', content_json: { headline: 'Energy features' } },
      ],
    })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero', 'features'], 'energy')
    expect(result['hero']).toEqual({ headline: 'General hero' })
    expect(result['features']).toEqual({ headline: 'Energy features' })
  })

  it('returns empty object when query returns null data', async () => {
    mockSelect.mockResolvedValue({ data: null })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero'], null)
    expect(result).toEqual({})
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run __tests__/lib/content.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/content'`

- [ ] **Step 3: Implement `lib/content.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'

export type PageContent = Record<string, Record<string, unknown>>

export async function getPageContent(
  page: string,
  sections: string[],
  persona: string | null
): Promise<PageContent> {
  const supabase = await createClient()

  const baseQuery = supabase
    .from('content_items')
    .select('section, persona, content_json')
    .eq('page', page)
    .eq('status', 'published')
    .in('section', sections)

  const { data } = persona
    ? await baseQuery.or(`persona.eq.${persona},persona.is.null`)
    : await baseQuery.is('persona', null)

  if (!data || data.length === 0) return {}

  const result: PageContent = {}

  // First pass: general rows (persona IS NULL)
  for (const row of data) {
    if (row.persona === null) {
      result[row.section] = row.content_json as Record<string, unknown>
    }
  }

  // Second pass: persona-specific rows override general
  if (persona) {
    for (const row of data) {
      if (row.persona === persona) {
        result[row.section] = row.content_json as Record<string, unknown>
      }
    }
  }

  return result
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run __tests__/lib/content.test.ts
```
Expected: `Tests  5 passed (5)`

- [ ] **Step 5: Run full suite — verify still 159 passing**

```bash
npx vitest run
```
Expected: `Tests  164 passed (164)`

- [ ] **Step 6: Commit**

```bash
git add lib/content.ts __tests__/lib/content.test.ts
git commit -m "feat: add getPageContent utility with persona-priority fallback"
```

---

### Task 4: `PersonaSelector` Component

**Files:**
- Create: `__tests__/components/PersonaSelector.test.tsx`
- Create: `components/PersonaSelector.tsx`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/PersonaSelector.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonaSelector } from '@/components/PersonaSelector'

describe('PersonaSelector', () => {
  it('renders General, Energy, Performance, Longevity links', () => {
    render(<PersonaSelector current={null} />)
    expect(screen.getByRole('link', { name: 'General' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Energy' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Performance' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Longevity' })).toBeDefined()
  })

  it('marks General as active when current is null', () => {
    render(<PersonaSelector current={null} />)
    const general = screen.getByRole('link', { name: 'General' })
    expect(general.className).toContain('bg-teal')
  })

  it('marks the active persona with teal background', () => {
    render(<PersonaSelector current="energy" />)
    const energy = screen.getByRole('link', { name: 'Energy' })
    expect(energy.className).toContain('bg-teal')
    const general = screen.getByRole('link', { name: 'General' })
    expect(general.className).not.toContain('bg-teal')
  })

  it('persona links point to correct ?persona= URLs', () => {
    render(<PersonaSelector current={null} />)
    expect(screen.getByRole('link', { name: 'Energy' })).toHaveAttribute('href', '?persona=energy')
    expect(screen.getByRole('link', { name: 'Performance' })).toHaveAttribute('href', '?persona=performance')
    expect(screen.getByRole('link', { name: 'Longevity' })).toHaveAttribute('href', '?persona=longevity')
  })

  it('General link clears persona param', () => {
    render(<PersonaSelector current="energy" />)
    expect(screen.getByRole('link', { name: 'General' })).toHaveAttribute('href', '?')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run __tests__/components/PersonaSelector.test.tsx
```
Expected: FAIL — `Cannot find module '@/components/PersonaSelector'`

- [ ] **Step 3: Implement `components/PersonaSelector.tsx`**

```tsx
'use client'

import Link from 'next/link'

type Persona = 'energy' | 'performance' | 'longevity'

const PERSONAS: { value: Persona; label: string }[] = [
  { value: 'energy',      label: 'Energy' },
  { value: 'performance', label: 'Performance' },
  { value: 'longevity',   label: 'Longevity' },
]

interface Props {
  current: Persona | null
}

export function PersonaSelector({ current }: Props) {
  return (
    <div className="flex flex-wrap gap-2 py-4">
      <Link
        href="?"
        className={`rounded-pill border px-4 py-1.5 font-sans text-sm font-medium transition-colors ${
          current === null
            ? 'border-teal bg-teal text-white'
            : 'border-ink-light/30 text-ink-mid hover:border-teal/50'
        }`}
      >
        General
      </Link>
      {PERSONAS.map(({ value, label }) => (
        <Link
          key={value}
          href={`?persona=${value}`}
          className={`rounded-pill border px-4 py-1.5 font-sans text-sm font-medium transition-colors ${
            current === value
              ? 'border-teal bg-teal text-white'
              : 'border-ink-light/30 text-ink-mid hover:border-teal/50'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run __tests__/components/PersonaSelector.test.tsx
```
Expected: `Tests  5 passed (5)`

- [ ] **Step 5: Run full suite**

```bash
npx vitest run
```
Expected: `Tests  169 passed (169)`

- [ ] **Step 6: Commit**

```bash
git add components/PersonaSelector.tsx __tests__/components/PersonaSelector.test.tsx
git commit -m "feat: add PersonaSelector pill component"
```

---

### Task 5: Wire Homepage

**Files:**
- Modify: `app/(site)/page.tsx`

The homepage hero section in content-config has fields: `headline`, `subheading`, `body`, `cta_text`.
The features section has: `headline`, `body`.
The social-proof section (key: `'social-proof'`) has: `quote`, `attribution`.

- [ ] **Step 1: Replace `app/(site)/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { TrustBar } from '@/components/sections/TrustBar'
import { PersonaCards } from '@/components/sections/PersonaCards'
import { PersonaSelector } from '@/components/PersonaSelector'
import { getPageContent } from '@/lib/content'

export const metadata: Metadata = {
  title: 'H2 Revive — Hydrogen Inhalation Technology',
  description:
    "The UK's dedicated hydrogen inhalation wellness brand. Research-backed molecular hydrogen technology for energy, recovery, and longevity.",
}

const VALID_PERSONAS = ['energy', 'performance', 'longevity'] as const
type Persona = typeof VALID_PERSONAS[number]

interface Props {
  searchParams: { persona?: string }
}

export default async function HomePage({ searchParams }: Props) {
  const raw = searchParams.persona
  const persona: Persona | null = VALID_PERSONAS.includes(raw as Persona) ? (raw as Persona) : null

  const content = await getPageContent(
    'homepage',
    ['hero', 'features', 'social-proof'],
    persona
  )

  const hero = content['hero'] ?? {}
  const features = content['features'] ?? {}
  const socialProof = content['social-proof'] ?? {}

  const heroHeadline = (hero.headline as string) ?? 'The smallest molecule in existence. The biggest idea in British wellness.'
  const heroBody = (hero.body as string) ?? 'Clinically studied. UK-based. Built for the serious.'
  const heroCta = (hero.cta_text as string) ?? 'Explore the device'

  const featuresHeadline = (features.headline as string) ?? '50+ peer-reviewed studies. One remarkable molecule.'
  const featuresBody = (features.body as string) ?? 'Molecular hydrogen is the smallest antioxidant in existence. It crosses the blood-brain barrier, enters mitochondria, and selectively neutralises only the most harmful free radicals.'

  return (
    <div>
      {/* Hero */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                Hydrogen inhalation technology
              </p>
              <h1 className="mb-4 font-display text-5xl leading-tight text-ink sm:text-6xl">
                {heroHeadline}
              </h1>
              <p className="mb-6 font-sans text-base text-ink-mid">{heroBody}</p>
              <PersonaSelector current={persona} />
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/product${persona ? `?persona=${persona}` : ''}`}
                  className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
                >
                  {heroCta}
                </Link>
                <span
                  className="inline-flex cursor-not-allowed items-center rounded-pill border border-ink-mid/30 px-6 py-2.5 font-sans text-sm font-medium text-ink-light"
                  title="Coming soon"
                  aria-disabled="true"
                >
                  See the science
                </span>
              </div>
            </div>
            <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-ink-light/20">
              <span className="font-sans text-sm text-ink-light">Product image</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <TrustBar />

      {/* Persona cards */}
      <PersonaCards />

      {/* CEO intro */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-3">
            <div className="flex justify-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-ink-light/20">
                <span className="font-sans text-xs text-ink-light">CEO portrait</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <blockquote className="font-display text-2xl leading-snug text-ink">
                {socialProof.quote
                  ? `\u201c${socialProof.quote as string}\u201d`
                  : '\u201cI started H2 Revive because I believe the British market deserves honest, research-backed wellness technology. No overclaiming. Just the science.\u201d'}
              </blockquote>
              <Link
                href="/about"
                className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-teal hover:text-teal-dark"
              >
                Our story &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Science teaser */}
      <section className="bg-teal-light py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-4 font-display text-4xl text-ink">{featuresHeadline}</h2>
          <p className="mx-auto mb-8 max-w-xl font-sans text-base text-ink-mid">{featuresBody}</p>
          <span
            className="inline-flex cursor-not-allowed font-mono text-xs uppercase tracking-widest text-ink-light"
            title="Coming soon"
          >
            Explore the research &mdash; coming soon
          </span>
        </div>
      </section>

      {/* Product hero */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-ink-mid/30">
              <span className="font-sans text-sm text-ink-light">Product image</span>
            </div>
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                The device
              </p>
              <h2 className="mb-4 font-display text-4xl text-white">
                The device built around the science.
              </h2>
              <p className="mb-8 font-sans text-base text-ink-light">
                CE certified. 2-year UK warranty. Up to 1,200&nbsp;ppb H&#8322; concentration.
              </p>
              <Link
                href={`/product${persona ? `?persona=${persona}` : ''}`}
                className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
              >
                Enquire now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: all tests still pass (pages are not unit-tested).

- [ ] **Step 3: Verify in browser**

Start dev server: `npm run dev`
Visit `http://localhost:3000` — page renders with hardcoded copy.
Visit `http://localhost:3000?persona=energy` — PersonaSelector shows Energy as active.
No blank fields or errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(site\)/page.tsx
git commit -m "feat: wire homepage to content_items with persona selector"
```

---

### Task 6: Wire Product Page

**Files:**
- Modify: `app/(site)/product/page.tsx`

The product hero section has fields: `headline`, `subheading`, `body`, `cta_text`.
The features section (`features`) has: `headline`, `body` — this replaces the outcomes tab copy.
The `how-it-works` section has: `headline`, `body`.
The `cta` section has: `headline`, `subheading`, `cta_text`.

- [ ] **Step 1: Update `app/(site)/product/page.tsx`**

Add imports and make the component async:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { EnquiryForm } from '@/components/forms/EnquiryForm'
import { Accordion } from '@/components/ui/Accordion'
import { PersonaSelector } from '@/components/PersonaSelector'
import { getPageContent } from '@/lib/content'

export const metadata: Metadata = {
  title: 'The Device',
  description:
    'Hydrogen inhalation technology for energy, recovery, and longevity. Enquire about the H2 Revive device.',
}

const outcomesTabs = {
  energy: {
    label: 'Energy',
    content: "Molecular hydrogen has been studied for its potential effects on mitochondrial efficiency and cognitive function. Research suggests it may support mental clarity and sustained energy levels by addressing oxidative stress at the cellular level — without the stimulant effects of caffeine.",
  },
  performance: {
    label: 'Performance',
    content: "Athletes exploring molecular hydrogen report faster perceived recovery and reduced post-exercise inflammation markers. Studies suggest it may support the body's natural antioxidant response after intense training, potentially reducing muscle soreness and improving readiness for the next session.",
  },
  longevity: {
    label: 'Longevity',
    content: "Oxidative stress is one of the primary drivers of cellular ageing. Molecular hydrogen is a selective antioxidant — it targets only the most harmful free radicals, leaving beneficial reactive oxygen species intact. Research explores its potential role in supporting long-term cellular health.",
  },
} as const

type Persona = keyof typeof outcomesTabs
const personaKeys: Persona[] = ['energy', 'performance', 'longevity']

const specRows: [string, string][] = [
  ['H₂ concentration', 'Up to 1,200 ppb'],
  ['H₂ purity', '≥99.99%'],
  ['Session length', '20–60 minutes'],
  ['Water per session', '~250ml'],
  ['Certifications', 'CE, RoHS'],
  ['Warranty', '2 years (UK)'],
]

const productFaqs = [
  {
    question: 'Do I need any special setup?',
    answer: 'No. The device requires only water and a standard UK power outlet. Simply fill the chamber, switch on, and breathe.',
  },
  {
    question: 'How often should I use it?',
    answer: 'Most users complete one 20–60 minute session daily. The device can be used morning or evening to suit your routine.',
  },
  {
    question: 'What water should I use?',
    answer: 'We recommend distilled or filtered water for optimal hydrogen concentration and to maintain device longevity.',
  },
  {
    question: 'Is it safe to use every day?',
    answer: 'Research studies involving daily hydrogen inhalation have reported no adverse effects. As with any wellness practice, consult your healthcare provider if you have an existing medical condition.',
  },
  {
    question: 'How quickly will I notice results?',
    answer: 'Individual experiences vary. Some users report changes within days; others over weeks. We recommend consistent daily use for at least 30 days before assessing.',
  },
]

interface ProductPageProps {
  searchParams: { persona?: string }
}

export default async function ProductPage({ searchParams }: ProductPageProps) {
  const raw = searchParams.persona
  const persona: Persona = personaKeys.includes(raw as Persona) ? (raw as Persona) : 'energy'

  const content = await getPageContent(
    'product',
    ['hero', 'features', 'how-it-works', 'cta'],
    persona
  )

  const hero = content['hero'] ?? {}
  const features = content['features'] ?? {}
  const howItWorks = content['how-it-works'] ?? {}
  const cta = content['cta'] ?? {}

  const heroHeadline = (hero.headline as string) ?? 'Breathe the science.'
  const heroBody = (hero.body as string) ?? 'H\u2082 concentration up to 1,200\u00a0ppb. Session length 20\u201360 minutes. CE certified.'
  const heroCta = (hero.cta_text as string) ?? 'Enquire now'

  const tabContent = (features.body as string) ?? outcomesTabs[persona].content

  const ctaHeadline = (cta.headline as string) ?? 'Enquire about the device.'
  const ctaSubheading = (cta.subheading as string) ?? "We\u2019re taking enquiries ahead of our UK launch. Tell us about yourself and we\u2019ll be in touch."

  return (
    <div>
      {/* Hero */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="order-2 flex aspect-[4/5] items-center justify-center rounded-lg bg-ink-mid/30 md:order-1">
              <span className="font-sans text-sm text-ink-light">Product image</span>
            </div>
            <div className="order-1 md:order-2">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                The device
              </p>
              <h1 className="mb-4 font-display text-5xl leading-tight text-white">
                {heroHeadline}
              </h1>
              <p className="mb-6 font-sans text-base text-ink-light">{heroBody}</p>
              <PersonaSelector current={persona} />
              <div className="mt-4">
                <a
                  href="#enquiry"
                  className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
                >
                  {heroCta}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes tabs */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">
            What the research explores
          </p>
          <div className="mb-8 flex flex-wrap gap-2">
            {personaKeys.map((key) => (
              <Link
                key={key}
                href={`/product?persona=${key}`}
                className={`rounded-pill border px-5 py-2 font-sans text-sm font-medium transition-colors ${
                  persona === key
                    ? 'border-teal bg-teal text-white'
                    : 'border-ink-light/30 text-ink-mid hover:border-teal/50'
                }`}
              >
                {outcomesTabs[key].label}
              </Link>
            ))}
          </div>
          <p className="max-w-2xl font-sans text-base leading-relaxed text-ink-mid">
            {tabContent}
          </p>
        </div>
      </section>

      {/* Spec table */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">
            Technical specification
          </p>
          <div className="max-w-lg overflow-hidden rounded-lg border border-ink-light/20">
            <table className="w-full">
              <tbody>
                {specRows.map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? 'bg-cream/50' : 'bg-white'}>
                    <td className="px-4 py-3 font-sans text-sm font-medium text-ink">{label}</td>
                    <td className="px-4 py-3 font-sans text-sm text-ink-mid">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-10 font-mono text-xs uppercase tracking-widest text-teal">
            {(howItWorks.headline as string) ?? 'How it works'}
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { n: 1, title: 'Fill', body: 'Fill the chamber with distilled or filtered water.' },
              { n: 2, title: 'Breathe', body: 'Breathe the hydrogen-enriched air through the included nasal cannula.' },
              { n: 3, title: 'Feel', body: 'Complete your session in 20–60 minutes. Use daily for best results.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex flex-col items-start">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-teal font-mono text-sm font-bold text-white">
                  {n}
                </div>
                <p className="mb-2 font-display text-xl text-ink">{title}</p>
                <p className="font-sans text-sm leading-relaxed text-ink-mid">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry form */}
      <section id="enquiry" className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                Get in touch
              </p>
              <h2 className="mb-4 font-display text-4xl text-white">{ctaHeadline}</h2>
              <p className="font-sans text-sm text-ink-light">{ctaSubheading}</p>
            </div>
            <div>
              <EnquiryForm source="product" defaultPersona={persona} />
              <p className="mt-4 font-sans text-xs leading-relaxed text-ink-light/60">
                These statements have not been evaluated by the MHRA. This product is not intended
                to diagnose, treat, cure, or prevent any disease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product FAQ */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-2xl px-6">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Questions</p>
          <h2 className="mb-8 font-display text-3xl text-ink">About the device.</h2>
          <Accordion items={productFaqs} />
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: all tests pass.

- [ ] **Step 3: Verify in browser**

Visit `http://localhost:3000/product` — renders with hardcoded copy, Energy tab active by default.
Visit `http://localhost:3000/product?persona=longevity` — Longevity tab active, PersonaSelector shows Longevity highlighted.

- [ ] **Step 4: Commit**

```bash
git add app/\(site\)/product/page.tsx
git commit -m "feat: wire product page to content_items with persona selector"
```

---

### Task 7: Wire About and FAQ Pages

**Files:**
- Modify: `app/(site)/about/page.tsx`
- Modify: `app/(site)/faq/page.tsx`

Neither page shows a PersonaSelector. About wires `hero` and `ceo-story`. FAQ wires `hero` only (multiple FAQ items are out of scope).

- [ ] **Step 1: Update `app/(site)/about/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { getPageContent } from '@/lib/content'

export const metadata: Metadata = {
  title: 'About',
  description:
    'The story behind H2 Revive — why we built it, who we are, and what we believe about wellness.',
}

const values = [
  {
    label: 'Research first',
    body: 'Every claim we make is grounded in peer-reviewed science. We cite our sources and encourage you to read them.',
  },
  {
    label: 'No overclaiming',
    body: 'We use language like "research suggests" and "studies explore" — never "treats", "cures", or "guaranteed". Honesty is the brand.',
  },
  {
    label: 'Built for the serious',
    body: "H2 Revive is for people who do their homework. If you're here, you probably already know why molecular hydrogen is interesting.",
  },
]

export default async function AboutPage() {
  const content = await getPageContent('about', ['hero', 'ceo-story'], null)

  const hero = content['hero'] ?? {}
  const ceoStory = content['ceo-story'] ?? {}

  const heroHeadline = (hero.headline as string) ?? 'Why I started H2\u00a0Revive.'
  const storyHeadline = (ceoStory.headline as string) ?? null
  const storyBody = (ceoStory.body as string) ?? null

  return (
    <div className="bg-cream">
      {/* Hero */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Our story</p>
        <h1 className="max-w-xl font-display text-5xl leading-tight text-ink">
          {heroHeadline}
        </h1>
      </div>

      {/* Story */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="flex justify-center md:justify-start">
            <div className="flex h-64 w-64 items-center justify-center rounded-full bg-ink-light/20">
              <span className="font-sans text-sm text-ink-light">CEO portrait</span>
            </div>
          </div>
          <div className="space-y-6 md:col-span-2">
            {storyHeadline && (
              <h2 className="font-display text-2xl text-ink">{storyHeadline}</h2>
            )}
            {storyBody ? (
              <p className="font-sans text-base leading-relaxed text-ink-mid">{storyBody}</p>
            ) : (
              <>
                <p className="font-sans text-base leading-relaxed text-ink-mid">
                  [Placeholder: Founder discovery story — how they first encountered molecular hydrogen
                  research, what drew them to the science, and the moment they decided the UK market
                  needed an honest, research-led brand in this space.]
                </p>
                <p className="font-sans text-base leading-relaxed text-ink-mid">
                  [Placeholder: Why the UK — the gap in the market. No credible, consumer-facing
                  hydrogen inhalation brand. The commitment to bringing CE-certified technology to
                  British consumers with full warranty and support.]
                </p>
                <p className="font-sans text-base leading-relaxed text-ink-mid">
                  [Placeholder: Product selection rationale — how H2 Revive evaluated and chose the
                  device. Criteria: H₂ concentration levels, safety certification, session length,
                  ease of use.]
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {values.map(({ label, body }) => (
              <div key={label}>
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-teal">
                  {label}
                </p>
                <p className="font-sans text-sm leading-relaxed text-ink-light">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="font-display text-2xl text-ink">Questions? I read every email.</p>
        <p className="mt-2 font-sans text-sm text-ink-mid">
          Reach out directly:{' '}
          <a href="mailto:hello@h2revive.co.uk" className="text-teal underline hover:text-teal-dark">
            hello@h2revive.co.uk
          </a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `app/(site)/faq/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { Accordion } from '@/components/ui/Accordion'
import { getPageContent } from '@/lib/content'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about the H2 Revive hydrogen inhalation device.',
}

const faqs = [
  {
    question: 'Is hydrogen inhalation safe?',
    answer: 'Molecular hydrogen has been used in research settings for over 15 years with a strong safety profile. Studies involving human participants have reported no serious adverse effects. As with any wellness device, we recommend consulting your healthcare provider if you have a medical condition.',
  },
  {
    question: 'What does the research actually show?',
    answer: "Over 50 peer-reviewed studies have explored molecular hydrogen's effects on oxidative stress, inflammation, and cellular health. The research is promising, particularly in areas of athletic recovery, cognitive function, and longevity markers. We cite all studies for educational purposes — these findings do not constitute medical claims.",
  },
  {
    question: 'How much does it cost?',
    answer: 'The H2 Revive device is priced at £1,200–1,600 depending on configuration. Please submit an enquiry for a full quote tailored to your needs.',
  },
  {
    question: 'How long does a session take?',
    answer: 'A typical session is 20–60 minutes. Most people use the device once daily, though session length and frequency can be adjusted to suit your routine.',
  },
  {
    question: 'What do I need to use it?',
    answer: 'The device requires only water and a standard UK power outlet. No specialist installation, tubing, or consumables are required beyond distilled or filtered water.',
  },
  {
    question: 'Is there a warranty?',
    answer: 'All H2 Revive devices come with a full 2-year UK warranty covering manufacturing defects. Our UK-based support team is available to assist with any issues.',
  },
  {
    question: 'Can I return it?',
    answer: "We encourage all prospective customers to speak with us before purchasing so we can ensure the device is right for you. Please contact us to discuss your needs — we're happy to answer any questions before you commit.",
  },
  {
    question: 'When will it be available in the UK?',
    answer: 'We are currently taking enquiries ahead of our UK launch. Submit an enquiry or join our waitlist to be among the first to receive a device.',
  },
]

export default async function FAQPage() {
  const content = await getPageContent('faq', ['hero'], null)
  const hero = content['hero'] ?? {}

  const heroHeadline = (hero.headline as string) ?? 'Common questions.'

  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">FAQ</p>
        <h1 className="mb-10 font-display text-4xl text-ink">{heroHeadline}</h1>
        <Accordion items={faqs} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```
Expected: all tests pass.

- [ ] **Step 4: Verify in browser**

Visit `http://localhost:3000/about` — renders with placeholder copy unchanged.
Visit `http://localhost:3000/faq` — renders with hardcoded FAQ items unchanged.

- [ ] **Step 5: Commit**

```bash
git add app/\(site\)/about/page.tsx app/\(site\)/faq/page.tsx
git commit -m "feat: wire about and faq pages to content_items"
```

---

### Task 8: Wire Science Page

**Files:**
- Modify: `app/(site)/science/page.tsx`

Wire the `hero` section only. Study grid is already data-driven. No PersonaSelector.

- [ ] **Step 1: Update `app/(site)/science/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { StudyGrid } from '@/components/science/StudyGrid'
import { getPageContent } from '@/lib/content'
import type { Study } from '@/lib/types'

export const metadata: Metadata = {
  title: 'The Science',
  description:
    '50+ peer-reviewed studies on molecular hydrogen — summarised in plain English. Research on energy, recovery, longevity, inflammation, safety, and respiratory health.',
}

export default async function SciencePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('studies')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const studies: Study[] = data ?? []

  const content = await getPageContent('science', ['hero'], null)
  const hero = content['hero'] ?? {}

  const heroHeadline = (hero.headline as string) ?? '50+ peer-reviewed studies.\nOne remarkable molecule.'
  const heroBody = (hero.body as string) ?? 'Peer-reviewed research on molecular hydrogen — summarised for humans.'

  return (
    <>
      {/* Hero */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-teal">
            The Science
          </p>
          <h1 className="font-display text-5xl leading-tight text-white md:text-6xl">
            {heroHeadline}
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base text-ink-light">{heroBody}</p>
          <div className="mt-8 flex flex-wrap gap-8">
            {[
              { value: '52', label: 'studies' },
              { value: '18', label: 'human trials' },
              { value: '6',  label: 'categories' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="font-mono text-3xl text-teal">{value}</div>
                <div className="font-mono text-xs text-ink-light">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mechanism explainer */}
      <section className="bg-cream py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
              The Mechanism
            </p>
            <h2 className="mb-4 font-display text-2xl text-ink">A selective antioxidant.</h2>
            <p className="font-sans text-base leading-relaxed text-ink-mid">
              Molecular hydrogen is the smallest antioxidant in existence. Unlike
              broad-spectrum antioxidants, research suggests H₂ selectively neutralises
              only the most damaging free radicals — specifically hydroxyl radicals —
              leaving beneficial reactive oxygen species intact.{' '}
              <a
                href="https://doi.org/10.1038/nm1577"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal underline-offset-2 hover:text-teal-dark hover:underline"
              >
                A 2007 study in Nature Medicine by Ohsawa et al.
              </a>{' '}
              was the first to document this selective mechanism in a peer-reviewed context.
            </p>
          </div>
        </div>
      </section>

      {/* Study grid */}
      <section className="bg-cream pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <Suspense fallback={<p className="font-sans text-sm text-ink-light">Loading studies...</p>}>
            <StudyGrid studies={studies} />
          </Suspense>
        </div>
      </section>

      {/* MHRA disclaimer */}
      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4">
          <p className="font-sans text-xs leading-relaxed text-amber-800">
            These statements have not been evaluated by the MHRA. This product is not
            intended to diagnose, treat, cure, or prevent any disease. Research
            referenced is cited for educational purposes.
          </p>
        </div>
      </div>

      {/* CTA */}
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-4 font-display text-3xl text-white">Ready to try it?</h2>
          <Link
            href="/product"
            className="inline-flex rounded-pill bg-teal px-8 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
          >
            Enquire about the device
          </Link>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: all tests pass.

- [ ] **Step 3: Verify in browser**

Visit `http://localhost:3000/science` — page renders with hardcoded copy, study grid loads.

- [ ] **Step 4: Commit and push**

```bash
git add app/\(site\)/science/page.tsx
git commit -m "feat: wire science page hero to content_items"
git push origin master
```

---

## Self-Review Notes

- **Spec coverage:** All sections covered — persona rename (Task 2), `lib/content.ts` (Task 3), PersonaSelector (Task 4), all 5 pages (Tasks 5–8). Clinics page correctly excluded (not yet built).
- **Section key consistency:** Content-config uses `'social-proof'`, `'how-it-works'`, `'ceo-story'` with hyphens. All tasks use these exact strings in `getPageContent` calls.
- **Persona type consistency:** `Persona` type is `'energy' | 'performance' | 'longevity'` throughout — defined locally in each page (no shared type needed).
- **FAQ items:** Multiple FAQ items per section are out of scope. Only the hero heading is wired on the FAQ page.
- **Test counts:** Start 159 → +5 content tests → +5 PersonaSelector tests = 169 total.
