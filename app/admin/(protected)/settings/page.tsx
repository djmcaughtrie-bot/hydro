import type { Metadata } from 'next'
import { getFeatureFlag, SETTINGS_KEYS } from '@/lib/site-settings'
import { SettingsForm } from '@/components/admin/SettingsForm'

export const metadata: Metadata = { title: 'Settings | H2 Admin' }

export default async function SettingsPage() {
  const [winEnabled, testimonialsEnabled, leadMagnetsEnabled] = await Promise.all([
    getFeatureFlag(SETTINGS_KEYS.WIN_PAGE_ENABLED),
    getFeatureFlag(SETTINGS_KEYS.TESTIMONIALS_ENABLED),
    getFeatureFlag(SETTINGS_KEYS.LEAD_MAGNETS_ENABLED),
  ])

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Settings</h1>
        <p className="mt-1 font-sans text-sm text-ink-light">Control which pages and features are visible on the public site.</p>
      </div>
      <SettingsForm
        initialValues={{
          [SETTINGS_KEYS.WIN_PAGE_ENABLED]: winEnabled,
          [SETTINGS_KEYS.TESTIMONIALS_ENABLED]: testimonialsEnabled,
          [SETTINGS_KEYS.LEAD_MAGNETS_ENABLED]: leadMagnetsEnabled,
        }}
      />
    </>
  )
}
