import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockEqForUpdate = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table) => {
      if (table === 'content_items') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })),
          update: vi.fn(() => ({ eq: mockEqForUpdate })),
        }
      }
    }),
  })),
}))

// Mock compliance so tests control pass/fail without real API calls
const mockCheckCompliance = vi.fn()
vi.mock('@/lib/compliance', () => ({
  checkCompliance: mockCheckCompliance,
}))

describe('POST /api/admin/content/[id]/publish', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValue({ data: null, error: null })
    mockEqForUpdate.mockResolvedValue({ error: null })
    // Default: compliance passes
    mockCheckCompliance.mockResolvedValue({ compliant: true, violations: [], stage: 'pass' })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/admin/content/[id]/publish/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 when content item not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const { POST } = await import('@/app/api/admin/content/[id]/publish/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'missing' }) }
    )
    expect(res.status).toBe(404)
  })

  it('returns 422 when content has compliance violations', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'item-1', content_json: { headline: 'This treats fatigue' } },
      error: null,
    })
    mockCheckCompliance.mockResolvedValue({
      compliant: false,
      violations: [{ text: 'treats fatigue', reason: 'Treatment claim', suggestion: 'may support energy' }],
      stage: 'hard',
    })
    const { POST } = await import('@/app/api/admin/content/[id]/publish/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.violations).toBeDefined()
  })

  it('sets status=published and published_at when content is compliant', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'item-1', content_json: { headline: 'Research may support energy levels' } },
      error: null,
    })
    const { POST } = await import('@/app/api/admin/content/[id]/publish/route')
    const res = await POST(
      new Request('http://localhost', { method: 'POST' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(200)
    expect(mockEqForUpdate).toHaveBeenCalled()
  })
})
