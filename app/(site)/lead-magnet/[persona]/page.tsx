import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PERSONAS } from '@/lib/persona'
import type { Persona } from '@/lib/persona'

const GUIDE_META: Record<Persona, {
  title: string
  teaser: string
  finding: string
}> = {
  energy: {
    title: 'The Cellular Energy Guide',
    teaser: 'Your guide is on its way — check your inbox.',
    finding: 'Key finding: A 2025 RCT at Palacký University found 60 minutes of H₂ inhalation was associated with increased fat oxidation at rest — suggesting a potential role in metabolic energy regulation.',
  },
  performance: {
    title: 'The H₂ Recovery Protocol',
    teaser: 'Your guide is on its way — check your inbox.',
    finding: 'Key finding: Multiple RCTs report reductions in blood lactate and perceived muscle soreness markers following hydrogen inhalation in trained athletes.',
  },
  longevity: {
    title: 'The Hydrogen Therapy Research Summary',
    teaser: 'Your guide is on its way — check your inbox.',
    finding: 'Key finding: The HYBRID II trial (Lancet eClinicalMedicine, 2023) reported 46% full neurological recovery versus 21% in controls — the most cited human RCT in hydrogen research.',
  },
}

interface Props {
  params: { persona: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!PERSONAS.includes(params.persona as Persona)) return {}
  const meta = GUIDE_META[params.persona as Persona]
  return { title: meta.title }
}

export default function LeadMagnetConfirmPage({ params }: Props) {
  if (!PERSONAS.includes(params.persona as Persona)) notFound()
  const persona = params.persona as Persona
  const meta = GUIDE_META[persona]

  return (
    <div className="bg-cream min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
          You&apos;re all set
        </p>
        <h1 className="mb-4 font-display text-4xl text-ink">{meta.teaser}</h1>
        <p className="mb-8 font-sans text-sm text-ink-mid">
          While you wait — a preview of one key finding from the guide.
        </p>

        <div className="mb-10 rounded-lg border border-teal-light bg-teal-light/40 p-6 text-left">
          <p className="font-sans text-sm leading-relaxed text-ink-mid">{meta.finding}</p>
        </div>

        <p className="mb-6 font-sans text-sm text-ink-mid">
          The Science Hub has everything the guide is drawn from.
        </p>
        <Link
          href="/science"
          className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          Explore the research
        </Link>
      </div>
    </div>
  )
}
