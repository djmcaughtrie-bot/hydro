import type { Metadata } from 'next'
import { getPageContent } from '@/lib/content'
import { ProductPageClient } from '@/components/product/ProductPageClient'

export const metadata: Metadata = {
  title: 'The Device',
  description: 'Hydrogen inhalation technology for energy, recovery, and longevity. Enquire about the H2 Revive device.',
}

export default async function ProductPage() {
  const content = await getPageContent(
    'product',
    ['hero', 'how-it-works', 'cta'],
    null  // fetch general content only; persona variants handled client-side
  )

  const hero       = content['hero']          ?? {}
  const howItWorks = content['how-it-works']  ?? {}
  const cta        = content['cta']           ?? {}

  return (
    <ProductPageClient
      cmsHeroHeadline={hero.headline as string | undefined}
      cmsHeroBody={hero.body as string | undefined}
      cmsHeroCta={hero.cta_text as string | undefined}
      cmsHowItWorksHeadline={howItWorks.headline as string | undefined}
      cmsCtaHeadline={cta.headline as string | undefined}
      cmsCtaSubheading={cta.subheading as string | undefined}
    />
  )
}
