import type { Metadata } from 'next'
import Link from 'next/link'
import { EnquiryForm } from '@/components/forms/EnquiryForm'
import { Accordion } from '@/components/ui/Accordion'

export const metadata: Metadata = {
  title: 'The Device',
  description:
    'Hydrogen inhalation technology for energy, recovery, and longevity. Enquire about the H2 Revive device.',
}

const outcomesTabs = {
  sarah: {
    label: 'Energy',
    content:
      "Molecular hydrogen has been studied for its potential effects on mitochondrial efficiency and cognitive function. Research suggests it may support mental clarity and sustained energy levels by addressing oxidative stress at the cellular level — without the stimulant effects of caffeine.",
  },
  marcus: {
    label: 'Recovery',
    content:
      "Athletes exploring molecular hydrogen report faster perceived recovery and reduced post-exercise inflammation markers. Studies suggest it may support the body's natural antioxidant response after intense training, potentially reducing muscle soreness and improving readiness for the next session.",
  },
  elena: {
    label: 'Longevity',
    content:
      "Oxidative stress is one of the primary drivers of cellular ageing. Molecular hydrogen is a selective antioxidant — it targets only the most harmful free radicals, leaving beneficial reactive oxygen species intact. Research explores its potential role in supporting long-term cellular health.",
  },
} as const

type Persona = keyof typeof outcomesTabs
const personaKeys: Persona[] = ['sarah', 'marcus', 'elena']

const specRows: [string, string][] = [
  ['H₂ concentration', 'Up to 1,200 ppb'],
  ['H₂ purity', '≥99.99%'],
  ['Session length', '20–60 minutes'],
  ['Water per session', '~250ml'],
  ['Certifications', 'CE, RoHS'],
  ['Warranty', '2 years (UK)'],
]

const productFaqs = [
  {
    question: 'Do I need any special setup?',
    answer:
      'No. The device requires only water and a standard UK power outlet. Simply fill the chamber, switch on, and breathe.',
  },
  {
    question: 'How often should I use it?',
    answer:
      'Most users complete one 20–60 minute session daily. The device can be used morning or evening to suit your routine.',
  },
  {
    question: 'What water should I use?',
    answer:
      'We recommend distilled or filtered water for optimal hydrogen concentration and to maintain device longevity.',
  },
  {
    question: 'Is it safe to use every day?',
    answer:
      'Research studies involving daily hydrogen inhalation have reported no adverse effects. As with any wellness practice, consult your healthcare provider if you have an existing medical condition.',
  },
  {
    question: 'How quickly will I notice results?',
    answer:
      'Individual experiences vary. Some users report changes within days; others over weeks. We recommend consistent daily use for at least 30 days before assessing.',
  },
]

interface ProductPageProps {
  searchParams: { persona?: string }
}

export default function ProductPage({ searchParams }: ProductPageProps) {
  const raw = searchParams.persona
  const persona: Persona = personaKeys.includes(raw as Persona) ? (raw as Persona) : 'sarah'

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
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                The device
              </p>
              <h1 className="mb-4 font-display text-5xl leading-tight text-white">
                Breathe the science.
              </h1>
              <p className="mb-8 font-sans text-base text-ink-light">
                H&#8322; concentration up to 1,200&nbsp;ppb. Session length 20&ndash;60 minutes.
                CE certified.
              </p>
              <a
                href="#enquiry"
                className="inline-flex items-center rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
              >
                Enquire now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes tabs */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">
            What the research explores
          </p>
          <div className="mb-8 flex flex-wrap gap-2">
            {personaKeys.map((key) => (
              <Link
                key={key}
                href={`/product?persona=${key}`}
                className={`rounded-pill border px-5 py-2 font-sans text-sm font-medium transition-colors ${
                  persona === key
                    ? 'border-teal bg-teal text-white'
                    : 'border-ink-light/30 text-ink-mid hover:border-teal/50'
                }`}
              >
                {outcomesTabs[key].label}
              </Link>
            ))}
          </div>
          <p className="max-w-2xl font-sans text-base leading-relaxed text-ink-mid">
            {outcomesTabs[persona].content}
          </p>
        </div>
      </section>

      {/* Spec table */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">
            Technical specification
          </p>
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
            How it works
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { n: 1, title: 'Fill', body: 'Fill the chamber with distilled or filtered water.' },
              {
                n: 2,
                title: 'Breathe',
                body: 'Breathe the hydrogen-enriched air through the included nasal cannula.',
              },
              {
                n: 3,
                title: 'Feel',
                body: 'Complete your session in 20–60 minutes. Use daily for best results.',
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex flex-col items-start">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-teal font-mono text-sm font-bold text-white">
                  {n}
                </div>
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
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
                Get in touch
              </p>
              <h2 className="mb-4 font-display text-4xl text-white">
                Enquire about the device.
              </h2>
              <p className="font-sans text-sm text-ink-light">
                We&apos;re taking enquiries ahead of our UK launch. Tell us about yourself and
                we&apos;ll be in touch.
              </p>
            </div>
            <div>
              <EnquiryForm source="product" defaultPersona={persona} />
              <p className="mt-4 font-sans text-xs leading-relaxed text-ink-light/60">
                These statements have not been evaluated by the MHRA. This product is not intended
                to diagnose, treat, cure, or prevent any disease.
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
