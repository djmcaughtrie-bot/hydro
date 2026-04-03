import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonaSelector } from '@/components/PersonaSelector'

describe('PersonaSelector', () => {
  it('renders General, Energy, Performance, Longevity links', () => {
    render(<PersonaSelector current={null} />)
    expect(screen.getByRole('link', { name: 'General' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Energy' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Performance' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Longevity' })).toBeDefined()
  })

  it('marks General as active when current is null', () => {
    render(<PersonaSelector current={null} />)
    const general = screen.getByRole('link', { name: 'General' })
    expect(general.className).toContain('bg-teal')
  })

  it('marks the active persona with teal background', () => {
    render(<PersonaSelector current="energy" />)
    const energy = screen.getByRole('link', { name: 'Energy' })
    expect(energy.className).toContain('bg-teal')
    const general = screen.getByRole('link', { name: 'General' })
    expect(general.className).not.toContain('bg-teal')
  })

  it('persona links point to correct ?persona= URLs', () => {
    render(<PersonaSelector current={null} />)
    expect(screen.getByRole('link', { name: 'Energy' })).toHaveAttribute('href', '?persona=energy')
    expect(screen.getByRole('link', { name: 'Performance' })).toHaveAttribute('href', '?persona=performance')
    expect(screen.getByRole('link', { name: 'Longevity' })).toHaveAttribute('href', '?persona=longevity')
  })

  it('General link clears persona param', () => {
    render(<PersonaSelector current="energy" />)
    expect(screen.getByRole('link', { name: 'General' })).toHaveAttribute('href', '?')
  })
})
