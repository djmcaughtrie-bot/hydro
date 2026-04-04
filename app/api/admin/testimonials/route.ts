import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    name, location, persona, format, quote_short, quote_full,
    video_url, source, rating, compliance_approved, consent_on_file,
    is_published, placement,
  } = body

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('testimonials')
    .insert({
      name, location, persona, format, quote_short, quote_full,
      video_url, source, rating, compliance_approved, consent_on_file,
      is_published, placement,
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id })
}
