import type { Metadata } from 'next'
import Image from 'next/image'
import { WaitlistForm } from '@/components/forms/WaitlistForm'

export const metadata: Metadata = {
  title: 'Coming Soon',
  description:
    'Hydrogen inhalation technology, coming to the UK. Join the H2 Revive waitlist.',
}

export default function WaitlistPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-16 text-center">
      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/logo.svg"
          alt="H2 Revive"
          width={120}
          height={80}
          priority
        />
      </div>

      {/* Headline */}
      <h1 className="font-display max-w-lg text-4xl leading-tight text-white sm:text-5xl">
        The smallest molecule in existence.{' '}
        <span className="text-teal">The biggest idea in British wellness.</span>
      </h1>

      {/* Subline */}
      <p className="mt-4 max-w-sm font-sans text-base font-light text-ink-light">
        Hydrogen inhalation technology, coming to the UK.
      </p>

      {/* Form */}
      <div className="mt-10 w-full max-w-md">
        <WaitlistForm />
      </div>

      {/* Disclaimer */}
      <p className="mt-12 max-w-md font-sans text-xs text-ink-light/60 leading-relaxed">
        These statements have not been evaluated by the MHRA. This product is not intended
        to diagnose, treat, cure, or prevent any disease.
      </p>
    </main>
  )
}
