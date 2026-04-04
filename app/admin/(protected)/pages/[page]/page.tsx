import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CONTENT_CONFIG } from '@/lib/content-config'
import type { SectionConfig } from '@/lib/content-config'
import { PageSectionEditor } from '@/components/admin/PageSectionEditor'

interface Props {
  params: Promise<{ page: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params
  const pageConfig = CONTENT_CONFIG[page as keyof typeof CONTENT_CONFIG]
  return { title: pageConfig ? `${pageConfig.label} — Pages` : 'Page editor' }
}

export default async function PageEditorPage({ params }: Props) {
  const { page: pageKey } = await params
  const pageConfig = CONTENT_CONFIG[pageKey as keyof typeof CONTENT_CONFIG]
  if (!pageConfig) notFound()

  const adminClient = createAdminClient()

  // Fetch all general (persona=null) content_items for this page
  const { data: items } = await adminClient
    .from('content_items')
    .select('id, section, persona, content_json, status, updated_at')
    .eq('page', pageKey)
    .is('persona', null)

  // Map section key → content_item
  const itemsBySection: Record<string, {
    id: string
    content_json: Record<string, unknown>
    status: string
    updated_at: string
  }> = {}

  for (const item of items ?? []) {
    itemsBySection[item.section] = {
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
          <PageSectionEditor
            key={sectionKey}
            page={pageKey}
            sectionKey={sectionKey}
            sectionConfig={sectionConfig}
            existingItem={itemsBySection[sectionKey] ?? null}
          />
        ))}
      </div>
    </div>
  )
}
