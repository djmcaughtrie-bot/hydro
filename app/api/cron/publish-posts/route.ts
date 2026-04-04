import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// Vercel calls this with the CRON_SECRET in the Authorization header.
// On hobby plans Vercel omits the header — we still guard with the env var when present.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // Find posts whose scheduled time has passed and haven't been published yet
  const { data: due, error } = await adminClient
    .from('posts')
    .select('id, slug')
    .eq('is_published', false)
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', now)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!due || due.length === 0) return Response.json({ published: 0 })

  const { error: updateError } = await adminClient
    .from('posts')
    .update({ is_published: true, published_at: now, updated_at: now })
    .in('id', due.map(p => p.id))

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  revalidatePath('/journal')
  for (const post of due) {
    revalidatePath(`/journal/${post.slug}`)
  }

  return Response.json({ published: due.length, slugs: due.map(p => p.slug) })
}
