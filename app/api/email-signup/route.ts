import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, persona, lead_magnet, marketing_consent, consent_timestamp,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from('email_signups').insert({
      email: email.trim().toLowerCase(),
      name: name ? String(name).slice(0, 100) : null,
      persona: persona ?? null,
      source: 'lead-magnet',
      lead_magnet: lead_magnet ?? null,
      marketing_consent: marketing_consent === true,
      consent_timestamp: marketing_consent === true ? (consent_timestamp ?? new Date().toISOString()) : null,
      utm_source: utm_source ?? null,
      utm_medium: utm_medium ?? null,
      utm_campaign: utm_campaign ?? null,
      utm_content: utm_content ?? null,
      utm_term: utm_term ?? null,
    })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Signup failed' }, { status: 500 })
  }
}
