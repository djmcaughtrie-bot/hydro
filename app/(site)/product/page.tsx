import type { Metadata } from 'next'
import { getPageContent } from '@/lib/content'
import { getTestimonials } from '@/lib/testimonials'
import { ProductPageClient } from '@/components/product/ProductPageClient'
import { TestimonialBlock } from '@/components/testimonials/TestimonialBlock'

export const metadata: Metadata = {
  title: 'The Device',
  description: 'Hydrogen inhalation technology for energy, recovery, and longevity. Enquire about the H2 Revive device.',
}

export default async function ProductPage() {
  const [content, testimonials] = await Promise.all([
    getPageContent(
      'product',
      ['hero', 'how-it-works', 'cta'],
      null  // fetch general content only; persona variants handled client-side
    ),
    getTestimonials('product'),
  ])

  const hero       = content['hero']          ?? {}
  const howItWorks = content['how-it-works']  ?? {}
  const cta        = content['cta']           ?? {}

  return (
    <>
      <ProductPageClient
        cmsHeroHeadline={hero.headline as string | undefined}
        cmsHeroBody={hero.body as string | undefined}
        cmsHeroCta={hero.cta_text as string | undefined}
        cmsHowItWorksHeadline={howItWorks.headline as string | undefined}
        cmsCtaHeadline={cta.headline as string | undefined}
        cmsCtaSubheading={cta.subheading as string | undefined}
      />
      {testimonials.length > 0 && (
        <section className="py-16 bg-cream">
          <div className="mx-auto max-w-6xl px-6">
            <p className="mb-6 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
              What people are saying
            </p>
            <TestimonialBlock testimonials={testimonials} />
          </div>
        </section>
      )}
    </>
  )
}
