import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockStorageUpload = vi.fn(async () => ({ data: { path: 'image/hero.jpg' }, error: null }))
const mockStorageGetPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://cdn.test/image/hero.jpg' } }))

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
    vi.clearAllMocks()
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

describe('POST /api/admin/media', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockStorageUpload.mockResolvedValue({ data: { path: 'image/hero.jpg' }, error: null })
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/image/hero.jpg' } })
    mockInsert.mockResolvedValue({
      data: {
        id: 'm-2', filename: 'hero.jpg', url: 'https://cdn.test/image/hero.jpg',
        width: 1400, height: 900, file_size_kb: 320, focal_point: 'center',
        media_type: 'image', uploaded_at: '2026-04-03T10:00:00Z', created_at: '2026-04-03T10:00:00Z',
      },
      error: null,
    })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/admin/media/route')
    const formData = new FormData()
    formData.append('file', new Blob(['data'], { type: 'image/jpeg' }), 'hero.jpg')
    formData.append('width', '1400')
    formData.append('height', '900')
    formData.append('focal_point', 'center')
    formData.append('media_type', 'image')
    const req = new Request('http://localhost', { method: 'POST', body: formData })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when media_type is invalid', async () => {
    const { POST } = await import('@/app/api/admin/media/route')
    const mockFile = {
      name: 'hero.jpg', type: 'image/jpeg', size: 4,
      stream: () => new ReadableStream(), text: async () => 'data',
      arrayBuffer: async () => new ArrayBuffer(4), slice: () => new Blob(),
    } as unknown as File
    const mockFormData = {
      get: vi.fn((key: string) => {
        const map: Record<string, unknown> = { file: mockFile, media_type: 'malicious-type' }
        return map[key] ?? null
      }),
    } as unknown as FormData
    const mockReq = { formData: vi.fn().mockResolvedValue(mockFormData) } as unknown as Request
    const res = await POST(mockReq)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid media_type')
  })

  it('uploads image, inserts into media table, returns MediaItem', async () => {
    const { POST } = await import('@/app/api/admin/media/route')
    const mockFile = {
      name: 'hero.jpg',
      type: 'image/jpeg',
      size: 4,
      stream: () => new ReadableStream(),
      text: async () => 'data',
      arrayBuffer: async () => new ArrayBuffer(4),
      slice: () => new Blob(),
    } as unknown as Blob

    const mockFormData = {
      get: vi.fn((key: string) => {
        const map: Record<string, any> = {
          file: mockFile,
          width: '1400',
          height: '900',
          focal_point: 'center',
          media_type: 'image',
        }
        return map[key]
      }),
    } as unknown as FormData

    const mockReq = {
      formData: vi.fn().mockResolvedValue(mockFormData),
    } as unknown as Request
    const res = await POST(mockReq)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('m-2')
    expect(body.url).toBe('https://cdn.test/image/hero.jpg')
    expect(mockStorageUpload).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  it('returns url only for captions upload (no media table insert)', async () => {
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/captions/subs.vtt' } })
    const { POST } = await import('@/app/api/admin/media/route')
    const mockFile = {
      name: 'subs.vtt',
      type: 'text/vtt',
      size: 10,
      stream: () => new ReadableStream(),
      text: async () => 'WEBVTT\n\n',
      arrayBuffer: async () => new ArrayBuffer(10),
      slice: () => new Blob(),
    } as unknown as Blob

    const mockFormData = {
      get: vi.fn((key: string) => {
        const map: Record<string, any> = {
          file: mockFile,
          media_type: 'captions',
        }
        return map[key]
      }),
    } as unknown as FormData

    const mockReq = {
      formData: vi.fn().mockResolvedValue(mockFormData),
    } as unknown as Request
    const res = await POST(mockReq)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://cdn.test/captions/subs.vtt')
    expect(body.id).toBeUndefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns 400 when no file provided', async () => {
    const { POST } = await import('@/app/api/admin/media/route')
    const formData = new FormData()
    formData.append('media_type', 'image')
    const req = new Request('http://localhost', { method: 'POST', body: formData })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('No file provided')
  })

  it('returns 500 when storage upload fails', async () => {
    mockStorageUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } })
    const { POST } = await import('@/app/api/admin/media/route')
    const mockFile = {
      name: 'hero.jpg',
      type: 'image/jpeg',
      size: 4,
      stream: () => new ReadableStream(),
      text: async () => 'data',
      arrayBuffer: async () => new ArrayBuffer(4),
      slice: () => new Blob(),
    } as unknown as Blob

    const mockFormData = {
      get: vi.fn((key: string) => {
        const map: Record<string, any> = {
          file: mockFile,
          width: '1400',
          height: '900',
          focal_point: 'center',
          media_type: 'image',
        }
        return map[key]
      }),
    } as unknown as FormData

    const mockReq = {
      formData: vi.fn().mockResolvedValue(mockFormData),
    } as unknown as Request
    const res = await POST(mockReq)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Upload failed')
  })
})
