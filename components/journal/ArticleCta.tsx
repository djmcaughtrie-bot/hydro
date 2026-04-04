import Link from 'next/link'

interface Props {
  headline?: string | null
  body?: string | null
  label?: string | null
  url?: string | null
  variant?: 'mid' | 'bottom'
}

export function ArticleCta({ headline, body, label, url, variant = 'mid' }: Props) {
  if (!headline && !label) return null

  if (variant === 'bottom') {
    return (
      <section className="mt-16 rounded-xl bg-ink px-8 py-10 text-center">
        {headline && (
          <h2 className="mb-3 font-display text-3xl text-white">{headline}</h2>
        )}
        {body && (
          <p className="mx-auto mb-6 max-w-md font-sans text-sm text-ink-light">{body}</p>
        )}
        {label && url && (
          <Link
            href={url}
            className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
          >
            {label}
          </Link>
        )}
      </section>
    )
  }

  return (
    <div className="my-8 rounded-lg border-l-4 border-teal bg-teal-light px-6 py-5">
      {headline && (
        <p className="mb-1 font-display text-xl text-ink">{headline}</p>
      )}
      {body && (
        <p className="mb-4 font-sans text-sm text-ink-mid">{body}</p>
      )}
      {label && url && (
        <Link
          href={url}
          className="inline-flex items-center font-mono text-xs uppercase tracking-widest text-teal transition-colors hover:text-teal-dark"
        >
          {label} &rarr;
        </Link>
      )}
    </div>
  )
}
