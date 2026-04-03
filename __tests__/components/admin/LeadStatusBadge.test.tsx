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
