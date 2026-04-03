import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { id: string; sort_order: number }[]
  const adminClient = createAdminClient()

  await Promise.all(
    body.map(({ id, sort_order }) =>
      adminClient.from('studies').update({ sort_order }).eq('id', id)
    )
  )

  return Response.json({ ok: true })
}
