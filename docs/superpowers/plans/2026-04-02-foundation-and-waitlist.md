# Foundation + Waitlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js 14 project with brand design system, wire up Supabase, and ship the `/start` waitlist page — a fully deployable lead-capture page live on Vercel.

**Architecture:** Next.js 14 App Router with TypeScript and Tailwind. The `/start` route is the Phase 1 homepage — middleware redirects all traffic there. A single API route handles form submission: validates with Zod, inserts to Supabase `leads` table, sends a Resend notification email.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (`@supabase/ssr`), React Hook Form + Zod, Resend, Vitest + Testing Library

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | Dependencies |
| `next.config.ts` | Next.js config |
| `tailwind.config.ts` | Brand tokens — colours, fonts, spacing |
| `app/globals.css` | Tailwind base + CSS custom properties |
| `app/layout.tsx` | Root layout — fonts, metadata defaults, analytics |
| `app/page.tsx` | `/start` waitlist page (Phase 1 root) |
| `app/api/enquiry/route.ts` | POST handler — validate → Supabase insert → Resend |
| `middleware.ts` | Phase 1 routing — all traffic to `/` |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client (uses cookies) |
| `lib/resend.ts` | Resend client + send helper |
| `lib/utils.ts` | UTM param extraction from URL |
| `components/forms/WaitlistForm.tsx` | Form UI — name, email, persona radio, submit state |
| `components/ui/Button.tsx` | Reusable button with loading state |
| `components/ui/Input.tsx` | Reusable input with error state |
| `supabase/migrations/001_leads.sql` | `leads` table schema |
| `.env.example` | Environment variable template |
| `vitest.config.ts` | Test config |
| `__tests__/lib/utils.test.ts` | UTM extraction unit tests |
| `__tests__/api/enquiry.test.ts` | API route integration tests |
| `__tests__/components/WaitlistForm.test.ts` | Form component tests |

---

## Task 1: Initialise Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `.env.example`

- [ ] **Step 1: Scaffold the project**

In the project root (`c:/Users/david.mcaughtrie/OneDrive - Cyncly/Documents/Hydro`), run:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes
```

Expected: Next.js 14 project created in current directory. Existing files (`index.html`, `docs/`, `public/logo.svg`, `.mcp.json`) are untouched.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr react-hook-form @hookform/resolvers zod resend
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: `node_modules/` populated, `package.json` updated.

- [ ] **Step 3: Configure Tailwind with brand tokens**

Replace `tailwind.config.ts` with:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#00B4C6',
          dark: '#007A87',
          light: '#E0F7FA',
        },
        ink: {
          DEFAULT: '#0D1B1E',
          mid: '#3A4F52',
          light: '#8AA0A3',
        },
        cream: '#F7F5F0',
      },
      fontFamily: {
        display: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      borderRadius: {
        pill: '100px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Configure globals.css**

Replace `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --teal:       #00B4C6;
  --teal-dark:  #007A87;
  --teal-light: #E0F7FA;
  --ink:        #0D1B1E;
  --ink-mid:    #3A4F52;
  --ink-light:  #8AA0A3;
  --cream:      #F7F5F0;
}
```

- [ ] **Step 5: Configure root layout with fonts**

Replace `app/layout.tsx` with:

```typescript
import type { Metadata } from 'next'
import { DM_Serif_Display, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  weight: ['200', '300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | H2 Revive',
    default: 'H2 Revive — Hydrogen Inhalation Technology',
  },
  description:
    "The UK's dedicated hydrogen inhalation wellness brand. Research-backed molecular hydrogen technology for energy, recovery, and longevity.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSerif.variable} ${dmSans.variable} ${dmMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Create .env.example**

Create `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@h2revive.co.uk
ADMIN_NOTIFICATION_EMAIL=

# Site
NEXT_PUBLIC_SITE_URL=https://h2revive.co.uk
```

Then copy to `.env.local` and fill in real values from the Supabase dashboard (`jvvcenyqmexxnjancohs`) and Resend.

- [ ] **Step 7: Add .gitignore entries**

Ensure `.gitignore` contains:

```
.env.local
.superpowers/
```

- [ ] **Step 8: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

Add test script to `package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:3000`. Default Next.js page visible. No TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: Next.js 14 scaffold with brand tokens and test config"
```

---

## Task 2: Supabase client setup

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `supabase/migrations/001_leads.sql`

- [ ] **Step 1: Write the test for the server client**

Create `__tests__/lib/supabase.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test that the clients are created with the correct env vars.
// We mock the Supabase modules to avoid real network calls.
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ from: vi.fn() })),
  createServerClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('Supabase client', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  it('createClient returns a supabase client', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.from).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- __tests__/lib/supabase.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/supabase/client'`

- [ ] **Step 3: Create browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Create server client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookie setting ignored
          }
        },
      },
    }
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm run test:run -- __tests__/lib/supabase.test.ts
```

Expected: PASS

- [ ] **Step 6: Create leads table migration**

Create `supabase/migrations/001_leads.sql`:

```sql
create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  name            text,
  email           text not null,
  phone           text,
  persona         text check (persona in ('sarah', 'marcus', 'elena', 'clinic', 'general')),
  enquiry_type    text check (enquiry_type in ('product', 'clinic', 'waitlist', 'general')),
  message         text,
  source_page     text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  status          text default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  notes           text
);

-- Enable Row Level Security
alter table leads enable row level security;

-- Only service role can read/write (admin panel uses service role)
-- Public inserts via API route use service role key server-side
create policy "service role full access" on leads
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
```

Run this SQL in the Supabase dashboard SQL editor for project `jvvcenyqmexxnjancohs`.

- [ ] **Step 7: Commit**

```bash
git add lib/ supabase/ __tests__/lib/supabase.test.ts
git commit -m "feat: Supabase client setup and leads table migration"
```

---

## Task 3: Utility functions

**Files:**
- Create: `lib/utils.ts`
- Test: `__tests__/lib/utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { extractUtmParams } from '@/lib/utils'

describe('extractUtmParams', () => {
  it('extracts utm_source, utm_medium, utm_campaign from a URL', () => {
    const url = 'https://h2revive.co.uk/start?utm_source=instagram&utm_medium=social&utm_campaign=launch'
    const result = extractUtmParams(url)
    expect(result).toEqual({
      utm_source: 'instagram',
      utm_medium: 'social',
      utm_campaign: 'launch',
    })
  })

  it('returns empty strings for missing UTM params', () => {
    const result = extractUtmParams('https://h2revive.co.uk/start')
    expect(result).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    })
  })

  it('handles partial UTM params', () => {
    const result = extractUtmParams('https://h2revive.co.uk/start?utm_source=google')
    expect(result.utm_source).toBe('google')
    expect(result.utm_medium).toBeNull()
    expect(result.utm_campaign).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- __tests__/lib/utils.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/utils'`

- [ ] **Step 3: Implement utils**

Create `lib/utils.ts`:

```typescript
export function extractUtmParams(url: string): {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
} {
  try {
    const { searchParams } = new URL(url)
    return {
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
    }
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/lib/utils.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts __tests__/lib/utils.test.ts
git commit -m "feat: UTM param extraction utility"
```

---

## Task 4: Resend email helper

**Files:**
- Create: `lib/resend.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/resend.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    },
  })),
}))

describe('sendLeadNotification', () => {
  it('calls resend.emails.send with correct params', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('RESEND_FROM_EMAIL', 'hello@h2revive.co.uk')
    vi.stubEnv('ADMIN_NOTIFICATION_EMAIL', 'admin@h2revive.co.uk')

    const { sendLeadNotification } = await import('@/lib/resend')
    const result = await sendLeadNotification({
      name: 'Sarah',
      email: 'sarah@example.com',
      persona: 'sarah',
      enquiry_type: 'waitlist',
      source_page: '/start',
    })
    expect(result.error).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- __tests__/lib/resend.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/resend'`

- [ ] **Step 3: Implement Resend helper**

Create `lib/resend.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface LeadNotificationParams {
  name?: string | null
  email: string
  persona?: string | null
  enquiry_type: string
  source_page?: string | null
}

export async function sendLeadNotification(params: LeadNotificationParams) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!to) return { data: null, error: new Error('ADMIN_NOTIFICATION_EMAIL not set') }

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'hello@h2revive.co.uk',
    to,
    subject: `New H2 Revive lead — ${params.enquiry_type}`,
    html: `
      <h2>New lead from H2 Revive</h2>
      <table>
        <tr><td><strong>Name</strong></td><td>${params.name ?? '—'}</td></tr>
        <tr><td><strong>Email</strong></td><td>${params.email}</td></tr>
        <tr><td><strong>Persona</strong></td><td>${params.persona ?? '—'}</td></tr>
        <tr><td><strong>Type</strong></td><td>${params.enquiry_type}</td></tr>
        <tr><td><strong>Source</strong></td><td>${params.source_page ?? '—'}</td></tr>
      </table>
    `,
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- __tests__/lib/resend.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/resend.ts __tests__/lib/resend.test.ts
git commit -m "feat: Resend email notification helper"
```

---

## Task 5: Enquiry API route

**Files:**
- Create: `app/api/enquiry/route.ts`
- Test: `__tests__/api/enquiry.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/api/enquiry.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/enquiry/route'
import { NextRequest } from 'next/server'

// Mock Supabase server client
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn(() => ({ insert: mockInsert }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}))

// Mock Resend
vi.mock('@/lib/resend', () => ({
  sendLeadNotification: vi.fn().mockResolvedValue({ error: null }),
}))

function makeRequest(body: object, url = 'http://localhost:3000/api/enquiry') {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/enquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  it('returns 400 when email is missing', async () => {
    const req = makeRequest({ persona: 'sarah', enquiry_type: 'waitlist' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when email is invalid', async () => {
    const req = makeRequest({ email: 'not-an-email', enquiry_type: 'waitlist' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 and inserts lead for valid waitlist submission', async () => {
    const req = makeRequest({
      email: 'sarah@example.com',
      persona: 'sarah',
      enquiry_type: 'waitlist',
      source_page: '/start',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('leads')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'sarah@example.com',
        persona: 'sarah',
        enquiry_type: 'waitlist',
        status: 'new',
      })
    )
  })

  it('returns 500 when Supabase insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } })
    const req = makeRequest({
      email: 'sarah@example.com',
      enquiry_type: 'waitlist',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('captures UTM params from referer header', async () => {
    const req = makeRequest(
      { email: 'sarah@example.com', enquiry_type: 'waitlist' },
      'http://localhost:3000/api/enquiry?utm_source=instagram&utm_medium=social'
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ utm_source: 'instagram', utm_medium: 'social' })
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- __tests__/api/enquiry.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/enquiry/route'`

- [ ] **Step 3: Define the Zod schema**

Create `app/api/enquiry/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendLeadNotification } from '@/lib/resend'
import { extractUtmParams } from '@/lib/utils'

const enquirySchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email({ message: 'A valid email address is required' }),
  phone: z.string().optional().nullable(),
  persona: z.enum(['sarah', 'marcus', 'elena', 'clinic', 'general']).optional().nullable(),
  enquiry_type: z.enum(['product', 'clinic', 'waitlist', 'general']),
  message: z.string().optional().nullable(),
  source_page: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = enquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const data = parsed.data
  const utmParams = extractUtmParams(request.url)

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('leads').insert({
    ...data,
    ...utmParams,
    status: 'new',
  })

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return NextResponse.json({ error: 'Failed to save enquiry' }, { status: 500 })
  }

  // Send notification — fire and forget, don't fail the request if email fails
  sendLeadNotification(data).catch(console.error)

  return NextResponse.json({ success: true }, { status: 200 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/api/enquiry.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/ __tests__/api/
git commit -m "feat: enquiry API route with Zod validation and Supabase insert"
```

---

## Task 6: UI primitives — Button and Input

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Input.tsx`
- Test: `__tests__/components/ui/Button.test.tsx`, `__tests__/components/ui/Input.test.tsx`

- [ ] **Step 1: Write Button tests**

Create `__tests__/components/ui/Button.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Send enquiry</Button>)
    expect(screen.getByText('Send enquiry')).toBeInTheDocument()
  })

  it('shows loading spinner and disables when loading=true', () => {
    render(<Button loading>Send enquiry</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText('Send enquiry')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run Button tests to verify they fail**

```bash
npm run test:run -- __tests__/components/ui/Button.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement Button**

Create `components/ui/Button.tsx`:

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost' | 'dark'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, loading, disabled, variant = 'primary', className, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-pill px-6 py-2.5 text-sm font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      primary: 'bg-teal text-white hover:bg-teal-dark',
      ghost:   'border border-ink-mid text-ink-mid hover:border-ink hover:text-ink',
      dark:    'bg-ink text-white hover:bg-ink/90',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], className)}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
```

Create `lib/cn.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install the deps:

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 4: Write Input tests**

Create `__tests__/components/ui/Input.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Email address" />)
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
  })

  it('shows error message when error prop provided', () => {
    render(<Input error="Email is required" />)
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('applies error styling when error prop provided', () => {
    render(<Input error="Required" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('border-red-400')
  })
})
```

- [ ] **Step 5: Implement Input**

Create `components/ui/Input.tsx`:

```typescript
import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-white px-4 py-3 font-sans text-sm text-ink placeholder-ink-light',
          'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent',
          'transition-colors',
          error ? 'border-red-400' : 'border-ink-light/40',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 font-sans text-xs text-red-500">{error}</p>
      )}
    </div>
  )
)
Input.displayName = 'Input'
```

- [ ] **Step 6: Run all UI tests**

```bash
npm run test:run -- __tests__/components/ui/
```

Expected: PASS (7 tests)

- [ ] **Step 7: Commit**

```bash
git add components/ui/ lib/cn.ts __tests__/components/ui/
git commit -m "feat: Button and Input UI primitives"
```

---

## Task 7: WaitlistForm component

**Files:**
- Create: `components/forms/WaitlistForm.tsx`
- Test: `__tests__/components/forms/WaitlistForm.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/forms/WaitlistForm.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WaitlistForm } from '@/components/forms/WaitlistForm'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('WaitlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email input and persona radio buttons', () => {
    render(<WaitlistForm />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/more energy/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/train hard/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/investing in longevity/i)).toBeInTheDocument()
  })

  it('shows validation error when email is empty on submit', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm />)
    await user.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('submits form and shows success state', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })
    render(<WaitlistForm />)
    await user.type(screen.getByPlaceholderText(/email/i), 'sarah@example.com')
    await user.click(screen.getByLabelText(/more energy/i))
    await user.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() => {
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument()
    })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/enquiry',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows error message when API call fails', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to save enquiry' }),
    })
    render(<WaitlistForm />)
    await user.type(screen.getByPlaceholderText(/email/i), 'sarah@example.com')
    await user.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- __tests__/components/forms/WaitlistForm.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement WaitlistForm**

Create `components/forms/WaitlistForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  persona: z.enum(['sarah', 'marcus', 'elena']).optional(),
})

type FormData = z.infer<typeof schema>

const personas = [
  { value: 'sarah', label: 'I want more energy and mental clarity' },
  { value: 'marcus', label: 'I train hard and want to recover better' },
  { value: 'elena', label: "I'm investing in longevity" },
] as const

export function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const selectedPersona = watch('persona')

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        enquiry_type: 'waitlist',
        source_page: '/start',
      }),
    })
    if (!res.ok) {
      setServerError('Something went wrong. Please try again.')
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center">
        <p className="font-display text-2xl text-teal">You're on the list.</p>
        <p className="mt-2 font-sans text-sm text-ink-light">
          We'll be in touch when H2 Revive launches in the UK.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-md space-y-4">
      <Input
        {...register('email')}
        type="email"
        placeholder="Email address"
        error={errors.email?.message}
        autoComplete="email"
      />

      <div className="space-y-2">
        {personas.map(({ value, label }) => (
          <label
            key={value}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 font-sans text-sm transition-colors',
              selectedPersona === value
                ? 'border-teal bg-teal/10 text-ink'
                : 'border-ink-light/20 text-ink-light hover:border-teal/50'
            )}
          >
            <input
              type="radio"
              className="sr-only"
              value={value}
              aria-label={label}
              {...register('persona')}
              onChange={() => setValue('persona', value)}
            />
            <span
              className={cn(
                'h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors',
                selectedPersona === value ? 'border-teal bg-teal' : 'border-ink-light/40'
              )}
            />
            {label}
          </label>
        ))}
      </div>

      {serverError && (
        <p className="font-sans text-sm text-red-400">{serverError}</p>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full">
        Join the waitlist
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/components/forms/WaitlistForm.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/forms/ __tests__/components/forms/
git commit -m "feat: WaitlistForm component with React Hook Form + Zod"
```

---

## Task 8: /start waitlist page

**Files:**
- Create: `app/page.tsx` (replaces placeholder)

- [ ] **Step 1: Build the waitlist page**

Replace `app/page.tsx` with:

```typescript
import type { Metadata } from 'next'
import Image from 'next/image'
import { WaitlistForm } from '@/components/forms/WaitlistForm'

export const metadata: Metadata = {
  title: 'Coming Soon',
  description:
    'Hydrogen inhalation technology, coming to the UK. Join the H2 Revive waitlist.',
}

export default function WaitlistPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-16 text-center">
      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/logo.svg"
          alt="H2 Revive"
          width={120}
          height={80}
          priority
        />
      </div>

      {/* Headline */}
      <h1 className="font-display max-w-lg text-4xl leading-tight text-white sm:text-5xl">
        The smallest molecule in existence.{' '}
        <span className="text-teal">The biggest idea in British wellness.</span>
      </h1>

      {/* Subline */}
      <p className="mt-4 max-w-sm font-sans text-base font-light text-ink-light">
        Hydrogen inhalation technology, coming to the UK.
      </p>

      {/* Form */}
      <div className="mt-10 w-full max-w-md">
        <WaitlistForm />
      </div>

      {/* Disclaimer */}
      <p className="mt-12 max-w-md font-sans text-xs text-ink-light/60 leading-relaxed">
        These statements have not been evaluated by the MHRA. This product is not intended
        to diagnose, treat, cure, or prevent any disease.
      </p>
    </main>
  )
}
```

- [ ] **Step 2: Verify the page renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: Dark page with H2 Revive logo, headline, persona radios, email input, submit button. No console errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: /start waitlist page"
```

---

## Task 9: Middleware — Phase 1 routing

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write middleware**

Create `middleware.ts` at the project root:

```typescript
import { NextRequest, NextResponse } from 'next/server'

// Phase 1: all non-API, non-static traffic goes to root (waitlist)
// Remove entries from LIVE_ROUTES as each page ships
const LIVE_ROUTES = new Set(['/'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always pass through: API routes, static files, Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  if (!LIVE_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Verify middleware redirects**

With `npm run dev` running:
- Visit `http://localhost:3000/product` — expected: redirects to `/`
- Visit `http://localhost:3000/science` — expected: redirects to `/`
- Visit `http://localhost:3000/api/enquiry` — expected: not redirected (returns 405 for GET)

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: phase 1 middleware — redirect all routes to waitlist"
```

---

## Task 10: Deploy to Vercel

**Files:**
- Modify: Vercel dashboard (env vars)

- [ ] **Step 1: Add environment variables to Vercel**

In the Vercel dashboard for the `hydro` project, go to Settings → Environment Variables. Add:

```
NEXT_PUBLIC_SUPABASE_URL       = (from Supabase project jvvcenyqmexxnjancohs → Settings → API)
NEXT_PUBLIC_SUPABASE_ANON_KEY  = (from Supabase project → Settings → API → anon public key)
SUPABASE_SERVICE_ROLE_KEY      = (from Supabase project → Settings → API → service_role key)
RESEND_API_KEY                 = (from Resend dashboard)
RESEND_FROM_EMAIL              = hello@h2revive.co.uk
ADMIN_NOTIFICATION_EMAIL       = (your email for lead alerts)
NEXT_PUBLIC_SITE_URL           = https://h2revive.co.uk (or the Vercel preview URL for now)
```

- [ ] **Step 2: Delete the old index.html**

The old `index.html` at the project root will conflict with Next.js. Remove it:

```bash
git rm index.html
git commit -m "chore: remove old static index.html"
```

- [ ] **Step 3: Push and verify deploy**

```bash
git push
```

Watch the Vercel deployment log. Expected: build succeeds, waitlist page is live at the Vercel URL.

- [ ] **Step 4: Run the SQL migration on Supabase**

In the Supabase dashboard for project `jvvcenyqmexxnjancohs`, open the SQL Editor and run the contents of `supabase/migrations/001_leads.sql`.

Expected: `leads` table created with RLS enabled.

- [ ] **Step 5: Smoke test the live form**

Submit a test lead via the live Vercel URL. Check:
1. Supabase Table Editor → `leads` — row appears with correct data
2. Admin notification email received (if Resend is configured)
3. Success state shows on page

- [ ] **Step 6: Run full test suite**

```bash
npm run test:run
```

Expected: All tests pass.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: production smoke test complete — Phase 1 live"
git push
```

---

## Self-Review Notes

- **Spec coverage:** Foundation (Task 1) ✓, Supabase schema (Task 2) ✓, `/start` page (Tasks 7–8) ✓, UTM capture (Tasks 3, 5) ✓, Resend notification (Tasks 4, 5) ✓, Vercel deploy (Task 10) ✓, Phase 1 middleware (Task 9) ✓
- **Out of scope for this plan:** Homepage, product page, science hub, admin panel — covered in Plans 2 and 3
- **Logo:** `public/logo.svg` exists (SVG approximation). Replace with real file when available — `next/image` will use whatever is at that path
- **Type consistency:** `LeadNotificationParams` in `lib/resend.ts` matches fields passed in `app/api/enquiry/route.ts`. `enquirySchema` in the API route matches the `leads` table columns exactly
- **name field:** Schema has `name text` (nullable — changed from spec's `not null` since waitlist doesn't collect it). API route passes it through as optional
