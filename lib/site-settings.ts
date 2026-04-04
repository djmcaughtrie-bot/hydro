import { createAdminClient } from '@/lib/supabase/admin'

// Feature flag keys used across the app
export const SETTINGS_KEYS = {
  WIN_PAGE_ENABLED: 'page_win_enabled',
  TESTIMONIALS_ENABLED: 'feature_testimonials_enabled',
  LEAD_MAGNETS_ENABLED: 'feature_lead_magnets_enabled',
} as const

export type SettingKey = typeof SETTINGS_KEYS[keyof typeof SETTINGS_KEYS]

// Read a single setting. Returns null if not set.
export async function getSetting(key: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? null
}

// Read a boolean feature flag. Defaults to true if not set (opt-out model).
export async function getFeatureFlag(key: string): Promise<boolean> {
  const value = await getSetting(key)
  if (value === null) return true   // not set = enabled by default
  return value === 'true'
}

// Write a setting (upsert).
export async function setSetting(key: string, value: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('site_settings')
    .upsert({ key, value }, { onConflict: 'key' })
}
