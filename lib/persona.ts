export type Persona = 'energy' | 'performance' | 'longevity'
export const PERSONAS: Persona[] = ['energy', 'performance', 'longevity']
export const DEFAULT_PERSONA: Persona = 'energy'

const STORAGE_KEY = 'h2r_persona'

export function isValidPersona(value: string | null | undefined): value is Persona {
  return PERSONAS.includes(value as Persona)
}

// Server-safe: reads from searchParams only (no window, no localStorage)
export function resolvePersonaServer(searchParams: { persona?: string }): Persona {
  return isValidPersona(searchParams.persona ?? null) ? (searchParams.persona as Persona) : DEFAULT_PERSONA
}

// Client-only: URL param → localStorage → default
export function resolvePersona(): Persona {
  if (typeof window === 'undefined') return DEFAULT_PERSONA
  const fromURL = new URLSearchParams(window.location.search).get('persona')
  if (isValidPersona(fromURL)) {
    localStorage.setItem(STORAGE_KEY, fromURL)
    return fromURL
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isValidPersona(stored)) return stored
  return DEFAULT_PERSONA
}

export function setStoredPersona(persona: Persona): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, persona)
  }
}
