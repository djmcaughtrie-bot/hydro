import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-ink text-ink-light">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Image src="/logo.svg" alt="H2 Revive" width={80} height={54} />
            <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-ink-light">
              Hydrogen inhalation technology, coming to the UK.
            </p>
          </div>

          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Product</p>
            <ul className="space-y-2">
              <li>
                <Link href="/product" className="font-sans text-sm transition-colors hover:text-white">
                  The Device
                </Link>
              </li>
              <li>
                <Link href="/faq" className="font-sans text-sm transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Company</p>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="font-sans text-sm transition-colors hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <span className="cursor-not-allowed font-sans text-sm text-ink-light/50">
                  Science (coming soon)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-mid/30 pt-6">
          <p className="font-sans text-xs leading-relaxed text-ink-light/60">
            These statements have not been evaluated by the MHRA. This product is not intended to
            diagnose, treat, cure, or prevent any disease. Research referenced is cited for
            educational purposes.
          </p>
          <p className="mt-4 font-sans text-xs text-ink-light/40">
            &copy; {new Date().getFullYear()} H2 Revive Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
