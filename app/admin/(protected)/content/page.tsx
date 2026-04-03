import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContentLibrary } from '@/components/admin/ContentLibrary'
import { ContentGenerationFormWithRedirect } from '@/components/admin/ContentGenerationFormWithRedirect'
import type { ContentItem } from '@/lib/types'

export const metadata: Metadata = { title: 'Content | H2 Admin' }

export default async function ContentPage() {
  const supabase = createAdminClient()
  const { data: items } = await supabase
    .from('content_items')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Content generation</h1>
      </div>

      <div className="mb-8">
        <ContentGenerationFormWithRedirect />
      </div>

      <ContentLibrary items={(items ?? []) as ContentItem[]} />
    </>
  )
}
