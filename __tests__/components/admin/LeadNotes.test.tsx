import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadNotes } from '@/components/admin/LeadNotes'

const mockFetch = vi.fn()

describe('LeadNotes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  const existingNotes = [
    { text: 'Called and left voicemail.', created_at: '2026-04-01T10:00:00.000Z' },
    { text: 'Initial contact made.', created_at: '2026-03-30T09:00:00.000Z' },
  ]

  it('renders existing notes', () => {
    render(<LeadNotes leadId="abc" initialNotes={existingNotes} />)
    expect(screen.getByText('Called and left voicemail.')).toBeInTheDocument()
    expect(screen.getByText('Initial contact made.')).toBeInTheDocument()
  })

  it('renders textarea and Add note button', () => {
    render(<LeadNotes leadId="abc" initialNotes={[]} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument()
  })

  it('renders empty state message when no notes', () => {
    render(<LeadNotes leadId="abc" initialNotes={[]} />)
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('submits note and appends it to the list', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<LeadNotes leadId="abc" initialNotes={[]} />)
    await user.type(screen.getByRole('textbox'), 'Follow up scheduled.')
    await user.click(screen.getByRole('button', { name: /add note/i }))
    await waitFor(() => {
      expect(screen.getByText('Follow up scheduled.')).toBeInTheDocument()
    })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/leads/abc',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ note: 'Follow up scheduled.' }),
      })
    )
  })

  it('clears textarea after successful submit', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<LeadNotes leadId="abc" initialNotes={[]} />)
    await user.type(screen.getByRole('textbox'), 'Some note')
    await user.click(screen.getByRole('button', { name: /add note/i }))
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('')
    })
  })
})
