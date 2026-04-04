import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PersonaSelector } from '@/components/PersonaSelector'

// Mock usePersona hook
const mockSetPersona = vi.fn()
let mockPersona: string | null = null

vi.mock('@/hooks/usePersona', () => ({
  usePersona: () => ({ persona: mockPersona, setPersona: mockSetPersona }),
}))

describe('PersonaSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPersona = null
    window.history.replaceState = vi.fn()
    Object.defineProperty(window, 'localStorage', {
      value: { removeItem: vi.fn(), getItem: vi.fn(), setItem: vi.fn() },
      writable: true,
    })
  })

  it('renders General, Energy, Performance, Longevity buttons', () => {
    render(<PersonaSelector />)
    expect(screen.getByRole('button', { name: 'General' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Energy' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Performance' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Longevity' })).toBeDefined()
  })

  it('marks General as active when persona is null', () => {
    mockPersona = null
    render(<PersonaSelector />)
    const general = screen.getByRole('button', { name: 'General' })
    expect(general.className).toContain('bg-teal')
  })

  it('marks the active persona with teal background', () => {
    mockPersona = 'energy'
    render(<PersonaSelector />)
    const energy = screen.getByRole('button', { name: 'Energy' })
    expect(energy.className).toContain('bg-teal')
    const general = screen.getByRole('button', { name: 'General' })
    expect(general.className).not.toContain('bg-teal')
  })

  it('clicking a persona button calls setPersona', () => {
    mockPersona = null
    render(<PersonaSelector />)
    fireEvent.click(screen.getByRole('button', { name: 'Performance' }))
    expect(mockSetPersona).toHaveBeenCalledWith('performance')
  })

  it('clicking a persona button calls setPersona with longevity', () => {
    mockPersona = null
    render(<PersonaSelector />)
    fireEvent.click(screen.getByRole('button', { name: 'Longevity' }))
    expect(mockSetPersona).toHaveBeenCalledWith('longevity')
  })
})
