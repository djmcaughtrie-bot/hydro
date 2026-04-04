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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'Body must be a JSON object' }, { status: 400 })
  }

  if (body.content_json) {
    const textContent = Object.values(body.content_json as Record<string, unknown>)
      .filter((v): v is string => typeof v === 'string')
      .join('\n')
    const result = await checkCompliance(textContent)
    if (!result.compliant) {
      return Response.json({ error: 'Compliance violation', violations: result.violations }, { status: 422 })
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.content_json !== undefined) update.content_json = body.content_json
  if (body.persona !== undefined) update.persona = body.persona ?? null
  if (body.status !== undefined && (body.status === 'draft' || body.status === 'needs_review')) {
    update.status = body.status
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('content_items')
    .update(update)
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
