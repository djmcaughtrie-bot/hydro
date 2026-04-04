import type { Metadata } from 'next'
import Link from 'next/link'
import { getTestimonials } from '@/lib/testimonials'
import { TestimonialBlock } from '@/components/testimonials/TestimonialBlock'

export const metadata: Metadata = {
  title: 'For Clinics & Practitioners',
  description:
    'Bring molecular hydrogen inhalation therapy to your clinic. Research-backed wellness technology for practitioners and health centres.',
}

export default async function ClinicsPage() {
  const testimonials = await getTestimonials('clinics', 'clinic')

  return (
    <>
      {/* Hero */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">
            B2B / Practitioners
          </p>
          <h1 className="font-display text-4xl leading-tight text-white md:text-5xl">
            Bring molecular hydrogen to your clinic.
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base text-ink-light">
            H2 Revive works with wellness clinics, physiotherapy practices, and health
            centres across the UK. Research-backed technology, professional support,
            and a brand your clients will trust.
          </p>
          <div className="mt-8">
            <Link
              href="/product"
              className="inline-flex rounded-pill bg-teal px-6 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
            >
              Enquire about clinic partnerships
            </Link>
          </div>
        </div>
      </section>

      {/* Why H2 Revive for clinics */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-teal">
            Why H2 Revive
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-display text-xl text-ink">Research-backed</h3>
              <p className="font-sans text-sm text-ink-mid">
                50+ peer-reviewed studies. We provide a full science dossier to support
                informed client conversations.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-display text-xl text-ink">Compliance-safe</h3>
              <p className="font-sans text-sm text-ink-mid">
                All marketing materials are MHRA-reviewed and ASA-compliant. No
                overclaiming, ever.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-display text-xl text-ink">UK support</h3>
              <p className="font-sans text-sm text-ink-mid">
                CE certified device. 2-year UK warranty. Dedicated account support for
                clinic partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="bg-cream py-12">
          <div className="mx-auto max-w-6xl px-6">
            <p className="mb-6 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
              From our clinic partners
            </p>
            <TestimonialBlock testimonials={testimonials} showPersonaBadge={false} />
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-4 font-display text-3xl text-white">
            Ready to bring this to your clients?
          </h2>
          <p className="mx-auto mb-8 max-w-lg font-sans text-base text-ink-light">
            Get in touch to discuss pricing, training, and partnership options.
          </p>
          <Link
            href="/product"
            className="inline-flex rounded-pill bg-teal px-8 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
          >
            Enquire now
          </Link>
        </div>
      </section>
    </>
  )
}
