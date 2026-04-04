import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Gate: cannot publish without compliance + consent
  if (body.is_published === true) {
    const adminClient = createAdminClient()
    const { data: existing } = await adminClient
      .from('testimonials')
      .select('compliance_approved, consent_on_file')
      .eq('id', params.id)
      .single()

    const complianceApproved = body.compliance_approved ?? existing?.compliance_approved
    const consentOnFile = body.consent_on_file ?? existing?.consent_on_file
    if (!complianceApproved || !consentOnFile) {
      return Response.json({
        error: 'Cannot publish: compliance must be approved and consent must be on file.'
      }, { status: 422 })
    }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('testimonials')
    .update(body)
    .eq('id', params.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('testimonials')
    .delete()
    .eq('id', params.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
