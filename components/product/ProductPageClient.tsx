'use client'

import { EnquiryForm } from '@/components/forms/EnquiryForm'
import { Accordion } from '@/components/ui/Accordion'
import { PersonaSelector } from '@/components/PersonaSelector'
import { usePersona } from '@/hooks/usePersona'
import { PERSONAS } from '@/lib/persona'
import type { Persona } from '@/lib/persona'

// Per-persona hero/tab copy
type PersonaKey = Persona | 'general'

const PERSONA_COPY: Record<PersonaKey, {
  heroHeadline: string
  heroParagraph: string
  ctaLabel: string
  tabContent: string
}> = {
  energy: {
    heroHeadline: "What if the reason nothing's working isn't you?",
    heroParagraph: "Molecular hydrogen may support mitochondrial efficiency and cellular energy at the source — without stimulants, without the crash. Research suggests it targets oxidative stress where energy is actually made.",
    ctaLabel: "Explore what might help",
    tabContent: "Molecular hydrogen has been studied for its potential effects on mitochondrial efficiency and cognitive function. Research suggests it may support mental clarity and sustained energy levels by addressing oxidative stress at the cellular level — without the stimulant effects of caffeine.",
  },
  performance: {
    heroHeadline: "600ml/min. The recovery tool serious athletes haven't found yet.",
    heroParagraph: "99.99% purity. Up to 1,200 ppb. Inhaled directly — the fastest path to systemic absorption. Athletes exploring H₂ report faster perceived recovery and reduced post-exercise inflammation markers.",
    ctaLabel: "See the full spec",
    tabContent: "Athletes exploring molecular hydrogen report faster perceived recovery and reduced post-exercise inflammation markers. Studies suggest it may support the body's natural antioxidant response after intense training, potentially reducing muscle soreness and improving readiness for the next session.",
  },
  longevity: {
    heroHeadline: "The most interesting thing isn't what it does. It's how it decides what to target.",
    heroParagraph: "Molecular hydrogen is a selective antioxidant — it neutralises only the most harmful free radicals, leaving beneficial reactive oxygen species intact. Research explores its role in Nrf2 activation, cardiovascular health, and cellular ageing.",
    ctaLabel: "Read the research case",
    tabContent: "Oxidative stress is one of the primary drivers of cellular ageing. Molecular hydrogen is a selective antioxidant — it targets only the most harmful free radicals, leaving beneficial reactive oxygen species intact. Research explores its potential role in supporting long-term cellular health.",
  },
  general: {
    heroHeadline: "Breathe the science.",
    heroParagraph: "H\u2082 concentration up to 1,200\u00a0ppb. Session length 20\u201360 minutes. CE certified.",
    ctaLabel: "Enquire now",
    tabContent: "Molecular hydrogen has been studied for its potential effects on mitochondrial efficiency and cognitive function. Research suggests it may support mental clarity and sustained energy levels by addressing oxidative stress at the cellular level — without the stimulant effects of caffeine.",
  },
}

const OUTCOMES_LABELS: Record<Persona, string> = {
  energy:      'Energy',
  performance: 'Performance',
  longevity:   'Longevity',
}

const specRows: [string, string][] = [
  ['Flow rate', '600ml/min'],
  ['H\u2082 concentration', 'Up to 1,200 ppb'],
  ['H\u2082 purity', '\u226599.99%'],
  ['Session length', '20\u201360 minutes'],
  ['Water per session', '~250ml'],
  ['Certifications', 'CE, RoHS'],
  ['Warranty', '2 years (UK)'],
]

const productFaqs = [
  { question: 'Do I need any special setup?', answer: 'No. The device requires only water and a standard UK power outlet. Simply fill the chamber, switch on, and breathe.' },
  { question: 'How often should I use it?', answer: 'Most users complete one 20\u201360 minute session daily. The device can be used morning or evening to suit your routine.' },
  { question: 'What water should I use?', answer: 'We recommend distilled or filtered water for optimal hydrogen concentration and to maintain device longevity.' },
  { question: 'Is it safe to use every day?', answer: 'Research studies involving daily hydrogen inhalation have reported no adverse effects. As with any wellness practice, consult your healthcare provider if you have an existing medical condition.' },
  { question: 'How quickly will I notice results?', answer: 'Individual experiences vary. Some users report changes within days; others over weeks. We recommend consistent daily use for at least 30 days before assessing.' },
]

interface Props {
  // CMS overrides (from content_items, may be empty)
  cmsHeroHeadline?: string
  cmsHeroBody?: string
  cmsHeroCta?: string
  cmsHowItWorksHeadline?: string
  cmsCtaHeadline?: string
  cmsCtaSubheading?: string
}

export function ProductPageClient({
  cmsHeroHeadline,
  cmsHeroBody,
  cmsHeroCta,
  cmsHowItWorksHeadline,
  cmsCtaHeadline,
  cmsCtaSubheading,
}: Props) {
  const { persona } = usePersona()
  const key: PersonaKey = persona ?? 'general'
  const copy = PERSONA_COPY[key]

  // CMS content overrides persona copy when set
  const heroHeadline = cmsHeroHeadline ?? copy.heroHeadline
  const heroBody = cmsHeroBody ?? copy.heroParagraph
  const heroCta = cmsHeroCta ?? copy.ctaLabel
  const ctaHeadline = cmsCtaHeadline ?? 'Enquire about the device.'
  const ctaSubheading = cmsCtaSubheading ?? "We\u2019re taking enquiries ahead of our UK launch. Tell us about yourself and we\u2019ll be in touch."

  return (
    <div>
      {/* Hero */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="order-2 flex aspect-[4/5] items-center justify-center rounded-lg bg-ink-mid/30 md:order-1">
              <span className="font-sans text-sm text-ink-light">Product image</span>
            </div>
            <div className="order-1 md:order-2">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">The device</p>
              <h1 className="mb-4 font-display text-5xl leading-tight text-white">{heroHeadline}</h1>
              <p className="mb-6 font-sans text-base text-ink-light">{heroBody}</p>
              <PersonaSelector />
              <div className="mt-4">
                <a
                  href="#enquiry"
                  className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
                >
                  {heroCta}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes tabs */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">What the research explores</p>
          <div className="mb-8 flex flex-wrap gap-2">
            {PERSONAS.map((key) => (
              <span
                key={key}
                className={`rounded-pill border px-5 py-2 font-sans text-sm font-medium ${
                  persona === key
                    ? 'border-teal bg-teal text-white'
                    : 'border-ink-light/30 text-ink-mid'
                }`}
              >
                {OUTCOMES_LABELS[key]}
              </span>
            ))}
          </div>
          <p className="max-w-2xl font-sans text-base leading-relaxed text-ink-mid">{copy.tabContent}</p>
        </div>
      </section>

      {/* Spec table */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">Technical specification</p>
          <div className="max-w-lg overflow-hidden rounded-lg border border-ink-light/20">
            <table className="w-full">
              <tbody>
                {specRows.map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? 'bg-cream/50' : 'bg-white'}>
                    <td className="px-4 py-3 font-sans text-sm font-medium text-ink">{label}</td>
                    <td className="px-4 py-3 font-sans text-sm text-ink-mid">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-10 font-mono text-xs uppercase tracking-widest text-teal">
            {cmsHowItWorksHeadline ?? 'How it works'}
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { n: 1, title: 'Fill',    body: 'Fill the chamber with distilled or filtered water.' },
              { n: 2, title: 'Breathe', body: 'Breathe the hydrogen-enriched air through the included nasal cannula.' },
              { n: 3, title: 'Feel',    body: 'Complete your session in 20\u201360 minutes. Use daily for best results.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex flex-col items-start">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-teal font-mono text-sm font-bold text-white">{n}</div>
                <p className="mb-2 font-display text-xl text-ink">{title}</p>
                <p className="font-sans text-sm leading-relaxed text-ink-mid">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry form */}
      <section id="enquiry" className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Get in touch</p>
              <h2 className="mb-4 font-display text-4xl text-white">{ctaHeadline}</h2>
              <p className="font-sans text-sm text-ink-light">{ctaSubheading}</p>
            </div>
            <div>
              <EnquiryForm source="product" defaultPersona={persona ?? undefined} />
              <p className="mt-4 font-sans text-xs leading-relaxed text-ink-light/60">
                These statements have not been evaluated by the MHRA. This product is not intended to diagnose, treat, cure, or prevent any disease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product FAQ */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-2xl px-6">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Questions</p>
          <h2 className="mb-8 font-display text-3xl text-ink">About the device.</h2>
          <Accordion items={productFaqs} />
        </div>
      </section>
    </div>
  )
}
