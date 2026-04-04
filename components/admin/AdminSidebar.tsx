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
  { label: 'Testimonials', href: '/admin/testimonials' },
  { label: 'Competitions', href: '/admin/competitions' },
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
