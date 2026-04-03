import { describe, it, expect, vi } from 'vitest'
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
