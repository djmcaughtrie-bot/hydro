type LeadStatus = 'new' | 'contacted' | 'converted' | 'closed'

const statusConfig: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new:       { label: 'New',       bg: 'bg-amber-100', text: 'text-amber-800' },
  contacted: { label: 'Contacted', bg: 'bg-blue-100',  text: 'text-blue-800'  },
  converted: { label: 'Converted', bg: 'bg-green-100', text: 'text-green-800' },
  closed:    { label: 'Closed',    bg: 'bg-gray-100',  text: 'text-gray-600'  },
}

interface LeadStatusBadgeProps {
  status: LeadStatus
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const { label, bg, text } = statusConfig[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}
