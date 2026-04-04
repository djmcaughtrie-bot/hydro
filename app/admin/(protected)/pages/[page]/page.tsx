import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CONTENT_CONFIG } from '@/lib/content-config'
import type { SectionConfig } from '@/lib/content-config'
import { PageSectionPersonaTabs } from '@/components/admin/PageSectionPersonaTabs'

// Pages where persona variants are useful
const PERSONA_PAGES = new Set(['product', 'homepage', 'about', 'clinics', 'science', 'faq'])

interface Props {
  params: Promise<{ page: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params
  const pageConfig = CONTENT_CONFIG[page as keyof typeof CONTENT_CONFIG]
  return { title: pageConfig ? `${pageConfig.label} — Pages` : 'Page editor' }
}

export type SectionItem = {
  id: string
  content_json: Record<string, unknown>
  status: string
  updated_at: string
}

// persona key used internally — null persona stored as 'general'
export type PersonaKey = 'general' | 'energy' | 'performance' | 'longevity'

export default async function PageEditorPage({ params }: Props) {
  const { page: pageKey } = await params
  const pageConfig = CONTENT_CONFIG[pageKey as keyof typeof CONTENT_CONFIG]
  if (!pageConfig) notFound()

  const supportsPersonas = PERSONA_PAGES.has(pageKey)
  const adminClient = createAdminClient()

  // Fetch all content_items for this page across all personas
  const { data: items } = await adminClient
    .from('content_items')
    .select('id, section, persona, content_json, status, updated_at')
    .eq('page', pageKey)

  // Map: section → persona → item
  const itemsBySection: Record<string, Record<PersonaKey, SectionItem | null>> = {}

  for (const item of items ?? []) {
    const personaKey: PersonaKey = (item.persona as PersonaKey) ?? 'general'
    itemsBySection[item.section] ??= { general: null, energy: null, performance: null, longevity: null }
    itemsBySection[item.section][personaKey] = {
      id: item.id,
      content_json: item.content_json as Record<string, unknown>,
      status: item.status,
      updated_at: item.updated_at,
    }
  }

  const sections = Object.entries(pageConfig.sections as Record<string, SectionConfig>)

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/pages"
          className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
        >
          ← Pages
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">{pageConfig.label}</h1>
      </div>

      <div className="space-y-4">
        {sections.map(([sectionKey, sectionConfig]) => (
          <PageSectionPersonaTabs
            key={sectionKey}
            page={pageKey}
            sectionKey={sectionKey}
            sectionConfig={sectionConfig}
            items={itemsBySection[sectionKey] ?? { general: null, energy: null, performance: null, longevity: null }}
            supportsPersonas={supportsPersonas}
          />
        ))}
      </div>
    </div>
  )
}
