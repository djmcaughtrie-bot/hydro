import { StudyCard } from '@/components/science/StudyCard'
import type { Persona } from '@/lib/persona'
import type { PersonaPageContent, StudyReference } from '@/lib/persona-page-content'
import type { Study } from '@/lib/types'

interface Props {
  persona: Persona
  studies: PersonaPageContent['studies']
  scienceLink: PersonaPageContent['scienceLink']
}

const eyebrowClass: Record<Persona, string> = {
  energy: 'text-persona-energy',
  performance: 'text-persona-performance',
  longevity: 'text-persona-longevity',
}

function studyReferenceToStudy(ref: StudyReference, index: number): Study {
  return {
    id: String(index),
    title: ref.title,
    authors: null,
    journal: ref.citation,
    year: null,
    summary: ref.summary,
    key_finding: null,
    study_type: ref.studyType,
    evidence_level: ref.evidenceLevel,
    categories: [],
    doi_url: ref.doiUrl,
    pubmed_url: ref.pubmedUrl,
    is_featured: false,
    is_published: true,
    sort_order: index,
  }
}

export function PersonaPageEvidence({ persona, studies, scienceLink }: Props) {
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-5xl px-6">
        <p className={`mb-4 font-mono text-xs uppercase tracking-widest ${eyebrowClass[persona]}`}>
          The evidence
        </p>
        <h2 className="mb-8 font-display text-3xl text-ink">
          What the research shows.
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {studies.map((ref, index) => (
            <StudyCard key={index} study={studyReferenceToStudy(ref, index)} />
          ))}
        </div>
        <div className="mt-8">
          <a
            href={scienceLink.href}
            className="font-mono text-xs uppercase tracking-widest text-teal transition-colors hover:text-teal-dark"
          >
            {scienceLink.label} →
          </a>
        </div>
      </div>
    </section>
  )
}
