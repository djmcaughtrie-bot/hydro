import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const POST_FIELDS = [
  'title', 'slug', 'excerpt', 'content', 'persona_tags', 'category',
  'mid_cta_headline', 'mid_cta_body', 'mid_cta_label', 'mid_cta_url',
  'bottom_cta_headline', 'bottom_cta_body', 'bottom_cta_label', 'bottom_cta_url',
  'seo_title', 'seo_description',
] as const

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.title || !body.slug) {
    return Response.json({ error: 'title and slug are required' }, { status: 400 })
  }

  const insert: Record<string, unknown> = {}
  for (const key of POST_FIELDS) {
    if (body[key] !== undefined) insert[key] = body[key]
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('posts')
    .insert(insert)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return Response.json({ error: 'Slug already in use' }, { status: 409 })
    return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json({ id: data.id }, { status: 201 })
}
