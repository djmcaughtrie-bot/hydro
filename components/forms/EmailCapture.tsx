'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { resolvePersona } from '@/lib/persona'
import { getUTMParamsWithFallback } from '@/lib/utm'
import type { Persona } from '@/lib/persona'
import type { UTMParams } from '@/lib/utm'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type FormData = z.infer<typeof schema>

interface EmailCaptureProps {
  heading: string
  subheading?: string
  source: string
  ctaText?: string
  enquiryType?: 'waitlist' | 'general'
  darkBackground?: boolean
}

export function EmailCapture({
  heading,
  subheading,
  source,
  ctaText = 'Keep me informed',
  enquiryType = 'general',
  darkBackground = false,
}: EmailCaptureProps) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const utmRef = useRef<UTMParams>({})
  const personaRef = useRef<Persona | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    utmRef.current = getUTMParamsWithFallback()
    personaRef.current = resolvePersona()
  }, [])

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          enquiry_type: enquiryType,
          source_page: source,
          persona: personaRef.current ?? undefined,
          ...utmRef.current,
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

  const textColor = darkBackground ? 'text-white' : 'text-ink'
  const subColor = darkBackground ? 'text-ink-light' : 'text-ink-mid'

  if (submitted) {
    return (
      <div className="text-center">
        <p className={`font-display text-xl ${textColor}`}>You&apos;re on the list.</p>
        <p className={`mt-1 font-sans text-sm ${subColor}`}>
          We&apos;ll be in touch as things develop.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className={`mb-2 font-display text-2xl ${textColor}`}>{heading}</p>
      {subheading && (
        <p className={`mx-auto mb-6 max-w-md font-sans text-sm ${subColor}`}>{subheading}</p>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mx-auto flex max-w-sm flex-col gap-3 sm:flex-row"
      >
        <div className="flex-1">
          <Input
            {...register('email')}
            id="email-capture"
            type="email"
            placeholder="Your email address"
            error={errors.email?.message}
            autoComplete="email"
          />
        </div>
        <Button type="submit" loading={isSubmitting}>
          {ctaText}
        </Button>
      </form>
      {serverError && (
        <p className="mt-2 font-sans text-sm text-red-400">{serverError}</p>
      )}
    </div>
  )
}
