import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentEditForm } from '@/components/admin/ContentEditForm'
import type { ContentItem } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

const mockFetch = vi.fn()

const item: ContentItem = {
  id: 'item-1',
  created_at: '2026-04-01T12:00:00Z',
  updated_at: '2026-04-01T12:00:00Z',
  page: 'homepage',
  section: 'hero',
  persona: 'sarah',
  content_type: 'headline',
  content_json: {
    headline: 'Your biology already knows how to perform',
    subheading: 'Molecular hydrogen for energy',
    body: 'Research suggests hydrogen may support cellular function.',
    cta_text: 'Explore the science',
    image_suggestion: 'Woman at rest, morning light',
  },
  status: 'draft',
  generation_prompt: null,
  published_at: null,
}

describe('ContentEditForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders a field for each key defined in config for homepage/hero', () => {
    render(<ContentEditForm item={item} />)
    expect(screen.getByLabelText(/headline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subheading/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/body/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cta text/i)).toBeInTheDocument()
  })

  it('pre-fills fields with values from content_json', () => {
    render(<ContentEditForm item={item} />)
    expect(screen.getByDisplayValue('Your biology already knows how to perform')).toBeInTheDocument()
  })

  it('calls PATCH /api/admin/content/item-1 with content_json on save', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<ContentEditForm item={item} />)
    await user.click(screen.getByRole('button', { name: /save draft/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/content/item-1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"content_json"'),
        })
      )
    })
  })

  it('shows inline compliance error per field when PATCH returns 422', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        violations: [{ field: 'headline', word: 'treats' }],
      }),
    })
    const user = userEvent.setup()
    render(<ContentEditForm item={item} />)
    await user.click(screen.getByRole('button', { name: /save draft/i }))
    await waitFor(() => {
      expect(screen.getByText(/treats/i)).toBeInTheDocument()
    })
  })

  it('calls POST /api/admin/content/item-1/publish on publish click', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<ContentEditForm item={item} />)
    await user.click(screen.getByRole('button', { name: /publish/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/content/item-1/publish',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('shows compliance violation error when publish returns 422', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        violations: [{ field: 'body', word: 'cures' }],
      }),
    })
    const user = userEvent.setup()
    render(<ContentEditForm item={item} />)
    await user.click(screen.getByRole('button', { name: /publish/i }))
    await waitFor(() => {
      expect(screen.getByText(/cures/i)).toBeInTheDocument()
    })
  })
})
