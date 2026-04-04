import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  competition_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  marketing_consent: z.boolean().default(false),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const {
      competition_id,
      name,
      email,
      marketing_consent,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    } = parsed.data

    // Check competition exists and is active (public client — RLS handles this)
    const publicClient = await createClient()
    const { data: competition, error: competitionError } = await publicClient
      .from('competitions')
      .select('id, is_active')
      .eq('id', competition_id)
      .eq('is_active', true)
      .single()

    if (competitionError || !competition) {
      return Response.json(
        { error: 'Competition not found or not active' },
        { status: 404 }
      )
    }

    // Insert entry using admin client
    const adminClient = createAdminClient()
    const { error: insertError } = await adminClient
      .from('competition_entries')
      .insert({
        competition_id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        marketing_consent,
        consent_timestamp: marketing_consent ? new Date().toISOString() : null,
        utm_source: utm_source ?? null,
        utm_medium: utm_medium ?? null,
        utm_campaign: utm_campaign ?? null,
        utm_content: utm_content ?? null,
        utm_term: utm_term ?? null,
      })

    if (insertError) {
      // Unique constraint violation — already entered
      if (insertError.code === '23505') {
        return Response.json({ error: 'already_entered' }, { status: 409 })
      }
      return Response.json({ error: insertError.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Entry failed' }, { status: 500 })
  }
}
