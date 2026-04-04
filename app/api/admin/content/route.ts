import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CONTENT_CONFIG } from '@/lib/content-config'
import type { SectionConfig } from '@/lib/content-config'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { page, section, persona = null, content_json = {} } = body as {
    page: string
    section: string
    persona?: string | null
    content_json?: Record<string, unknown>
  }

  const pageConfig = CONTENT_CONFIG[page as keyof typeof CONTENT_CONFIG]
  const sectionConfig = (pageConfig?.sections as Record<string, SectionConfig> | undefined)?.[section]
  if (!sectionConfig) return Response.json({ error: 'Invalid page/section' }, { status: 400 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('content_items')
    .insert({
      page,
      section,
      persona: persona ?? null,
      content_type: sectionConfig.contentType,
      content_json,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id }, { status: 201 })
}
