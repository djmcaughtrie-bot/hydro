import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { CONTENT_CONFIG } from '@/lib/content-config'
import { PageVisibilityToggle } from '@/components/admin/PageVisibilityToggle'

export const metadata: Metadata = { title: 'Pages' }

export default async function PagesListPage() {
  const adminClient = createAdminClient()

  const [{ data: items }, { data: settings }] = await Promise.all([
    adminClient.from('content_items').select('page, status').is('persona', null),
    adminClient.from('site_settings').select('key, value').like('key', 'page_hidden_%'),
  ])

  const counts: Record<string, Record<string, number>> = {}
  for (const item of items ?? []) {
    counts[item.page] ??= {}
    counts[item.page][item.status] = (counts[item.page][item.status] ?? 0) + 1
  }

  const hiddenMap: Record<string, boolean> = {}
  for (const s of settings ?? []) {
    const pageKey = s.key.replace('page_hidden_', '')
    hiddenMap[pageKey] = s.value === 'true'
  }

  const pages = Object.entries(CONTENT_CONFIG)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink">Pages</h1>
        <p className="mt-1 font-sans text-sm text-ink-light">
          Edit content and control visibility for each page of the site.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map(([pageKey, pageConfig]) => {
          const sectionCount = Object.keys(pageConfig.sections).length
          const pageCounts = counts[pageKey] ?? {}
          const publishedCount = pageCounts['published'] ?? 0
          const draftCount = pageCounts['draft'] ?? 0
          const reviewCount = pageCounts['needs_review'] ?? 0
          const isHidden = hiddenMap[pageKey] ?? false

          return (
            <div key={pageKey} className="relative">
              <Link
                href={`/admin/pages/${pageKey}`}
                className="group block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-teal/40 hover:shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="font-sans text-base font-semibold text-ink group-hover:text-teal">
                    {pageConfig.label}
                  </h2>
                  <div className="flex shrink-0 items-center gap-2">
                    {reviewCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-xs text-amber-800">
                        {reviewCount} review
                      </span>
                    )}
                    <PageVisibilityToggle pageKey={pageKey} initialHidden={isHidden} />
                  </div>
                </div>

                <div className="mb-4 font-sans text-xs text-ink-light">
                  {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
                </div>

                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-teal transition-all"
                    style={{ width: `${sectionCount > 0 ? Math.min(100, (publishedCount / sectionCount) * 100) : 0}%` }}
                  />
                </div>

                <div className="flex justify-between font-mono text-xs text-ink-light">
                  <span>{publishedCount}/{sectionCount} published</span>
                  {draftCount > 0 && <span className="text-amber-600">{draftCount} draft</span>}
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
