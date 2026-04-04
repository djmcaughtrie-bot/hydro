import { createClient } from '@/lib/supabase/server'
import type { Testimonial } from '@/lib/types'
import { getFeatureFlag, SETTINGS_KEYS } from '@/lib/site-settings'

// Fetch published testimonials for a given placement tag, optionally filtered by persona.
// RLS policy handles published + compliance_approved + consent_on_file filtering.
export async function getTestimonials(
  placement: string,
  persona?: string | null
): Promise<Testimonial[]> {
  const enabled = await getFeatureFlag(SETTINGS_KEYS.TESTIMONIALS_ENABLED)
  if (!enabled) return []

  const supabase = await createClient()
  let query = supabase
    .from('testimonials')
    .select('*')
    .contains('placement', [placement])
    .order('created_at', { ascending: false })
  if (persona) query = query.eq('persona', persona)
  const { data, error } = await query
  if (error) console.error('[getTestimonials] Supabase error:', error)
  return (data ?? []) as Testimonial[]
}
