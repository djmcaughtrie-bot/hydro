import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Competition Terms & Conditions | H2 Revive',
  description: 'Terms and conditions for H2 Revive competitions and giveaways.',
}

const terms = [
  {
    title: '1. Eligibility',
    body: 'This competition is open to UK residents aged 18 and over, excluding employees of H2 Revive and their immediate families. Entries from outside the United Kingdom will not be accepted. By entering, you confirm that you meet these eligibility requirements.',
  },
  {
    title: '2. Entry',
    body: 'One entry per person. Duplicate entries — identified by email address — will be disregarded. Entries must be submitted via the official competition page at h2revive.co.uk/win. H2 Revive accepts no responsibility for entries that are lost, delayed, or not received due to technical issues.',
  },
  {
    title: '3. Prize',
    body: 'The prize is as described on the competition page. No cash alternative is available, and the prize is non-transferable. H2 Revive reserves the right to substitute the prize with one of equivalent or greater value if circumstances beyond our control make this necessary.',
  },
  {
    title: '4. Winner Selection',
    body: 'The winner will be selected by random draw from all valid entries within 7 days of the competition closing date. The draw will be conducted by H2 Revive or a nominated third party, and the result is final. No correspondence regarding the outcome will be entered into.',
  },
  {
    title: '5. Winner Notification',
    body: 'The winner will be notified by email using the address provided at entry. If a winner does not respond within 30 days of notification, the prize will be forfeited and a new winner may be selected at H2 Revive\'s discretion.',
  },
  {
    title: '6. General',
    body: 'H2 Revive reserves the right to amend, suspend, or cancel this competition at any time, without prior notice, if circumstances beyond its control make this necessary. These terms and conditions are governed by English law. H2 Revive is a trading name of [Company Name]. Competitions are run in accordance with UK law.',
  },
]

export default function CompetitionTermsPage() {
  return (
    <main className="min-h-screen bg-cream px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/win"
          className="mb-8 inline-block font-mono text-xs text-teal hover:text-teal-dark"
        >
          ← Back to competition
        </Link>

        <h1 className="font-display text-4xl text-ink">Competition Terms &amp; Conditions</h1>
        <p className="mt-4 font-sans text-sm text-ink-light">
          Please read these terms carefully before entering.
        </p>

        <div className="mt-12 space-y-10">
          {terms.map((term) => (
            <div key={term.title}>
              <h2 className="font-display text-xl text-ink">{term.title}</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-mid">{term.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-ink-light/20 pt-8">
          <p className="font-sans text-xs text-ink-light">
            H2 Revive is a trading name of [Company Name]. Competitions are run in accordance with
            UK law.
          </p>
        </div>
      </div>
    </main>
  )
}
