import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isValidPersona, resolvePersonaServer, DEFAULT_PERSONA, PERSONAS } from '@/lib/persona'

describe('persona utilities', () => {
  describe('isValidPersona', () => {
    it('returns true for energy', () => {
      expect(isValidPersona('energy')).toBe(true)
    })

    it('returns true for performance', () => {
      expect(isValidPersona('performance')).toBe(true)
    })

    it('returns true for longevity', () => {
      expect(isValidPersona('longevity')).toBe(true)
    })

    it('returns false for invalid value', () => {
      expect(isValidPersona('sarah')).toBe(false)
    })

    it('returns false for null', () => {
      expect(isValidPersona(null)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidPersona('')).toBe(false)
    })
  })

  describe('resolvePersonaServer', () => {
    it('returns the persona when valid', () => {
      expect(resolvePersonaServer({ persona: 'performance' })).toBe('performance')
    })

    it('returns DEFAULT_PERSONA when persona is undefined', () => {
      expect(resolvePersonaServer({})).toBe(DEFAULT_PERSONA)
    })

    it('returns DEFAULT_PERSONA when persona is invalid', () => {
      expect(resolvePersonaServer({ persona: 'sarah' })).toBe(DEFAULT_PERSONA)
    })
  })

  describe('constants', () => {
    it('DEFAULT_PERSONA is energy', () => {
      expect(DEFAULT_PERSONA).toBe('energy')
    })

    it('PERSONAS contains all three values', () => {
      expect(PERSONAS).toEqual(['energy', 'performance', 'longevity'])
    })
  })
})
