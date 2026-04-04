import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Testimonial } from '@/lib/types'

export default async function TestimonialsPage() {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false })

  const testimonials: Testimonial[] = data ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Testimonials</h1>
        <Link
          href="/admin/testimonials/new"
          className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          + Add testimonial
        </Link>
      </div>

      {/* Compliance reminder */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="font-sans text-xs leading-relaxed text-amber-800">
          <strong>Before publishing:</strong> Testimonials must not claim to treat, cure, or diagnose any condition.
          Only experience and feeling language is permitted (&ldquo;I noticed&rdquo;, &ldquo;I feel&rdquo;, &ldquo;I find myself&rdquo;).
          Prohibited words: treats, cures, proven, eliminates, heals, fixes, therapy, clinical, or disease names as outcomes.
          Written consent to publish must be on file.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-mono text-xs text-ink-light">Customer</th>
              <th className="px-4 py-3 text-left font-mono text-xs text-ink-light">Persona</th>
              <th className="px-4 py-3 text-left font-mono text-xs text-ink-light">Format</th>
              <th className="px-4 py-3 text-left font-mono text-xs text-ink-light">Compliance</th>
              <th className="px-4 py-3 text-left font-mono text-xs text-ink-light">Consent</th>
              <th className="px-4 py-3 text-left font-mono text-xs text-ink-light">Status</th>
              <th className="px-4 py-3 text-left font-mono text-xs text-ink-light">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-sans text-sm text-ink-light">
                  No testimonials yet. Add your first one above.
                </td>
              </tr>
            ) : (
              testimonials.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-sans text-sm font-medium text-ink">{t.customer_name}</p>
                    {t.customer_context && (
                      <p className="font-sans text-xs text-ink-light">{t.customer_context}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 font-mono text-xs capitalize bg-gray-100 text-gray-700">
                      {t.persona}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-sans text-xs text-ink-mid capitalize">{t.format}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs ${t.compliance_approved ? 'text-green-700' : 'text-amber-600'}`}>
                      {t.compliance_approved ? '✓' : '○'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs ${t.consent_on_file ? 'text-green-700' : 'text-amber-600'}`}>
                      {t.consent_on_file ? '✓' : '○'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 font-mono text-xs ${
                      t.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {t.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/testimonials/${t.id}`}
                      className="font-mono text-xs text-teal hover:text-teal-dark"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
