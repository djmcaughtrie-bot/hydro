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
