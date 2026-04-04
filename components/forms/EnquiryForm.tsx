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
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  persona: z.enum(['energy', 'performance', 'longevity']).optional(),
  message: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const personaOptions = [
  { value: 'energy'      as const, label: 'Energy' },
  { value: 'performance' as const, label: 'Performance' },
  { value: 'longevity'   as const, label: 'Longevity' },
]

interface EnquiryFormProps {
  source: 'product' | 'clinics' | 'homepage'
  defaultPersona?: 'energy' | 'performance' | 'longevity'
  showMessage?: boolean
  ctaText?: string
}

export function EnquiryForm({
  source,
  defaultPersona,
  showMessage = true,
  ctaText = 'Send enquiry',
}: EnquiryFormProps) {
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { persona: defaultPersona },
  })

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
          enquiry_type: 'product',
          source_page: source,
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
      <div className="space-y-4 rounded-lg border border-teal/20 bg-teal-light p-6">
        <p className="font-display text-2xl text-ink">We&apos;ve got your enquiry.</p>
        <p className="font-sans text-sm leading-relaxed text-ink-mid">
          Someone from the H2 Revive team will be in touch within one working day. In the meantime, the Science Hub has the full research behind everything we do.
        </p>
        <a
          href="/science"
          className="inline-flex items-center font-mono text-xs uppercase tracking-widest text-teal transition-colors hover:text-teal-dark"
        >
          Explore the science &rarr;
        </a>
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
      <Input
        {...register('phone')}
        id="phone"
        type="tel"
        placeholder="Phone (optional)"
        autoComplete="tel"
      />

      <div className="flex gap-2">
        {personaOptions.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue('persona', value)}
            className={cn(
              'flex-1 rounded-pill border py-2 font-sans text-xs font-medium transition-colors',
              selectedPersona === value
                ? 'border-teal bg-teal text-white'
                : 'border-ink-light/30 text-ink-mid hover:border-teal/50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {showMessage && (
        <textarea
          {...register('message')}
          placeholder="Message (optional)"
          rows={3}
          className="w-full rounded-lg border border-ink-light/40 bg-white px-4 py-3 font-sans text-sm text-ink placeholder-ink-light focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal"
        />
      )}

      {serverError && (
        <p className="font-sans text-sm text-red-400">{serverError}</p>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full">
        {ctaText}
      </Button>
    </form>
  )
}
