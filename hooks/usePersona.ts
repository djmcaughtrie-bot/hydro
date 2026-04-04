'use client'

import { useState, useEffect } from 'react'
import { resolvePersona, setStoredPersona } from '@/lib/persona'
import type { Persona } from '@/lib/persona'

export function usePersona() {
  const [persona, setPersonaState] = useState<Persona | null>(null)

  useEffect(() => {
    setPersonaState(resolvePersona())
  }, [])

  const setPersona = (p: Persona) => {
    setStoredPersona(p)
    setPersonaState(p)
    window.history.replaceState({}, '', `?persona=${p}`)
  }

  return { persona, setPersona }
}
