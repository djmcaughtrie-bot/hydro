export type Persona = 'energy' | 'performance' | 'longevity'
export const PERSONAS: Persona[] = ['energy', 'performance', 'longevity']

const STORAGE_KEY = 'h2r_persona'

export function isValidPersona(value: string | null | undefined): value is Persona {
  return PERSONAS.includes(value as Persona)
}

// Server-safe: reads from searchParams only (no window, no localStorage)
export function resolvePersonaServer(searchParams: { persona?: string }): Persona | null {
  return isValidPersona(searchParams.persona ?? null) ? (searchParams.persona as Persona) : null
}

// Client-only: URL param → localStorage → null (general)
export function resolvePersona(): Persona | null {
  if (typeof window === 'undefined') return null
  const fromURL = new URLSearchParams(window.location.search).get('persona')
  if (isValidPersona(fromURL)) {
    localStorage.setItem(STORAGE_KEY, fromURL)
    return fromURL
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isValidPersona(stored)) return stored
  return null
}

export function setStoredPersona(persona: Persona): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, persona)
  }
}
