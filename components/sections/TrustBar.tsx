const DEFAULTS = [
  { label: '1,000+ peer-reviewed studies', description: 'Research-backed' },
  { label: 'UK-based',                     description: 'Designed and supported in Britain' },
  { label: '2-year warranty',              description: 'Full UK coverage' },
  { label: 'CE certified',                 description: 'Safety certified' },
]

interface TrustBarContent {
  item1_label?: string; item1_description?: string
  item2_label?: string; item2_description?: string
  item3_label?: string; item3_description?: string
  item4_label?: string; item4_description?: string
}

interface Props { content?: TrustBarContent }

export function TrustBar({ content }: Props) {
  const items = content ? [
    { label: content.item1_label ?? DEFAULTS[0].label, description: content.item1_description ?? DEFAULTS[0].description },
    { label: content.item2_label ?? DEFAULTS[1].label, description: content.item2_description ?? DEFAULTS[1].description },
    { label: content.item3_label ?? DEFAULTS[2].label, description: content.item3_description ?? DEFAULTS[2].description },
    { label: content.item4_label ?? DEFAULTS[3].label, description: content.item4_description ?? DEFAULTS[3].description },
  ] : DEFAULTS

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
