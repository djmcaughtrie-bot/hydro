import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table) => {
      if (table === 'content_items') {
        return {
          update: vi.fn(() => ({ eq: mockUpdate })),
          delete: vi.fn(() => ({ eq: mockDelete })),
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

describe('PATCH /api/admin/content/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpdate.mockResolvedValue({ error: null })
    mockDelete.mockResolvedValue({ error: null })
    // Default: compliance passes
    mockCheckCompliance.mockResolvedValue({ compliant: true, violations: [], stage: 'pass' })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { PATCH } = await import('@/app/api/admin/content/[id]/route')
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ content_json: { headline: 'Test' } }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(401)
  })

  it('returns 422 when content_json contains prohibited words', async () => {
    mockCheckCompliance.mockResolvedValue({
      compliant: false,
      violations: [{ text: 'treats fatigue', reason: 'Treatment claim', suggestion: 'may support energy' }],
      stage: 'hard',
    })
    const { PATCH } = await import('@/app/api/admin/content/[id]/route')
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ content_json: { headline: 'This treats fatigue' } }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.violations).toBeDefined()
  })

  it('returns 200 when content_json is compliant', async () => {
    const { PATCH } = await import('@/app/api/admin/content/[id]/route')
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ content_json: { headline: 'Research may support energy' } }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(200)
  })

  it('skips compliance when patching non-content fields', async () => {
    const { PATCH } = await import('@/app/api/admin/content/[id]/route')
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'draft' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(200)
  })

})

describe('DELETE /api/admin/content/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockDelete.mockResolvedValue({ error: null })
    mockCheckCompliance.mockResolvedValue({ compliant: true, violations: [], stage: 'pass' })
  })

  it('returns 200 on success', async () => {
    const { DELETE } = await import('@/app/api/admin/content/[id]/route')
    const res = await DELETE(
      new Request('http://localhost', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(200)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { DELETE } = await import('@/app/api/admin/content/[id]/route')
    const res = await DELETE(
      new Request('http://localhost', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    )
    expect(res.status).toBe(401)
  })
})
