import type { Metadata } from 'next'
import { CookiePrefsButton } from '@/components/analytics/CookiePrefsButton'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How H2 Revive uses cookies and how to manage your preferences.',
}

export default function CookiePolicyPage() {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-teal">Legal</p>
        <h1 className="mb-8 font-display text-4xl text-ink">Cookie Policy</h1>

        <div className="space-y-8 font-sans text-sm leading-relaxed text-ink-mid">
          <section>
            <h2 className="mb-3 font-display text-xl text-ink">What are cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website.
              They help us understand how you use H2 Revive so we can improve your experience
              and show you relevant content.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-ink">Essential cookies</h2>
            <p>
              These cookies are necessary for the website to function and cannot be switched off.
              They are set in response to actions you take, such as setting your privacy preferences
              or filling in forms.
            </p>
            <table className="mt-4 w-full text-xs">
              <thead>
                <tr className="border-b border-ink-light/20">
                  <th className="pb-2 text-left font-medium text-ink">Cookie</th>
                  <th className="pb-2 text-left font-medium text-ink">Purpose</th>
                  <th className="pb-2 text-left font-medium text-ink">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-light/10">
                <tr>
                  <td className="py-2 pr-4">cookieyes-consent</td>
                  <td className="py-2 pr-4">Stores your cookie consent preferences</td>
                  <td className="py-2">1 year</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">h2r_persona</td>
                  <td className="py-2 pr-4">Remembers your selected content persona</td>
                  <td className="py-2">Until cleared</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">h2r_utms</td>
                  <td className="py-2 pr-4">Stores campaign parameters for your session</td>
                  <td className="py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-ink">Analytics cookies</h2>
            <p>
              These cookies help us understand how visitors interact with the site.
              All data is aggregated and anonymous.
            </p>
            <table className="mt-4 w-full text-xs">
              <thead>
                <tr className="border-b border-ink-light/20">
                  <th className="pb-2 text-left font-medium text-ink">Cookie</th>
                  <th className="pb-2 text-left font-medium text-ink">Provider</th>
                  <th className="pb-2 text-left font-medium text-ink">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-light/10">
                <tr>
                  <td className="py-2 pr-4">_ga, _ga_*</td>
                  <td className="py-2 pr-4">Google Analytics 4</td>
                  <td className="py-2">2 years</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-ink">Marketing cookies</h2>
            <p>
              These cookies are used to show you relevant advertising on other platforms.
              They are set by our advertising partners.
            </p>
            <table className="mt-4 w-full text-xs">
              <thead>
                <tr className="border-b border-ink-light/20">
                  <th className="pb-2 text-left font-medium text-ink">Cookie</th>
                  <th className="pb-2 text-left font-medium text-ink">Provider</th>
                  <th className="pb-2 text-left font-medium text-ink">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-light/10">
                <tr>
                  <td className="py-2 pr-4">_fbp</td>
                  <td className="py-2 pr-4">Meta (Facebook)</td>
                  <td className="py-2">3 months</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">ttclid</td>
                  <td className="py-2 pr-4">TikTok</td>
                  <td className="py-2">Session</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">li_fat_id</td>
                  <td className="py-2 pr-4">LinkedIn</td>
                  <td className="py-2">30 days</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-ink">Managing your preferences</h2>
            <p className="mb-4">
              You can change your cookie preferences at any time. Click the button below to
              reopen the cookie preference panel.
            </p>
            <CookiePrefsButton />
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-ink">Contact</h2>
            <p>
              If you have questions about our use of cookies, contact us at{' '}
              <a href="mailto:hello@h2revive.co.uk" className="text-teal underline-offset-2 hover:underline">
                hello@h2revive.co.uk
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
