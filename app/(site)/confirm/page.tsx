import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Confirm your subscription',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { status } = await searchParams

  let headline: string
  let body: string
  let linkHref: string
  let linkLabel: string

  if (status === 'success') {
    headline = "You're confirmed."
    body =
      "Your research guide will be with you shortly. In the meantime, explore the science behind molecular hydrogen."
    linkHref = '/science'
    linkLabel = 'Explore the science'
  } else if (status === 'already_confirmed') {
    headline = "You're already confirmed."
    body = "You've already confirmed your subscription. You're all set."
    linkHref = '/'
    linkLabel = 'Back to H2 Revive'
  } else {
    headline = 'This link is invalid or has expired.'
    body =
      "If you'd like to sign up, please visit our sign-up page."
    linkHref = '/get-the-research'
    linkLabel = 'Get the research guide'
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-24 text-center">
      <h1 className="font-display text-3xl text-ink mb-4">{headline}</h1>
      <p className="font-sans text-base text-ink-mid leading-relaxed mb-8">{body}</p>
      <Link
        href={linkHref}
        className="font-sans text-teal underline underline-offset-4 hover:text-teal-dark transition-colors"
      >
        {linkLabel}
      </Link>
    </main>
  )
}
