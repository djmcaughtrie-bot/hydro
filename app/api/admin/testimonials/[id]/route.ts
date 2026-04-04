import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    name, location, persona, format, quote_short, quote_full,
    video_url, source, rating, compliance_approved, consent_on_file,
    is_published, placement,
  } = body

  const adminClient = createAdminClient()

  // Gate: cannot publish without compliance + consent
  if (is_published === true) {
    const { data: existing } = await adminClient
      .from('testimonials')
      .select('compliance_approved, consent_on_file')
      .eq('id', params.id)
      .single()

    const complianceApprovedFinal = compliance_approved ?? existing?.compliance_approved
    const consentOnFileFinal = consent_on_file ?? existing?.consent_on_file
    if (!complianceApprovedFinal || !consentOnFileFinal) {
      return Response.json({
        error: 'Cannot publish: compliance must be approved and consent must be on file.'
      }, { status: 422 })
    }
  }

  const { error } = await adminClient
    .from('testimonials')
    .update({
      name, location, persona, format, quote_short, quote_full,
      video_url, source, rating, compliance_approved, consent_on_file,
      is_published, placement,
    })
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
