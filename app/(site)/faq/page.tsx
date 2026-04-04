import type { Metadata } from 'next'
import { Accordion } from '@/components/ui/Accordion'
import { getPageContent } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about the H2 Revive hydrogen inhalation device.',
}

const FALLBACK_FAQS = [
  {
    question: 'Is hydrogen inhalation safe?',
    answer:
      'Molecular hydrogen has been used in research settings for over 15 years with a strong safety profile. Studies involving human participants have reported no serious adverse effects. As with any wellness device, we recommend consulting your healthcare provider if you have a medical condition.',
  },
  {
    question: 'What does the research actually show?',
    answer:
      "Over 50 peer-reviewed studies have explored molecular hydrogen's effects on oxidative stress, inflammation, and cellular health. The research is promising, particularly in areas of athletic recovery, cognitive function, and longevity markers. We cite all studies for educational purposes — these findings do not constitute medical claims.",
  },
  {
    question: 'How much does it cost?',
    answer:
      'The H2 Revive device is priced at £1,200–1,600 depending on configuration. Please submit an enquiry for a full quote tailored to your needs.',
  },
  {
    question: 'How long does a session take?',
    answer:
      'A typical session is 20–60 minutes. Most people use the device once daily, though session length and frequency can be adjusted to suit your routine.',
  },
  {
    question: 'What do I need to use it?',
    answer:
      'The device requires only water and a standard UK power outlet. No specialist installation, tubing, or consumables are required beyond distilled or filtered water.',
  },
  {
    question: 'Is there a warranty?',
    answer:
      'All H2 Revive devices come with a full 2-year UK warranty covering manufacturing defects. Our UK-based support team is available to assist with any issues.',
  },
  {
    question: 'Can I return it?',
    answer:
      "We encourage all prospective customers to speak with us before purchasing so we can ensure the device is right for you. Please contact us to discuss your needs — we're happy to answer any questions before you commit.",
  },
  {
    question: 'When will it be available in the UK?',
    answer:
      'We are currently taking enquiries ahead of our UK launch. Submit an enquiry or join our waitlist to be among the first to receive a device.',
  },
]

export default async function FAQPage() {
  const content = await getPageContent('faq', ['hero', 'item'], null)
  const hero = content['hero'] ?? {}
  const faqSection = content['item'] ?? {}

  const heroHeadline = (hero.headline as string) || 'Common questions.'

  // Use CMS items if published, otherwise fall back to hardcoded
  const cmsItems = Array.isArray(faqSection.items)
    ? (faqSection.items as { question?: string; answer?: string }[])
        .filter(i => i.question && i.answer)
        .map(i => ({ question: i.question!, answer: i.answer! }))
    : []
  const faqs = cmsItems.length > 0 ? cmsItems : FALLBACK_FAQS

  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">FAQ</p>
        <h1 className="mb-10 font-display text-4xl text-ink">{heroHeadline}</h1>
        <Accordion items={faqs} />
      </div>
    </div>
  )
}
