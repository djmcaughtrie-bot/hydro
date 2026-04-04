import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SETTINGS_KEYS } from '@/lib/site-settings'

const ALLOWED_KEYS: string[] = Object.values(SETTINGS_KEYS)

const patchSchema = z.object({
  key: z.string().refine(k => ALLOWED_KEYS.includes(k), {
    message: 'Unknown settings key',
  }),
  value: z.string(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('site_settings')
    .select('key, value')
    .order('key')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { key, value } = parsed.data
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key, value }, { onConflict: 'key' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
