'use client'
import { useEffect } from 'react'
import { setStoredPersona } from '@/lib/persona'
import type { Persona } from '@/lib/persona'

interface Props { persona: Persona }

export function SetPersonaOnMount({ persona }: Props) {
  useEffect(() => {
    setStoredPersona(persona)
  }, [persona])
  return null
}
