import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentEditForm } from '@/components/admin/ContentEditForm'
import type { ContentItem } from '@/lib/types'

vi.mock('next/navigation', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))
// Mock ImagePanel and VideoPanel to keep these tests focused on wiring only
vi.mock('@/components/admin/ImagePanel', () => ({
  ImagePanel: ({ onChange }: { onChange: (u: Record<string, unknown>) => void }) => (
    <div data-testid="image-panel">
      <button onClick={() => onChange({ image_url: 'https://cdn.test/new.jpg', image_alt: 'New' })}>
        Set image
      </button>
    </div>
  ),
}))
vi.mock('@/components/admin/VideoPanel', () => ({
  VideoPanel: ({ onChange }: { onChange: (u: Record<string, unknown>) => void }) => (
    <div data-testid="video-panel">
      <button onClick={() => onChange({ video_url: 'https://stream.test/abc', video_autoplay: true })}>
        Set video
      </button>
    </div>
  ),
}))

const mockFetch = vi.fn()

const heroItem: ContentItem = {
  id: 'item-1', created_at: '2026-04-01T12:00:00Z', updated_at: '2026-04-01T12:00:00Z',
  page: 'homepage', section: 'hero', persona: null, content_type: 'headline',
  content_json: {
    headline: 'Test headline', subheading: 'Sub', body: 'Body text', cta_text: 'CTA',
  },
  status: 'draft', generation_prompt: null, published_at: null,
}

describe('ContentEditForm — media wiring', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders ImagePanel for sections with imageGuidelines (homepage/hero)', () => {
    render(<ContentEditForm item={heroItem} />)
    expect(screen.getByTestId('image-panel')).toBeInTheDocument()
  })

  it('renders VideoPanel for sections with videoType (homepage/hero has videoType=ambient)', () => {
    render(<ContentEditForm item={heroItem} />)
    expect(screen.getByTestId('video-panel')).toBeInTheDocument()
  })

  it('merges media fields into PATCH body on save', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<ContentEditForm item={heroItem} />)

    // Trigger image update via mocked ImagePanel
    await user.click(screen.getByRole('button', { name: /set image/i }))
    // Save
    await user.click(screen.getByRole('button', { name: /save draft/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/content/item-1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"image_url"'),
        })
      )
    })
  })

  it('does not render ImagePanel for sections without imageGuidelines (homepage/faq)', () => {
    const faqItem: ContentItem = {
      ...heroItem, id: 'item-2', section: 'faq',
      content_json: { question: 'What is H2?', answer: 'Molecular hydrogen.' },
    }
    render(<ContentEditForm item={faqItem} />)
    expect(screen.queryByTestId('image-panel')).not.toBeInTheDocument()
  })
})
