import type { Study } from '@/lib/types'

const evidenceBadgeStyles: Record<Study['evidence_level'], { background: string; color: string }> = {
  Strong: { background: '#dcfce7', color: '#166534' },
  Moderate: { background: '#fef9c3', color: '#854d0e' },
  Emerging: { background: '#dbeafe', color: '#1e40af' },
}

interface StudyCardProps {
  study: Study
}

export function StudyCard({ study }: StudyCardProps) {
  const badgeStyle = evidenceBadgeStyles[study.evidence_level]

  return (
    <div className="rounded-lg border border-ink-light/20 bg-white p-5">
      {/* Badges row */}
      <div className="mb-3 flex flex-wrap gap-2">
        <span
          className="rounded px-1.5 py-0.5 font-mono text-xs font-medium"
          style={badgeStyle}
        >
          {study.evidence_level}
        </span>
        <span className="rounded bg-ink-light/10 px-1.5 py-0.5 font-mono text-xs text-ink-mid">
          {study.study_type}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-1 font-sans text-sm font-semibold leading-snug text-ink">
        {study.title}
      </h3>

      {/* Journal + year */}
      <p className="mb-3 font-mono text-xs text-ink-light">
        {[study.authors, study.journal, study.year].filter(Boolean).join(' — ')}
      </p>

      {/* Summary */}
      <p className="mb-3 font-sans text-sm leading-relaxed text-ink-mid">
        {study.summary}
      </p>

      {/* Key finding callout */}
      {study.key_finding !== null && (
        <blockquote className="mb-3 border-l-2 border-teal pl-3 font-sans text-xs italic text-ink-mid">
          {study.key_finding}
        </blockquote>
      )}

      {/* Links */}
      {(study.doi_url || study.pubmed_url) && (
        <div className="flex flex-wrap gap-4">
          {study.doi_url && (
            <a
              href={study.doi_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
            >
              DOI ↗
            </a>
          )}
          {study.pubmed_url && (
            <a
              href={study.pubmed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
            >
              PubMed ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}
