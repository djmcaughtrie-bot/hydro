import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('resend', () => ({
  Resend: vi.fn(function () {
    return {
      emails: {
        send: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
      },
    }
  }),
}))

describe('sendLeadNotification', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('calls resend.emails.send and returns no error', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('RESEND_FROM_EMAIL', 'hello@h2revive.co.uk')
    vi.stubEnv('ADMIN_NOTIFICATION_EMAIL', 'admin@h2revive.co.uk')

    const { sendLeadNotification } = await import('@/lib/resend')
    const result = await sendLeadNotification({
      name: 'Sarah',
      email: 'sarah@example.com',
      persona: 'energy',
      enquiry_type: 'waitlist',
      source_page: '/start',
    })
    expect(result.error).toBeNull()
  })

  it('returns an error when ADMIN_NOTIFICATION_EMAIL is not set', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    // ADMIN_NOTIFICATION_EMAIL intentionally not set

    const { sendLeadNotification } = await import('@/lib/resend')
    const result = await sendLeadNotification({
      email: 'sarah@example.com',
      enquiry_type: 'waitlist',
    })
    expect(result.error).toBeInstanceOf(Error)
    expect((result.error as Error).message).toBe('ADMIN_NOTIFICATION_EMAIL not set')
  })
})
