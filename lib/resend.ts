import { Resend } from 'resend'
import { generateConfirmToken } from './email-token'

interface LeadNotificationParams {
  name?: string | null
  email: string
  persona?: string | null
  enquiry_type: string
  source_page?: string | null
}

export async function sendDoubleOptIn(opts: {
  email: string
  name?: string
  persona?: string
  signupId: string
}): Promise<{ error: Error | null }> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL ?? 'hello@h2revive.co.uk'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://h2revive.co.uk'

  let token: string
  try {
    token = generateConfirmToken(opts.email, opts.signupId)
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }

  const confirmUrl = `${siteUrl}/confirm?token=${token}`
  const greeting = opts.name ? `Hi ${opts.name},` : 'Hi there,'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your H2 Revive subscription</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5F0;font-family:'DM Sans',Arial,sans-serif;color:#0D1B1E;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5F0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background-color:#ffffff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">
          <tr>
            <td style="background-color:#00B4C6;padding:28px 40px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">H2 Revive</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#0D1B1E;">${greeting}</p>
              <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#3A4F52;">
                Thank you for signing up to H2 Revive. Please confirm your email address to receive the research guide and our science-backed wellness updates.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:100px;background-color:#00B4C6;">
                    <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;">
                      Confirm my subscription
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:13px;color:#8AA0A3;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #E0F7FA;">
              <p style="margin:0;font-size:12px;color:#8AA0A3;line-height:1.6;">
                H2 Revive | hello@h2revive.co.uk<br />
                You're receiving this because you signed up at h2revive.co.uk
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from,
    to: opts.email,
    subject: 'Confirm your H2 Revive subscription',
    html,
  })

  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function sendLeadNotification(params: LeadNotificationParams) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!to) return { data: null, error: new Error('ADMIN_NOTIFICATION_EMAIL not set') }

  const resend = new Resend(process.env.RESEND_API_KEY)
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'hello@h2revive.co.uk',
    to,
    subject: `New H2 Revive lead — ${params.enquiry_type}`,
    html: `
      <h2>New lead from H2 Revive</h2>
      <table>
        <tr><td><strong>Name</strong></td><td>${params.name ?? '—'}</td></tr>
        <tr><td><strong>Email</strong></td><td>${params.email}</td></tr>
        <tr><td><strong>Persona</strong></td><td>${params.persona ?? '—'}</td></tr>
        <tr><td><strong>Type</strong></td><td>${params.enquiry_type}</td></tr>
        <tr><td><strong>Source</strong></td><td>${params.source_page ?? '—'}</td></tr>
      </table>
    `,
  })
}
