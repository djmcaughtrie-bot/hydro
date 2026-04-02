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
