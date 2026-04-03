# Admin Panel Phase 3a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a password-protected admin panel with Supabase Auth, sidebar layout, dashboard stat cards, and full leads management (list, detail, status updates, append-only notes).

**Architecture:** Route groups separate public (`/admin/login`) from protected routes — `app/admin/(protected)/layout.tsx` is the single auth gate that checks Supabase session and renders the sidebar shell. All admin data operations use a service role Supabase client to bypass RLS. Client components (sidebar, notes, status update, filter pills) are isolated; all pages are server components.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase SSR + service role, Vitest + Testing Library.

---

## File map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/supabase/admin.ts` | Create | Service role Supabase client for admin data ops |
| `components/admin/LeadStatusBadge.tsx` | Create | Coloured status pill (New/Contacted/Converted/Closed) |
| `components/admin/StatCard.tsx` | Create | Dashboard stat card — label, count, link |
| `components/admin/AdminSidebar.tsx` | Create | Sidebar nav with active link + sign out (client) |
| `components/admin/LeadsFilter.tsx` | Create | Filter pills with URL param sync (client, useSearchParams) |
| `components/admin/LeadStatusUpdate.tsx` | Create | Status dropdown + save button (client) |
| `components/admin/LeadNotes.tsx` | Create | Append-only timestamped notes log (client) |
| `app/admin/(public)/login/page.tsx` | Create | Public login form (email + password) |
| `app/admin/(protected)/layout.tsx` | Create | Auth gate + AdminShell with sidebar |
| `app/admin/(protected)/page.tsx` | Create | Dashboard: stat cards + recent leads |
| `app/api/admin/leads/[id]/route.ts` | Create | PATCH: update lead status or append note |
| `app/admin/(protected)/leads/page.tsx` | Create | Leads list with status filter |
| `app/admin/(protected)/leads/[id]/page.tsx` | Create | Lead detail: metadata, message, status, notes |

---

## Important project context

- **Leads table RLS**: `supabase/migrations/001_leads.sql` enables RLS with `service_role` only. All admin data reads/writes must use `createAdminClient()` (service role), not `createClient()` (anon). Auth checks (is user logged in?) still use `createClient()`.
- **Route groups**: `app/admin/(protected)/` maps to `/admin/...` URLs. `app/admin/(public)/login/` maps to `/admin/login`. Route group names in parentheses don't appear in URLs. This gives the login page its own layout (none) without the auth gate.
- **Existing patterns**: Server components use `await createClient()` from `@/lib/supabase/server`. Client components use `createClient()` from `@/lib/supabase/client`. Both are already implemented.
- **SUPABASE_SERVICE_ROLE_KEY** is in the environment (listed in CLAUDE.md env vars).
- **cn()** utility is at `@/lib/cn` — use it for conditional classes.
- **Design tokens**: `bg-ink`, `bg-teal`, `bg-teal-dark`, `text-teal`, `text-ink`, `text-ink-mid`, `text-ink-light`, `font-display`, `font-sans`, `font-mono`, `rounded-pill`.

---

## Task 1: Service role Supabase client

**Files:**
- Create: `lib/supabase/admin.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/admin.ts
git commit -m "feat: add service role Supabase client for admin"
```

---

## Task 2: LeadStatusBadge component

**Files:**
- Create: `components/admin/LeadStatusBadge.tsx`
- Create: `__tests__/components/admin/LeadStatusBadge.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/admin/LeadStatusBadge.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge'

describe('LeadStatusBadge', () => {
  it('renders "New" with amber classes', () => {
    render(<LeadStatusBadge status="new" />)
    const badge = screen.getByText('New')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-amber-100')
    expect(badge).toHaveClass('text-amber-800')
  })

  it('renders "Contacted" with blue classes', () => {
    render(<LeadStatusBadge status="contacted" />)
    const badge = screen.getByText('Contacted')
    expect(badge).toHaveClass('bg-blue-100')
    expect(badge).toHaveClass('text-blue-800')
  })

  it('renders "Converted" with green classes', () => {
    render(<LeadStatusBadge status="converted" />)
    const badge = screen.getByText('Converted')
    expect(badge).toHaveClass('bg-green-100')
    expect(badge).toHaveClass('text-green-800')
  })

  it('renders "Closed" with gray classes', () => {
    render(<LeadStatusBadge status="closed" />)
    const badge = screen.getByText('Closed')
    expect(badge).toHaveClass('bg-gray-100')
    expect(badge).toHaveClass('text-gray-600')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/components/admin/LeadStatusBadge.test.tsx`
Expected: FAIL — "Cannot find module '@/components/admin/LeadStatusBadge'"

- [ ] **Step 3: Implement LeadStatusBadge**

```typescript
// components/admin/LeadStatusBadge.tsx
type LeadStatus = 'new' | 'contacted' | 'converted' | 'closed'

const statusConfig: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new:       { label: 'New',       bg: 'bg-amber-100', text: 'text-amber-800' },
  contacted: { label: 'Contacted', bg: 'bg-blue-100',  text: 'text-blue-800'  },
  converted: { label: 'Converted', bg: 'bg-green-100', text: 'text-green-800' },
  closed:    { label: 'Closed',    bg: 'bg-gray-100',  text: 'text-gray-600'  },
}

interface LeadStatusBadgeProps {
  status: LeadStatus
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const { label, bg, text } = statusConfig[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/components/admin/LeadStatusBadge.test.tsx`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add components/admin/LeadStatusBadge.tsx __tests__/components/admin/LeadStatusBadge.test.tsx
git commit -m "feat: add LeadStatusBadge component"
```

---

## Task 3: StatCard component

**Files:**
- Create: `components/admin/StatCard.tsx`
- Create: `__tests__/components/admin/StatCard.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/admin/StatCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/admin/StatCard'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="New" count={12} href="/admin/leads?status=new" />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('renders the count', () => {
    render(<StatCard label="New" count={12} href="/admin/leads?status=new" />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders as a link with the correct href', () => {
    render(<StatCard label="New" count={12} href="/admin/leads?status=new" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/admin/leads?status=new')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/components/admin/StatCard.test.tsx`
Expected: FAIL — "Cannot find module '@/components/admin/StatCard'"

- [ ] **Step 3: Implement StatCard**

```typescript
// components/admin/StatCard.tsx
import Link from 'next/link'

interface StatCardProps {
  label: string
  count: number
  href: string
}

export function StatCard({ label, count, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-teal/50"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-ink-light">{label}</p>
      <p className="mt-2 font-display text-4xl text-ink">{count}</p>
    </Link>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/components/admin/StatCard.test.tsx`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add components/admin/StatCard.tsx __tests__/components/admin/StatCard.test.tsx
git commit -m "feat: add StatCard component"
```

---

## Task 4: AdminSidebar component

**Files:**
- Create: `components/admin/AdminSidebar.tsx`
- Create: `__tests__/components/admin/AdminSidebar.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/admin/AdminSidebar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  })),
}))

describe('AdminSidebar', () => {
  it('renders brand label', () => {
    render(<AdminSidebar newLeadsCount={0} />)
    expect(screen.getByText('H2 ADMIN')).toBeInTheDocument()
  })

  it('renders Dashboard link', () => {
    render(<AdminSidebar newLeadsCount={0} />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('renders Leads link', () => {
    render(<AdminSidebar newLeadsCount={0} />)
    expect(screen.getByRole('link', { name: /leads/i })).toBeInTheDocument()
  })

  it('shows new leads badge when count > 0', () => {
    render(<AdminSidebar newLeadsCount={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('does not show badge when count is 0', () => {
    render(<AdminSidebar newLeadsCount={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders Sign out button', () => {
    render(<AdminSidebar newLeadsCount={0} />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/components/admin/AdminSidebar.test.tsx`
Expected: FAIL — "Cannot find module '@/components/admin/AdminSidebar'"

- [ ] **Step 3: Implement AdminSidebar**

```typescript
// components/admin/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { createClient } from '@/lib/supabase/client'

interface AdminSidebarProps {
  newLeadsCount: number
}

const navItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Leads', href: '/admin/leads' },
  { label: 'Science', href: '/admin/science' },
  { label: 'Content', href: '/admin/content' },
  { label: 'Settings', href: '/admin/settings' },
]

export function AdminSidebar({ newLeadsCount }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col bg-ink">
      <div className="px-4 py-6">
        <p className="font-mono text-xs font-semibold tracking-widest text-teal">H2 ADMIN</p>
      </div>

      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {navItems.map(({ label, href }) => {
            const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 font-sans text-sm transition-colors',
                    isActive
                      ? 'border-l-2 border-teal bg-ink-mid/30 text-white'
                      : 'text-ink-light hover:text-white'
                  )}
                >
                  <span>{label}</span>
                  {label === 'Leads' && newLeadsCount > 0 && (
                    <span className="rounded-full bg-teal px-1.5 font-mono text-xs text-white">
                      {newLeadsCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-2 py-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-md px-3 py-2 text-left font-sans text-sm text-ink-light transition-colors hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/components/admin/AdminSidebar.test.tsx`
Expected: PASS — 6 tests

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass (58 pre-existing + 4 + 3 + 6 = 71 total)

- [ ] **Step 6: Commit**

```bash
git add components/admin/AdminSidebar.tsx __tests__/components/admin/AdminSidebar.test.tsx
git commit -m "feat: add AdminSidebar component"
```

---

## Task 5: Login page and auth layout

**Files:**
- Create: `app/admin/(public)/login/page.tsx`
- Create: `app/admin/(protected)/layout.tsx`

### Spec notes

- Login page: client component, uses `createClient()` from `@/lib/supabase/client`, calls `supabase.auth.signInWithPassword({ email, password })`
- The route group `(protected)` applies the auth layout only to routes inside it. `(public)` routes (login) get no admin layout.
- `app/admin/(protected)/layout.tsx` fetches the new leads count (for sidebar badge) then renders `AdminSidebar` + `<main>`.
- No `x-pathname` header needed — route groups handle the separation cleanly.

- [ ] **Step 1: Create the login page**

```typescript
// app/admin/(public)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="w-full max-w-sm">
        <p className="mb-8 font-mono text-xs font-semibold tracking-widest text-teal">H2 ADMIN</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-mid/30 bg-ink-mid/10 px-4 py-2.5 font-sans text-sm text-white placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="you@h2revive.co.uk"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-mid/30 bg-ink-mid/10 px-4 py-2.5 font-sans text-sm text-white placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="••••••••"
            />
          </div>

          {error !== null && (
            <p className="font-sans text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal px-4 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the protected layout**

```typescript
// app/admin/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  // Auth check using standard (anon) client — reads session from cookies
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Fetch new leads count for sidebar badge — uses service role client
  const adminClient = createAdminClient()
  const { count: newLeadsCount } = await adminClient
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar newLeadsCount={newLeadsCount ?? 0} />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(public)/login/page.tsx" "app/admin/(protected)/layout.tsx"
git commit -m "feat: add admin login page and protected layout with auth gate"
```

---

## Task 6: Dashboard page

**Files:**
- Create: `app/admin/(protected)/page.tsx`

- [ ] **Step 1: Create the dashboard page**

```typescript
// app/admin/(protected)/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatCard } from '@/components/admin/StatCard'
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge'

export const metadata: Metadata = { title: 'Dashboard | H2 Admin' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default async function DashboardPage() {
  const supabase = createAdminClient()

  const [
    { count: newCount },
    { count: contactedCount },
    { count: convertedCount },
    { count: closedCount },
    { data: recentLeads },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'converted'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase
      .from('leads')
      .select('id, name, email, persona, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <>
      <h1 className="mb-8 font-display text-2xl text-ink">Dashboard</h1>

      {/* Stat cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="New" count={newCount ?? 0} href="/admin/leads?status=new" />
        <StatCard label="Contacted" count={contactedCount ?? 0} href="/admin/leads?status=contacted" />
        <StatCard label="Converted" count={convertedCount ?? 0} href="/admin/leads?status=converted" />
        <StatCard label="Closed" count={closedCount ?? 0} href="/admin/leads?status=closed" />
      </div>

      {/* Recent leads */}
      <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-widest text-ink-light">
        Recent leads
      </h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {!recentLeads || recentLeads.length === 0 ? (
          <p className="px-5 py-4 font-sans text-sm text-ink-light">No leads yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentLeads.map(lead => (
              <li key={lead.id}>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="font-sans text-sm font-medium text-ink">{lead.name ?? lead.email}</p>
                    <p className="font-mono text-xs text-ink-light">{timeAgo(lead.created_at)}</p>
                  </div>
                  <LeadStatusBadge status={lead.status as 'new' | 'contacted' | 'converted' | 'closed'} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/page.tsx"
git commit -m "feat: add admin dashboard with stat cards and recent leads"
```

---

## Task 7: PATCH API route for leads

**Files:**
- Create: `app/api/admin/leads/[id]/route.ts`

### Spec notes

This route handles two independent operations:
- `{ status }` — overwrites the lead's status
- `{ note }` — prepends a new `NoteEntry` to the JSON notes array

Both auth-check using the standard server client. Data operations use `createAdminClient()`.

- [ ] **Step 1: Create the API route**

```typescript
// app/api/admin/leads/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface NoteEntry {
  text: string
  created_at: string
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json() as { status?: string; note?: string }
  const adminClient = createAdminClient()

  if (body.status) {
    const { error } = await adminClient
      .from('leads')
      .update({ status: body.status })
      .eq('id', id)
    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  }

  if (body.note) {
    const { data: lead, error: fetchError } = await adminClient
      .from('leads')
      .select('notes')
      .eq('id', id)
      .single()

    if (fetchError) {
      return Response.json({ error: fetchError.message }, { status: 500 })
    }

    const existing: NoteEntry[] = JSON.parse(lead?.notes ?? '[]')
    const updated: NoteEntry[] = [
      { text: body.note, created_at: new Date().toISOString() },
      ...existing,
    ]

    const { error: updateError } = await adminClient
      .from('leads')
      .update({ notes: JSON.stringify(updated) })
      .eq('id', id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 })
    }
  }

  return Response.json({ ok: true })
}
```

- [ ] **Step 2: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/api/admin/leads/[id]/route.ts"
git commit -m "feat: add PATCH API route for lead status and notes"
```

---

## Task 8: LeadNotes component

**Files:**
- Create: `components/admin/LeadNotes.tsx`
- Create: `__tests__/components/admin/LeadNotes.test.tsx`

### Spec notes

- Client component. Props: `leadId: string`, `initialNotes: NoteEntry[]`
- Displays notes newest-first (initialNotes is already ordered newest-first from the API)
- On submit: fetch PATCH, optimistically prepend new note to list, clear textarea
- `NoteEntry` interface: `{ text: string; created_at: string }`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/admin/LeadNotes.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadNotes } from '@/components/admin/LeadNotes'

const mockFetch = vi.fn()

describe('LeadNotes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  const existingNotes = [
    { text: 'Called and left voicemail.', created_at: '2026-04-01T10:00:00.000Z' },
    { text: 'Initial contact made.', created_at: '2026-03-30T09:00:00.000Z' },
  ]

  it('renders existing notes', () => {
    render(<LeadNotes leadId="abc" initialNotes={existingNotes} />)
    expect(screen.getByText('Called and left voicemail.')).toBeInTheDocument()
    expect(screen.getByText('Initial contact made.')).toBeInTheDocument()
  })

  it('renders textarea and Add note button', () => {
    render(<LeadNotes leadId="abc" initialNotes={[]} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument()
  })

  it('renders empty state message when no notes', () => {
    render(<LeadNotes leadId="abc" initialNotes={[]} />)
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('submits note and appends it to the list', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<LeadNotes leadId="abc" initialNotes={[]} />)
    await user.type(screen.getByRole('textbox'), 'Follow up scheduled.')
    await user.click(screen.getByRole('button', { name: /add note/i }))
    await waitFor(() => {
      expect(screen.getByText('Follow up scheduled.')).toBeInTheDocument()
    })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/leads/abc',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ note: 'Follow up scheduled.' }),
      })
    )
  })

  it('clears textarea after successful submit', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<LeadNotes leadId="abc" initialNotes={[]} />)
    await user.type(screen.getByRole('textbox'), 'Some note')
    await user.click(screen.getByRole('button', { name: /add note/i }))
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('')
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/components/admin/LeadNotes.test.tsx`
Expected: FAIL — "Cannot find module '@/components/admin/LeadNotes'"

- [ ] **Step 3: Implement LeadNotes**

```typescript
// components/admin/LeadNotes.tsx
'use client'

import { useState } from 'react'

interface NoteEntry {
  text: string
  created_at: string
}

interface LeadNotesProps {
  leadId: string
  initialNotes: NoteEntry[]
}

function formatNoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LeadNotes({ leadId, initialNotes }: LeadNotesProps) {
  const [notes, setNotes] = useState<NoteEntry[]>(initialNotes)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAddNote() {
    if (!text.trim()) return
    setSaving(true)
    const noteText = text.trim()

    await fetch(`/api/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText }),
    })

    setNotes(prev => [{ text: noteText, created_at: new Date().toISOString() }, ...prev])
    setText('')
    setSaving(false)
  }

  return (
    <div>
      <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-widest text-ink-light">
        Notes
      </h3>

      {/* Add note */}
      <div className="mb-6">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder="Add a note..."
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAddNote}
            disabled={saving || !text.trim()}
            className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add note'}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="font-sans text-sm text-ink-light">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note, i) => (
            <li key={i} className="rounded-lg border border-gray-100 bg-white px-4 py-3">
              <p className="mb-1 font-mono text-xs text-ink-light">{formatNoteDate(note.created_at)}</p>
              <p className="font-sans text-sm text-ink-mid">{note.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/components/admin/LeadNotes.test.tsx`
Expected: PASS — 5 tests

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass (71 + 5 = 76 total)

- [ ] **Step 6: Commit**

```bash
git add components/admin/LeadNotes.tsx __tests__/components/admin/LeadNotes.test.tsx
git commit -m "feat: add LeadNotes component with append-only notes log"
```

---

## Task 9: Leads list page

**Files:**
- Create: `components/admin/LeadsFilter.tsx`
- Create: `app/admin/(protected)/leads/page.tsx`

### Spec notes

- `LeadsFilter` uses `useSearchParams` → needs `<Suspense>` wrapper in the page
- Rows are fully clickable links to `/admin/leads/[id]`
- `timeAgo` utility is repeated here (not shared) — each page file is self-contained per plan rules

- [ ] **Step 1: Create LeadsFilter**

```typescript
// components/admin/LeadsFilter.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'

const STATUSES = ['all', 'new', 'contacted', 'converted', 'closed'] as const

export function LeadsFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const active = searchParams.get('status') ?? 'all'

  function handleClick(status: string) {
    if (status === 'all') {
      router.push('/admin/leads')
    } else {
      router.push(`/admin/leads?status=${status}`)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map(status => (
        <button
          key={status}
          type="button"
          onClick={() => handleClick(status)}
          className={cn(
            'rounded-pill px-4 py-1.5 font-sans text-sm capitalize transition-colors',
            active === status
              ? 'bg-teal text-white'
              : 'border border-gray-200 text-ink-mid hover:border-teal/50'
          )}
        >
          {status === 'all' ? 'All' : status}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create the leads list page**

```typescript
// app/admin/(protected)/leads/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge'
import { LeadsFilter } from '@/components/admin/LeadsFilter'

export const metadata: Metadata = { title: 'Leads | H2 Admin' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function LeadsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('leads')
    .select('id, name, email, persona, source_page, status, created_at')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: leads } = await query

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">
          Leads
          <span className="ml-2 font-mono text-sm text-ink-light">
            {leads?.length ?? 0}
          </span>
        </h1>
      </div>

      <div className="mb-6">
        <Suspense fallback={<div className="h-9" />}>
          <LeadsFilter />
        </Suspense>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {!leads || leads.length === 0 ? (
          <p className="px-5 py-6 font-sans text-sm text-ink-light">No leads found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {leads.map(lead => (
              <li key={lead.id}>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-medium text-ink">
                      {lead.name ?? '—'}
                    </p>
                    <p className="font-mono text-xs text-ink-light">{lead.email}</p>
                  </div>
                  <div className="hidden shrink-0 font-mono text-xs text-ink-light md:block">
                    {lead.source_page ?? '—'}
                  </div>
                  <div className="shrink-0 font-mono text-xs text-ink-light">
                    {timeAgo(lead.created_at)}
                  </div>
                  <div className="shrink-0">
                    <LeadStatusBadge status={lead.status as 'new' | 'contacted' | 'converted' | 'closed'} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 3: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/admin/LeadsFilter.tsx "app/admin/(protected)/leads/page.tsx"
git commit -m "feat: add leads list page with status filter"
```

---

## Task 10: Lead detail page

**Files:**
- Create: `components/admin/LeadStatusUpdate.tsx`
- Create: `app/admin/(protected)/leads/[id]/page.tsx`

### Spec notes

- `LeadStatusUpdate` is an inline client component for the status dropdown + save
- The page is a server component that fetches the lead by ID, parses notes JSON, then renders all sections
- Notes are parsed: `JSON.parse(lead.notes ?? '[]')` — newest-first (the API prepends)

- [ ] **Step 1: Create LeadStatusUpdate**

```typescript
// components/admin/LeadStatusUpdate.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

interface LeadStatusUpdateProps {
  leadId: string
  initialStatus: string
}

const STATUSES = ['new', 'contacted', 'converted', 'closed'] as const

export function LeadStatusUpdate({ leadId, initialStatus }: LeadStatusUpdateProps) {
  const [status, setStatus] = useState(initialStatus)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<'saved' | 'error' | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setMessage(res.ok ? 'saved' : 'error')
    } catch {
      setMessage('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
      >
        {STATUSES.map(s => (
          <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save status'}
      </button>
      {message === 'saved' && (
        <span className="font-sans text-sm text-green-600">Saved</span>
      )}
      {message === 'error' && (
        <span className="font-sans text-sm text-red-600">Error saving</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the lead detail page**

```typescript
// app/admin/(protected)/leads/[id]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge'
import { LeadStatusUpdate } from '@/components/admin/LeadStatusUpdate'
import { LeadNotes } from '@/components/admin/LeadNotes'

interface NoteEntry {
  text: string
  created_at: string
}

const personaLabels: Record<string, string> = {
  sarah:   'Sarah — Energy',
  marcus:  'Marcus — Recovery',
  elena:   'Elena — Longevity',
  clinic:  'Clinic',
  general: 'General',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: lead } = await supabase.from('leads').select('name, email').eq('id', id).single()
  return { title: `${lead?.name ?? lead?.email ?? 'Lead'} | H2 Admin` }
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single()

  if (!lead) notFound()

  const notes: NoteEntry[] = JSON.parse(lead.notes ?? '[]')

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/leads"
          className="mb-4 inline-block font-mono text-xs text-teal transition-colors hover:text-teal-dark"
        >
          ← All leads
        </Link>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1">
            <h1 className="font-display text-2xl text-ink">{lead.name ?? '—'}</h1>
            <p className="mt-1 font-sans text-sm text-ink-mid">
              {lead.email}
              {lead.phone && ` · ${lead.phone}`}
            </p>
          </div>
          <LeadStatusBadge status={lead.status as 'new' | 'contacted' | 'converted' | 'closed'} />
        </div>
      </div>

      {/* Metadata grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Persona',       value: lead.persona ? (personaLabels[lead.persona] ?? lead.persona) : '—' },
          { label: 'Enquiry type',  value: lead.enquiry_type ?? '—' },
          { label: 'Source page',   value: lead.source_page ?? '—' },
          { label: 'Received',      value: formatDate(lead.created_at) },
          ...(lead.utm_source   ? [{ label: 'UTM source',   value: lead.utm_source   }] : []),
          ...(lead.utm_medium   ? [{ label: 'UTM medium',   value: lead.utm_medium   }] : []),
          ...(lead.utm_campaign ? [{ label: 'UTM campaign', value: lead.utm_campaign }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-gray-100 bg-white px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-light">{label}</p>
            <p className="mt-1 font-sans text-sm text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Message */}
      {lead.message !== null && lead.message !== undefined && (
        <div className="mb-8">
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-widest text-ink-light">
            Message
          </h2>
          <blockquote className="border-l-2 border-ink-light/30 pl-4 font-sans text-sm italic text-ink-mid">
            {lead.message}
          </blockquote>
        </div>
      )}

      {/* Status update */}
      <div className="mb-8">
        <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-widest text-ink-light">
          Status
        </h2>
        <LeadStatusUpdate leadId={lead.id} initialStatus={lead.status} />
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <LeadNotes leadId={lead.id} initialNotes={notes} />
      </div>
    </>
  )
}
```

- [ ] **Step 3: Check TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass (76 total)

- [ ] **Step 5: Commit**

```bash
git add components/admin/LeadStatusUpdate.tsx "app/admin/(protected)/leads/[id]/page.tsx"
git commit -m "feat: add lead detail page with status update and notes"
```

---

## Final checks

- [ ] **TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Full test suite**

Run: `npx vitest run`
Expected: 76 tests passing

- [ ] **Deploy**

```bash
git push origin master
```

Then verify in Vercel:
1. `/admin/login` — login form renders on dark background
2. Log in → redirects to `/admin` dashboard
3. `/admin/leads` — shows lead list (or empty state)
4. Click a lead → full detail page with metadata, message, status dropdown, notes
5. `/admin/login` with wrong password → shows "Invalid email or password."

> **Note to implementer:** Science (`/admin/science`), Content (`/admin/content`), and Settings (`/admin/settings`) links appear in the sidebar but the pages don't exist yet (Phase 3b/3c). They will 404 — that's expected for now.
