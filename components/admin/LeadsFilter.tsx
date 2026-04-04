'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'

const STATUSES = ['all', 'new', 'contacted', 'converted', 'closed'] as const

interface Props { activeStatus?: string }

export function LeadsFilter({ activeStatus }: Props) {
  const router = useRouter()
  const active = activeStatus ?? 'all'

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
