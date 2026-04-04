const items = [
  { label: '1,000+ peer-reviewed studies', description: 'Research-backed' },
  { label: 'UK-based', description: 'Designed and supported in Britain' },
  { label: '2-year warranty', description: 'Full UK coverage' },
  { label: 'CE certified', description: 'Safety certified' },
]

export function TrustBar() {
  return (
    <div className="bg-ink py-6">
      <div className="mx-auto max-w-6xl px-6">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map(({ label, description }) => (
            <li key={label} className="text-center">
              <p className="font-mono text-sm font-medium text-teal">{label}</p>
              <p className="mt-0.5 font-sans text-xs text-ink-light">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
