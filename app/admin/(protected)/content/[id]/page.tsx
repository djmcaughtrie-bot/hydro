import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContentEditForm } from '@/components/admin/ContentEditForm'
import { CONTENT_CONFIG } from '@/lib/content-config'
import type { ContentItem } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('content_items')
    .select('page, section')
    .eq('id', id)
    .single()
  if (!data) return { title: 'Edit content | H2 Admin' }
  const pageConfig = CONTENT_CONFIG[data.page as keyof typeof CONTENT_CONFIG]
  const pageLabel = pageConfig?.label ?? data.page
  const sections = pageConfig?.sections as Record<string, { label: string }> | undefined
  const sectionLabel = sections?.[data.section]?.label ?? data.section
  return { title: `${pageLabel} / ${sectionLabel} | H2 Admin` }
}

export default async function ContentEditPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: item } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single()

  if (!item) notFound()

  return (
    <div className="max-w-4xl">
      <ContentEditForm item={item as ContentItem} />
    </div>
  )
}
