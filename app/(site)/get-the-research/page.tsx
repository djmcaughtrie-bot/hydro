import { redirect } from 'next/navigation'
import { getFeatureFlag, SETTINGS_KEYS } from '@/lib/site-settings'
import { GetTheResearchClient } from '@/components/GetTheResearchClient'

export default async function GetTheResearchPage() {
  const enabled = await getFeatureFlag(SETTINGS_KEYS.LEAD_MAGNETS_ENABLED)
  if (!enabled) redirect('/')
  return <GetTheResearchClient />
}
