import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockStorageUpload = vi.fn()
const mockStorageGetPublicUrl = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'media') {
        return {
          select: vi.fn(() => ({ order: mockSelect })),
          insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockInsert })) })),
        }
      }
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      })),
    },
  })),
}))

describe('GET /api/admin/media', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { GET } = await import('@/app/api/admin/media/route')
    const res = await GET(new Request('http://localhost/api/admin/media'))
    expect(res.status).toBe(401)
  })

  it('returns media items ordered by uploaded_at desc', async () => {
    const items = [
      { id: 'm-1', filename: 'hero.jpg', url: 'https://cdn.test/hero.jpg',
        width: 1400, height: 900, file_size_kb: 320, focal_point: 'center',
        media_type: 'image', uploaded_at: '2026-04-03T10:00:00Z', created_at: '2026-04-03T10:00:00Z' }
    ]
    mockSelect.mockResolvedValue({ data: items, error: null })
    const { GET } = await import('@/app/api/admin/media/route')
    const res = await GET(new Request('http://localhost/api/admin/media'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(items)
  })

  it('returns 500 when database query fails', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const { GET } = await import('@/app/api/admin/media/route')
    const res = await GET(new Request('http://localhost/api/admin/media'))
    expect(res.status).toBe(500)
  })
})
