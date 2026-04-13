'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const navLinksBefore = [
  { label: 'Home', href: '/' },
] as const

const navLinksAfter = [
  { label: 'Product', href: '/product' },
  { label: 'Science', href: '/science' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
] as const

const personaLinks = [
  { label: 'Energy & Clarity', href: '/for/energy', colour: 'text-persona-energy' },
  { label: 'Performance & Recovery', href: '/for/performance', colour: 'text-persona-performance' },
  { label: 'Longevity & Ageing', href: '/for/longevity', colour: 'text-persona-longevity' },
] as const

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobilePersonaOpen, setMobilePersonaOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLLIElement>(null)
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const isPersonaActive = pathname.startsWith('/for/')

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="sticky top-0 z-50 border-b border-ink-light/20 bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="H2 Revive home">
          <Image src="/logo.svg" alt="H2 Revive" width={80} height={54} priority />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex">
          {navLinksBefore.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'font-sans text-sm transition-colors hover:text-ink',
                  isActive(href)
                    ? 'border-b-2 border-teal pb-0.5 text-ink'
                    : 'text-ink-mid'
                )}
              >
                {label}
              </Link>
            </li>
          ))}

          {/* Your story dropdown */}
          <li
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                'flex items-center gap-1 font-sans text-sm transition-colors hover:text-ink',
                isPersonaActive ? 'border-b-2 border-teal pb-0.5 text-ink' : 'text-ink-mid'
              )}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              Your story
              <svg
                className={cn('h-3 w-3 transition-transform', dropdownOpen && 'rotate-180')}
                fill="none"
                viewBox="0 0 12 12"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 4l4 4 4-4" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-52 -translate-x-1/2 rounded-lg border border-ink-light/20 bg-white py-2 shadow-md">
                {personaLinks.map(({ label, href, colour }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDropdownOpen(false)}
                    className={cn(
                      'block px-4 py-2.5 font-sans text-sm transition-colors hover:bg-cream',
                      pathname === href ? `font-medium ${colour}` : 'text-ink-mid hover:text-ink'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </li>

          {navLinksAfter.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'font-sans text-sm transition-colors hover:text-ink',
                  isActive(href)
                    ? 'border-b-2 border-teal pb-0.5 text-ink'
                    : 'text-ink-mid'
                )}
              >
                {label}
              </Link>
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
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <span className={cn('block h-0.5 w-6 bg-ink transition-all', mobileOpen && 'translate-y-2 rotate-45')} />
          <span className={cn('block h-0.5 w-6 bg-ink transition-all', mobileOpen && 'opacity-0')} />
          <span className={cn('block h-0.5 w-6 bg-ink transition-all', mobileOpen && '-translate-y-2 -rotate-45')} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-ink-light/20 bg-cream px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-4">
            {navLinksBefore.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'font-sans text-sm hover:text-ink',
                    isActive(href) ? 'font-medium text-ink' : 'text-ink-mid'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}

            {/* Your story — expandable on mobile */}
            <li>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between font-sans text-sm',
                  isPersonaActive ? 'font-medium text-ink' : 'text-ink-mid'
                )}
                onClick={() => setMobilePersonaOpen(!mobilePersonaOpen)}
              >
                Your story
                <svg
                  className={cn('h-3 w-3 transition-transform', mobilePersonaOpen && 'rotate-180')}
                  fill="none"
                  viewBox="0 0 12 12"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 4l4 4 4-4" />
                </svg>
              </button>

              {mobilePersonaOpen && (
                <ul className="mt-2 flex flex-col gap-3 pl-3 border-l-2 border-ink-light/30">
                  {personaLinks.map(({ label, href, colour }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className={cn(
                          'font-sans text-sm',
                          pathname === href ? `font-medium ${colour}` : 'text-ink-mid hover:text-ink'
                        )}
                        onClick={() => { setMobileOpen(false); setMobilePersonaOpen(false) }}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {navLinksAfter.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'font-sans text-sm hover:text-ink',
                    isActive(href) ? 'font-medium text-ink' : 'text-ink-mid'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}

            <li>
              <Link
                href="/product"
                className="inline-flex rounded-pill bg-teal px-5 py-2 font-sans text-sm font-medium text-white hover:bg-teal-dark"
                onClick={() => setMobileOpen(false)}
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
