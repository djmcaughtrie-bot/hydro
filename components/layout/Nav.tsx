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
