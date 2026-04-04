import type { Metadata } from 'next'
import { getPageContent } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About',
  description:
    'The story behind H2 Revive — why we built it, who we are, and what we believe about wellness.',
}

const values = [
  {
    label: 'Research first',
    body: 'Every claim we make is grounded in peer-reviewed science. We cite our sources and encourage you to read them.',
  },
  {
    label: 'No overclaiming',
    body: 'We use language like "research suggests" and "studies explore" — never "treats", "cures", or "guaranteed". Honesty is the brand.',
  },
  {
    label: 'Built for the serious',
    body: "H2 Revive is for people who do their homework. If you're here, you probably already know why molecular hydrogen is interesting.",
  },
]

export default async function AboutPage() {
  const content = await getPageContent('about', ['hero', 'ceo-story'], null)

  const hero = content['hero'] ?? {}
  const ceoStory = content['ceo-story'] ?? {}

  const heroHeadline = (hero.headline as string) ?? 'Why I started H2\u00a0Revive.'
  const storyHeadline = (ceoStory.headline as string) ?? null
  const storyBody = (ceoStory.body as string) ?? null
  return (
    <div className="bg-cream">
      {/* Hero */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Our story</p>
        <h1 className="max-w-xl font-display text-5xl leading-tight text-ink">
          {heroHeadline}
        </h1>
      </div>

      {/* Story */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="flex justify-center md:justify-start">
            <div className="flex h-64 w-64 items-center justify-center rounded-full bg-ink-light/20">
              <span className="font-sans text-sm text-ink-light">CEO portrait</span>
            </div>
          </div>

          <div className="space-y-6 md:col-span-2">
            {storyHeadline && (
              <h2 className="font-display text-2xl text-ink">{storyHeadline}</h2>
            )}
            {storyBody ? (
              <p className="font-sans text-base leading-relaxed text-ink-mid">{storyBody}</p>
            ) : (
              <>
                <p className="font-sans text-base leading-relaxed text-ink-mid">
                  [Placeholder: Founder discovery story — how they first encountered molecular hydrogen
                  research, what drew them to the science, and the moment they decided the UK market
                  needed an honest, research-led brand in this space.]
                </p>
                <p className="font-sans text-base leading-relaxed text-ink-mid">
                  [Placeholder: Why the UK — the gap in the market. No credible, consumer-facing
                  hydrogen inhalation brand. The commitment to bringing CE-certified technology to
                  British consumers with full warranty and support.]
                </p>
                <p className="font-sans text-base leading-relaxed text-ink-mid">
                  [Placeholder: Product selection rationale — how H2 Revive evaluated and chose the
                  device. Criteria: H₂ concentration levels, safety certification, session length,
                  ease of use.]
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {values.map(({ label, body }) => (
              <div key={label}>
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-teal">
                  {label}
                </p>
                <p className="font-sans text-sm leading-relaxed text-ink-light">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="font-display text-2xl text-ink">Questions? I read every email.</p>
        <p className="mt-2 font-sans text-sm text-ink-mid">
          Reach out directly:{' '}
          <a href="mailto:hello@h2revive.co.uk" className="text-teal underline hover:text-teal-dark">
            hello@h2revive.co.uk
          </a>
        </p>
      </div>
    </div>
  )
}
