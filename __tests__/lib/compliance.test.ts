import { describe, it, expect } from 'vitest'
import { checkCompliance } from '@/lib/compliance'

describe('checkCompliance', () => {
  it('returns pass:true when no prohibited words present', () => {
    const result = checkCompliance({ headline: 'Hydrogen may support energy levels' })
    expect(result.pass).toBe(true)
  })

  it('returns pass:false with violation when prohibited word found', () => {
    const result = checkCompliance({ body: 'This product treats chronic fatigue.' })
    expect(result.pass).toBe(false)
    if (!result.pass) {
      expect(result.violations).toEqual([{ field: 'body', word: 'treats' }])
    }
  })

  it('catches violations across multiple fields', () => {
    const result = checkCompliance({
      headline: 'Proven to help recovery',
      body: 'This cures inflammation',
    })
    expect(result.pass).toBe(false)
    if (!result.pass) {
      expect(result.violations).toHaveLength(2)
      expect(result.violations).toContainEqual({ field: 'headline', word: 'proven to help' })
      expect(result.violations).toContainEqual({ field: 'body', word: 'cures' })
    }
  })

  it('is case-insensitive', () => {
    const result = checkCompliance({ headline: 'TREATS inflammation' })
    expect(result.pass).toBe(false)
  })

  it('catches multi-word prohibited phrases', () => {
    const result = checkCompliance({ body: 'Studies proven to help reduce fatigue' })
    expect(result.pass).toBe(false)
    if (!result.pass) {
      expect(result.violations[0].word).toBe('proven to help')
    }
  })

  it('skips non-string values without throwing', () => {
    const result = checkCompliance({
      count: 42 as unknown as string,
      image_url: null as unknown as string,
    })
    expect(result.pass).toBe(true)
  })
})
