import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn(() => mockSelect()),
        is: vi.fn(() => mockSelect()),
      })),
    })),
  })),
}))

describe('getPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty object when no published rows exist', async () => {
    mockSelect.mockResolvedValue({ data: [] })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero'], null)
    expect(result).toEqual({})
  })

  it('returns general content when persona is null', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { section: 'hero', persona: null, content_json: { headline: 'General headline' } },
      ],
    })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero'], null)
    expect(result['hero']).toEqual({ headline: 'General headline' })
  })

  it('returns persona-specific content over general for same section', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { section: 'hero', persona: null,     content_json: { headline: 'General headline' } },
        { section: 'hero', persona: 'energy', content_json: { headline: 'Energy headline' } },
      ],
    })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero'], 'energy')
    expect(result['hero']).toEqual({ headline: 'Energy headline' })
  })

  it('returns both general and persona-specific for different sections', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { section: 'hero',     persona: null,     content_json: { headline: 'General hero' } },
        { section: 'features', persona: 'energy', content_json: { headline: 'Energy features' } },
      ],
    })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero', 'features'], 'energy')
    expect(result['hero']).toEqual({ headline: 'General hero' })
    expect(result['features']).toEqual({ headline: 'Energy features' })
  })

  it('returns empty object when query returns null data', async () => {
    mockSelect.mockResolvedValue({ data: null })
    const { getPageContent } = await import('@/lib/content')
    const result = await getPageContent('homepage', ['hero'], null)
    expect(result).toEqual({})
  })
})
