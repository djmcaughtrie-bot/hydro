import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })

vi.mock('resend', () => {
  return {
    Resend: vi.fn(function () {
      return {
        emails: {
          send: sendMock,
        },
      }
    }),
  }
})

describe('sendLeadNotification', () => {
  it('calls resend.emails.send with correct params', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('RESEND_FROM_EMAIL', 'hello@h2revive.co.uk')
    vi.stubEnv('ADMIN_NOTIFICATION_EMAIL', 'admin@h2revive.co.uk')

    const { sendLeadNotification } = await import('@/lib/resend')
    const result = await sendLeadNotification({
      name: 'Sarah',
      email: 'sarah@example.com',
      persona: 'sarah',
      enquiry_type: 'waitlist',
      source_page: '/start',
    })
    expect(result.error).toBeNull()
  })
})
