# H2 Revive — Project Context for Claude Code

## What this project is

H2 Revive is the UK's dedicated hydrogen inhalation wellness brand. This Next.js website
sells a premium molecular hydrogen inhalation device (£1,200–1,600) to three personas:
Sarah (chronic fatigue / energy), Marcus (athletic recovery / biohacking),
Elena (longevity / cellular health).

Phase 1: marketing site with enquiry-based lead capture + custom admin panel.
No ecommerce checkout — product page drives to an enquiry form.
All leads and content managed via a Supabase-powered admin panel.

---

## Tech Stack

- **Framework**: Next.js 14+ App Router, TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (admin panel only)
- **Storage**: Supabase Storage
- **Hosting**: Vercel
- **Forms**: React Hook Form + Zod + Supabase insert
- **Email**: Resend
- **Content generation**: Anthropic API (claude-sonnet-4-20250514)
- **Analytics**: Vercel Analytics

---

## Design System

Apply these tokens consistently. They are configured in `tailwind.config.ts`.

```
Colors:
  teal:       #00B4C6   — primary brand, CTAs, accents
  teal-dark:  #007A87   — hover states
  teal-light: #E0F7FA   — backgrounds, callout boxes
  ink:        #0D1B1E   — primary text, dark backgrounds
  ink-mid:    #3A4F52   — body text
  ink-light:  #8AA0A3   — captions, labels, muted
  cream:      #F7F5F0   — page background
  white:      #FFFFFF

Fonts (loaded via next/font/google):
  display:    DM Serif Display  — headings, hero, quotes, italic accents
  sans:       DM Sans           — all body copy, UI
  mono:       DM Mono           — labels, tags, metadata, monospace

Border radius:  8px cards, 10px panels, 12px large, 100px pills
Shadows:        subtle only — box-shadow: 0 1px 3px rgba(0,0,0,0.06)
```

---

## Site Architecture

```
/                   Homepage
/product            Product enquiry page
/science            Science Hub (filterable research)
/science/safety     Safety deep-dive
/science/energy     Use case: Energy & Fatigue
/science/recovery   Use case: Athletic Recovery
/science/longevity  Use case: Longevity & Ageing
/science/inflammation Use case: Inflammation
/science/respiratory  Use case: Respiratory
/about              CEO story
/journal            Blog (Phase 2)
/clinics            B2B landing
/faq                Objection handling
/start              Coming-soon / waitlist

/admin              Dashboard (auth protected)
/admin/leads        Lead management
/admin/content      Content generation + publish
/admin/science      Science Hub study management
/admin/settings     Site settings
```

---

## Supabase Schema

### leads
```sql
id uuid pk, created_at, name, email, phone,
persona text,          -- 'sarah' | 'marcus' | 'elena' | 'clinic' | 'general'
enquiry_type text,     -- 'product' | 'clinic' | 'waitlist' | 'general'
message text, source_page text,
utm_source, utm_medium, utm_campaign text,
status text default 'new',  -- 'new' | 'contacted' | 'converted' | 'closed'
notes text
```

### studies
```sql
id uuid pk, created_at, updated_at,
title, authors, journal text,
year integer,
summary text,          -- plain English, 2-3 sentences
key_finding text,      -- single headline finding
study_type text,       -- 'Human RCT' | 'Human' | 'Animal' | 'Meta-analysis'
evidence_level text,   -- 'Strong' | 'Moderate' | 'Emerging'
categories text[],     -- ['energy','recovery','longevity','safety','inflammation','respiratory']
doi_url, pubmed_url text,
is_featured boolean default false,
is_published boolean default true,
sort_order integer default 0
```

### content_items
```sql
id uuid pk, created_at, updated_at,
page text,             -- 'homepage' | 'product' | 'about' | 'clinics' etc.
section text,          -- 'hero' | 'faq' | 'features' | 'ceo-intro' etc.
persona text,          -- null = all, or 'sarah' | 'marcus' | 'elena'
content_type text,     -- 'headline' | 'body' | 'cta' | 'faq-item' | 'testimonial'
content_json jsonb,    -- structured content (headline, subheading, body, cta_text etc.)
status text default 'draft',  -- 'draft' | 'published'
generation_prompt text,       -- prompt used to generate (for audit/regen)
published_at timestamptz
```

### posts (Phase 2)
```sql
id uuid pk, title, slug unique, excerpt, content text,
persona_tags text[], category text,
cover_image_url, seo_title, seo_description text,
is_published boolean, published_at timestamptz
```

### site_settings
```sql
key text pk, value text
```

---

## Content Generation Architecture

Content is generated via the Anthropic API with the brand voice baked into the system prompt.
The pipeline: trigger → generate → compliance validate → store as draft → one-click publish.

### API route: `/api/generate-content`
```typescript
// POST body:
{
  page: string,
  section: string,
  content_type: string,
  persona?: string,
  additional_context?: string
}
// Returns: structured JSON content or validation failure
```

### System prompt (use verbatim for ALL generation calls)
```
You are the content writer for H2 Revive, a UK wellness brand specialising in
molecular hydrogen inhalation therapy. Write in the H2 Revive brand voice:

VOICE PILLARS:
- Curious and confident: share discoveries, not sales pitches
- Human, not clinical: translate science into feeling
- Quietly British: understated authority, no hype, no exclamation marks
- Intellectually honest: hedge claims accurately

ALWAYS USE: "may support", "research suggests", "some users report",
"studies explore", "we believe", "the science is pointing toward",
"a [year] study in [journal] found"

NEVER USE: "treats", "cures", "proven to", "proven to help", "guaranteed",
"eliminates", "heals", "clinical grade", "medical device",
"therapeutic treatment", "diagnose", "prevent disease", "from my own experience"

CITATION RULE: Always link to primary sources (PubMed DOI, journal page).
Never reference third-party aggregator sites.

COMPLIANCE DISCLAIMER (include near any health claim):
"These statements have not been evaluated by the MHRA. This product is not
intended to diagnose, treat, cure, or prevent any disease."

BRAND: H2 Revive is a wellness technology brand, not a medical device company.
UK-first positioning. CEO-led authentic voice. Science-backed but honest about
the state of the evidence.

Respond with valid JSON only. No markdown, no preamble.
```

### Compliance validator
Before saving any generated content, scan for prohibited words:
```typescript
const PROHIBITED = [
  'treats', 'cures', 'proven to', 'proven to help', 'guaranteed',
  'eliminates', 'heals', 'clinical grade', 'medical device',
  'therapeutic treatment', 'diagnose', 'prevent disease',
  'from my own experience', 'no side effects'
]
// If any match: auto-regenerate, max 2 retries
// If still failing after 2: save as 'needs_review' status, flag in admin
```

---

## Messaging Framework (summary for copy reference)

### Brand Truth
"Your biology already knows how to perform. We give it the conditions to remember."

### Message Hierarchy
1. Brand Truth — the feeling. Not stated directly, felt through copy.
2. Category Frame — "The most researched molecule you've never heard of — delivered where it works fastest."
3. Product Promise — "20 minutes. 99.99% pure molecular hydrogen. Directly to your lungs, your bloodstream, your cells."
4. Proof Points — studies, specs, CEO credibility, user reports.

### Persona Entry Points
**Sarah Mitchell — Energy Seeker (48F)**
Pain: chronic fatigue, brain fog, post-viral. Nothing has touched it.
Hook: "What if the reason nothing's working isn't you — it's that nothing works at the right level?"
Lead with: energy/clarity — gentle science. Tone: warm, peer-to-peer, permission-giving.

**Marcus Chen — Performance Optimizer (34M)**
Pain: recovery time, inflammation, biohacking edge.
Hook: "600ml/min. 99.99% purity. The recovery tool most serious athletes haven't discovered yet."
Lead with: specs — mechanism — evidence. Tone: precise, peer-level, efficient.

**Elena Rossi — Longevity Seeker (57F)**
Pain: ageing (cardiovascular, cognitive, skin), wants evidence not promises.
Hook: "The most interesting thing about molecular hydrogen isn't what it does — it's how it decides what to target."
Lead with: selective antioxidant mechanism — depth of research — investment framing.
Tone: sophisticated, measured, science-first.

---

## Key Studies (cite these accurately, with DOI links)

| Study | Key Finding | Use for |
|-------|-------------|---------|
| Ohsawa et al., Nature Medicine, 2007 | H₂ selectively neutralises hydroxyl radicals | Mechanism explanation (all pages) |
| HYBRID II, Lancet eClinicalMedicine, 2023 | 46% full neurological recovery vs 21% controls in cardiac arrest RCT | Credibility signal (science hub) |
| ROS reduction RCT, Free Radical Biology & Medicine, 2024 | Significant blood ROS reduction immediately + at 24hrs post-inhalation | How it works section |
| Fat oxidation RCT, Palacký University, 2025 | 60 mins H₂ associated with increased fat oxidation at rest | Energy/metabolic claims |
| 72-hour safety study | No adverse events after 72 continuous hours at 2.4% | Safety page |
| Frontiers meta-analysis, 2024 | Reductions in TNF-α, IL-1β, CRP, IL-8 across 12 lung studies | Inflammation claims |

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@h2revive.co.uk
ADMIN_NOTIFICATION_EMAIL=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SITE_URL=https://h2revive.co.uk
```

---

## Component Conventions

- Server components by default; client only when necessary (forms, filters, interactive)
- All Supabase queries in server components using `createServerClient`
- Forms: React Hook Form + Zod validation + Supabase insert in server action
- All enquiry forms capture UTM params from URL and store in leads table
- Loading, success, and error states required on every form
- Mobile-first; all layouts functional at 375px minimum
- Images: Next.js `<Image>` with WebP, proper sizing, no layout shift
- No lorem ipsum — all placeholder copy uses real H2 Revive messaging

---

## SEO Defaults

```typescript
// app/layout.tsx
export const metadata = {
  title: { template: '%s | H2 Revive', default: 'H2 Revive — Hydrogen Inhalation Technology UK' },
  description: 'The UK\'s dedicated hydrogen inhalation wellness brand. Research-backed molecular hydrogen for energy, recovery, and longevity.',
}
// Per page: unique title, description, OG image
// Science pages: FAQ schema, Article schema, BreadcrumbList
// LCP target: < 1.5s (YMYL health content — Google weights this heavily)
```

---

## Competitive Context (inform positioning decisions)

- **QLife (US)**: Market leader commercially, weak educational content, 6.5s real LCP. Ranks #39 for "molecular hydrogen" (5,400/mo). Our opportunity: own the educational/trust lane.
- **HydrogenStudies.com**: Scientific authority, no product. 1.0s LCP benchmark. Do NOT link to them — they sell competing products.
- **H2E (UK, our supplier)**: Only UK site. Makes overclaims ("proven to help" — ASA violation risk). Science page = raw link dump. No brand identity. We win on brand, compliance, and trust centre quality.

**H2 Revive position**: UK-first specialist. Science-backed, compliance-safe, CEO-led authentic voice. Combines scientific authority with a consumer narrative — none of the three competitors hold all three positions.

---

## Admin Panel — Content Generation UI

The admin content section should have:
1. Page selector dropdown
2. Section selector (per page)
3. Persona selector (optional — null = general)
4. "Generate" button — calls `/api/generate-content`
5. Preview of generated content (read-only)
6. "Approve & Publish" button
7. "Regenerate" button
8. Status indicator (generating / compliance check / draft / published)

No rich text editor. No manual editing field. Approve or regenerate only.
This keeps brand voice consistent — editing introduces drift.
