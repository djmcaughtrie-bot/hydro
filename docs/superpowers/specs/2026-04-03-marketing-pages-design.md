# H2 Revive — Marketing Pages Design Spec
**Date:** 2026-04-03
**Status:** Approved
**Scope:** Homepage, Product page, About page, FAQ page — all 4 built and deployed together

---

## 1. Context

Phase 1 foundation and waitlist are live. This spec covers the marketing pages that make up the public-facing site. All pages share a Nav and Footer via a `(site)` route group. Pages are deployed together and unlocked in middleware in one go.

**Brand tokens:** defined in `tailwind.config.ts` — teal `#00B4C6`, ink `#0D1B1E`, cream `#F7F5F0`, ink-mid `#3A4F52`, ink-light `#8AA0A3`, teal-light `#E0F7FA`

**Fonts:** DM Serif Display (`font-display`), DM Sans (`font-sans`), DM Mono (`font-mono`) — already configured in `app/layout.tsx`

**All copy is placeholder** — real content to be dropped in before launch. CEO copy, product specs, and FAQ answers are all stubs.

---

## 2. Architecture

### New files

```
app/
  (site)/
    layout.tsx              ← route group: wraps all pages with Nav + Footer
    page.tsx                ← Homepage (/)
    product/
      page.tsx              ← Product enquiry page (/product)
    about/
      page.tsx              ← About / CEO page (/about)
    faq/
      page.tsx              ← FAQ page (/faq)

components/
  layout/
    Nav.tsx                 ← shared navigation
    Footer.tsx              ← shared footer
  sections/
    TrustBar.tsx            ← reusable dark trust band
    PersonaCards.tsx        ← 3-card persona routing
  forms/
    EnquiryForm.tsx         ← shared enquiry form (replaces WaitlistForm on product page)
  ui/
    Accordion.tsx           ← collapsible FAQ items
```

### Modified files

```
app/page.tsx                ← redirect to / (passes through to (site)/page.tsx)
middleware.ts               ← add /product, /about, /faq to LIVE_ROUTES
```

### Route group

The `(site)` route group does not appear in URLs. `app/(site)/page.tsx` serves `/`, `app/(site)/product/page.tsx` serves `/product`, etc. The group layout provides Nav + Footer to all pages within it.

### Existing files unchanged

`components/forms/WaitlistForm.tsx` remains intact — still used at `/` via the waitlist redirect for now. EnquiryForm is a new component for the product page.

---

## 3. Shared Components

### Nav (`components/layout/Nav.tsx`)

- Logo left (SVG from `public/logo.svg`, links to `/`)
- Links centre/right: Home, Product, Science, About, FAQ
- Science link: rendered but visually muted (`text-ink-light pointer-events-none`) with a "Coming soon" tooltip — not yet live
- "Enquire" pill CTA right: teal, links to `/product`
- Mobile: hamburger menu, links stack vertically
- Sticky on scroll (`position: sticky; top: 0`), cream background, subtle bottom border

```typescript
// No props — static nav for Phase 1
export function Nav() { ... }
```

### Footer (`components/layout/Footer.tsx`)

- Dark ink background
- Logo top left
- Link columns: Product, Company (About, FAQ), Science (coming soon)
- MHRA disclaimer verbatim (small text, muted)
- Social placeholders (Instagram, LinkedIn — `href="#"` until accounts set up)
- Copyright: "© 2026 H2 Revive Ltd. All rights reserved."

```typescript
// No props — static footer
export function Footer() { ... }
```

### TrustBar (`components/sections/TrustBar.tsx`)

Dark ink (`bg-ink`) horizontal band. Four items, pipe-separated on desktop, 2×2 on mobile:

- `50+ studies` — "Research-backed"
- `UK-based` — "Designed and supported in Britain"  
- `2-year warranty` — "Full UK coverage"
- `CE certified` — "Safety certified"

Each item: mono label (teal) + sans description (ink-light).

```typescript
// No props — static content
export function TrustBar() { ... }
```

### PersonaCards (`components/sections/PersonaCards.tsx`)

Cream background section. Label above: "FIND YOUR STORY" (mono, teal, spaced).

Three white cards, equal width, horizontal on desktop / stacked on mobile:

| Card | Icon | Label | Description | Link |
|------|------|-------|-------------|------|
| Energy | ⚡ (SVG) | Energy | "Mental clarity and sustained energy without the crash" | `/product?persona=sarah` |
| Recovery | 🏃 (SVG) | Recovery | "Train harder, recover faster, reduce inflammation" | `/product?persona=marcus` |
| Longevity | 🌿 (SVG) | Longevity | "Cellular health, oxidative stress, and the long game" | `/product?persona=elena` |

Card structure: icon centred, serif label, sans description, teal "LEARN MORE →" link. Hover: subtle teal border.

```typescript
// No props — static content
export function PersonaCards() { ... }
```

### EnquiryForm (`components/forms/EnquiryForm.tsx`)

```typescript
interface EnquiryFormProps {
  source: 'product' | 'clinics' | 'homepage'
  defaultPersona?: 'sarah' | 'marcus' | 'elena'
  showMessage?: boolean   // default: true
  ctaText?: string        // default: 'Send enquiry'
}
```

Fields:
- `name` — text, required
- `email` — email, required
- `phone` — tel, optional
- `persona` — pill select (Energy / Recovery / Longevity), optional. Pre-selected if `defaultPersona` passed.
- `message` — textarea, optional (hidden if `showMessage={false}`)

Behaviour:
1. Validate with React Hook Form + Zod
2. POST to `/api/enquiry` with `{ ...data, enquiry_type: 'product', source_page: source }`
3. Inline success state — no redirect
4. Loading state on submit button
5. Capture UTM params from `window.location.search` on submit

Zod schema:
```typescript
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  persona: z.enum(['sarah', 'marcus', 'elena']).optional(),
  message: z.string().optional(),
})
```

### Accordion (`components/ui/Accordion.tsx`)

```typescript
interface AccordionItem {
  question: string
  answer: string
}

interface AccordionProps {
  items: AccordionItem[]
}
```

- Single-open: opening one closes others
- Animated height transition (CSS `max-height` transition)
- Teal `+` / `−` toggle icon right-aligned
- No external dependencies

---

## 4. Page Designs

### Homepage (`app/(site)/page.tsx`)

Server Component. Metadata:
```typescript
export const metadata: Metadata = {
  title: 'H2 Revive — Hydrogen Inhalation Technology',
  description: "The UK's dedicated hydrogen inhalation wellness brand. Research-backed molecular hydrogen technology for energy, recovery, and longevity.",
}
```

Section order:
1. **Hero** — split layout. Left: eyebrow label ("HYDROGEN INHALATION TECHNOLOGY", mono teal spaced), DM Serif Display headline ("The smallest molecule in existence. The biggest idea in British wellness."), subline ("Clinically studied. UK-made. Built for the serious."), two CTAs: "Explore the device" (teal pill → `/product`) + "See the science" (ghost pill → `/science`, `aria-disabled` since not live). Right: product image placeholder (`bg-ink-light/20 rounded-lg`, aspect ratio 4/5).
2. **TrustBar** — `<TrustBar />`
3. **PersonaCards** — `<PersonaCards />`
4. **CEO Intro** — cream background, two-column: placeholder headshot circle left, pull quote right. Quote: *"I started H2 Revive because I believe the British market deserves honest, research-backed wellness technology. No overclaiming. Just the science."* — with link to `/about`.
5. **Science Teaser** — `bg-teal-light` section. Headline: "50+ peer-reviewed studies. One remarkable molecule." Body: 2 sentences on molecular hydrogen as selective antioxidant. CTA: "Explore the research →" (links to `/science`).
6. **Product Hero** — `bg-ink` section. Product placeholder left, copy right: serif headline "The device built around the science.", subline, "Enquire now" teal pill CTA → `/product`.
7. **Footer** — `<Footer />`

### Product Page (`app/(site)/product/page.tsx`)

Client Component (needs `useSearchParams` for `?persona=`). Metadata:
```typescript
export const metadata: Metadata = {
  title: 'The Device',
  description: 'Hydrogen inhalation technology for energy, recovery, and longevity. Enquire about the H2 Revive device.',
}
```

Section order:
1. **Hero** — `bg-ink`. Product placeholder left, copy right: serif headline "Breathe the science.", subline "H₂ concentration up to 1,200 ppb. Session length 20–60 minutes. CE certified.", teal "Enquire now" CTA (smooth-scrolls to form).
2. **Outcomes Tabs** — 3 persona pills. Pre-selected from `?persona=` param. Placeholder copy per tab:
   - Energy: "Molecular hydrogen has been studied for its potential effects on mitochondrial efficiency and cognitive function..."
   - Recovery: "Athletes exploring molecular hydrogen report faster perceived recovery and reduced post-exercise inflammation markers..."
   - Longevity: "Oxidative stress is one of the primary drivers of cellular ageing. Molecular hydrogen is a selective antioxidant..."
3. **Spec Table** — two-column table. Rows: H₂ concentration (up to 1,200 ppb), H₂ purity (≥99.99%), Session length (20–60 min), Water consumption (~250ml/session), Certifications (CE, RoHS), Warranty (2 years UK).
4. **How It Works** — 3 steps, horizontal on desktop: ① Fill the chamber with water ② Breathe the hydrogen-enriched air ③ Complete your session in 20–60 minutes. Numbered teal circles.
5. **Enquiry Form** — dark ink section (`bg-ink`). `<EnquiryForm source="product" defaultPersona={persona} />`. MHRA disclaimer below button. Form id `enquiry` for scroll target.
6. **FAQ Accordion** — 5 Q&As (purchase objections — see FAQ section below for full list).

### About Page (`app/(site)/about/page.tsx`)

Server Component. Cream background throughout. Metadata:
```typescript
export const metadata: Metadata = {
  title: 'About',
  description: 'The story behind H2 Revive — why we built it, who we are, and what we believe about wellness.',
}
```

Layout:
1. **Hero** — large DM Serif Display headline: "Why I started H2 Revive." Subline placeholder.
2. **Story section** — two-column: CEO headshot placeholder left (circle, `bg-ink-light/20`), 3 placeholder paragraphs right. Topics: personal discovery, why hydrogen, why UK market.
3. **Values strip** — 3 items: "Research first", "No overclaiming", "Built for the serious"
4. **Direct contact** — "Questions? I read every email." with placeholder email `hello@h2revive.co.uk`.

### FAQ Page (`app/(site)/faq/page.tsx`)

Server Component. Cream background. Metadata:
```typescript
export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about the H2 Revive hydrogen inhalation device.',
}
```

Layout: centred column (max-width 720px), `<Accordion>` with 8 items:

1. **Is hydrogen inhalation safe?** — Placeholder: "Molecular hydrogen has been used in research settings for over 15 years with a strong safety profile..."
2. **What does the research actually show?** — Placeholder: "Over 50 peer-reviewed studies have explored molecular hydrogen's effects on oxidative stress, inflammation, and cellular health..."
3. **How much does it cost?** — Placeholder: "The H2 Revive device is priced at £1,200–1,600 depending on configuration. Contact us for a full quote."
4. **How long does a session take?** — Placeholder: "A typical session is 20–60 minutes. Most people use the device once daily."
5. **What do I need to use it?** — Placeholder: "The device requires only water and a power outlet. No specialist setup required."
6. **Is there a warranty?** — Placeholder: "All devices come with a full 2-year UK warranty."
7. **Can I return it?** — Placeholder: "Please contact us before purchase to discuss your needs. We're happy to answer any questions."
8. **When will it be available in the UK?** — Placeholder: "We are currently taking enquiries ahead of our UK launch. Join the waitlist or submit an enquiry to be first to know."

---

## 5. Middleware Update

Add the new routes to `LIVE_ROUTES` in `middleware.ts`:

```typescript
const LIVE_ROUTES = new Set(['/', '/product', '/about', '/faq'])
```

Science (`/science`) and Clinics (`/clinics`) remain redirected until their phases.

---

## 6. Deployment Strategy

All 4 pages built, tested, and merged in a single PR. Middleware updated in the same commit. No partial deploys — the Nav links all pages together so they must ship together.

`app/page.tsx` (the current waitlist) is replaced by the homepage. The waitlist form moves to a `/start` route or is retired — **decision: retire the standalone waitlist page, as the homepage now captures leads via the enquiry form on `/product`**.

---

## 7. Testing

- Unit tests for `EnquiryForm` (submit, validation, success state, persona pre-select)
- Unit tests for `Accordion` (open/close, single-open behaviour)
- Unit tests for `Nav` (renders all links, Science link has aria-disabled)
- No tests for static page components (TrustBar, PersonaCards, Footer) — pure markup

---

## 8. Out of Scope

- Real photography (placeholder divs throughout)
- Real CEO copy (placeholder text throughout)
- Real FAQ answers (placeholders)
- Science page (`/science`) — Phase 2
- Clinics page (`/clinics`) — Phase 2
- Admin panel — Phase 3
- Resend email verification (no sender domain yet)
