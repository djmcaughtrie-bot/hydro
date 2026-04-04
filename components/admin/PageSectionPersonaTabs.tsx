'use client'

import { useState } from 'react'
import type { SectionConfig } from '@/lib/content-config'
import type { SectionItem, PersonaKey } from '@/app/admin/(protected)/pages/[page]/page'
import { PageSectionEditor } from './PageSectionEditor'
import { PageSectionListEditor } from './PageSectionListEditor'

interface Props {
  page: string
  sectionKey: string
  sectionConfig: SectionConfig
  items: Record<PersonaKey, SectionItem | null>
  supportsPersonas: boolean
}

const TABS: { key: PersonaKey; label: string; color?: string }[] = [
  { key: 'general',     label: 'General' },
  { key: 'energy',      label: 'Energy',      color: 'text-purple-600' },
  { key: 'performance', label: 'Performance', color: 'text-blue-600' },
  { key: 'longevity',   label: 'Longevity',   color: 'text-green-700' },
]

const STATUS_DOT: Record<string, string> = {
  published:    '● ',
  draft:        '○ ',
  needs_review: '⚠ ',
}

export function PageSectionPersonaTabs({ page, sectionKey, sectionConfig, items, supportsPersonas }: Props) {
  const [activeTab, setActiveTab] = useState<PersonaKey>('general')

  // List sections (e.g. FAQs) use a dedicated multi-item editor, no persona tabs
  if (sectionConfig.list) {
    return (
      <PageSectionListEditor
        page={page}
        sectionKey={sectionKey}
        sectionConfig={sectionConfig}
        existingItem={items.general}
        persona={null}
      />
    )
  }

  if (!supportsPersonas) {
    // No tabs — just render the general editor directly
    return (
      <PageSectionEditor
        page={page}
        sectionKey={sectionKey}
        sectionConfig={sectionConfig}
        existingItem={items.general}
        persona={null}
      />
    )
  }

  const visibleTabs = TABS

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Section header with tabs */}
      <div className="border-b border-gray-100 px-5 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-sm font-semibold text-ink">{sectionConfig.label}</span>
          {/* Quick status overview */}
          <div className="flex items-center gap-3">
            {TABS.map(({ key, label, color }) => {
              const item = items[key]
              if (!item) return null
              return (
                <span key={key} className={`font-mono text-xs ${color ?? 'text-ink-light'}`}>
                  {STATUS_DOT[item.status] ?? ''}{label}
                </span>
              )
            })}
          </div>
        </div>

        {/* Tab row */}
        <div className="flex gap-1">
          {visibleTabs.map(({ key, label, color }) => {
            const item = items[key]
            const isActive = activeTab === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-t px-3 py-1.5 font-sans text-xs font-medium transition-colors ${
                  isActive
                    ? `border-b-2 border-teal bg-gray-50 ${color ?? 'text-ink'}`
                    : `${color ?? 'text-ink-light'} hover:text-ink`
                }`}
              >
                {label}
                {item && (
                  <span className="ml-1 font-mono text-[10px] opacity-60">
                    {item.status === 'published' ? '●' : item.status === 'draft' ? '○' : '⚠'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active tab editor — no outer card border since we're inside one already */}
      <div className="px-5 py-5">
        <PageSectionEditor
          key={`${sectionKey}-${activeTab}`}
          page={page}
          sectionKey={sectionKey}
          sectionConfig={sectionConfig}
          existingItem={items[activeTab]}
          persona={activeTab === 'general' ? null : activeTab}
          embedded
        />
      </div>
    </div>
  )
}
