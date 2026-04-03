import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface NoteEntry {
  text: string
  created_at: string
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json() as { status?: string; note?: string }
  const adminClient = createAdminClient()

  if (body.status) {
    const { error } = await adminClient
      .from('leads')
      .update({ status: body.status })
      .eq('id', id)
    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  }

  if (body.note) {
    const { data: lead, error: fetchError } = await adminClient
      .from('leads')
      .select('notes')
      .eq('id', id)
      .single()

    if (fetchError) {
      return Response.json({ error: fetchError.message }, { status: 500 })
    }

    const existing: NoteEntry[] = JSON.parse(lead?.notes ?? '[]')
    const updated: NoteEntry[] = [
      { text: body.note, created_at: new Date().toISOString() },
      ...existing,
    ]

    const { error: updateError } = await adminClient
      .from('leads')
      .update({ notes: JSON.stringify(updated) })
      .eq('id', id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 })
    }
  }

  return Response.json({ ok: true })
}
