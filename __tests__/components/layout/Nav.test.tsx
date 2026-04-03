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

  it('renders Science as a link to /science', () => {
    render(<Nav />)
    expect(screen.getByRole('link', { name: /^science$/i })).toHaveAttribute('href', '/science')
  })

  it('renders Enquire CTA linking to /product', () => {
    render(<Nav />)
    const enquireLinks = screen.getAllByRole('link', { name: /enquire/i })
    expect(enquireLinks[0]).toHaveAttribute('href', '/product')
  })
})
