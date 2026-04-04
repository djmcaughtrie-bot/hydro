import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_FIELDS = [
  'title', 'slug', 'excerpt', 'content', 'persona_tags', 'category',
  'mid_cta_headline', 'mid_cta_body', 'mid_cta_label', 'mid_cta_url',
  'bottom_cta_headline', 'bottom_cta_body', 'bottom_cta_label', 'bottom_cta_url',
  'seo_title', 'seo_description',
] as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.from('posts').select('*').eq('id', id).single()
  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('posts').update(update).eq('id', id)
  if (error) {
    if (error.code === '23505') return Response.json({ error: 'Slug already in use' }, { status: 409 })
    return Response.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/journal')
  return Response.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const adminClient = createAdminClient()

  // Fetch slug before deleting so we can revalidate
  const { data } = await adminClient.from('posts').select('slug').eq('id', id).single()

  const { error } = await adminClient.from('posts').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  revalidatePath('/journal')
  if (data?.slug) revalidatePath(`/journal/${data.slug}`)
  return Response.json({ ok: true })
}
