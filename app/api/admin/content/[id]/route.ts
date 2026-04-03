import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCompliance } from '@/lib/compliance'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  if (body.content_json) {
    const textFields = Object.fromEntries(
      Object.entries(body.content_json as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'string')
    ) as Record<string, string>
    const result = checkCompliance(textFields)
    if (!result.pass) {
      return Response.json({ error: 'Compliance violation', violations: result.violations }, { status: 422 })
    }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('content_items')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
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

  const { error } = await adminClient.from('content_items').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
