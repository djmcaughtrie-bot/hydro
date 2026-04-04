import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUTMParams, getUTMParamsWithFallback } from '@/lib/utm'

describe('UTM utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })
  })

  describe('getUTMParams', () => {
    it('returns empty object when no UTM params in URL', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      })
      const result = getUTMParams()
      expect(result).toEqual({})
    })

    it('returns utm_source when present', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?utm_source=google' },
        writable: true,
      })
      const result = getUTMParams()
      expect(result.utm_source).toBe('google')
    })

    it('returns all five UTM params when present', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?utm_source=meta&utm_medium=cpc&utm_campaign=energy-fatigue&utm_content=ceo-video&utm_term=hydrogen' },
        writable: true,
      })
      const result = getUTMParams()
      expect(result).toEqual({
        utm_source:   'meta',
        utm_medium:   'cpc',
        utm_campaign: 'energy-fatigue',
        utm_content:  'ceo-video',
        utm_term:     'hydrogen',
      })
    })

    it('omits keys with no value (undefined not included)', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?utm_source=email' },
        writable: true,
      })
      const result = getUTMParams()
      expect(result.utm_medium).toBeUndefined()
      expect(result.utm_campaign).toBeUndefined()
    })
  })

  describe('getUTMParamsWithFallback', () => {
    it('returns current URL params and saves to sessionStorage when utm_source present', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?utm_source=google&utm_medium=cpc' },
        writable: true,
      })
      const result = getUTMParamsWithFallback()
      expect(result.utm_source).toBe('google')
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'h2r_utms',
        JSON.stringify({ utm_source: 'google', utm_medium: 'cpc' })
      )
    })

    it('returns sessionStorage fallback when no UTMs in URL', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      })
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(
        JSON.stringify({ utm_source: 'email', utm_campaign: 'energy-onboarding' })
      )
      const result = getUTMParamsWithFallback()
      expect(result.utm_source).toBe('email')
      expect(result.utm_campaign).toBe('energy-onboarding')
    })

    it('returns empty object when no UTMs in URL or sessionStorage', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      })
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(null)
      const result = getUTMParamsWithFallback()
      expect(result).toEqual({})
    })
  })
})
