import { createClient } from '@/lib/supabase/server'

export type PageContent = Record<string, Record<string, unknown>>

export async function getPageContent(
  page: string,
  sections: string[],
  persona: string | null
): Promise<PageContent> {
  const supabase = await createClient()

  const baseQuery = supabase
    .from('content_items')
    .select('section, persona, content_json')
    .eq('page', page)
    .eq('status', 'published')
    .in('section', sections)

  const { data } = persona
    ? await baseQuery.or(`persona.eq.${persona},persona.is.null`)
    : await baseQuery.is('persona', null)

  if (!data || data.length === 0) return {}

  const result: PageContent = {}

  // First pass: general rows (persona IS NULL)
  for (const row of data) {
    if (row.persona === null) {
      result[row.section] = row.content_json as Record<string, unknown>
    }
  }

  // Second pass: persona-specific rows override general
  if (persona) {
    for (const row of data) {
      if (row.persona === persona) {
        result[row.section] = row.content_json as Record<string, unknown>
      }
    }
  }

  return result
}
