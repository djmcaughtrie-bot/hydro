# Content Wiring — Design Spec

**Date:** 2026-04-03
**Status:** Approved

---

## Goal

Wire the five public pages to read published `content_items` rows from Supabase, with graceful fallback to hardcoded copy when nothing is published. Rename personas from name-based slugs to focus-based slugs. Add a persona selector to the two pages where persona meaningfully changes the copy.

---

## Persona Rename

Personas are renamed from person names to focus areas across the entire codebase and database:

| Old | New |
|-----|-----|
| `sarah` | `energy` |
| `marcus` | `performance` |
| `elena` | `longevity` |

**Affected:**
- DB `CHECK` constraint on `leads.persona`
- DB `CHECK` constraint on `content_items.persona`
- `CONTENT_CONFIG` persona labels in `lib/content-config.ts`
- `PERSONA_LABELS` in `components/admin/ContentEditForm.tsx`
- `PERSONAS` array in `components/admin/ContentGenerationForm.tsx`
- All other code references to `'sarah'`, `'marcus'`, `'elena'`
- `CLAUDE.md` documentation

A DB migration (`005_rename_personas.sql`) updates both CHECK constraints and migrates existing data.

---

## Architecture

### `lib/content.ts` — data utility

Single shared function used by all public pages:

```typescript
export async function getPageContent(
  page: string,
  sections: string[],
  persona: string | null
): Promise<Record<string, Record<string, unknown>>>
```

**Query:** Fetches all `content_items` rows where:
- `page` matches
- `section` is in `sections[]`
- `status = 'published'`
- `persona = <requested>` OR `persona IS NULL`

**Persona priority:** If both a persona-specific row and a general (`persona IS NULL`) row exist for the same section, the persona-specific row wins.

**Return value:** `Record<section, content_json>` — only sections with published content are present. Missing sections are absent from the map (not null/undefined).

**Usage pattern in pages:**
```typescript
const content = await getPageContent('homepage', ['hero', 'features'], persona)
const headline = content['hero']?.headline ?? 'Hardcoded fallback headline'
```

Uses `createClient()` from `@/lib/supabase/server` — same client the science page already uses. No new dependencies.

---

### `components/PersonaSelector.tsx` — client component

```typescript
interface Props {
  current: 'energy' | 'performance' | 'longevity' | null
}
```

Renders a pill row with four options: General / Energy / Performance / Longevity.

Each option is a Next.js `<Link>` that sets `?persona=<slug>` in the URL, preserving all other existing search params. The active option is visually highlighted (teal background, white text). Inactive options are ghost pills.

Positioned below the hero section on pages that show it.

---

## Page Wiring

### Sections connected per page

| Page | Sections | Persona selector |
|------|----------|-----------------|
| Homepage (`/`) | `hero`, `features`, `social_proof` | Yes |
| Product (`/product`) | `hero`, `features`, `how_it_works`, `cta` | Yes |
| About (`/about`) | `hero`, `ceo_story` | No |
| FAQ (`/faq`) | `hero`, `items` | No |
| Clinics (`/clinics`) | — | — | (page not yet built — skip) |
| Science (`/science`) | `hero` | No |

### Pattern per page

Each page:
1. Becomes (or stays) an async server component
2. Reads `searchParams.persona` and validates it against the allowed set
3. Calls `getPageContent(page, sections, persona)`
4. Renders `<PersonaSelector current={persona} />` if applicable
5. Spreads `content_json` fields over hardcoded defaults field by field

### Fallback guarantee

Every field falls back to hardcoded copy if the content_items row is absent or the field is missing from `content_json`. Visitors never see a blank field. Pages render identically to today until content is published.

---

## URL and Navigation

- Persona is carried as `?persona=energy|performance|longevity` query param
- `PersonaSelector` links preserve other params (e.g. `?persona=energy&utm_campaign=foo`)
- No localStorage persistence in this phase — UTM → persona mapping is a follow-on
- Internal navigation links between Homepage and Product carry the persona param forward

---

## DB Migration: `005_rename_personas.sql`

```sql
-- Update content_items persona check constraint
ALTER TABLE public.content_items
  DROP CONSTRAINT IF EXISTS content_items_persona_check;
ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_persona_check
  CHECK (persona IN ('energy', 'performance', 'longevity'));

-- Migrate existing data
UPDATE public.content_items SET persona = 'energy'      WHERE persona = 'sarah';
UPDATE public.content_items SET persona = 'performance' WHERE persona = 'marcus';
UPDATE public.content_items SET persona = 'longevity'   WHERE persona = 'elena';

-- Update leads persona check constraint
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_persona_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_persona_check
  CHECK (persona IN ('energy', 'performance', 'longevity', 'clinic', 'general'));

-- Migrate existing leads data
UPDATE public.leads SET persona = 'energy'      WHERE persona = 'sarah';
UPDATE public.leads SET persona = 'performance' WHERE persona = 'marcus';
UPDATE public.leads SET persona = 'longevity'   WHERE persona = 'elena';
```

---

## File Map

| Action | File |
|--------|------|
| Create | `lib/content.ts` |
| Create | `components/PersonaSelector.tsx` |
| Create | `supabase/migrations/005_rename_personas.sql` |
| Modify | `app/(site)/page.tsx` |
| Modify | `app/(site)/product/page.tsx` |
| Modify | `app/(site)/about/page.tsx` |
| Modify | `app/(site)/faq/page.tsx` |
| Modify | `app/(site)/science/page.tsx` |
| Skip | `app/(site)/clinics/page.tsx` — not yet built |
| Modify | `lib/content-config.ts` |
| Modify | `components/admin/ContentEditForm.tsx` |
| Modify | `components/admin/ContentGenerationForm.tsx` |
| Modify | `CLAUDE.md` |

---

## Out of Scope

- UTM → persona mapping (follow-on — trivial once this is in place)
- Journal/blog
- Layout or visual changes to public pages
- New pages
