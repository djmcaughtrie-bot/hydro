'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EnquiryForm } from '@/components/forms/EnquiryForm'
import { Accordion } from '@/components/ui/Accordion'
import { PersonaSelector } from '@/components/PersonaSelector'
import { usePersona } from '@/hooks/usePersona'
import { PERSONAS } from '@/lib/persona'
import type { Persona } from '@/lib/persona'
import { TestimonialBlock } from '@/components/testimonials/TestimonialBlock'
import type { Testimonial } from '@/lib/types'
import { ModelSelector } from '@/components/product/ModelSelector'
import { FlowRateComparison } from '@/components/product/FlowRateComparison'
import { TechnologySection } from '@/components/product/TechnologySection'
import { MODELS } from '@/lib/product-models'
import type { ModelKey } from '@/lib/product-models'

// ─── Per-persona featured study ───────────────────────────────────────────────
const FEATURED_STUDIES: Record<Persona, {
  label: string
  title: string
  finding: string
  citation: string
  url: string
}> = {
  energy: {
    label: 'Featured study \u2014 Energy',
    title: 'Hydrogen inhalation and fat oxidation at rest',
    finding:
      'A 2025 study from Palac\u00fdk\u00fd University found 60 minutes of H\u2082 inhalation was associated with increased fat oxidation at rest \u2014 suggesting a potential role in metabolic energy regulation.',
    citation: 'Palac\u00fdk\u00fd University, 2025',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
  },
  performance: {
    label: 'Featured study \u2014 Recovery',
    title: 'Molecular hydrogen and exercise-induced oxidative stress',
    finding:
      'Research published in Medical Gas Research found that H\u2082-enriched water significantly reduced blood lactate levels and improved peak torque during exercise \u2014 suggesting a potential recovery benefit for trained athletes.',
    citation: 'Medical Gas Research, 2012',
    url: 'https://doi.org/10.1186/2045-9912-2-12',
  },
  longevity: {
    label: 'Featured study \u2014 Longevity',
    title: 'HYBRID II: hydrogen inhalation in cardiac arrest recovery',
    finding:
      'The HYBRID II trial, published in The Lancet eClinicalMedicine (2023), reported 46% full neurological recovery in the H\u2082 group vs 21% in controls \u2014 the strongest human RCT evidence to date for hydrogen\u2019s neuroprotective potential.',
    citation: 'Lancet eClinicalMedicine, 2023',
    url: 'https://doi.org/10.1016/j.eclinm.2023.101832',
  },
}

// ─── Per-persona hero copy ─────────────────────────────────────────────────────
type PersonaKey = Persona | 'general'

const PERSONA_COPY: Record<PersonaKey, {
  heroHeadline: string
  heroParagraph: string
  ctaLabel: string
  tabContent: string
}> = {
  energy: {
    heroHeadline: "What if the reason nothing\u2019s working isn\u2019t you?",
    heroParagraph:
      'Molecular hydrogen may support mitochondrial efficiency and cellular energy at the source \u2014 without stimulants, without the crash. Research suggests it targets oxidative stress where energy is actually made.',
    ctaLabel: 'Explore what might help',
    tabContent:
      'Molecular hydrogen has been studied for its potential effects on mitochondrial efficiency and cognitive function. Research suggests it may support mental clarity and sustained energy levels by addressing oxidative stress at the cellular level \u2014 without the stimulant effects of caffeine.',
  },
  performance: {
    heroHeadline: "1,500\u00a0ml/min. The recovery tool serious athletes haven\u2019t found yet.",
    heroParagraph:
      '99.99% purity. Inhaled directly \u2014 the fastest path to systemic absorption. Athletes exploring H\u2082 report faster perceived recovery and reduced post-exercise inflammation markers.',
    ctaLabel: 'See the full spec',
    tabContent:
      'Athletes exploring molecular hydrogen report faster perceived recovery and reduced post-exercise inflammation markers. Studies suggest it may support the body\u2019s natural antioxidant response after intense training, potentially reducing muscle soreness and improving readiness for the next session.',
  },
  longevity: {
    heroHeadline: "The most interesting thing isn\u2019t what it does. It\u2019s how it decides what to target.",
    heroParagraph:
      'Molecular hydrogen is a selective antioxidant \u2014 it neutralises only the most harmful free radicals, leaving beneficial reactive oxygen species intact. Research explores its role in Nrf2 activation, cardiovascular health, and cellular ageing.',
    ctaLabel: 'Read the research case',
    tabContent:
      'Oxidative stress is one of the primary drivers of cellular ageing. Molecular hydrogen is a selective antioxidant \u2014 it targets only the most harmful free radicals, leaving beneficial reactive oxygen species intact. Research explores its potential role in supporting long-term cellular health.',
  },
  general: {
    heroHeadline: 'Breathe the science.',
    heroParagraph:
      'Pure molecular hydrogen. 99.99% purity. Up to 1,500\u00a0ml/min. Session length 20\u201360 minutes.',
    ctaLabel: 'Enquire now',
    tabContent:
      'Molecular hydrogen has been studied for its potential effects on mitochondrial efficiency and cognitive function. Research suggests it may support mental clarity and sustained energy levels by addressing oxidative stress at the cellular level.',
  },
}

const OUTCOMES_LABELS: Record<Persona, string> = {
  energy: 'Energy',
  performance: 'Performance',
  longevity: 'Longevity',
}

// ─── Model spec rows ───────────────────────────────────────────────────────────
function getSpecRows(modelKey: ModelKey): [string, string][] {
  const m = MODELS[modelKey]
  return [
    ['Flow rate (max)', `${m.flowRate.toLocaleString()}\u00a0ml/min`],
    ['Output settings', m.settings.join('\u00a0\u00b7\u00a0')],
    ['H\u2082 purity', '\u226599.99%'],
    ['Technology', 'SPE\u00a0/\u00a0PEM membrane'],
    ['Electrolyzer', 'USA-made N117'],
    ['Session length', '20\u201360\u00a0minutes'],
    ['Continuous operation', m.continuous ? 'Yes (24\u00a0h)' : 'Up to 8\u00a0hours'],
    ['Noise level', m.noise],
    ['Weight', m.weight],
    ['Dimensions', m.dimensions],
    ['Water tank', modelKey === 'clinical' ? '5\u00a0L' : '2.6\u00a0L'],
    ['Device lifespan', m.lifespan],
    ['Certifications', 'CE, RoHS'],
    ['Warranty', '2\u00a0years (UK)'],
    ['PFAS', 'None'],
    ['Price', `\u00a3${m.price.toLocaleString()}`],
  ]
}

// ─── FAQs ──────────────────────────────────────────────────────────────────────
const productFaqs = [
  {
    question: 'Which model should I choose?',
    answer:
      'Most people opt for the H2 Revive Flow (1,500\u00a0ml/min). It delivers the output range most referenced in the research literature we cite, operates quietly at 20\u00a0dB, and is designed for daily 20\u201360 minute home sessions. The Pulse is an excellent entry point if you\u2019re starting a new practice. The Clinical is for clinic environments requiring continuous multi-session operation.',
  },
  {
    question: 'Why does flow rate matter?',
    answer:
      'Flow rate determines how much hydrogen-enriched air you receive per minute of inhalation. Most home devices on the market deliver 50\u2013150\u00a0ml/min \u2014 often dispersed passively into the air around you. The H2 Revive range starts at 1,200\u00a0ml/min and delivers directly through a nasal cannula. The difference is not marginal.',
  },
  {
    question: 'Why a nasal cannula rather than a nozzle or diffuser?',
    answer:
      'A nasal cannula delivers hydrogen directly into the nasal passage, from the machine to your lungs with no dilution by room air. Proximity nozzles and diffusers release hydrogen into the ambient space around you \u2014 concentration varies by distance, ventilation, and room size. The research studies we reference used direct delivery methods.',
  },
  {
    question: 'Do I need any special setup?',
    answer:
      'No. Each device requires only distilled water and a standard UK power outlet. Fill the tank, connect the cannula, and breathe normally.',
  },
  {
    question: 'How often should I use it?',
    answer:
      'Most users complete one 20\u201360 minute session daily. The device can be used morning or evening to suit your routine. The Pulse and Flow run up to 8 continuous hours; the Clinical runs indefinitely.',
  },
  {
    question: 'What water should I use?',
    answer:
      'Distilled water only. Each device includes a TDS pen to check water quality. Using tap or mineral water will damage the electrolysis membrane over time.',
  },
  {
    question: 'Is it safe to use every day?',
    answer:
      'Research studies involving daily hydrogen inhalation have reported no adverse effects. A 72-hour continuous inhalation study at 2.4% H\u2082 concentration found no adverse events. As with any wellness practice, consult your healthcare provider if you have an existing medical condition.',
  },
  {
    question: 'How quickly will I notice results?',
    answer:
      'Individual experiences vary. Some users report noticing changes within days; others over weeks of consistent use. We recommend daily use for at least 30 days before assessing.',
  },
]

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  cmsHeroHeadline?: string
  cmsHeroBody?: string
  cmsHeroCta?: string
  cmsHowItWorksHeadline?: string
  cmsCtaHeadline?: string
  cmsCtaSubheading?: string
  testimonials?: Testimonial[]
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function ProductPageClient({
  cmsHeroHeadline,
  cmsHeroBody,
  cmsHeroCta,
  cmsHowItWorksHeadline,
  cmsCtaHeadline,
  cmsCtaSubheading,
  testimonials = [],
}: Props) {
  const { persona } = usePersona()
  const key: PersonaKey = persona ?? 'general'
  const copy = PERSONA_COPY[key]
  const [selectedModel, setSelectedModel] = useState<ModelKey>('flow')

  const heroHeadline = cmsHeroHeadline ?? copy.heroHeadline
  const heroBody = cmsHeroBody ?? copy.heroParagraph
  const heroCta = cmsHeroCta ?? copy.ctaLabel
  const ctaHeadline = cmsCtaHeadline ?? 'Enquire about the device.'
  const ctaSubheading =
    cmsCtaSubheading ??
    "We\u2019re taking enquiries ahead of our UK launch. Tell us about yourself and we\u2019ll be in touch."

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
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
              <p className="mt-2 font-sans text-xs text-ink-light">
                Looking for more context?{' '}
                <Link href="/for/energy" className="text-teal underline underline-offset-2 hover:text-teal-dark">Energy</Link>
                {' \u00b7 '}
                <Link href="/for/performance" className="text-teal underline underline-offset-2 hover:text-teal-dark">Performance</Link>
                {' \u00b7 '}
                <Link href="/for/longevity" className="text-teal underline underline-offset-2 hover:text-teal-dark">Longevity</Link>
              </p>
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

      {/* ── Model selector ───────────────────────────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-teal">Choose your device</p>
          <h2 className="mb-2 font-display text-3xl text-ink">Three models. One standard.</h2>
          <p className="mb-8 max-w-2xl font-sans text-sm leading-relaxed text-ink-mid">
            Every H2 Revive device uses the same USA-made SPE/PEM membrane, delivers
            99.99% pure hydrogen through a direct nasal cannula, and carries a
            2-year UK warranty. The difference is output rate and intended use.
          </p>
          <ModelSelector selected={selectedModel} onSelect={setSelectedModel} />

          {/* Selected model description */}
          <div className="mt-8 rounded-lg border border-teal/30 bg-teal-light p-6">
            <p className="mb-1 font-display text-lg text-ink">{MODELS[selectedModel].name}</p>
            <p className="font-sans text-sm leading-relaxed text-ink-mid">
              {MODELS[selectedModel].description}
            </p>
          </div>
        </div>
      </section>

      {/* ── Flow rate & delivery method ──────────────────────────────────── */}
      <FlowRateComparison />

      {/* ── Research / outcomes tabs ─────────────────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">What the research explores</p>
          <div className="mb-8 flex flex-wrap gap-2">
            {PERSONAS.map((p) => (
              <span
                key={p}
                className={`rounded-pill border px-5 py-2 font-sans text-sm font-medium ${
                  persona === p
                    ? 'border-teal bg-teal text-white'
                    : 'border-ink-light/30 text-ink-mid'
                }`}
              >
                {OUTCOMES_LABELS[p]}
              </span>
            ))}
          </div>
          <p className="max-w-2xl font-sans text-base leading-relaxed text-ink-mid">{copy.tabContent}</p>
        </div>
      </section>

      {/* ── Technology ───────────────────────────────────────────────────── */}
      <TechnologySection />

      {/* ── Spec table ───────────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-teal">Technical specification</p>
              <h2 className="mt-1 font-display text-2xl text-ink">{MODELS[selectedModel].name}</h2>
            </div>
            <div className="flex gap-2">
              {(['pulse', 'flow', 'clinical'] as ModelKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedModel(k)}
                  className={`rounded-pill border px-4 py-1.5 font-sans text-xs font-medium transition-colors ${
                    selectedModel === k
                      ? 'border-teal bg-teal text-white'
                      : 'border-ink-light/30 text-ink-mid hover:border-teal/40'
                  }`}
                >
                  {MODELS[k].name.replace('H2 Revive ', '')}
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-lg overflow-hidden rounded-lg border border-ink-light/20">
            <table className="w-full">
              <tbody>
                {getSpecRows(selectedModel).map(([label, value], i) => (
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

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-10 font-mono text-xs uppercase tracking-widest text-teal">
            {cmsHowItWorksHeadline ?? 'How it works'}
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { n: 1, title: 'Fill', body: 'Fill the tank with distilled water. The built-in quality sensor confirms it\u2019s ready.' },
              { n: 2, title: 'Breathe', body: 'Connect the nasal cannula and breathe normally. No breath-holding, no technique required.' },
              { n: 3, title: 'Repeat', body: '20\u201360 minutes per session. Most users notice the most consistent results with daily practice.' },
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

      {/* ── Featured study callout ────────────────────────────────────────── */}
      {persona && (
        <section className="bg-teal-light py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                {FEATURED_STUDIES[persona].label}
              </p>
              <h3 className="mb-3 font-display text-xl text-ink">
                {FEATURED_STUDIES[persona].title}
              </h3>
              <p className="mb-4 font-sans text-sm leading-relaxed text-ink-mid">
                {FEATURED_STUDIES[persona].finding}
              </p>
              <a
                href={FEATURED_STUDIES[persona].url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-teal transition-colors hover:text-teal-dark"
              >
                {FEATURED_STUDIES[persona].citation} &#x2197;
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <p className="mb-8 font-mono text-xs uppercase tracking-widest text-teal">What people say</p>
            <TestimonialBlock testimonials={testimonials} showPersonaBadge />
          </div>
        </section>
      )}

      {/* ── Enquiry form ──────────────────────────────────────────────────── */}
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
                These statements have not been evaluated by the MHRA. This product is not intended
                to diagnose, treat, cure, or prevent any disease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product FAQ ───────────────────────────────────────────────────── */}
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
