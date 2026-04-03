import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCompliance } from '@/lib/compliance'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const adminClient = createAdminClient()

  const { data: item, error: fetchError } = await adminClient
    .from('content_items')
    .select('id, content_json')
    .eq('id', id)
    .single()

  if (fetchError || !item) return Response.json({ error: 'Not found' }, { status: 404 })

  const textFields = Object.fromEntries(
    Object.entries(item.content_json as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'string')
  ) as Record<string, string>

  const result = checkCompliance(textFields)
  if (!result.pass) {
    return Response.json({ error: 'Compliance violation', violations: result.violations }, { status: 422 })
  }

  const { error: updateError } = await adminClient
    .from('content_items')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })
  return Response.json({ ok: true })
}
