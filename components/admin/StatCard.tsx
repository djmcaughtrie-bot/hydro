import Link from 'next/link'

interface StatCardProps {
  label: string
  count: number
  href: string
}

export function StatCard({ label, count, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-teal/50"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-ink-light">{label}</p>
      <p className="mt-2 font-display text-4xl text-ink">{count}</p>
    </Link>
  )
}
