import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  persona: z.string().optional(),
  lead_magnet: z.string().optional(),
  marketing_consent: z.boolean().default(false),
  consent_timestamp: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }
    const body = parsed.data

    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from('email_signups').insert({
      email: body.email.trim().toLowerCase(),
      name: body.name ? String(body.name).slice(0, 100) : null,
      persona: body.persona ?? null,
      source: 'lead-magnet',
      lead_magnet: body.lead_magnet ?? null,
      marketing_consent: body.marketing_consent === true,
      consent_timestamp: body.marketing_consent === true ? (body.consent_timestamp ?? new Date().toISOString()) : null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      utm_content: body.utm_content ?? null,
      utm_term: body.utm_term ?? null,
    }).select('id').single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Fire-and-forget email sequence trigger
    void fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/trigger-sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMAIL_TRIGGER_SECRET ?? ''}`,
      },
      body: JSON.stringify({
        type: 'lead-magnet',
        email: body.email.trim().toLowerCase(),
        name: body.name ? String(body.name).slice(0, 100) : undefined,
        persona: body.persona ?? undefined,
        signup_id: data?.id,
      }),
    }).catch(err => console.error('[email-signup] trigger-sequence failed:', err))

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Signup failed' }, { status: 500 })
  }
}
