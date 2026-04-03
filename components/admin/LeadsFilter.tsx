'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'

const STATUSES = ['all', 'new', 'contacted', 'converted', 'closed'] as const

export function LeadsFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const active = searchParams.get('status') ?? 'all'

  function handleClick(status: string) {
    if (status === 'all') {
      router.push('/admin/leads')
    } else {
      router.push(`/admin/leads?status=${status}`)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map(status => (
        <button
          key={status}
          type="button"
          onClick={() => handleClick(status)}
          className={cn(
            'rounded-pill px-4 py-1.5 font-sans text-sm capitalize transition-colors',
            active === status
              ? 'bg-teal text-white'
              : 'border border-gray-200 text-ink-mid hover:border-teal/50'
          )}
        >
          {status === 'all' ? 'All' : status}
        </button>
      ))}
    </div>
  )
}
