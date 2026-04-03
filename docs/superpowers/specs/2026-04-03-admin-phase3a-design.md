# H2 Revive — Admin Panel Phase 3a Design Spec
**Date:** 2026-04-03
**Status:** Approved
**Scope:** Auth + Admin layout + Dashboard + Leads management (list, detail, notes)

---

## 1. Context

Phase 3a is the first admin sub-project. It delivers the operational core: a password-protected admin panel where the H2 Revive operator can see all enquiry leads, update their status, and keep notes on each one. This unblocks day-to-day sales follow-up without needing to query Supabase directly.

Phase 3b (Science management) and Phase 3c (AI content generation) follow once this is shipped.

The `leads` table already exists in Supabase (created in Phase 1). The `notes text` column exists but is empty — it will store a JSON array of timestamped note objects.

---

## 2. Architecture

### New files

```
app/admin/
  layout.tsx                    ← auth gate + sidebar shell (server component)
  page.tsx                      ← dashboard: stat cards + recent leads (server)
  login/
    page.tsx                    ← public login page (client form)
  leads/
    page.tsx                    ← leads list with status filter (server)
    [id]/
      page.tsx                  ← lead detail: metadata, message, status, notes (server)

components/admin/
  AdminSidebar.tsx              ← sidebar nav with active link (client)
  StatCard.tsx                  ← dashboard stat card (server-compatible)
  LeadStatusBadge.tsx           ← coloured status pill (server-compatible)
  LeadNotes.tsx                 ← append-only notes log (client)

app/api/admin/
  leads/[id]/route.ts           ← PATCH: update status + append note (server, auth-checked)
```

### Existing files unchanged
- `middleware.ts` — already passes `/admin` through
- `lib/supabase/server.ts` — used for all server-side Supabase queries
- `lib/supabase/client.ts` — used in client components (login form, sign out)

### Route map

| Route | Component | Auth? |
|-------|-----------|-------|
| `/admin/login` | `LoginPage` | Public |
| `/admin` | `DashboardPage` | Protected |
| `/admin/leads` | `LeadsPage` | Protected |
| `/admin/leads/[id]` | `LeadDetailPage` | Protected |

---

## 3. Auth

### Login page (`app/admin/login/page.tsx`)

Client component. Email + password form using `supabase.auth.signInWithPassword()` from `@/lib/supabase/client`. On success: `router.push('/admin')`. On failure: show inline error message below the form (e.g. "Invalid email or password").

No sign-up flow. Admin account created once via Supabase dashboard (Authentication → Users → Invite user).

```typescript
// Form fields: email (type="email"), password (type="password")
// On submit: await supabase.auth.signInWithPassword({ email, password })
// Success: router.push('/admin')
// Error: setError(error.message)
```

### Auth gate (`app/admin/layout.tsx`)

Server component. Runs on every admin request except `/admin/login`.

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  return <AdminShell>{children}</AdminShell>
}
```

`AdminShell` renders the sidebar + main content area. The login page is excluded from this layout — it lives at `app/admin/login/page.tsx` which does NOT inherit `app/admin/layout.tsx` (it is a sibling, not a child, so it renders without the auth gate).

**Important:** `app/admin/login/` must NOT be nested under the protected layout. Use a separate layout file at `app/admin/login/layout.tsx` that renders just `{children}` with no auth check, OR rely on the fact that `redirect('/admin/login')` in the parent layout won't infinite-loop because the login page is excluded by a pathname check.

Simplest approach: add a pathname check in `AdminLayout`:

```typescript
// app/admin/layout.tsx
import { headers } from 'next/headers'

export default async function AdminLayout({ children }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  
  // Login page is public — skip auth check
  if (pathname.startsWith('/admin/login')) {
    return <>{children}</>
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  
  return <AdminShell>{children}</AdminShell>
}
```

**Alternatively** (cleaner): put `login/` outside the `admin/` route group by using a route group `app/(admin)/` for protected routes, with the login page at `app/admin/login/`. But for simplicity, use the pathname check approach.

### Sign out

`AdminSidebar` has a "Sign out" button at the bottom. Client-side: calls `supabase.auth.signOut()` then `router.push('/admin/login')`.

---

## 4. Admin layout (`components/admin/AdminSidebar.tsx`)

`'use client'` — needs `usePathname()` and `useRouter()` for active states and sign-out.

```typescript
interface NavItem {
  label: string
  href: string
  badge?: number  // for unread lead count
}
```

Sidebar styling:
- Background: `bg-ink` (full height)
- Width: `w-56` on desktop
- Brand: "H2 ADMIN" in `font-mono text-xs text-teal` at top
- Nav items: `font-sans text-sm`
  - Active: `bg-ink-mid/30 text-white border-l-2 border-teal`
  - Inactive: `text-ink-light hover:text-white`
- Badge (new leads count): `bg-teal text-white rounded-full text-xs px-1.5`
- Sign out: bottom of sidebar, `text-ink-light hover:text-white font-sans text-sm`

The `AdminShell` server component wraps `AdminSidebar` + `<main>` content area. Layout: `flex h-screen`. Sidebar is fixed width, main is `flex-1 overflow-auto bg-gray-50`.

---

## 5. Dashboard (`app/admin/page.tsx`)

Server component. Fires 4 parallel Supabase count queries + 1 recent leads query:

```typescript
const [newCount, contactedCount, convertedCount, closedCount, recentLeads] = await Promise.all([
  supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
  supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
  supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'converted'),
  supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
  supabase.from('leads').select('id, name, email, persona, status, created_at').order('created_at', { ascending: false }).limit(5),
])
```

Layout:
1. Page heading: "Dashboard" in `font-display text-2xl text-ink`
2. 4 stat cards in a `grid grid-cols-2 md:grid-cols-4` row
3. "Recent leads" heading
4. List of 5 most recent leads — each row links to `/admin/leads/[id]`

### StatCard (`components/admin/StatCard.tsx`)

```typescript
interface StatCardProps {
  label: string        // "New" | "Contacted" | "Converted" | "Closed"
  count: number
  href: string         // e.g. "/admin/leads?status=new" — card is a link
}
```

Styling: white card, `rounded-lg border border-gray-200 p-5`. Label in `font-mono text-xs uppercase tracking-widest text-ink-light`. Count in `font-display text-4xl text-ink`. Hover: `hover:border-teal/50 transition-colors`.

---

## 6. Leads list (`app/admin/leads/page.tsx`)

Server component. Reads `?status=` from `searchParams`.

```typescript
const status = searchParams.status  // 'new' | 'contacted' | 'converted' | 'closed' | undefined
const query = supabase.from('leads').select('*').order('created_at', { ascending: false })
if (status) query.eq('status', status)
const { data: leads } = await query
```

Layout:
- Page heading: "Leads" + total count
- Filter pills row (client component `LeadsFilter`): All / New / Contacted / Converted / Closed — clicking calls `router.push(?status=X)` — uses `useSearchParams` so needs `<Suspense>` wrapper
- Leads table: each row = name, email, persona badge, source page, time ago (formatted), `LeadStatusBadge`. Full row is clickable → `/admin/leads/[id]`

### LeadStatusBadge (`components/admin/LeadStatusBadge.tsx`)

```typescript
const statusStyles = {
  new:        { bg: 'bg-amber-100',  text: 'text-amber-800'  },
  contacted:  { bg: 'bg-blue-100',   text: 'text-blue-800'   },
  converted:  { bg: 'bg-green-100',  text: 'text-green-800'  },
  closed:     { bg: 'bg-gray-100',   text: 'text-gray-600'   },
}
```

---

## 7. Lead detail (`app/admin/leads/[id]/page.tsx`)

Server component. Fetches full lead row by `params.id`. If not found: `notFound()`.

Sections:

### Header
- "← All leads" back link → `/admin/leads`
- Name in `font-display text-2xl`
- Email, phone in `font-sans text-sm text-ink-mid`
- `LeadStatusBadge` inline

### Metadata grid
4-column grid (2×2 on mobile):
- Persona (formatted: "Sarah — Energy")
- Enquiry type
- Source page
- Created at (formatted date)
- UTM source / UTM medium / UTM campaign (shown only if not null)

### Message
Shown only if `lead.message` is not null. Styled as a blockquote with `border-l-2 border-ink-light/30 pl-4 font-sans text-sm italic text-ink-mid`.

### Status update
Client component (`LeadStatusUpdate`):
- Dropdown: New / Contacted / Converted / Closed — pre-selected to current status
- "Save status" button — PATCH `/api/admin/leads/[id]` with `{ status }`
- Shows success/error inline feedback

### Notes log (`components/admin/LeadNotes.tsx`)
Client component. Props: `leadId: string`, `initialNotes: NoteEntry[]`.

```typescript
interface NoteEntry {
  text: string
  created_at: string  // ISO timestamp
}
```

Notes are stored in `leads.notes` as a JSON string: `JSON.stringify(NoteEntry[])`. Server parses on fetch: `JSON.parse(lead.notes ?? '[]')`.

Display: notes listed newest-first, each showing formatted date + text. Below the list: `<textarea>` + "Add note" button. On submit: PATCH `/api/admin/leads/[id]` with `{ note: text }` — API appends to the array.

---

## 8. API route (`app/api/admin/leads/[id]/route.ts`)

```typescript
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()  // { status?: string, note?: string }

  if (body.status) {
    await supabase.from('leads').update({ status: body.status }).eq('id', id)
  }

  if (body.note) {
    const { data: lead } = await supabase.from('leads').select('notes').eq('id', id).single()
    const existing: NoteEntry[] = JSON.parse(lead?.notes ?? '[]')
    const updated = [{ text: body.note, created_at: new Date().toISOString() }, ...existing]
    await supabase.from('leads').update({ notes: JSON.stringify(updated) }).eq('id', id)
  }

  return Response.json({ ok: true })
}
```

---

## 9. Testing

### Unit tests

**`LeadStatusBadge`** (`__tests__/components/admin/LeadStatusBadge.test.tsx`):
- Renders "New" with amber classes
- Renders "Contacted" with blue classes
- Renders "Converted" with green classes
- Renders "Closed" with gray classes

**`StatCard`** (`__tests__/components/admin/StatCard.tsx`):
- Renders label and count
- Renders as a link with correct href

**`LeadNotes`** (`__tests__/components/admin/LeadNotes.test.tsx`):
- Renders existing notes with timestamps
- Textarea + submit button present
- On submit: calls fetch PATCH with note text
- Adds new note to list after successful submit
- Clears textarea after submit

**`AdminSidebar`** (`__tests__/components/admin/AdminSidebar.test.tsx`):
- Renders all nav links
- Active link has correct aria/style indicator (via `usePathname` mock)
- Sign out button present

---

## 10. Design tokens

Admin uses the same Tailwind config as the public site. Additional conventions:
- Admin backgrounds: `bg-gray-50` (page), `bg-white` (cards/panels)
- Admin sidebar: `bg-ink`
- Admin text: `text-ink` (headings), `text-ink-mid` (body), `text-ink-light` (labels)
- Actions: `bg-teal` buttons, `hover:bg-teal-dark`
- All form elements: `border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal`

---

## 11. Out of scope

- CSV export of leads (Phase 3b)
- Email sending from within the admin (Phase 3b)
- Science study management (Phase 3b)
- AI content generation (Phase 3c)
- Multi-user admin accounts
- Password reset flow (use Supabase dashboard)
