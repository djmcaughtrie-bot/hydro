import { Resend } from 'resend'

interface LeadNotificationParams {
  name?: string | null
  email: string
  persona?: string | null
  enquiry_type: string
  source_page?: string | null
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
