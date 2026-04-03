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
