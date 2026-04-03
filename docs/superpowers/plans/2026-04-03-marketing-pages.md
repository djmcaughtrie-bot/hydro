# Marketing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the Homepage, Product, About, and FAQ pages for H2 Revive, sharing a Nav and Footer via a Next.js route group.

**Architecture:** A `(site)` route group wraps all marketing pages with Nav + Footer via `app/(site)/layout.tsx`. Shared UI and section components are built first, then pages are added one at a time. The existing waitlist `app/page.tsx` is replaced by the new homepage in the final task. Middleware `LIVE_ROUTES` is updated incrementally as pages are added.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, React Hook Form, Zod v4, Vitest + Testing Library. Brand tokens in `tailwind.config.ts` (teal, ink, cream). Fonts via CSS vars `--font-dm-serif`, `--font-dm-sans`, `--font-dm-mono`.

---

## Codebase context

Existing files to understand before starting:
- `components/ui/Button.tsx` — `forwardRef`, variants: `primary | ghost | dark`, `loading` prop
- `components/ui/Input.tsx` — `forwardRef`, `error` prop with `aria-describedby`
- `components/forms/WaitlistForm.tsx` — pattern for React Hook Form + Zod + fetch to `/api/enquiry`
- `lib/cn.ts` — `cn(...inputs)` using clsx + tailwind-merge
- `tailwind.config.ts` — brand tokens: `teal`, `teal-dark`, `teal-light`, `ink`, `ink-mid`, `ink-light`, `cream`, `pill` border radius, `subtle` shadow
- `middleware.ts` — `LIVE_ROUTES` set controls which routes are live; others redirect to `/`
- `app/layout.tsx` — root layout, Google Fonts loaded here as CSS vars

Zod v4 note: use `error.issues[0]?.message` not `error.errors[0]?.message`. Plain `z.enum([...]).optional()` — do NOT use `z.preprocess`.

---

## File structure

```
components/
  layout/
    Nav.tsx                           ← create
    Footer.tsx                        ← create
  sections/
    TrustBar.tsx                      ← create
    PersonaCards.tsx                  ← create
  forms/
    EnquiryForm.tsx                   ← create
  ui/
    Accordion.tsx                     ← create

app/
  (site)/
    layout.tsx                        ← create (route group: Nav + Footer)
    page.tsx                          ← create (homepage at /)
    product/
      page.tsx                        ← create
    about/
      page.tsx                        ← create
    faq/
      page.tsx                        ← create
  page.tsx                            ← delete in Task 10 (replaced by (site)/page.tsx)

__tests__/
  components/
    ui/
      Accordion.test.tsx              ← create
    layout/
      Nav.test.tsx                    ← create
    forms/
      EnquiryForm.test.tsx            ← create

middleware.ts                         ← modify (add /product, /about, /faq across tasks 7–10)
```

---

## Task 1: Accordion component

**Files:**
- Create: `components/ui/Accordion.tsx`
- Create: `__tests__/components/ui/Accordion.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/ui/Accordion.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion } from '@/components/ui/Accordion'

const items = [
  { question: 'First question?', answer: 'First answer.' },
  { question: 'Second question?', answer: 'Second answer.' },
]

describe('Accordion', () => {
  it('renders all questions', () => {
    render(<Accordion items={items} />)
    expect(screen.getByText('First question?')).toBeInTheDocument()
    expect(screen.getByText('Second question?')).toBeInTheDocument()
  })

  it('starts with all items collapsed (aria-expanded false)', () => {
    render(<Accordion items={items} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect(btn).toHaveAttribute('aria-expanded', 'false'))
  })

  it('sets aria-expanded true when item is opened', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)
    await user.click(screen.getByRole('button', { name: /first question/i }))
    expect(screen.getByRole('button', { name: /first question/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes an open item when clicked again', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)
    const btn = screen.getByRole('button', { name: /first question/i })
    await user.click(btn)
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the first item when second is opened', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)
    await user.click(screen.getByRole('button', { name: /first question/i }))
    await user.click(screen.getByRole('button', { name: /second question/i }))
    expect(screen.getByRole('button', { name: /first question/i })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: /second question/i })).toHaveAttribute('aria-expanded', 'true')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "c:\Users\david.mcaughtrie\OneDrive - Cyncly\Documents\Hydro"
npx vitest run __tests__/components/ui/Accordion.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ui/Accordion'`

- [ ] **Step 3: Implement Accordion**

```typescript
// components/ui/Accordion.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

interface AccordionItem {
  question: string
  answer: string
}

interface AccordionProps {
  items: AccordionItem[]
}

export function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="divide-y divide-ink-light/20">
      {items.map((item, index) => (
        <div key={index}>
          <button
            type="button"
            className="flex w-full items-center justify-between py-4 text-left"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span className="font-sans text-base font-medium text-ink">
              {item.question}
            </span>
            <span
              className={cn(
                'font-mono text-xl text-teal transition-transform duration-200',
                openIndex === index && 'rotate-45'
              )}
              aria-hidden="true"
            >
              +
            </span>
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              openIndex === index ? 'max-h-96 pb-4' : 'max-h-0'
            )}
          >
            <p className="font-sans text-sm leading-relaxed text-ink-mid">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/ui/Accordion.test.tsx
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add components/ui/Accordion.tsx __tests__/components/ui/Accordion.test.tsx
git commit -m "feat: Accordion component with single-open behaviour"
```

---

## Task 2: Nav component

**Files:**
- Create: `components/layout/Nav.tsx`
- Create: `__tests__/components/layout/Nav.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/layout/Nav.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Nav } from '@/components/layout/Nav'

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('Nav', () => {
  it('renders the H2 Revive logo', () => {
    render(<Nav />)
    expect(screen.getByAltText('H2 Revive')).toBeInTheDocument()
  })

  it('renders links to Home, Product, About, FAQ', () => {
    render(<Nav />)
    expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /product/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /^about$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^faq$/i })).toBeInTheDocument()
  })

  it('renders Science as aria-disabled (not a link)', () => {
    render(<Nav />)
    const scienceEl = screen.getByText(/^science$/i)
    expect(scienceEl).toHaveAttribute('aria-disabled', 'true')
    expect(scienceEl.tagName).not.toBe('A')
  })

  it('renders Enquire CTA linking to /product', () => {
    render(<Nav />)
    const enquireLinks = screen.getAllByRole('link', { name: /enquire/i })
    expect(enquireLinks[0]).toHaveAttribute('href', '/product')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/layout/Nav.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/layout/Nav'`

- [ ] **Step 3: Implement Nav**

```typescript
// components/layout/Nav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/cn'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Product', href: '/product' },
  { label: 'Science', href: '/science', disabled: true },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
] as const

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-ink-light/20 bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="H2 Revive home">
          <Image src="/logo.svg" alt="H2 Revive" width={80} height={54} priority />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ label, href, disabled }) => (
            <li key={href}>
              {disabled ? (
                <span
                  className="cursor-not-allowed font-sans text-sm text-ink-light"
                  title="Coming soon"
                  aria-disabled="true"
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="font-sans text-sm text-ink-mid transition-colors hover:text-ink"
                >
                  {label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <Link
          href="/product"
          className="hidden rounded-pill bg-teal px-5 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark md:inline-flex"
        >
          Enquire
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <span className={cn('block h-0.5 w-6 bg-ink transition-all', open && 'translate-y-2 rotate-45')} />
          <span className={cn('block h-0.5 w-6 bg-ink transition-all', open && 'opacity-0')} />
          <span className={cn('block h-0.5 w-6 bg-ink transition-all', open && '-translate-y-2 -rotate-45')} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-ink-light/20 bg-cream px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-4">
            {navLinks.map(({ label, href, disabled }) => (
              <li key={href}>
                {disabled ? (
                  <span className="font-sans text-sm text-ink-light" aria-disabled="true">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="font-sans text-sm text-ink-mid hover:text-ink"
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                )}
              </li>
            ))}
            <li>
              <Link
                href="/product"
                className="inline-flex rounded-pill bg-teal px-5 py-2 font-sans text-sm font-medium text-white hover:bg-teal-dark"
                onClick={() => setOpen(false)}
              >
                Enquire
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/layout/Nav.test.tsx
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add components/layout/Nav.tsx __tests__/components/layout/Nav.test.tsx
git commit -m "feat: Nav component with sticky header and mobile menu"
```

---

## Task 3: Footer component

**Files:**
- Create: `components/layout/Footer.tsx`

No tests — pure static markup.

- [ ] **Step 1: Create Footer**

```typescript
// components/layout/Footer.tsx
import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-ink text-ink-light">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Image src="/logo.svg" alt="H2 Revive" width={80} height={54} />
            <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-ink-light">
              Hydrogen inhalation technology, coming to the UK.
            </p>
          </div>

          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Product</p>
            <ul className="space-y-2">
              <li>
                <Link href="/product" className="font-sans text-sm transition-colors hover:text-white">
                  The Device
                </Link>
              </li>
              <li>
                <Link href="/faq" className="font-sans text-sm transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Company</p>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="font-sans text-sm transition-colors hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <span className="cursor-not-allowed font-sans text-sm text-ink-light/50">
                  Science (coming soon)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-mid/30 pt-6">
          <p className="font-sans text-xs leading-relaxed text-ink-light/60">
            These statements have not been evaluated by the MHRA. This product is not intended to
            diagnose, treat, cure, or prevent any disease. Research referenced is cited for
            educational purposes.
          </p>
          <p className="mt-4 font-sans text-xs text-ink-light/40">
            &copy; {new Date().getFullYear()} H2 Revive Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all existing tests PASS

- [ ] **Step 3: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "feat: Footer component with links and MHRA disclaimer"
```

---

## Task 4: TrustBar and PersonaCards sections

**Files:**
- Create: `components/sections/TrustBar.tsx`
- Create: `components/sections/PersonaCards.tsx`

No tests — pure static markup with no logic.

- [ ] **Step 1: Create TrustBar**

```typescript
// components/sections/TrustBar.tsx
const items = [
  { label: '50+ studies', description: 'Research-backed' },
  { label: 'UK-based', description: 'Designed and supported in Britain' },
  { label: '2-year warranty', description: 'Full UK coverage' },
  { label: 'CE certified', description: 'Safety certified' },
]

export function TrustBar() {
  return (
    <div className="bg-ink py-6">
      <div className="mx-auto max-w-6xl px-6">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map(({ label, description }) => (
            <li key={label} className="text-center">
              <p className="font-mono text-sm font-medium text-teal">{label}</p>
              <p className="mt-0.5 font-sans text-xs text-ink-light">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create PersonaCards**

```typescript
// components/sections/PersonaCards.tsx
import Link from 'next/link'

const personas = [
  {
    icon: '⚡',
    label: 'Energy',
    description: 'Mental clarity and sustained energy without the crash',
    href: '/product?persona=sarah',
  },
  {
    icon: '🏃',
    label: 'Recovery',
    description: 'Train harder, recover faster, reduce inflammation',
    href: '/product?persona=marcus',
  },
  {
    icon: '🌿',
    label: 'Longevity',
    description: 'Cellular health, oxidative stress, and the long game',
    href: '/product?persona=elena',
  },
]

export function PersonaCards() {
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-8 text-center font-mono text-xs uppercase tracking-widest text-teal">
          Find your story
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {personas.map(({ icon, label, description, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center rounded-lg border border-ink-light/20 bg-white p-6 text-center shadow-subtle transition-colors hover:border-teal"
            >
              <span className="mb-3 text-3xl" aria-hidden="true">
                {icon}
              </span>
              <p className="mb-2 font-display text-lg text-ink">{label}</p>
              <p className="font-sans text-sm text-ink-light">{description}</p>
              <p className="mt-4 font-mono text-xs uppercase tracking-widest text-teal">
                Learn more &rarr;
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests PASS

- [ ] **Step 4: Commit**

```bash
git add components/sections/TrustBar.tsx components/sections/PersonaCards.tsx
git commit -m "feat: TrustBar and PersonaCards section components"
```

---

## Task 5: Route group layout

**Files:**
- Create: `app/(site)/layout.tsx`

This layout wraps all pages inside `app/(site)/` with Nav + Footer. No tests needed — it's a layout shell.

- [ ] **Step 1: Create the route group layout**

```typescript
// app/(site)/layout.tsx
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests PASS

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/layout.tsx"
git commit -m "feat: (site) route group layout with Nav and Footer"
```

---

## Task 6: EnquiryForm component

**Files:**
- Create: `components/forms/EnquiryForm.tsx`
- Create: `__tests__/components/forms/EnquiryForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/forms/EnquiryForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnquiryForm } from '@/components/forms/EnquiryForm'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('EnquiryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders name, email, phone fields and persona buttons', () => {
    render(<EnquiryForm source="product" />)
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^energy$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^recovery$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^longevity$/i })).toBeInTheDocument()
  })

  it('pre-selects persona from defaultPersona prop', () => {
    render(<EnquiryForm source="product" defaultPersona="marcus" />)
    expect(screen.getByRole('button', { name: /^recovery$/i })).toHaveClass('bg-teal')
  })

  it('shows validation errors when name and email are empty on submit', async () => {
    const user = userEvent.setup()
    render(<EnquiryForm source="product" />)
    await user.click(screen.getByRole('button', { name: /send enquiry/i }))
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('submits and shows success state', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    render(<EnquiryForm source="product" />)
    await user.type(screen.getByPlaceholderText(/your name/i), 'Sarah Smith')
    await user.type(screen.getByPlaceholderText(/email address/i), 'sarah@example.com')
    await user.click(screen.getByRole('button', { name: /send enquiry/i }))
    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument()
    })
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toMatchObject({ enquiry_type: 'product', source_page: 'product' })
  })

  it('shows server error when API fails', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Failed' }) })
    render(<EnquiryForm source="product" />)
    await user.type(screen.getByPlaceholderText(/your name/i), 'Sarah Smith')
    await user.type(screen.getByPlaceholderText(/email address/i), 'sarah@example.com')
    await user.click(screen.getByRole('button', { name: /send enquiry/i }))
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  it('hides message field when showMessage is false', () => {
    render(<EnquiryForm source="product" showMessage={false} />)
    expect(screen.queryByPlaceholderText(/message/i)).not.toBeInTheDocument()
  })

  it('uses custom ctaText when provided', () => {
    render(<EnquiryForm source="product" ctaText="Request a callback" />)
    expect(screen.getByRole('button', { name: /request a callback/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/forms/EnquiryForm.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/forms/EnquiryForm'`

- [ ] **Step 3: Implement EnquiryForm**

```typescript
// components/forms/EnquiryForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  persona: z.enum(['sarah', 'marcus', 'elena']).optional(),
  message: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const personaOptions = [
  { value: 'sarah' as const, label: 'Energy' },
  { value: 'marcus' as const, label: 'Recovery' },
  { value: 'elena' as const, label: 'Longevity' },
]

interface EnquiryFormProps {
  source: 'product' | 'clinics' | 'homepage'
  defaultPersona?: 'sarah' | 'marcus' | 'elena'
  showMessage?: boolean
  ctaText?: string
}

export function EnquiryForm({
  source,
  defaultPersona,
  showMessage = true,
  ctaText = 'Send enquiry',
}: EnquiryFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { persona: defaultPersona },
  })

  const selectedPersona = watch('persona')

  async function onSubmit(data: FormData) {
    setServerError(null)
    const utmParams: Record<string, string> = {}
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
        const val = params.get(key)
        if (val) utmParams[key] = val
      }
    }
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ...utmParams,
          enquiry_type: 'product',
          source_page: source,
        }),
      })
      if (!res.ok) {
        setServerError('Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <p className="font-display text-2xl text-teal">Thank you.</p>
        <p className="mt-2 font-sans text-sm text-ink-light">
          We&apos;ll be in touch shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-md space-y-4">
      <Input
        {...register('name')}
        id="name"
        type="text"
        placeholder="Your name"
        error={errors.name?.message}
        autoComplete="name"
      />
      <Input
        {...register('email')}
        id="email"
        type="email"
        placeholder="Email address"
        error={errors.email?.message}
        autoComplete="email"
      />
      <Input
        {...register('phone')}
        id="phone"
        type="tel"
        placeholder="Phone (optional)"
        autoComplete="tel"
      />

      <div className="flex gap-2">
        {personaOptions.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue('persona', value)}
            className={cn(
              'flex-1 rounded-pill border py-2 font-sans text-xs font-medium transition-colors',
              selectedPersona === value
                ? 'border-teal bg-teal text-white'
                : 'border-ink-light/30 text-ink-mid hover:border-teal/50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {showMessage && (
        <textarea
          {...register('message')}
          placeholder="Message (optional)"
          rows={3}
          className="w-full rounded-lg border border-ink-light/40 bg-white px-4 py-3 font-sans text-sm text-ink placeholder-ink-light focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal"
        />
      )}

      {serverError && (
        <p className="font-sans text-sm text-red-400">{serverError}</p>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full">
        {ctaText}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/forms/EnquiryForm.test.tsx
```

Expected: PASS — 6 tests

- [ ] **Step 5: Run full suite**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add components/forms/EnquiryForm.tsx __tests__/components/forms/EnquiryForm.test.tsx
git commit -m "feat: EnquiryForm component with persona select and Zod validation"
```

---

## Task 7: FAQ page

**Files:**
- Create: `app/(site)/faq/page.tsx`
- Modify: `middleware.ts` (add `/faq` to LIVE_ROUTES)

No page-level tests — Accordion is already tested.

- [ ] **Step 1: Create the FAQ page**

```typescript
// app/(site)/faq/page.tsx
import type { Metadata } from 'next'
import { Accordion } from '@/components/ui/Accordion'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about the H2 Revive hydrogen inhalation device.',
}

const faqs = [
  {
    question: 'Is hydrogen inhalation safe?',
    answer:
      'Molecular hydrogen has been used in research settings for over 15 years with a strong safety profile. Studies involving human participants have reported no serious adverse effects. As with any wellness device, we recommend consulting your healthcare provider if you have a medical condition.',
  },
  {
    question: 'What does the research actually show?',
    answer:
      "Over 50 peer-reviewed studies have explored molecular hydrogen's effects on oxidative stress, inflammation, and cellular health. The research is promising, particularly in areas of athletic recovery, cognitive function, and longevity markers. We cite all studies for educational purposes — these findings do not constitute medical claims.",
  },
  {
    question: 'How much does it cost?',
    answer:
      'The H2 Revive device is priced at £1,200–1,600 depending on configuration. Please submit an enquiry for a full quote tailored to your needs.',
  },
  {
    question: 'How long does a session take?',
    answer:
      'A typical session is 20–60 minutes. Most people use the device once daily, though session length and frequency can be adjusted to suit your routine.',
  },
  {
    question: 'What do I need to use it?',
    answer:
      'The device requires only water and a standard UK power outlet. No specialist installation, tubing, or consumables are required beyond distilled or filtered water.',
  },
  {
    question: 'Is there a warranty?',
    answer:
      'All H2 Revive devices come with a full 2-year UK warranty covering manufacturing defects. Our UK-based support team is available to assist with any issues.',
  },
  {
    question: 'Can I return it?',
    answer:
      "We encourage all prospective customers to speak with us before purchasing so we can ensure the device is right for you. Please contact us to discuss your needs — we're happy to answer any questions before you commit.",
  },
  {
    question: 'When will it be available in the UK?',
    answer:
      'We are currently taking enquiries ahead of our UK launch. Submit an enquiry or join our waitlist to be among the first to receive a device.',
  },
]

export default function FAQPage() {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">FAQ</p>
        <h1 className="mb-10 font-display text-4xl text-ink">Common questions.</h1>
        <Accordion items={faqs} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update middleware to unlock /faq**

```typescript
// middleware.ts — full file replacement
import { NextRequest, NextResponse } from 'next/server'

const LIVE_ROUTES = new Set(['/', '/faq'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (!LIVE_ROUTES.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/faq/page.tsx" middleware.ts
git commit -m "feat: FAQ page with Accordion; unlock /faq in middleware"
```

---

## Task 8: About page

**Files:**
- Create: `app/(site)/about/page.tsx`
- Modify: `middleware.ts` (add `/about` to LIVE_ROUTES)

- [ ] **Step 1: Create the About page**

```typescript
// app/(site)/about/page.tsx
import type { Metadata } from 'next'

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

export default function AboutPage() {
  return (
    <div className="bg-cream">
      {/* Hero */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Our story</p>
        <h1 className="max-w-xl font-display text-5xl leading-tight text-ink">
          Why I started H2&nbsp;Revive.
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
          <a
            href="mailto:hello@h2revive.co.uk"
            className="text-teal underline hover:text-teal-dark"
          >
            hello@h2revive.co.uk
          </a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update middleware to add /about**

```typescript
// middleware.ts — full file replacement
import { NextRequest, NextResponse } from 'next/server'

const LIVE_ROUTES = new Set(['/', '/faq', '/about'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (!LIVE_ROUTES.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/about/page.tsx" middleware.ts
git commit -m "feat: About page with placeholder CEO copy; unlock /about in middleware"
```

---

## Task 9: Product page

**Files:**
- Create: `app/(site)/product/page.tsx`
- Modify: `middleware.ts` (add `/product` to LIVE_ROUTES)

- [ ] **Step 1: Create the Product page**

```typescript
// app/(site)/product/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { EnquiryForm } from '@/components/forms/EnquiryForm'
import { Accordion } from '@/components/ui/Accordion'

export const metadata: Metadata = {
  title: 'The Device',
  description:
    'Hydrogen inhalation technology for energy, recovery, and longevity. Enquire about the H2 Revive device.',
}

const outcomesTabs = {
  sarah: {
    label: 'Energy',
    content:
      "Molecular hydrogen has been studied for its potential effects on mitochondrial efficiency and cognitive function. Research suggests it may support mental clarity and sustained energy levels by addressing oxidative stress at the cellular level — without the stimulant effects of caffeine.",
  },
  marcus: {
    label: 'Recovery',
    content:
      "Athletes exploring molecular hydrogen report faster perceived recovery and reduced post-exercise inflammation markers. Studies suggest it may support the body's natural antioxidant response after intense training, potentially reducing muscle soreness and improving readiness for the next session.",
  },
  elena: {
    label: 'Longevity',
    content:
      "Oxidative stress is one of the primary drivers of cellular ageing. Molecular hydrogen is a selective antioxidant — it targets only the most harmful free radicals, leaving beneficial reactive oxygen species intact. Research explores its potential role in supporting long-term cellular health.",
  },
} as const

type Persona = keyof typeof outcomesTabs
const personaKeys: Persona[] = ['sarah', 'marcus', 'elena']

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
    answer:
      'No. The device requires only water and a standard UK power outlet. Simply fill the chamber, switch on, and breathe.',
  },
  {
    question: 'How often should I use it?',
    answer:
      'Most users complete one 20–60 minute session daily. The device can be used morning or evening to suit your routine.',
  },
  {
    question: 'What water should I use?',
    answer:
      'We recommend distilled or filtered water for optimal hydrogen concentration and to maintain device longevity.',
  },
  {
    question: 'Is it safe to use every day?',
    answer:
      'Research studies involving daily hydrogen inhalation have reported no adverse effects. As with any wellness practice, consult your healthcare provider if you have an existing medical condition.',
  },
  {
    question: 'How quickly will I notice results?',
    answer:
      'Individual experiences vary. Some users report changes within days; others over weeks. We recommend consistent daily use for at least 30 days before assessing.',
  },
]

interface ProductPageProps {
  searchParams: { persona?: string }
}

export default function ProductPage({ searchParams }: ProductPageProps) {
  const raw = searchParams.persona
  const persona: Persona = personaKeys.includes(raw as Persona) ? (raw as Persona) : 'sarah'

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
                Breathe the science.
              </h1>
              <p className="mb-8 font-sans text-base text-ink-light">
                H&#8322; concentration up to 1,200&nbsp;ppb. Session length 20&ndash;60 minutes.
                CE certified.
              </p>
              <a
                href="#enquiry"
                className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
              >
                Enquire now
              </a>
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
            {outcomesTabs[persona].content}
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
            How it works
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { n: 1, title: 'Fill', body: 'Fill the chamber with distilled or filtered water.' },
              {
                n: 2,
                title: 'Breathe',
                body: 'Breathe the hydrogen-enriched air through the included nasal cannula.',
              },
              {
                n: 3,
                title: 'Feel',
                body: 'Complete your session in 20–60 minutes. Use daily for best results.',
              },
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
              <h2 className="mb-4 font-display text-4xl text-white">
                Enquire about the device.
              </h2>
              <p className="font-sans text-sm text-ink-light">
                We&apos;re taking enquiries ahead of our UK launch. Tell us about yourself and
                we&apos;ll be in touch.
              </p>
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

- [ ] **Step 2: Update middleware to add /product**

```typescript
// middleware.ts — full file replacement
import { NextRequest, NextResponse } from 'next/server'

const LIVE_ROUTES = new Set(['/', '/faq', '/about', '/product'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (!LIVE_ROUTES.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/product/page.tsx" middleware.ts
git commit -m "feat: Product page with tabs, spec table, how-it-works, enquiry form; unlock /product"
```

---

## Task 10: Homepage + replace waitlist page

**Files:**
- Create: `app/(site)/page.tsx` — new homepage at `/`
- Delete: `app/page.tsx` — old waitlist (conflicts with route group homepage)

**Important:** `app/page.tsx` and `app/(site)/page.tsx` both resolve to `/`. They cannot coexist. Delete `app/page.tsx` first, then create the new one. Do both in the same git commit to avoid a broken intermediate state.

- [ ] **Step 1: Delete the old waitlist page**

```bash
git rm app/page.tsx
```

- [ ] **Step 2: Create the new homepage**

```typescript
// app/(site)/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { TrustBar } from '@/components/sections/TrustBar'
import { PersonaCards } from '@/components/sections/PersonaCards'

export const metadata: Metadata = {
  title: 'H2 Revive — Hydrogen Inhalation Technology',
  description:
    "The UK's dedicated hydrogen inhalation wellness brand. Research-backed molecular hydrogen technology for energy, recovery, and longevity.",
}

export default function HomePage() {
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
                The smallest molecule in existence.{' '}
                <span className="text-teal">The biggest idea in British wellness.</span>
              </h1>
              <p className="mb-8 font-sans text-base text-ink-mid">
                Clinically studied. UK-based. Built for the serious.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/product"
                  className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
                >
                  Explore the device
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
                &ldquo;I started H2 Revive because I believe the British market deserves honest,
                research-backed wellness technology. No overclaiming. Just the science.&rdquo;
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
          <h2 className="mb-4 font-display text-4xl text-ink">
            50+ peer-reviewed studies. One remarkable molecule.
          </h2>
          <p className="mx-auto mb-8 max-w-xl font-sans text-base text-ink-mid">
            Molecular hydrogen is the smallest antioxidant in existence. It crosses the
            blood-brain barrier, enters mitochondria, and selectively neutralises only the most
            harmful free radicals.
          </p>
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
                href="/product"
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

- [ ] **Step 3: Run a local build to confirm no route conflicts**

```bash
cd "c:\Users\david.mcaughtrie\OneDrive - Cyncly\Documents\Hydro"
npm run build
```

Expected: build completes with no errors. Route table should show `○ /`, `ƒ /product`, `○ /about`, `○ /faq`.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS. Note: WaitlistForm tests may now fail if they imported from `app/page.tsx` — they don't, they import from `components/forms/WaitlistForm.tsx` which still exists unchanged.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/page.tsx"
git commit -m "feat: homepage — hero, trust bar, persona cards, CEO intro, science teaser, product CTA; retire waitlist page"
```

- [ ] **Step 6: Push and verify on Vercel**

```bash
git push
```

Open the new Vercel deployment URL. Verify:
- `/` loads the homepage with hero, TrustBar, PersonaCards
- `/product` loads with tabs pre-selected to `sarah` by default
- `/product?persona=marcus` pre-selects Recovery tab
- `/about` loads with placeholder copy
- `/faq` loads with accordion
- `/science` (not live) redirects back to `/`
- Nav links work; Science is visually muted
