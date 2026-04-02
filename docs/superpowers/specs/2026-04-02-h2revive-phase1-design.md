# H2 Revive — Phase 1 Website Design Spec
**Date:** 2026-04-02  
**Status:** Approved  
**Scope:** Full Phase 1 marketing site with admin panel

---

## 1. Project Context

H2 Revive is a UK hydrogen inhalation wellness brand selling a premium molecular hydrogen device (£1,200–1,600). The Phase 1 site is a marketing and lead-capture site — no ecommerce. The product page drives to an enquiry form. All leads and content are managed via a custom admin panel.

**Three target personas:**
- **Sarah** — chronic fatigue / energy
- **Marcus** — athletic recovery / biohacking
- **Elena** — longevity / cellular health

**Infrastructure at start of build:**
- GitHub repo: `djmcaughtrie-bot/hydro`
- Vercel connected to repo (auto-deploys on push)
- Supabase project: `jvvcenyqmexxnjancohs`
- Resend, domain: not yet set up

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ App Router, TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (admin only) |
| Storage | Supabase Storage |
| Hosting | Vercel |
| Forms | React Hook Form + Zod |
| Email | Resend |
| Analytics | Vercel Analytics + custom Supabase events |

---

## 3. Brand Design System

```css
--teal:        #00B4C6;   /* Primary — CTAs, accents */
--teal-dark:   #007A87;   /* Hover states */
--teal-light:  #E0F7FA;   /* Backgrounds, callouts */
--ink:         #0D1B1E;   /* Primary text, dark sections */
--ink-mid:     #3A4F52;   /* Body text */
--ink-light:   #8AA0A3;   /* Captions, muted */
--cream:       #F7F5F0;   /* Page background */
--white:       #FFFFFF;
```

**Typography:**
- Display: `DM Serif Display` — headings, hero, quotes
- Body: `DM Sans` — all body copy, UI
- Mono: `DM Mono` — labels, tags, metadata

**Spacing:** 4px base, multiples thereof  
**Border radius:** 8px cards, 10px panels, 12px large, 100px pills  
**Shadows:** `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`

**Logo:** SVG — stylised H mark with curved notch, superscript 2, "Revive" wordmark. Teal-to-cyan gradient. Stored at `public/logo.svg`. Real logo file to be dropped into `public/` and referenced directly once provided.

---

## 4. Architecture

### Directory Structure

```
app/
  page.tsx                  ← / (phase 1: waitlist; phase 3: homepage)
  layout.tsx                ← site-wide metadata, fonts, analytics
  (site)/                   ← route group, shared Nav + Footer
    home/page.tsx           ← homepage (phased in as /)
    product/page.tsx
    science/page.tsx
    about/page.tsx
    clinics/page.tsx
    faq/page.tsx
  admin/
    page.tsx                ← dashboard
    leads/page.tsx
    science/page.tsx
    settings/page.tsx
  api/
    enquiry/route.ts        ← form submit → Supabase + Resend

components/
  ui/                       ← Button, Badge, Input, Card primitives
  sections/                 ← HeroSection, PersonaRouting, TrustBar, etc.
  forms/                    ← EnquiryForm, StudyForm
  admin/                    ← LeadsTable, StudyEditor, StatsCard

lib/
  supabase/client.ts
  supabase/server.ts
  resend.ts
  utils.ts
```

### Approach: Incremental build, minimal scaffold

Only build what is being deployed. Each page is added to the repo when it is ready to go live. Middleware handles routing per phase.

### Phased Middleware Routing

**Phase 1 (now):** `/` serves the waitlist page. All other routes redirect to `/`.  
**Phase 2 (pages live):** Homepage goes live at `/`. Pages added one by one as `/start` remains at `/start`.  
**Phase 3 (full site):** All routes live. `/start` redirects to `/`. Middleware simplified.

### Data Flow

| Path | Flow |
|---|---|
| Public content | Server Component → Supabase server client → rendered HTML |
| Form submission | Client form → POST `/api/enquiry` → Supabase insert + Resend email |
| Admin | Supabase Auth middleware → Server Components (reads) + Client Components (mutations) |
| Analytics | Vercel Analytics (auto) + custom event on every form submit to Supabase |

---

## 5. Database Schema

### `leads`
```sql
id              uuid primary key default gen_random_uuid()
created_at      timestamptz default now()
name            text not null
email           text not null
phone           text
persona         text        -- 'sarah' | 'marcus' | 'elena' | 'clinic' | 'general'
enquiry_type    text        -- 'product' | 'clinic' | 'waitlist' | 'general'
message         text
source_page     text
utm_source      text
utm_medium      text
utm_campaign    text
status          text default 'new'   -- 'new' | 'contacted' | 'converted' | 'closed'
notes           text
```

### `studies`
```sql
id              uuid primary key default gen_random_uuid()
created_at      timestamptz default now()
updated_at      timestamptz default now()
title           text not null
authors         text
journal         text
year            integer
summary         text not null
key_finding     text
study_type      text        -- 'Human RCT' | 'Human' | 'Animal' | 'Meta-analysis'
evidence_level  text        -- 'Strong' | 'Moderate' | 'Emerging'
categories      text[]      -- ['energy','recovery','longevity','safety','inflammation']
doi_url         text
pubmed_url      text
is_featured     boolean default false
is_published    boolean default true
sort_order      integer default 0
```

### `site_settings`
```sql
key     text primary key
value   text
```

---

## 6. Page Designs

### /start — Waitlist (Phase 1 homepage)

- Dark background (`#0D1B1E`), teal accents
- H2 Revive logo centred
- Headline: "The smallest molecule in existence. The biggest idea in British wellness."
- Subline: "Hydrogen inhalation technology, coming to the UK."
- Email capture + persona self-select radio: Energy / Recovery / Longevity
- On submit: insert to `leads` (enquiry_type: `waitlist`) → success state (no redirect)
- UTM params captured from URL and stored

### / — Homepage (phases in during Phase 2)

Cream background throughout. Section order:

1. **Nav** — logo left, links + "Enquire" pill CTA right
2. **Hero** — eyebrow label, DM Serif Display headline, subline, dual CTA (primary teal pill + ghost pill), hero photography placeholder
3. **Trust Bar** — dark ink band: 50+ studies / UK-based / 2yr warranty / CE certified
4. **Persona Routing** — "Find your story" label, 3 white cards (Energy / Recovery / Longevity). Subtle — not a gate. Each links to `/product?persona=sarah|marcus|elena`
5. **CEO Intro** — photo + pull quote strip, link to `/about`
6. **Science Teaser** — teal-light background, one compelling fact, link to `/science`
7. **Product Hero** — product photo placeholder, headline spec, dark CTA
8. **Footer** — dark ink, links, legal, social

### /product — Product Enquiry Page

1. **Product Hero** — dark ink background, product photo left, headline + subline + enquire CTA right
2. **Outcomes Tabs** — persona pill tabs (Energy / Recovery / Longevity), content updates per tab. Persona pre-selected from `?persona=` URL param
3. **Spec Table** — two-column: label / value. H₂ concentration, purity, session length, water type, certification
4. **How It Works** — 3-step: Fill → Breathe → Feel with numbered teal circles
5. **Science Callout** — one featured study card, link to `/science`
6. **In the Box** — what's included
7. **Warranty Block** — UK warranty story
8. **Enquiry Form** — dark ink section. Fields: name, email, phone (optional), persona pill select, message (optional). On submit: Supabase insert + Resend notification. MHRA disclaimer below submit button. Success state inline, no redirect
9. **Product FAQ** — accordion, purchase objections

### /science — Science Hub

1. **Hero** — dark, founder quote, study count stats
2. **Mechanism Explainer** — what is molecular hydrogen, selective antioxidant concept
3. **Filter Pills** — All / Energy / Recovery / Longevity / Safety / Inflammation
4. **Study Grid** — 2-column, fetched from Supabase `studies` table (server component). Filtered client-side on pill click
5. **Study Card** — title, journal, year, evidence badge (Strong=green / Moderate=amber / Emerging=blue), study type tag, summary, DOI/PubMed link
6. **MHRA Disclaimer** — amber banner, verbatim text, prominent placement near grid
7. **Science CTA** — link to `/product`

### /about — CEO Page

- Founder story, long-form narrative
- CEO portrait placeholder
- Brand origin, why UK, product selection rationale
- Intellectual honesty commitment ("no overclaiming")
- Direct email invite

### /admin — Admin Panel (Supabase Auth protected)

Auth: Supabase Auth, email/password. Small team access (2–3 people) — invite-based via Supabase Auth dashboard. No self-registration.

**`/admin` — Dashboard**
- 4 stat cards: Total leads / New today / Studies / Converted
- Recent leads table (last 10)

**`/admin/leads` — Leads Management**
- Full table: name, email, persona, type, status, date
- Filter by status / persona / enquiry type
- Click row → slide-out detail panel: full lead data, status dropdown, notes textarea, save button
- Export to CSV

**`/admin/science` — Study Management**
- List all studies, sortable
- Add / edit / delete
- Toggle `is_published` inline
- Form fields: title, authors, journal, year, summary, key_finding, study_type, evidence_level, categories (multi-select), doi_url, pubmed_url

**`/admin/settings` — Site Settings**
- Key/value editor for `site_settings` table
- Fields: contact email, social links, announcement bar text

### /clinics — B2B Page

- Trade-focused messaging
- Enquiry form (`enquiry_type: 'clinic'`)

### /faq — FAQ Page

- Accordion layout
- Objection-mapped questions

---

## 7. Shared Component Specs

### EnquiryForm

```typescript
interface EnquiryFormProps {
  source: 'product' | 'clinics' | 'waitlist' | 'homepage'
  showPersonaSelect?: boolean
  showMessage?: boolean
  ctaText?: string
}
```

Behaviour:
1. Validate with React Hook Form + Zod
2. POST to `/api/enquiry`
3. API route: insert to Supabase `leads` + send Resend notification
4. Show inline success state — never redirect
5. Capture UTM params from URL on submit
6. Show loading state on submit button

### StudyCard

```typescript
interface Study {
  id: string
  title: string
  journal: string
  year: number
  summary: string
  key_finding: string
  study_type: 'Human RCT' | 'Human' | 'Animal' | 'Meta-analysis'
  evidence_level: 'Strong' | 'Moderate' | 'Emerging'
  categories: string[]
  doi_url?: string
  pubmed_url?: string
  is_featured: boolean
}
```

Evidence badge colours: Strong=green (`#dcfce7`/`#166534`), Moderate=amber (`#fef9c3`/`#854d0e`), Emerging=blue (`#dbeafe`/`#1e40af`)

---

## 8. Copy & Compliance Rules

**Always use:** "may support", "research suggests", "some users report", "studies explore", "we believe"

**Never use:** "treats", "cures", "proven to", "guaranteed", "eliminates", "heals", "clinical grade", "medical device", "therapeutic treatment"

**MHRA disclaimer** (verbatim, near all health claims):
> "These statements have not been evaluated by the MHRA. This product is not intended to diagnose, treat, cure, or prevent any disease. Research referenced is cited for educational purposes."

**CEO voice:** First person, curious, conviction-led. "I found" not "science proves."

---

## 9. SEO

```typescript
// site-wide default
title: { template: '%s | H2 Revive', default: 'H2 Revive — Hydrogen Inhalation Technology' }
description: "The UK's dedicated hydrogen inhalation wellness brand..."

// per-page targets
/           'hydrogen inhalation UK', 'molecular hydrogen therapy UK'
/product    'hydrogen inhalation machine UK', 'buy hydrogen inhaler UK'
/science    'molecular hydrogen benefits', 'hydrogen therapy research'
/clinics    'hydrogen therapy clinic UK', 'hydrogen machine for clinic'
```

---

## 10. Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@h2revive.co.uk
ADMIN_NOTIFICATION_EMAIL=
NEXT_PUBLIC_SITE_URL=https://h2revive.co.uk
```

---

## 11. Build Order (Phase 1)

1. **Foundation** — Next.js 14 scaffold, Tailwind config with brand tokens, Google Fonts, Supabase client setup, env vars, Vercel deploy
2. **`/start` waitlist page** — live immediately, start capturing leads
3. **Homepage** — phases in as `/` when ready
4. **`/product`** — enquiry form live, Resend wired up
5. **`/science`** — Supabase studies table seeded with initial studies
6. **`/about`** — CEO story
7. **`/admin`** — auth-protected panel, leads + science management
8. **`/clinics` + `/faq`** — supporting pages

---

## 12. Out of Scope (Phase 1)

- Ecommerce / checkout
- `/journal` blog (Phase 2)
- Self-service admin user registration (team invited via Supabase Auth dashboard)
- Feature flag routing via `site_settings` (middleware approach used instead)
