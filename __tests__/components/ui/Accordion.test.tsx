import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion } from '@/components/ui/Accordion'

const items = [
  { question: 'First question?', answer: 'First answer.' },
  { question: 'Second question?', answer: 'Second answer.' },
]

describe('Accordion', () => {
  it('renders all questions', () => {
    render(<Accordion items={items} />)
    expect(screen.getByText('First question?')).toBeInTheDocument()
    expect(screen.getByText('Second question?')).toBeInTheDocument()
  })

  it('starts with all items collapsed (aria-expanded false)', () => {
    render(<Accordion items={items} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect(btn).toHaveAttribute('aria-expanded', 'false'))
  })

  it('sets aria-expanded true when item is opened', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)
    await user.click(screen.getByRole('button', { name: /first question/i }))
    expect(screen.getByRole('button', { name: /first question/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes an open item when clicked again', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)
    const btn = screen.getByRole('button', { name: /first question/i })
    await user.click(btn)
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the first item when second is opened', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)
    await user.click(screen.getByRole('button', { name: /first question/i }))
    await user.click(screen.getByRole('button', { name: /second question/i }))
    expect(screen.getByRole('button', { name: /first question/i })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: /second question/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows answer text when item is opened', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)
    await user.click(screen.getByRole('button', { name: /first question/i }))
    expect(screen.getByText('First answer.')).toBeInTheDocument()
  })
})
