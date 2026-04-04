import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const adminClient = createAdminClient()

  const { data: post } = await adminClient.from('posts').select('slug').eq('id', id).single()
  if (!post) return Response.json({ error: 'Not found' }, { status: 404 })

  const { error } = await adminClient
    .from('posts')
    .update({ is_published: true, published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  revalidatePath('/journal')
  revalidatePath(`/journal/${post.slug}`)
  return Response.json({ ok: true })
}
