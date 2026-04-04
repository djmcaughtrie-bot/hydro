import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Fetch all competitions
  const { data: competitions, error } = await adminClient
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Fetch entry counts — single query to avoid N+1
  const competitionList = competitions ?? []
  const countMap: Record<string, number> = {}
  if (competitionList.length > 0) {
    const { data: entryRows } = await adminClient
      .from('competition_entries')
      .select('competition_id')
      .in('competition_id', competitionList.map((c) => c.id))

    for (const entry of entryRows ?? []) {
      countMap[entry.competition_id] = (countMap[entry.competition_id] ?? 0) + 1
    }
  }

  const withCounts = competitionList.map((competition) => ({
    ...competition,
    entry_count: countMap[competition.id] ?? 0,
  }))

  return Response.json(withCounts)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, prize, is_active, starts_at, ends_at } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return Response.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!prize || typeof prize !== 'string' || !prize.trim()) {
    return Response.json({ error: 'Prize is required' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('competitions')
    .insert({
      title: title.trim(),
      description: description ? String(description).trim() : null,
      prize: prize.trim(),
      is_active: is_active === true,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id })
}
