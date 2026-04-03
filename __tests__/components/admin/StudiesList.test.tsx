import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudiesList } from '@/components/admin/StudiesList'
import type { Study } from '@/lib/types'

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({ children }: { children: (p: { innerRef: (el: HTMLElement | null) => void; droppableProps: Record<string, unknown>; placeholder: null }) => React.ReactNode }) =>
    <>{children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null })}</>,
  Draggable: ({ children }: { children: (p: { innerRef: (el: HTMLElement | null) => void; draggableProps: Record<string, unknown>; dragHandleProps: Record<string, unknown> }) => React.ReactNode }) =>
    <>{children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} })}</>,
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const mockFetch = vi.fn()

const studies: Study[] = [
  {
    id: 'study-1',
    title: 'First study',
    authors: 'Author A',
    journal: 'Journal A',
    year: 2023,
    summary: 'Summary A',
    key_finding: 'Finding A',
    study_type: 'Human RCT',
    evidence_level: 'Strong',
    categories: ['energy'],
    doi_url: null,
    pubmed_url: null,
    is_featured: false,
    is_published: true,
    sort_order: 1,
  },
  {
    id: 'study-2',
    title: 'Second study',
    authors: 'Author B',
    journal: 'Journal B',
    year: 2022,
    summary: 'Summary B',
    key_finding: 'Finding B',
    study_type: 'Animal',
    evidence_level: 'Emerging',
    categories: ['recovery'],
    doi_url: null,
    pubmed_url: null,
    is_featured: true,
    is_published: false,
    sort_order: 2,
  },
]

describe('StudiesList', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders all studies', () => {
    render(<StudiesList studies={studies} />)
    expect(screen.getByText('First study')).toBeInTheDocument()
    expect(screen.getByText('Second study')).toBeInTheDocument()
  })

  it('renders unpublished study with opacity class', () => {
    render(<StudiesList studies={studies} />)
    const row = screen.getByTestId('study-row-study-2')
    expect(row).toHaveClass('opacity-60')
  })

  it('featured toggle calls PATCH with is_featured: true for unfeatured study', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<StudiesList studies={studies} />)
    const featureBtn = screen.getAllByRole('button', { name: /feature/i })[0]
    await user.click(featureBtn)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies/study-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ is_featured: true }),
        })
      )
    })
  })

  it('published toggle calls PATCH with is_published: true for hidden study', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<StudiesList studies={studies} />)
    const hiddenBtn = screen.getByRole('button', { name: /hidden/i })
    await user.click(hiddenBtn)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies/study-2',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ is_published: true }),
        })
      )
    })
  })

  it('delete button calls DELETE after confirm', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('confirm', () => true)
    const user = userEvent.setup()
    render(<StudiesList studies={studies} />)
    const deleteBtn = screen.getAllByRole('button', { name: /delete/i })[0]
    await user.click(deleteBtn)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies/study-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
