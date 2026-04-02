import { describe, it, expect } from 'vitest'
import { extractUtmParams } from '@/lib/utils'

describe('extractUtmParams', () => {
  it('extracts utm_source, utm_medium, utm_campaign from a URL', () => {
    const url = 'https://h2revive.co.uk/start?utm_source=instagram&utm_medium=social&utm_campaign=launch'
    const result = extractUtmParams(url)
    expect(result).toEqual({
      utm_source: 'instagram',
      utm_medium: 'social',
      utm_campaign: 'launch',
    })
  })

  it('returns null for missing UTM params', () => {
    const result = extractUtmParams('https://h2revive.co.uk/start')
    expect(result).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    })
  })

  it('handles partial UTM params', () => {
    const result = extractUtmParams('https://h2revive.co.uk/start?utm_source=google')
    expect(result.utm_source).toBe('google')
    expect(result.utm_medium).toBeNull()
    expect(result.utm_campaign).toBeNull()
  })
})
