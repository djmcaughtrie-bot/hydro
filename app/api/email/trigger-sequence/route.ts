import { z } from 'zod'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDoubleOptIn } from '@/lib/resend'

const schema = z.object({
  type: z.enum(['lead-magnet', 'competition']),
  email: z.string().email(),
  name: z.string().optional(),
  persona: z.enum(['energy', 'performance', 'longevity']).optional(),
  signup_id: z.string().uuid().optional(),
  competition_id: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  // Auth check
  const triggerSecret = process.env.EMAIL_TRIGGER_SECRET
  if (!triggerSecret) {
    console.warn('[trigger-sequence] EMAIL_TRIGGER_SECRET not set — skipping auth check in dev')
  } else {
    const authHeader = request.headers.get('Authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (bearer !== triggerSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { type, email, name, persona, signup_id } = parsed.data

  if (type === 'lead-magnet') {
    if (!signup_id) {
      return Response.json({ error: 'signup_id required for lead-magnet' }, { status: 400 })
    }

    // Send double opt-in email
    const { error: emailError } = await sendDoubleOptIn({
      email,
      name,
      persona,
      signupId: signup_id,
    })

    if (emailError) {
      console.error('[trigger-sequence] sendDoubleOptIn failed:', emailError)
      return Response.json({ error: 'Failed to send confirmation email' }, { status: 500 })
    }

    // Mark double_opt_in_sent = true
    const adminClient = createAdminClient()
    const { error: dbError } = await adminClient
      .from('email_signups')
      .update({ double_opt_in_sent: true })
      .eq('id', signup_id)

    if (dbError) {
      console.error('[trigger-sequence] failed to set double_opt_in_sent:', dbError)
      // Non-fatal — email was sent; log and continue
    }

    return Response.json({ success: true })
  }

  if (type === 'competition') {
    const audienceId = process.env.RESEND_AUDIENCE_ID_COMPETITION
    if (!audienceId) {
      console.warn('[trigger-sequence] RESEND_AUDIENCE_ID_COMPETITION not set — skipping audience add')
      return Response.json({ success: true, skipped: 'no_audience_id' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    try {
      await resend.contacts.create({
        audienceId,
        email,
        firstName: name ?? undefined,
        unsubscribed: false,
      })
    } catch (err) {
      console.error('[trigger-sequence] resend.contacts.create failed:', err)
      return Response.json({ error: 'Failed to add to audience' }, { status: 500 })
    }

    return Response.json({ success: true })
  }

  return Response.json({ error: 'Unknown type' }, { status: 400 })
}
