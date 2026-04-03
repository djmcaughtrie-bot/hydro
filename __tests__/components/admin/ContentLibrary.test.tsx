import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentLibrary } from '@/components/admin/ContentLibrary'
import type { ContentItem } from '@/lib/types'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const mockFetch = vi.fn()

const items: ContentItem[] = [
  {
    id: 'item-1',
    created_at: '2026-04-01T12:00:00Z',
    updated_at: '2026-04-01T12:00:00Z',
    page: 'homepage',
    section: 'hero',
    persona: 'energy',
    content_type: 'headline',
    content_json: { headline: 'Your biology already knows how to perform' },
    status: 'published',
    generation_prompt: null,
    published_at: '2026-04-01T12:00:00Z',
  },
  {
    id: 'item-2',
    created_at: '2026-04-02T12:00:00Z',
    updated_at: '2026-04-02T12:00:00Z',
    page: 'product',
    section: 'features',
    persona: 'performance',
    content_type: 'body',
    content_json: { headline: '600ml/min delivery rate' },
    status: 'draft',
    generation_prompt: null,
    published_at: null,
  },
]

describe('ContentLibrary', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders all content items', () => {
    render(<ContentLibrary items={items} />)
    expect(screen.getByText('Homepage / Hero')).toBeInTheDocument()
    expect(screen.getByText('Product / Features')).toBeInTheDocument()
  })

  it('shows headline preview from content_json', () => {
    render(<ContentLibrary items={items} />)
    expect(screen.getByText(/Your biology already knows/)).toBeInTheDocument()
  })

  it('filters items by page', async () => {
    const user = userEvent.setup()
    render(<ContentLibrary items={items} />)
    await user.selectOptions(screen.getByLabelText(/filter by page/i), 'homepage')
    expect(screen.getByText('Homepage / Hero')).toBeInTheDocument()
    expect(screen.queryByText('Product / Features')).not.toBeInTheDocument()
  })

  it('filters items by status', async () => {
    const user = userEvent.setup()
    render(<ContentLibrary items={items} />)
    await user.selectOptions(screen.getByLabelText(/filter by status/i), 'published')
    expect(screen.getByText('Homepage / Hero')).toBeInTheDocument()
    expect(screen.queryByText('Product / Features')).not.toBeInTheDocument()
  })

  it('delete button calls DELETE after confirm', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('confirm', () => true)
    const user = userEvent.setup()
    render(<ContentLibrary items={items} />)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/content/item-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
