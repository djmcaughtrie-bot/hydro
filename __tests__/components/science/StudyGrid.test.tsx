import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyGrid } from '@/components/science/StudyGrid'
import type { Study } from '@/lib/types'

const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => mockSearchParams),
  useRouter: vi.fn(() => ({ push: mockPush })),
  usePathname: vi.fn(() => '/science'),
}))

const makeStudy = (overrides: Partial<Study> & { id: string; title: string; categories: string[] }): Study => ({
  authors: null,
  journal: null,
  year: null,
  summary: 'Test summary.',
  key_finding: null,
  study_type: 'Animal',
  evidence_level: 'Strong',
  doi_url: null,
  pubmed_url: null,
  is_featured: false,
  ...overrides,
})

const studies: Study[] = [
  makeStudy({ id: '1', title: 'Energy study', categories: ['energy'] }),
  makeStudy({ id: '2', title: 'Recovery study', categories: ['recovery'] }),
  makeStudy({ id: '3', title: 'Multi-category study', categories: ['energy', 'longevity'] }),
]

describe('StudyGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.delete('category')
  })

  it('renders all studies when no category filter is active', () => {
    render(<StudyGrid studies={studies} />)
    expect(screen.getByText('Energy study')).toBeInTheDocument()
    expect(screen.getByText('Recovery study')).toBeInTheDocument()
    expect(screen.getByText('Multi-category study')).toBeInTheDocument()
  })

  it('renders filter pills for each unique category present in studies', () => {
    render(<StudyGrid studies={studies} />)
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'energy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'recovery' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'longevity' })).toBeInTheDocument()
  })

  it('filters studies when a category pill is clicked', async () => {
    const user = userEvent.setup()
    render(<StudyGrid studies={studies} />)
    await user.click(screen.getByRole('button', { name: 'recovery' }))
    expect(mockPush).toHaveBeenCalledWith('?category=recovery', { scroll: false })
  })

  it('shows only matching studies when initialCategory is set', () => {
    render(<StudyGrid studies={studies} initialCategory="recovery" />)
    expect(screen.getByText('Recovery study')).toBeInTheDocument()
    expect(screen.queryByText('Energy study')).not.toBeInTheDocument()
  })

  it('clears category param when All pill is clicked', async () => {
    const user = userEvent.setup()
    render(<StudyGrid studies={studies} />)
    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(mockPush).toHaveBeenCalledWith('/science', { scroll: false })
  })

  it('shows empty state when no studies match filter', () => {
    const sparseStudies: Study[] = [
      makeStudy({ id: '1', title: 'Only energy study', categories: ['energy'] }),
    ]
    render(<StudyGrid studies={sparseStudies} initialCategory="recovery" />)
    expect(screen.getByText(/no studies found/i)).toBeInTheDocument()
  })
})
