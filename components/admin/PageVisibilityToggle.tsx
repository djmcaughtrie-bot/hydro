'use client'

import { useState, useTransition } from 'react'

interface Props {
  pageKey: string
  initialHidden: boolean
}

export function PageVisibilityToggle({ pageKey, initialHidden }: Props) {
  const [hidden, setHidden] = useState(initialHidden)
  const [isPending, startTransition] = useTransition()

  async function toggle(e: React.MouseEvent) {
    e.preventDefault() // prevent the Link click from firing
    const next = !hidden
    startTransition(async () => {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `page_hidden_${pageKey}`, value: String(next) }),
      })
      setHidden(next)
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title={hidden ? 'Page hidden — click to show' : 'Page visible — click to hide'}
      className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs transition-colors ${
        hidden
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      } disabled:opacity-50`}
    >
      {isPending ? '…' : hidden ? 'Hidden' : 'Live'}
    </button>
  )
}
