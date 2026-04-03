'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="w-full max-w-sm">
        <p className="mb-8 font-mono text-xs font-semibold tracking-widest text-teal">H2 ADMIN</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-mid/30 bg-ink-mid/10 px-4 py-2.5 font-sans text-sm text-white placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="you@h2revive.co.uk"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink-light">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-mid/30 bg-ink-mid/10 px-4 py-2.5 font-sans text-sm text-white placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="••••••••"
            />
          </div>

          {error !== null && (
            <p className="font-sans text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal px-4 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
