'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { getUTMParamsWithFallback } from '@/lib/utm'
import { resolvePersona } from '@/lib/persona'
import type { UTMParams } from '@/lib/utm'
import type { Persona } from '@/lib/persona'

const schema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  persona: z.enum(['energy', 'performance', 'longevity']).optional(),
})

type FormData = z.infer<typeof schema>

const personas = [
  { value: 'energy',      label: 'I want more energy and mental clarity' },
  { value: 'performance', label: 'I train hard and want to recover better' },
  { value: 'longevity',   label: "I'm investing in longevity" }, // apostrophe is safe in JS string, not JSX
] as const

export function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const utmRef = useRef<UTMParams>({})
  const capturedPersonaRef = useRef<Persona | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    utmRef.current = getUTMParamsWithFallback()
    capturedPersonaRef.current = resolvePersona()
  }, [])

  const selectedPersona = watch('persona')

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ...utmRef.current,
          persona: data.persona ?? capturedPersonaRef.current ?? undefined,
          enquiry_type: 'waitlist',
          source_page: '/start',
        }),
      })
      if (!res.ok) {
        setServerError('Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <p className="font-display text-2xl text-teal">You&apos;re on the list.</p>
        <p className="mt-2 font-sans text-sm text-ink-light">
          We&apos;ll be in touch when H2 Revive launches in the UK.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-md space-y-4">
      <Input
        {...register('email')}
        type="email"
        placeholder="Email address"
        error={errors.email?.message}
        autoComplete="email"
      />

      <div className="space-y-2">
        {personas.map(({ value, label }) => (
          <label
            key={value}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 font-sans text-sm transition-colors',
              selectedPersona === value
                ? 'border-teal bg-teal/10 text-ink'
                : 'border-ink-light/20 text-ink-light hover:border-teal/50'
            )}
          >
            <input
              type="radio"
              className="sr-only"
              value={value}
              aria-label={label}
              {...register('persona')}
              onChange={() => setValue('persona', value)}
            />
            <span
              className={cn(
                'h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors',
                selectedPersona === value ? 'border-teal bg-teal' : 'border-ink-light/40'
              )}
            />
            {label}
          </label>
        ))}
      </div>

      {serverError && (
        <p className="font-sans text-sm text-red-400">{serverError}</p>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full">
        Join the waitlist
      </Button>
    </form>
  )
}
