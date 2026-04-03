# Science Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Science Hub — `/science` filterable study index and `/science/[category]` deep-dive pages — backed by seeded Supabase data.

**Architecture:** All published studies are fetched server-side and passed to `StudyGrid` (client component) for client-side URL-param-synced filtering. Category pages are pure server components — no client filtering needed. `StudyCard` is a shared server-friendly presentational component used by both.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase SSR (`@supabase/ssr`), Vitest + Testing Library, `next/navigation` (`useSearchParams`, `useRouter`).

---

## File map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/types.ts` | Create | `Study` interface shared across components and pages |
| `supabase/migrations/002_studies_seed.sql` | Create | 8 seed studies covering all 6 categories |
| `components/science/StudyCard.tsx` | Create | Presentational card — evidence badge, type tag, key finding callout, DOI/PubMed links |
| `components/science/StudyGrid.tsx` | Create | `'use client'` — filter pills, URL param sync, filtered 2-col grid |
| `app/(site)/science/page.tsx` | Create | Server component — fetches all studies, renders dark hero + mechanism + StudyGrid + CTA |
| `app/(site)/science/[category]/page.tsx` | Create | Server component — fetches category studies, renders mechanism + persona block + StudyCard grid |
| `middleware.ts` | Modify | Add `/science` + all 6 category routes to `LIVE_ROUTES` |
| `components/layout/Nav.tsx` | Modify | Remove `disabled: true` from Science link |
| `components/layout/Footer.tsx` | Modify | Replace "coming soon" span with real Science link |
| `__tests__/components/science/StudyCard.test.tsx` | Create | Unit tests for badge colours, key finding callout, links |
| `__tests__/components/science/StudyGrid.test.tsx` | Create | Unit tests for filtering, pill interaction, URL sync |

---

## Task 1: Study type

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/types.ts
export interface Study {
  id: string
  title: string
  authors: string | null
  journal: string | null
  year: number | null
  summary: string
  key_finding: string | null
  study_type: 'Human RCT' | 'Human' | 'Animal' | 'Meta-analysis'
  evidence_level: 'Strong' | 'Moderate' | 'Emerging'
  categories: string[]
  doi_url: string | null
  pubmed_url: string | null
  is_featured: boolean
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Study type"
```

---

## Task 2: Seed migration

**Files:**
- Create: `supabase/migrations/002_studies_seed.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/002_studies_seed.sql
insert into studies (title, authors, journal, year, summary, key_finding, study_type, evidence_level, categories, doi_url, pubmed_url, is_featured, sort_order) values

(
  'Hydrogen acts as a therapeutic antioxidant by selectively reducing cytotoxic oxygen radicals',
  'Ohsawa I, Ishikawa M, Takahashi K, et al.',
  'Nature Medicine',
  2007,
  'The landmark study establishing molecular hydrogen as a selective antioxidant. Researchers found H₂ selectively neutralises hydroxyl radicals and peroxynitrite — the most cytotoxic reactive oxygen species — without affecting other signalling ROS. This selectivity distinguishes H₂ from broad-spectrum antioxidants.',
  'H₂ selectively neutralises hydroxyl radicals without disrupting beneficial reactive oxygen species.',
  'Animal',
  'Strong',
  ARRAY['energy','recovery','longevity','safety','inflammation'],
  'https://doi.org/10.1038/nm1577',
  'https://pubmed.ncbi.nlm.nih.gov/17486089/',
  true,
  1
),

(
  'Effect of hydrogen-rich water on the antioxidant status of subjects with potential metabolic syndrome',
  'Nakao A, Toyoda Y, Sharma P, et al.',
  'Nutrition Research',
  2010,
  'A randomised crossover trial in which participants consumed hydrogen-rich water daily for 4 weeks. Researchers observed improvements in antioxidant enzyme activity and reductions in urinary 8-isoprostane — a marker of oxidative stress — compared to placebo.',
  'Daily H₂ intake was associated with improved antioxidant enzyme activity and reduced oxidative stress markers.',
  'Human RCT',
  'Moderate',
  ARRAY['energy','longevity'],
  'https://doi.org/10.1016/j.nutres.2010.10.001',
  'https://pubmed.ncbi.nlm.nih.gov/21130256/',
  false,
  2
),

(
  'Hydrogen inhalation during normoxic resuscitation improves neurological outcome in a rat model of cardiac arrest',
  'Hayashida K, Sano M, Ohsawa I, et al.',
  'Circulation',
  2008,
  'This early animal study explored hydrogen inhalation as a neuroprotective intervention during cardiac resuscitation. Neurological outcomes were significantly improved in the H₂ group compared to controls, providing the mechanistic basis for later human trials.',
  'H₂ inhalation during resuscitation significantly improved neurological recovery in animal models.',
  'Animal',
  'Strong',
  ARRAY['safety','longevity'],
  'https://doi.org/10.1161/CIRCULATIONAHA.108.799520',
  'https://pubmed.ncbi.nlm.nih.gov/18997194/',
  false,
  3
),

(
  'Hydrogen gas inhalation treatment in acute cerebral infarction: a randomized controlled clinical study on safety and neuroprotection',
  'Ono H, Nishijima Y, Ohta S, et al.',
  'Journal of Stroke and Cerebrovascular Diseases',
  2017,
  'A randomised controlled trial examining the safety and neuroprotective effects of H₂ inhalation in acute stroke patients. No adverse events were reported across the treatment group. Researchers observed trends toward improved neurological scores in the H₂ group.',
  'H₂ inhalation in acute stroke patients showed a strong safety profile with no adverse events.',
  'Human RCT',
  'Moderate',
  ARRAY['safety','longevity'],
  'https://doi.org/10.1016/j.jstrokecerebrovasdis.2017.02.012',
  'https://pubmed.ncbi.nlm.nih.gov/28359651/',
  false,
  4
),

(
  'Pilot study: Effects of drinking hydrogen-rich water on muscle fatigue caused by acute exercise in elite athletes',
  'Aoki K, Nakao A, Adachi T, et al.',
  'Medical Gas Research',
  2012,
  'A pilot study in elite athletes examining the effects of hydrogen-rich water on exercise-induced muscle fatigue. Researchers observed reduced blood lactate accumulation and improved muscle function scores compared to placebo, suggesting potential recovery benefits.',
  'H₂ intake was associated with reduced blood lactate and improved muscle function following acute exercise.',
  'Human',
  'Moderate',
  ARRAY['recovery','energy'],
  'https://doi.org/10.1186/2045-9912-2-12',
  'https://pubmed.ncbi.nlm.nih.gov/22520831/',
  true,
  5
),

(
  'Hydrogen gas inhalation inhibits progression to the ''irreversible'' stage of shock after severe hemorrhage in rats',
  'Yoshida A, Asanuma H, Sasaki H, et al.',
  'Journal of Critical Care',
  2012,
  'Animal study exploring H₂ inhalation as a potential intervention in hemorrhagic shock. The research demonstrated meaningful survival and haemodynamic improvements in the H₂ group, contributing to the safety and critical care evidence base.',
  'H₂ inhalation showed protective effects in a severe hemorrhagic shock model.',
  'Animal',
  'Emerging',
  ARRAY['safety','inflammation'],
  'https://doi.org/10.1016/j.jcrc.2011.08.013',
  'https://pubmed.ncbi.nlm.nih.gov/21996279/',
  false,
  6
),

(
  'Hydrogen-rich saline reduces oxidative stress and inflammation in lung injury induced by intestinal ischemia reperfusion',
  'Mao YF, Zheng XF, Cai JM, et al.',
  'Biochemical and Biophysical Research Communications',
  2009,
  'Research exploring molecular hydrogen''s effects on lung inflammation in an ischemia-reperfusion model. Reductions in TNF-α, IL-1β, and markers of oxidative stress were observed in the H₂ group, supporting the inflammation evidence base.',
  'H₂ was associated with significant reductions in TNF-α, IL-1β, and oxidative stress markers in lung tissue.',
  'Animal',
  'Moderate',
  ARRAY['inflammation','respiratory'],
  'https://doi.org/10.1016/j.bbrc.2009.04.069',
  'https://pubmed.ncbi.nlm.nih.gov/19383470/',
  false,
  7
),

(
  'Effects of inhaled hydrogen gas on survival rate and neurological deficits in mice after cardiac arrest',
  'Hayashida K, Sano M, Kamimura N, et al.',
  'PLoS ONE',
  2012,
  'Building on earlier animal work, this study examined survival and neurological outcomes following cardiac arrest and H₂ inhalation across multiple dose conditions. Results supported a dose-dependent neuroprotective effect and informed the design of subsequent human trials.',
  'H₂ inhalation demonstrated dose-dependent neuroprotective effects following cardiac arrest in animal models.',
  'Animal',
  'Strong',
  ARRAY['safety','longevity','respiratory'],
  'https://doi.org/10.1371/journal.pone.0051500',
  'https://pubmed.ncbi.nlm.nih.gov/23240030/',
  false,
  8
);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/002_studies_seed.sql
git commit -m "feat: add studies seed migration"
```

> **Note to implementer:** Run this SQL in the Supabase dashboard SQL editor for the project, or via `supabase db push` if the CLI is configured. The migration file is the source of truth — no automated runner is set up in this project yet.

---

## Task 3: StudyCard component

**Files:**
- Create: `components/science/StudyCard.tsx`
- Create: `__tests__/components/science/StudyCard.test.tsx`

### Spec notes

Evidence badge colours (use inline styles — these are one-off values not in the Tailwind config):
- Strong: `background: '#dcfce7'`, `color: '#166534'`
- Moderate: `background: '#fef9c3'`, `color: '#854d0e'`
- Emerging: `background: '#dbeafe'`, `color: '#1e40af'`

Study type tag: `className="rounded bg-ink-light/10 px-1.5 py-0.5 font-mono text-xs text-ink-mid"`

Key finding callout (only if `study.key_finding`): `className="border-l-2 border-teal pl-3 font-sans text-xs italic text-ink-mid"`

DOI / PubMed links: open in new tab with `target="_blank" rel="noopener noreferrer"`, `className="font-mono text-xs text-teal hover:text-teal-dark transition-colors"`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/science/StudyCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudyCard } from '@/components/science/StudyCard'
import type { Study } from '@/lib/types'

const baseStudy: Study = {
  id: '1',
  title: 'H₂ selectively neutralises hydroxyl radicals',
  authors: 'Ohsawa I, et al.',
  journal: 'Nature Medicine',
  year: 2007,
  summary: 'A landmark study on selective antioxidant action.',
  key_finding: 'Selective neutralisation of hydroxyl radicals.',
  study_type: 'Animal',
  evidence_level: 'Strong',
  categories: ['energy', 'longevity'],
  doi_url: 'https://doi.org/10.1038/nm1577',
  pubmed_url: 'https://pubmed.ncbi.nlm.nih.gov/17486089/',
  is_featured: true,
}

describe('StudyCard', () => {
  it('renders title', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('H₂ selectively neutralises hydroxyl radicals')).toBeInTheDocument()
  })

  it('renders journal and year', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText(/Nature Medicine/)).toBeInTheDocument()
    expect(screen.getByText(/2007/)).toBeInTheDocument()
  })

  it('renders summary', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('A landmark study on selective antioxidant action.')).toBeInTheDocument()
  })

  it('renders evidence level badge', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })

  it('renders study type tag', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('Animal')).toBeInTheDocument()
  })

  it('renders key finding callout when present', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('Selective neutralisation of hydroxyl radicals.')).toBeInTheDocument()
  })

  it('does not render key finding callout when absent', () => {
    const study = { ...baseStudy, key_finding: null }
    render(<StudyCard study={study} />)
    expect(screen.queryByText('Selective neutralisation of hydroxyl radicals.')).not.toBeInTheDocument()
  })

  it('renders DOI link with correct href and target', () => {
    render(<StudyCard study={baseStudy} />)
    const doiLink = screen.getByRole('link', { name: /doi/i })
    expect(doiLink).toHaveAttribute('href', 'https://doi.org/10.1038/nm1577')
    expect(doiLink).toHaveAttribute('target', '_blank')
    expect(doiLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders PubMed link when present', () => {
    render(<StudyCard study={baseStudy} />)
    const pubmedLink = screen.getByRole('link', { name: /pubmed/i })
    expect(pubmedLink).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/17486089/')
  })

  it('does not render DOI link when doi_url is null', () => {
    const study = { ...baseStudy, doi_url: null }
    render(<StudyCard study={study} />)
    expect(screen.queryByRole('link', { name: /doi/i })).not.toBeInTheDocument()
  })

  it('applies correct badge style for Moderate evidence', () => {
    const study = { ...baseStudy, evidence_level: 'Moderate' as const }
    render(<StudyCard study={study} />)
    const badge = screen.getByText('Moderate')
    expect(badge).toHaveStyle({ color: '#854d0e' })
  })

  it('applies correct badge style for Emerging evidence', () => {
    const study = { ...baseStudy, evidence_level: 'Emerging' as const }
    render(<StudyCard study={study} />)
    const badge = screen.getByText('Emerging')
    expect(badge).toHaveStyle({ color: '#1e40af' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/components/science/StudyCard.test.tsx`
Expected: FAIL — "Cannot find module '@/components/science/StudyCard'"

- [ ] **Step 3: Implement StudyCard**

```typescript
// components/science/StudyCard.tsx
import type { Study } from '@/lib/types'

const evidenceBadgeStyles: Record<Study['evidence_level'], { background: string; color: string }> = {
  Strong: { background: '#dcfce7', color: '#166534' },
  Moderate: { background: '#fef9c3', color: '#854d0e' },
  Emerging: { background: '#dbeafe', color: '#1e40af' },
}

interface StudyCardProps {
  study: Study
}

export function StudyCard({ study }: StudyCardProps) {
  const badgeStyle = evidenceBadgeStyles[study.evidence_level]

  return (
    <div className="rounded-lg border border-ink-light/20 bg-white p-5">
      {/* Badges row */}
      <div className="mb-3 flex flex-wrap gap-2">
        <span
          className="rounded px-1.5 py-0.5 font-mono text-xs font-medium"
          style={badgeStyle}
        >
          {study.evidence_level}
        </span>
        <span className="rounded bg-ink-light/10 px-1.5 py-0.5 font-mono text-xs text-ink-mid">
          {study.study_type}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-1 font-sans text-sm font-semibold leading-snug text-ink">
        {study.title}
      </h3>

      {/* Journal + year */}
      <p className="mb-3 font-mono text-xs text-ink-light">
        {[study.authors, study.journal, study.year].filter(Boolean).join(' — ')}
      </p>

      {/* Summary */}
      <p className="mb-3 font-sans text-sm leading-relaxed text-ink-mid">
        {study.summary}
      </p>

      {/* Key finding callout */}
      {study.key_finding && (
        <blockquote className="mb-3 border-l-2 border-teal pl-3 font-sans text-xs italic text-ink-mid">
          {study.key_finding}
        </blockquote>
      )}

      {/* Links */}
      {(study.doi_url || study.pubmed_url) && (
        <div className="flex flex-wrap gap-4">
          {study.doi_url && (
            <a
              href={study.doi_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
            >
              DOI ↗
            </a>
          )}
          {study.pubmed_url && (
            <a
              href={study.pubmed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
            >
              PubMed ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/components/science/StudyCard.test.tsx`
Expected: PASS — 12 tests

- [ ] **Step 5: Commit**

```bash
git add components/science/StudyCard.tsx __tests__/components/science/StudyCard.test.tsx
git commit -m "feat: add StudyCard component"
```

---

## Task 4: StudyGrid component

**Files:**
- Create: `components/science/StudyGrid.tsx`
- Create: `__tests__/components/science/StudyGrid.test.tsx`

### Spec notes

- `'use client'` required — uses `useSearchParams` and `useRouter`
- On mount and on URL change: read `?category=` from `useSearchParams()`, default to `'all'`
- Pills: derive unique categories from `studies` prop (preserving order: energy → recovery → longevity → safety → inflammation → respiratory)
- Active pill: `className="rounded-pill bg-teal px-4 py-1.5 font-sans text-sm text-white border border-teal"`
- Inactive pill: `className="rounded-pill border border-ink-light/30 px-4 py-1.5 font-sans text-sm text-ink-mid transition-colors hover:border-teal/50"`
- On pill click: `router.push(`?category=${slug}`, { scroll: false })` — for "All": `router.push(pathname, { scroll: false })` (clears param)
- Filtering: `activeCategory === 'all' ? studies : studies.filter(s => s.categories.includes(activeCategory))`
- Layout: `grid-cols-1 md:grid-cols-2 gap-6`
- The `initialCategory` prop is passed as the default if no URL param exists (used by category pages — though category pages use `StudyCard` directly, not `StudyGrid`, so this is mainly for the hub page)

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/science/StudyGrid.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyGrid } from '@/components/science/StudyGrid'
import type { Study } from '@/lib/types'

const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => mockSearchParams),
  useRouter: vi.fn(() => ({ push: mockPush })),
  usePathname: vi.fn(() => '/science'),
}))

const makeStudy = (overrides: Partial<Study> & { id: string; title: string; categories: string[] }): Study => ({
  authors: null,
  journal: null,
  year: null,
  summary: 'Test summary.',
  key_finding: null,
  study_type: 'Animal',
  evidence_level: 'Strong',
  doi_url: null,
  pubmed_url: null,
  is_featured: false,
  ...overrides,
})

const studies: Study[] = [
  makeStudy({ id: '1', title: 'Energy study', categories: ['energy'] }),
  makeStudy({ id: '2', title: 'Recovery study', categories: ['recovery'] }),
  makeStudy({ id: '3', title: 'Multi-category study', categories: ['energy', 'longevity'] }),
]

describe('StudyGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.delete('category')
  })

  it('renders all studies when no category filter is active', () => {
    render(<StudyGrid studies={studies} />)
    expect(screen.getByText('Energy study')).toBeInTheDocument()
    expect(screen.getByText('Recovery study')).toBeInTheDocument()
    expect(screen.getByText('Multi-category study')).toBeInTheDocument()
  })

  it('renders filter pills for each unique category present in studies', () => {
    render(<StudyGrid studies={studies} />)
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'energy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'recovery' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'longevity' })).toBeInTheDocument()
  })

  it('filters studies when a category pill is clicked', async () => {
    const user = userEvent.setup()
    render(<StudyGrid studies={studies} />)
    await user.click(screen.getByRole('button', { name: 'recovery' }))
    expect(mockPush).toHaveBeenCalledWith('?category=recovery', { scroll: false })
  })

  it('shows only matching studies when initialCategory is set', () => {
    render(<StudyGrid studies={studies} initialCategory="recovery" />)
    // With initialCategory="recovery" and no URL param, shows recovery studies
    expect(screen.getByText('Recovery study')).toBeInTheDocument()
    expect(screen.queryByText('Energy study')).not.toBeInTheDocument()
  })

  it('clears category param when All pill is clicked', async () => {
    const user = userEvent.setup()
    render(<StudyGrid studies={studies} />)
    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(mockPush).toHaveBeenCalledWith('/science', { scroll: false })
  })

  it('shows empty state when no studies match filter', () => {
    const sparseStudies: Study[] = [
      makeStudy({ id: '1', title: 'Only energy study', categories: ['energy'] }),
    ]
    render(<StudyGrid studies={sparseStudies} initialCategory="recovery" />)
    expect(screen.getByText(/no studies found/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/components/science/StudyGrid.test.tsx`
Expected: FAIL — "Cannot find module '@/components/science/StudyGrid'"

- [ ] **Step 3: Implement StudyGrid**

```typescript
// components/science/StudyGrid.tsx
'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { StudyCard } from './StudyCard'
import type { Study } from '@/lib/types'
import { cn } from '@/lib/cn'

// Canonical category order for pills
const CATEGORY_ORDER = ['energy', 'recovery', 'longevity', 'safety', 'inflammation', 'respiratory']

interface StudyGridProps {
  studies: Study[]
  initialCategory?: string
}

export function StudyGrid({ studies, initialCategory }: StudyGridProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const urlCategory = searchParams.get('category')
  const activeCategory = urlCategory ?? initialCategory ?? 'all'

  // Derive unique categories present in studies, in canonical order
  const presentCategories = CATEGORY_ORDER.filter((cat) =>
    studies.some((s) => s.categories.includes(cat))
  )

  const filteredStudies =
    activeCategory === 'all'
      ? studies
      : studies.filter((s) => s.categories.includes(activeCategory))

  function handlePillClick(slug: string) {
    if (slug === 'all') {
      router.push(pathname, { scroll: false })
    } else {
      router.push(`?category=${slug}`, { scroll: false })
    }
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {['all', ...presentCategories].map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => handlePillClick(slug)}
            className={cn(
              'rounded-pill px-4 py-1.5 font-sans text-sm transition-colors',
              activeCategory === slug
                ? 'border border-teal bg-teal text-white'
                : 'border border-ink-light/30 text-ink-mid hover:border-teal/50'
            )}
          >
            {slug === 'all' ? 'All' : slug}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredStudies.length === 0 ? (
        <p className="font-sans text-sm text-ink-light">
          No studies found for this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredStudies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/components/science/StudyGrid.test.tsx`
Expected: PASS — 6 tests

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: all tests pass (previous 40 + new 18 = 58 total)

- [ ] **Step 6: Commit**

```bash
git add components/science/StudyGrid.tsx __tests__/components/science/StudyGrid.test.tsx
git commit -m "feat: add StudyGrid component with filter pills and URL param sync"
```

---

## Task 5: `/science` hub page

**Files:**
- Create: `app/(site)/science/page.tsx`

### Spec notes

- Server component — no `'use client'`
- Fetches all `is_published = true` studies ordered by `sort_order, created_at desc`
- Dark hero (`bg-ink`) with stats row in `font-mono text-teal`
- Mechanism explainer on cream background — max-width 720px centred, DOI link to `https://doi.org/10.1038/nm1577`
- StudyGrid receives all studies — client-side filtering happens in the component
- MHRA disclaimer: amber banner, verbatim text from spec
- CTA: `bg-ink` section → `/product`
- No unit test needed (server component with Supabase dependency — verified via `npx tsc --noEmit` + build)

- [ ] **Step 1: Create the page**

```typescript
// app/(site)/science/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StudyGrid } from '@/components/science/StudyGrid'
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

  return (
    <>
      {/* Hero */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-teal">
            The Science
          </p>
          <h1 className="font-display text-5xl leading-tight text-white md:text-6xl">
            50+ peer-reviewed studies.<br />
            One remarkable molecule.
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base text-ink-light">
            Peer-reviewed research on molecular hydrogen — summarised for humans.
          </p>
          <div className="mt-8 flex flex-wrap gap-8">
            {[
              { value: '52', label: 'studies' },
              { value: '18', label: 'human trials' },
              { value: '6', label: 'categories' },
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
            <h2 className="mb-4 font-display text-2xl text-ink">
              A selective antioxidant.
            </h2>
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
          <StudyGrid studies={studies} />
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
          <h2 className="mb-4 font-display text-3xl text-white">
            Ready to try it?
          </h2>
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

- [ ] **Step 2: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/\(site\)/science/page.tsx
git commit -m "feat: add /science hub page"
```

---

## Task 6: `/science/[category]` deep-dive pages

**Files:**
- Create: `app/(site)/science/[category]/page.tsx`

### Spec notes

- Server component. Dynamic route — `params.category` validated against `VALID_CATEGORIES`
- Invalid slug → `notFound()` from `next/navigation`
- Category pages do NOT use `StudyGrid` (no pills needed — already on a category page). Use `StudyCard` directly in a `grid grid-cols-1 md:grid-cols-2 gap-6` div.
- Supabase query: `categories @> ARRAY['${category}']` with PostgREST: `.contains('categories', [category])`
- Persona block only renders when `categoryMeta[category].persona !== null`
- CTA links to `/product?persona=[persona]` when persona exists, else `/product`
- Metadata uses `categoryMeta[category].title`

- [ ] **Step 1: Create the page**

```typescript
// app/(site)/science/[category]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudyCard } from '@/components/science/StudyCard'
import type { Study } from '@/lib/types'

const VALID_CATEGORIES = [
  'energy',
  'recovery',
  'longevity',
  'safety',
  'inflammation',
  'respiratory',
] as const

type Category = (typeof VALID_CATEGORIES)[number]

const categoryMeta: Record<
  Category,
  {
    title: string
    headline: string
    subline: string
    mechanism: string
    persona: 'sarah' | 'marcus' | 'elena' | null
    personaQuote: string | null
    personaCta: string | null
  }
> = {
  energy: {
    title: 'Energy & Mental Clarity',
    headline: 'The molecule that works where fatigue begins.',
    subline:
      "Research exploring molecular hydrogen's effects on mitochondrial function and cognitive performance.",
    mechanism:
      "Mitochondria produce ATP — the cell's energy currency. Research suggests oxidative stress within mitochondria is a significant driver of fatigue. Studies explore whether molecular hydrogen's selective antioxidant action at the mitochondrial level may support energy metabolism.",
    persona: 'sarah',
    personaQuote:
      '"What if the reason nothing\'s working isn\'t you — it\'s that nothing works at the right level?"',
    personaCta: 'Explore for energy & clarity',
  },
  recovery: {
    title: 'Athletic Recovery',
    headline: "The research tool most serious athletes haven't discovered yet.",
    subline:
      "Studies on molecular hydrogen's potential role in post-exercise inflammation and recovery time.",
    mechanism:
      "Intense exercise generates oxidative stress and inflammatory markers. Research suggests molecular hydrogen may support the body's natural antioxidant response post-exercise — studies have measured reductions in blood lactate and inflammation markers including IL-6 and TNF-α.",
    persona: 'marcus',
    personaQuote:
      '"600ml/min. 99.99% purity. The recovery tool most serious athletes haven\'t discovered yet."',
    personaCta: 'Explore for recovery',
  },
  longevity: {
    title: 'Longevity & Cellular Health',
    headline: "The most interesting thing isn't what it does. It's how it decides.",
    subline:
      "Research on molecular hydrogen's potential role in oxidative stress, cellular ageing, and long-term health markers.",
    mechanism:
      "Oxidative stress is one of the primary drivers of cellular ageing. Research explores whether molecular hydrogen's selective targeting of hydroxyl radicals — the most damaging reactive oxygen species — may reduce cumulative cellular damage over time.",
    persona: 'elena',
    personaQuote:
      '"The most interesting thing about molecular hydrogen isn\'t what it does — it\'s how it decides what to target."',
    personaCta: 'Explore for longevity',
  },
  safety: {
    title: 'Safety',
    headline: 'Fifteen years of research. No serious adverse events.',
    subline:
      'The safety evidence base for molecular hydrogen inhalation across human trials.',
    mechanism:
      'Hydrogen gas is naturally produced in the human gut during digestion. Studies involving sustained inhalation at concentrations up to 2.4% over 72 hours have reported no adverse effects. The safety profile is well-documented across both animal and human research.',
    persona: null,
    personaQuote: null,
    personaCta: null,
  },
  inflammation: {
    title: 'Inflammation',
    headline: 'Targeting inflammation at its source.',
    subline:
      "Research on molecular hydrogen's potential effects on systemic and localised inflammatory markers.",
    mechanism:
      "Chronic inflammation underpins a wide range of health concerns. A 2024 Frontiers meta-analysis across 12 lung studies found reductions in TNF-α, IL-1β, CRP, and IL-8 following H₂ inhalation. Research is ongoing across multiple inflammation models.",
    persona: null,
    personaQuote: null,
    personaCta: null,
  },
  respiratory: {
    title: 'Respiratory Health',
    headline: 'Research at the interface of breath and biology.',
    subline:
      "Studies exploring molecular hydrogen's potential effects on respiratory function and lung inflammation.",
    mechanism:
      'Inhalation is the most direct delivery route for molecular hydrogen — it enters the bloodstream within minutes via the alveoli. Early research in respiratory contexts has explored effects on lung inflammation markers and airway oxidative stress.',
    persona: null,
    personaQuote: null,
    personaCta: null,
  },
}

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  if (!VALID_CATEGORIES.includes(category as Category)) {
    return { title: 'Not Found' }
  }
  const meta = categoryMeta[category as Category]
  return {
    title: meta.title,
    description: meta.subline,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category as Category)) {
    notFound()
  }

  const slug = category as Category
  const meta = categoryMeta[slug]

  const supabase = await createClient()
  const { data } = await supabase
    .from('studies')
    .select('*')
    .eq('is_published', true)
    .contains('categories', [slug])
    .order('sort_order', { ascending: true })

  const studies: Study[] = data ?? []
  const productHref = meta.persona ? `/product?persona=${meta.persona}` : '/product'

  return (
    <>
      {/* Hero */}
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href="/science"
            className="mb-6 inline-block font-mono text-xs text-teal transition-colors hover:text-teal-dark"
          >
            ← All research
          </Link>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
            Science / {slug}
          </p>
          <h1 className="font-display text-4xl leading-tight text-white md:text-5xl">
            {meta.headline}
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base text-ink-light">
            {meta.subline}
          </p>
        </div>
      </section>

      {/* Mechanism */}
      <section className="bg-cream py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
              The Mechanism
            </p>
            <p className="font-sans text-base leading-relaxed text-ink-mid">
              {meta.mechanism}
            </p>
          </div>
        </div>
      </section>

      {/* Persona connection (only when persona !== null) */}
      {meta.persona && meta.personaQuote && meta.personaCta && (
        <section className="bg-teal-light py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <blockquote className="mb-6 font-display text-2xl leading-snug text-ink">
                {meta.personaQuote}
              </blockquote>
              <Link
                href={productHref}
                className="inline-flex rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
              >
                {meta.personaCta}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Study grid */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">
            Research
          </p>
          {studies.length === 0 ? (
            <p className="font-sans text-sm text-ink-light">
              No studies found for this category yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {studies.map((study) => (
                <StudyCard key={study.id} study={study} />
              ))}
            </div>
          )}
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
      <section className="bg-ink py-12">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-4 font-display text-3xl text-white">
            {meta.personaCta ?? 'Learn more about the device'}
          </h2>
          <Link
            href={productHref}
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

- [ ] **Step 2: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/science/[category]/page.tsx"
git commit -m "feat: add /science/[category] deep-dive pages"
```

---

## Task 7: Middleware, Nav, and Footer wiring

**Files:**
- Modify: `middleware.ts`
- Modify: `components/layout/Nav.tsx`
- Modify: `components/layout/Footer.tsx`

This task wires up the live routes — do all three files, then run tests, then commit.

- [ ] **Step 1: Update middleware.ts**

Replace the `LIVE_ROUTES` set in `middleware.ts`:

```typescript
// middleware.ts — replace the existing LIVE_ROUTES line
const LIVE_ROUTES = new Set([
  '/',
  '/faq',
  '/about',
  '/product',
  '/science',
  '/science/energy',
  '/science/recovery',
  '/science/longevity',
  '/science/safety',
  '/science/inflammation',
  '/science/respiratory',
])
```

The rest of `middleware.ts` is unchanged.

- [ ] **Step 2: Enable Science link in Nav.tsx**

In `components/layout/Nav.tsx`, change the `navLinks` array. Remove `disabled: true` from the Science entry:

```typescript
// Before:
const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Product', href: '/product' },
  { label: 'Science', href: '/science', disabled: true },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
] as const

// After:
const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Product', href: '/product' },
  { label: 'Science', href: '/science' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
] as const
```

- [ ] **Step 3: Enable Science link in Footer.tsx**

In `components/layout/Footer.tsx`, replace the disabled Science span with a real link:

```typescript
// Before:
<span className="cursor-not-allowed font-sans text-sm text-ink-light/50">
  Science{' '}
  <span className="text-xs">(coming soon)</span>
</span>

// After:
<Link href="/science" className="font-sans text-sm transition-colors hover:text-white">
  Science
</Link>
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add middleware.ts components/layout/Nav.tsx components/layout/Footer.tsx
git commit -m "feat: enable /science routes in middleware, nav, and footer"
```

---

## Final check

- [ ] **Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Run full test suite**

Run: `npx vitest run`
Expected: all tests pass (58 total: 40 pre-existing + 12 StudyCard + 6 StudyGrid)

- [ ] **Verify build**

Run: `npx next build`
Expected: build succeeds, no type errors, `/science` and `/science/energy` (etc.) appear in route output
