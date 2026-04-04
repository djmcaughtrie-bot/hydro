import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersona } from '@/hooks/usePersona'

vi.mock('@/lib/persona', () => ({
  resolvePersona: vi.fn(() => null),
  setStoredPersona: vi.fn(),
  PERSONAS: ['energy', 'performance', 'longevity'],
}))

describe('usePersona', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { search: '', href: 'http://localhost/' },
      writable: true,
    })
    window.history.replaceState = vi.fn()
  })

  it('initialises with null (general)', async () => {
    const { resolvePersona } = await import('@/lib/persona')
    vi.mocked(resolvePersona).mockReturnValue(null)
    const { result } = renderHook(() => usePersona())
    expect(result.current.persona).toBeNull()
  })

  it('initialises with resolved persona from URL/localStorage', async () => {
    const { resolvePersona } = await import('@/lib/persona')
    vi.mocked(resolvePersona).mockReturnValue('performance')
    const { result } = renderHook(() => usePersona())
    expect(result.current.persona).toBe('performance')
  })

  it('setPersona updates persona state', async () => {
    const { resolvePersona } = await import('@/lib/persona')
    vi.mocked(resolvePersona).mockReturnValue(null)
    const { result } = renderHook(() => usePersona())
    act(() => {
      result.current.setPersona('longevity')
    })
    expect(result.current.persona).toBe('longevity')
  })

  it('setPersona calls setStoredPersona', async () => {
    const { resolvePersona, setStoredPersona } = await import('@/lib/persona')
    vi.mocked(resolvePersona).mockReturnValue(null)
    const { result } = renderHook(() => usePersona())
    act(() => {
      result.current.setPersona('energy')
    })
    expect(setStoredPersona).toHaveBeenCalledWith('energy')
  })

  it('setPersona calls history.replaceState with persona param', async () => {
    const { resolvePersona } = await import('@/lib/persona')
    vi.mocked(resolvePersona).mockReturnValue(null)
    const { result } = renderHook(() => usePersona())
    act(() => {
      result.current.setPersona('energy')
    })
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '?persona=energy')
  })
})
