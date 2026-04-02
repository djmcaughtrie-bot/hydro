import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WaitlistForm } from '@/components/forms/WaitlistForm'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('WaitlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email input and persona radio buttons', () => {
    render(<WaitlistForm />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/more energy/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/train hard/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/investing in longevity/i)).toBeInTheDocument()
  })

  it('shows validation error when email is empty on submit', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm />)
    await user.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('submits form and shows success state', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })
    render(<WaitlistForm />)
    await user.type(screen.getByPlaceholderText(/email/i), 'sarah@example.com')
    await user.click(screen.getByLabelText(/more energy/i))
    await user.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() => {
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument()
    })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/enquiry',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows error message when API call fails', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to save enquiry' }),
    })
    render(<WaitlistForm />)
    await user.type(screen.getByPlaceholderText(/email/i), 'sarah@example.com')
    await user.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })
})
