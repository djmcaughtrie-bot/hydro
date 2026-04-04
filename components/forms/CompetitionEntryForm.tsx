'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getUTMParamsWithFallback } from '@/lib/utm'
import type { UTMParams } from '@/lib/utm'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  marketing_consent: z.boolean(),
})

type FormData = z.infer<typeof schema>

type FormState = 'idle' | 'submitting' | 'success' | 'error' | 'already_entered' | 'closed'

interface CompetitionEntryFormProps {
  competitionId: string
  prize: string
}

export function CompetitionEntryForm({ competitionId, prize }: CompetitionEntryFormProps) {
  const [formState, setFormState] = useState<FormState>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const utmRef = useRef<UTMParams>({})

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { marketing_consent: false },
  })

  useEffect(() => {
    utmRef.current = getUTMParamsWithFallback()
  }, [])

  async function onSubmit(data: FormData) {
    setServerError(null)
    setFormState('submitting')
    try {
      const res = await fetch('/api/competition-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competition_id: competitionId,
          name: data.name,
          email: data.email,
          marketing_consent: data.marketing_consent,
          ...utmRef.current,
        }),
      })

      if (res.status === 409) {
        setFormState('already_entered')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.error === 'competition_not_active') {
          setFormState('closed')
          return
        }
        setFormState('error')
        setServerError('Something went wrong. Please try again.')
        return
      }

      setFormState('success')
    } catch {
      setFormState('error')
      setServerError('Something went wrong. Please try again.')
    }
  }

  if (formState === 'success') {
    return (
      <div className="rounded-lg bg-teal-light p-8 text-center">
        <p className="font-display text-3xl text-teal">You&apos;re in.</p>
        <p className="mt-3 font-sans text-base text-ink-mid">
          We&apos;ll be in touch if you win.
        </p>
        <p className="mt-4 font-mono text-sm text-ink-light">Prize: {prize}</p>
      </div>
    )
  }

  if (formState === 'already_entered') {
    return (
      <div className="rounded-lg border border-teal/30 bg-teal-light p-8 text-center">
        <p className="font-display text-2xl text-teal">Already entered.</p>
        <p className="mt-3 font-sans text-sm text-ink-mid">
          Looks like you&apos;ve already entered — good luck!
        </p>
      </div>
    )
  }

  if (formState === 'closed') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="font-sans text-sm text-ink-mid">This competition has now closed.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-md space-y-4">
      <Input
        {...register('name')}
        id="name"
        type="text"
        placeholder="Your name"
        error={errors.name?.message}
        autoComplete="name"
      />
      <Input
        {...register('email')}
        id="email"
        type="email"
        placeholder="Email address"
        error={errors.email?.message}
        autoComplete="email"
      />

      <label className="flex cursor-pointer items-start gap-3">
        <input
          {...register('marketing_consent')}
          id="marketing_consent"
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-ink-light/40 text-teal focus:ring-teal"
        />
        <span className="font-sans text-sm text-ink-mid">
          I&apos;d like to receive wellness updates from H2 Revive
        </span>
      </label>

      {serverError && (
        <p className="font-sans text-sm text-red-400">{serverError}</p>
      )}

      <Button
        type="submit"
        loading={isSubmitting || formState === 'submitting'}
        className="w-full"
      >
        Enter the competition
      </Button>
    </form>
  )
}
