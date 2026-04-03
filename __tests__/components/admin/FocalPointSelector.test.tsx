import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FocalPointSelector } from '@/components/admin/FocalPointSelector'

const POINTS = [
  'top-left','top','top-right',
  'left','center','right',
  'bottom-left','bottom','bottom-right',
]

describe('FocalPointSelector', () => {
  it('renders 9 buttons', () => {
    render(<FocalPointSelector value="center" onChange={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(9)
  })

  it('marks the selected focal point as active', () => {
    render(<FocalPointSelector value="top-left" onChange={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /top-left/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onChange with the clicked focal point', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<FocalPointSelector value="center" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /top-right/i }))
    expect(onChange).toHaveBeenCalledWith('top-right')
  })

  it('all 9 focal point values are reachable', () => {
    render(<FocalPointSelector value="center" onChange={vi.fn()} />)
    for (const point of POINTS) {
      expect(screen.getByRole('button', { name: new RegExp(`^${point}$`, 'i') })).toBeInTheDocument()
    }
  })
})
