import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockInsertSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: mockInsertSingle })),
      })),
    })),
  })),
}))

const mockAnthropicCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () { return { messages: { create: mockAnthropicCreate } } },
  ),
}))

// Mock compliance so its internal Anthropic call doesn't interfere with
// the content-generation mock and does not make real API calls.
const mockCheckCompliance = vi.fn()
vi.mock('@/lib/compliance', () => ({
  checkCompliance: mockCheckCompliance,
}))

describe('POST /api/generate-content', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockInsertSingle.mockResolvedValue({ data: { id: 'item-1' }, error: null })
    // Default: compliance passes
    mockCheckCompliance.mockResolvedValue({ compliant: true, violations: [], stage: 'pass' })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/generate-content/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ page: 'homepage', section: 'hero' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid page/section', async () => {
    const { POST } = await import('@/app/api/generate-content/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ page: 'nonexistent', section: 'hero' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res.status).toBe(400)
  })

  it('saves as draft when compliance passes', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({
        headline: 'Research may support energy levels',
        subheading: 'Science-backed wellness technology',
        body: 'Studies suggest hydrogen inhalation may help.',
        cta_text: 'Explore the science',
        image_suggestion: 'Woman at rest, morning light',
      }) }],
    })
    const { POST } = await import('@/app/api/generate-content/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ page: 'homepage', section: 'hero' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.status).toBe('draft')
  })

  it('retries up to 3 times and saves as needs_review when compliance keeps failing', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({
        headline: 'This treats fatigue permanently',
        subheading: 'Proven to help',
        body: 'Cures inflammation',
        cta_text: 'Try it',
        image_suggestion: 'Device photo',
      }) }],
    })
    // Compliance always fails
    mockCheckCompliance.mockResolvedValue({
      compliant: false,
      violations: [{ text: 'treats fatigue', reason: 'Treatment claim', suggestion: '' }],
      stage: 'hard',
    })
    const { POST } = await import('@/app/api/generate-content/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ page: 'homepage', section: 'hero' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    const data = await res.json()
    expect(mockAnthropicCreate).toHaveBeenCalledTimes(3)
    expect(data.status).toBe('needs_review')
  })
})
