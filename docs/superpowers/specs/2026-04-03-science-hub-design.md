# H2 Revive — Science Hub Design Spec
**Date:** 2026-04-03
**Status:** Approved
**Scope:** `/science` main hub + `/science/[category]` deep-dive pages + study seed data

---

## 1. Context

The Science Hub is H2 Revive's primary SEO and trust asset. CLAUDE.md identifies "own the educational/trust lane" as the key competitive opportunity — QLife ranks #39 for "molecular hydrogen" with weak educational content. This hub delivers the research in compliant, human-readable form.

The `studies` table exists in Supabase (created in Phase 1 migration) but is empty. This phase seeds it and builds the public-facing pages.

---

## 2. Architecture

### New files

```
app/(site)/science/
  page.tsx                        ← /science hub — server fetches all studies, passes to StudyGrid
  [category]/
    page.tsx                      ← /science/[category] — server fetches filtered studies

components/science/
  StudyCard.tsx                   ← individual study card with evidence badge + type tag
  StudyGrid.tsx                   ← 'use client' — filter pills + URL param sync + filtered grid

supabase/migrations/
  002_studies_seed.sql            ← 8 initial studies covering all 6 categories

middleware.ts                     ← add /science to LIVE_ROUTES (dynamic [category] routes pass through automatically)
```

### Data flow

**`/science`:**
Server Component → `createClient()` → fetch all `is_published = true` studies ordered by `sort_order, created_at` → pass as prop to `<StudyGrid studies={studies} />`.

`StudyGrid` (client): reads `?category=` from URL on mount, filters `studies` array client-side, updates URL with `router.push(?category=X, { scroll: false })` on pill click.

**`/science/[category]`:**
Server Component → `createClient()` → fetch studies where `categories @> ARRAY[category]` and `is_published = true` → render server-side. No client filtering needed — page is statically determined by route.

### Valid category slugs

```typescript
const VALID_CATEGORIES = ['energy', 'recovery', 'longevity', 'safety', 'inflammation', 'respiratory'] as const
type Category = typeof VALID_CATEGORIES[number]
```

Invalid slugs (`/science/foo`) → `notFound()` from `next/navigation`.

### Middleware

Add `/science` to `LIVE_ROUTES`. The `/science/[category]` sub-routes are handled by the same entry since middleware only needs to allow the prefix — but since middleware uses exact matching, also add each category path explicitly:

```typescript
const LIVE_ROUTES = new Set([
  '/', '/faq', '/about', '/product', '/science',
  '/science/energy', '/science/recovery', '/science/longevity',
  '/science/safety', '/science/inflammation', '/science/respiratory',
])
```

---

## 3. Supabase types

```typescript
// lib/types.ts (create this file)
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

---

## 4. Components

### StudyCard (`components/science/StudyCard.tsx`)

Server component (no interactivity). Props: `study: Study`.

Layout:
- Evidence badge (top-left): Strong = `bg-[#dcfce7] text-[#166534]`, Moderate = `bg-[#fef9c3] text-[#854d0e]`, Emerging = `bg-[#dbeafe] text-[#1e40af]`
- Study type tag (top-left, beside badge): `bg-ink-light/10 text-ink-mid` — "Human RCT" | "Human" | "Animal" | "Meta-analysis"
- Title: `font-sans text-sm font-semibold text-ink`
- Journal + year: `font-mono text-xs text-ink-light`
- Summary: `font-sans text-sm text-ink-mid leading-relaxed`
- Key finding (if present): teal left-border callout — `border-l-2 border-teal pl-3 font-sans text-xs italic text-ink-mid`
- Links row: DOI link + PubMed link — `font-mono text-xs text-teal hover:text-teal-dark` — opens in new tab with `rel="noopener noreferrer"`

```typescript
interface StudyCardProps {
  study: Study
}
export function StudyCard({ study }: StudyCardProps) { ... }
```

### StudyGrid (`components/science/StudyGrid.tsx`)

`'use client'`. Props: `studies: Study[]`, `initialCategory?: string`.

Behaviour:
- On mount: read `?category=` from `useSearchParams()`, set as active filter
- Filter pills: "All" + each category that has ≥1 study in the `studies` array. Active = `bg-teal text-white border-teal`, inactive = `border-ink-light/30 text-ink-mid hover:border-teal/50`
- On pill click: `router.push(`?category=${value}`, { scroll: false })` — or clear param for "All"
- Filtered studies: `studies.filter(s => activeCategory === 'all' || s.categories.includes(activeCategory))`
- Layout: 2-column grid on desktop, 1-column on mobile
- Empty state: "No studies found for this category yet." (shouldn't occur with seed data but defensive)

```typescript
interface StudyGridProps {
  studies: Study[]
  initialCategory?: string
}
export function StudyGrid({ studies, initialCategory }: StudyGridProps) { ... }
```

---

## 5. Page designs

### `/science` — Main Hub (`app/(site)/science/page.tsx`)

Server Component. Metadata:
```typescript
export const metadata: Metadata = {
  title: 'The Science',
  description: "50+ peer-reviewed studies on molecular hydrogen — summarised in plain English. Research on energy, recovery, longevity, inflammation, safety, and respiratory health.",
}
```

Sections:
1. **Hero** — `bg-ink py-20`. Eyebrow: "THE SCIENCE" (mono, teal). Headline: `font-display text-5xl text-white` "50+ peer-reviewed studies. One remarkable molecule." Subline: `font-sans text-base text-ink-light` "Peer-reviewed research on molecular hydrogen — summarised for humans." Stats row: "52 studies · 18 human trials · 6 categories" in `font-mono text-sm text-teal`.

2. **Mechanism explainer** — `bg-cream py-12`. Max-width 720px centred. Eyebrow: "THE MECHANISM". Headline: `font-display text-2xl text-ink` "A selective antioxidant." Body copy (2 sentences, compliant): "Molecular hydrogen is the smallest antioxidant in existence. Unlike broad-spectrum antioxidants, research suggests H₂ selectively neutralises only the most damaging free radicals — specifically hydroxyl radicals — leaving beneficial reactive oxygen species intact. A 2007 study in Nature Medicine by Ohsawa et al. was the first to document this selective mechanism in a peer-reviewed context." DOI link to `https://doi.org/10.1038/nm1577`.

3. **StudyGrid** — `bg-cream pb-16`. `<StudyGrid studies={studies} />` — all published studies passed from server.

4. **MHRA disclaimer** — amber banner `bg-amber-50 border border-amber-200 rounded-lg px-6 py-4 mx-auto max-w-6xl` with verbatim text from CLAUDE.md.

5. **CTA** — `bg-ink py-16` section. Headline: "Ready to try it?" CTA: "Enquire about the device" → `/product`.

### `/science/[category]` — Deep-dive (`app/(site)/science/[category]/page.tsx`)

Server Component. Dynamic route. On invalid slug: `notFound()`.

Category metadata map (used for page title, hero copy, persona connection):
```typescript
const categoryMeta = {
  energy: {
    title: 'Energy & Mental Clarity',
    headline: 'The molecule that works where fatigue begins.',
    subline: 'Research exploring molecular hydrogen\'s effects on mitochondrial function and cognitive performance.',
    mechanism: 'Mitochondria produce ATP — the cell\'s energy currency. Research suggests oxidative stress within mitochondria is a significant driver of fatigue. Studies explore whether molecular hydrogen\'s selective antioxidant action at the mitochondrial level may support energy metabolism.',
    persona: 'sarah' as const,
    personaQuote: '"What if the reason nothing\'s working isn\'t you — it\'s that nothing works at the right level?"',
    personaCta: 'Explore for energy & clarity',
  },
  recovery: {
    title: 'Athletic Recovery',
    headline: 'The research tool most serious athletes haven\'t discovered yet.',
    subline: 'Studies on molecular hydrogen\'s potential role in post-exercise inflammation and recovery time.',
    mechanism: 'Intense exercise generates oxidative stress and inflammatory markers. Research suggests molecular hydrogen may support the body\'s natural antioxidant response post-exercise — studies have measured reductions in blood lactate and inflammation markers including IL-6 and TNF-α.',
    persona: 'marcus' as const,
    personaQuote: '"600ml/min. 99.99% purity. The recovery tool most serious athletes haven\'t discovered yet."',
    personaCta: 'Explore for recovery',
  },
  longevity: {
    title: 'Longevity & Cellular Health',
    headline: 'The most interesting thing isn\'t what it does. It\'s how it decides.',
    subline: 'Research on molecular hydrogen\'s potential role in oxidative stress, cellular ageing, and long-term health markers.',
    mechanism: 'Oxidative stress is one of the primary drivers of cellular ageing. Research explores whether molecular hydrogen\'s selective targeting of hydroxyl radicals — the most damaging reactive oxygen species — may reduce cumulative cellular damage over time.',
    persona: 'elena' as const,
    personaQuote: '"The most interesting thing about molecular hydrogen isn\'t what it does — it\'s how it decides what to target."',
    personaCta: 'Explore for longevity',
  },
  safety: {
    title: 'Safety',
    headline: 'Fifteen years of research. No serious adverse events.',
    subline: 'The safety evidence base for molecular hydrogen inhalation across human trials.',
    mechanism: 'Hydrogen gas is naturally produced in the human gut during digestion. Studies involving sustained inhalation at concentrations up to 2.4% over 72 hours have reported no adverse effects. The safety profile is well-documented across both animal and human research.',
    persona: null,
    personaQuote: null,
    personaCta: null,
  },
  inflammation: {
    title: 'Inflammation',
    headline: 'Targeting inflammation at its source.',
    subline: 'Research on molecular hydrogen\'s potential effects on systemic and localised inflammatory markers.',
    mechanism: 'Chronic inflammation underpins a wide range of health concerns. A 2024 Frontiers meta-analysis across 12 lung studies found reductions in TNF-α, IL-1β, CRP, and IL-8 following H₂ inhalation. Research is ongoing across multiple inflammation models.',
    persona: null,
    personaQuote: null,
    personaCta: null,
  },
  respiratory: {
    title: 'Respiratory Health',
    headline: 'Research at the interface of breath and biology.',
    subline: 'Studies exploring molecular hydrogen\'s potential effects on respiratory function and lung inflammation.',
    mechanism: 'Inhalation is the most direct delivery route for molecular hydrogen — it enters the bloodstream within minutes via the alveoli. Early research in respiratory contexts has explored effects on lung inflammation markers and airway oxidative stress.',
    persona: null,
    personaQuote: null,
    personaCta: null,
  },
}
```

Sections:
1. **Hero** — `bg-ink py-16`. "SCIENCE / [CATEGORY]" breadcrumb in mono teal. Category headline + subline. Back link: "← All research" → `/science`.
2. **Mechanism explainer** — `bg-cream py-12`. Max-width 720px. "THE MECHANISM" eyebrow. `mechanism` copy. DOI link where applicable.
3. **Persona connection** — only if `persona !== null`. `bg-teal-light py-12`. Pull quote in `font-display text-2xl text-ink`. CTA pill → `/product?persona=[persona]`.
4. **Study grid** — `bg-cream py-16`. Pre-filtered studies. No filter pills (already on a category page). Uses `StudyCard` directly in a 2-col grid.
5. **MHRA disclaimer** — amber banner.
6. **CTA** — `bg-ink py-12`. Category-specific CTA text + link to `/product?persona=[persona]` (or `/product` if no persona).

---

## 6. Seed data (`supabase/migrations/002_studies_seed.sql`)

8 studies covering all 6 categories. All summaries written in compliant brand voice (no prohibited words). DOIs from CLAUDE.md where available.

```sql
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

---

## 7. Middleware update

```typescript
const LIVE_ROUTES = new Set([
  '/', '/faq', '/about', '/product', '/science',
  '/science/energy', '/science/recovery', '/science/longevity',
  '/science/safety', '/science/inflammation', '/science/respiratory',
])
```

---

## 8. Nav update

The Science link in `components/layout/Nav.tsx` is currently `disabled: true`. Remove the `disabled` flag and enable it as a real link once this phase ships.

---

## 9. Testing

- Unit tests for `StudyCard`: renders title, journal, evidence badge colour, DOI link
- Unit tests for `StudyGrid`: renders all studies, filters correctly on pill click, shows correct study count per category
- No page-level tests (server component pages with Supabase dependency — tested via build)

---

## 10. Out of scope

- `/science/[category]` editorial copy beyond what is in `categoryMeta` above (placeholder mechanism text ships, real copy added later)
- Study search / text search within the grid
- Featured study highlighting on the hub page (is_featured flag exists but not used in Phase 2 UI)
- RSS feed or structured data (Phase 3)
