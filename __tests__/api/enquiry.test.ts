import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/enquiry/route'
import { NextRequest } from 'next/server'

// Mock Supabase server client
const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
const mockFrom = vi.hoisted(() => vi.fn(() => ({ insert: mockInsert })))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}))

// Mock Resend
vi.mock('@/lib/resend', () => ({
  sendLeadNotification: vi.fn().mockResolvedValue({ error: null }),
}))

function makeRequest(body: object, url = 'http://localhost:3000/api/enquiry') {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/enquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  it('returns 400 when email is missing', async () => {
    const req = makeRequest({ persona: 'sarah', enquiry_type: 'waitlist' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when email is invalid', async () => {
    const req = makeRequest({ email: 'not-an-email', enquiry_type: 'waitlist' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 and inserts lead for valid waitlist submission', async () => {
    const req = makeRequest({
      email: 'sarah@example.com',
      persona: 'sarah',
      enquiry_type: 'waitlist',
      source_page: '/start',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('leads')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'sarah@example.com',
        persona: 'sarah',
        enquiry_type: 'waitlist',
        status: 'new',
      })
    )
  })

  it('returns 500 when Supabase insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } })
    const req = makeRequest({
      email: 'sarah@example.com',
      enquiry_type: 'waitlist',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('captures UTM params from request URL', async () => {
    const req = makeRequest(
      { email: 'sarah@example.com', enquiry_type: 'waitlist' },
      'http://localhost:3000/api/enquiry?utm_source=instagram&utm_medium=social'
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ utm_source: 'instagram', utm_medium: 'social' })
    )
  })

  it('returns 400 when enquiry_type is invalid', async () => {
    const req = makeRequest({ email: 'test@example.com', enquiry_type: 'unknown' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
