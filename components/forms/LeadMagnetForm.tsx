'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getUTMParamsWithFallback } from '@/lib/utm'
import type { UTMParams } from '@/lib/utm'
import type { Persona } from '@/lib/persona'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
  marketing_consent: z.boolean(),
})

type FormData = z.infer<typeof schema>

const LEAD_MAGNET_LABELS: Record<Persona, string> = {
  energy:      'The Cellular Energy Guide',
  performance: 'The H₂ Recovery Protocol',
  longevity:   'The Hydrogen Therapy Research Summary',
}

interface Props {
  persona: Persona
  onSuccess: () => void
}

export function LeadMagnetForm({ persona, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const utmRef = useRef<UTMParams>({})

  useEffect(() => {
    utmRef.current = getUTMParamsWithFallback()
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { marketing_consent: false },
  })

  const consentChecked = watch('marketing_consent')

  const LEAD_MAGNET_KEYS: Record<Persona, string> = {
    energy:      'cellular-energy-guide',
    performance: 'recovery-protocol',
    longevity:   'research-summary',
  }

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const res = await fetch('/api/email-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name || undefined,
          persona,
          lead_magnet: LEAD_MAGNET_KEYS[persona],
          marketing_consent: data.marketing_consent,
          consent_timestamp: data.marketing_consent ? new Date().toISOString() : undefined,
          ...utmRef.current,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Signup failed')
      onSuccess()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="font-sans text-sm text-ink-mid">
        Enter your email to get <strong>{LEAD_MAGNET_LABELS[persona]}</strong> — free.
      </p>
      <Input
        {...register('name')}
        type="text"
        placeholder="Your name (optional)"
        autoComplete="name"
      />
      <Input
        {...register('email')}
        type="email"
        placeholder="Email address"
        error={errors.email?.message}
        autoComplete="email"
      />
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          {...register('marketing_consent')}
          className="mt-0.5 h-4 w-4 rounded border-ink-light/40 text-teal focus:ring-teal"
        />
        <span className="font-sans text-xs leading-relaxed text-ink-light">
          I&apos;d like to receive the weekly H2 Revive Founder Letter and research updates.
        </span>
      </label>
      {serverError && (
        <p className="font-sans text-xs text-red-500">{serverError}</p>
      )}
      <Button type="submit" loading={isSubmitting} className="w-full">
        Send me the guide
      </Button>
    </form>
  )
}
