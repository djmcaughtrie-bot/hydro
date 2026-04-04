import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { CONTENT_CONFIG } from '@/lib/content-config'

export const metadata: Metadata = { title: 'Pages' }

export default async function PagesListPage() {
  const adminClient = createAdminClient()

  // Fetch counts per page so we can show a quick status summary
  const { data: items } = await adminClient
    .from('content_items')
    .select('page, status')
    .is('persona', null)

  const counts: Record<string, Record<string, number>> = {}
  for (const item of items ?? []) {
    counts[item.page] ??= {}
    counts[item.page][item.status] = (counts[item.page][item.status] ?? 0) + 1
  }

  const pages = Object.entries(CONTENT_CONFIG)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink">Pages</h1>
        <p className="mt-1 font-sans text-sm text-ink-light">
          Edit and publish content for each page of the site.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map(([pageKey, pageConfig]) => {
          const sectionCount = Object.keys(pageConfig.sections).length
          const pageCounts = counts[pageKey] ?? {}
          const publishedCount = pageCounts['published'] ?? 0
          const draftCount = pageCounts['draft'] ?? 0
          const reviewCount = pageCounts['needs_review'] ?? 0
          return (
            <Link
              key={pageKey}
              href={`/admin/pages/${pageKey}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-teal/40 hover:shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <h2 className="font-sans text-base font-semibold text-ink group-hover:text-teal">
                  {pageConfig.label}
                </h2>
                {reviewCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-xs text-amber-800">
                    {reviewCount} review
                  </span>
                )}
              </div>

              <div className="mb-4 font-sans text-xs text-ink-light">
                {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
              </div>

              {/* Progress bar: sections filled vs total */}
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
          )
        })}
      </div>
    </div>
  )
}
