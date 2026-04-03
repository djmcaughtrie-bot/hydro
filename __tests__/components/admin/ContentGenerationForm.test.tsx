import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentGenerationForm } from '@/components/admin/ContentGenerationForm'

const mockFetch = vi.fn()
const mockOnGenerated = vi.fn()

describe('ContentGenerationForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders page selector, section selector, persona selector, and generate button', () => {
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    expect(screen.getByLabelText(/page/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/section/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/persona/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
  })

  it('populates section options when a page is selected', async () => {
    const user = userEvent.setup()
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    await user.selectOptions(screen.getByLabelText(/page/i), 'homepage')
    const sectionSelect = screen.getByLabelText(/section/i) as HTMLSelectElement
    // homepage has 4 sections (hero, features, social-proof, faq) plus placeholder
    expect(sectionSelect.options.length).toBeGreaterThanOrEqual(2)
  })

  it('calls POST /api/generate-content with correct body on submit', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'item-1', status: 'draft' }),
    })
    const user = userEvent.setup()
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    await user.selectOptions(screen.getByLabelText(/page/i), 'homepage')
    await user.selectOptions(screen.getByLabelText(/section/i), 'hero')
    await user.selectOptions(screen.getByLabelText(/persona/i), 'sarah')
    await user.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/generate-content',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"page":"homepage"'),
        })
      )
    })
  })

  it('calls onGenerated with item id and status on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'item-1', status: 'draft' }),
    })
    const user = userEvent.setup()
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    await user.selectOptions(screen.getByLabelText(/page/i), 'homepage')
    await user.selectOptions(screen.getByLabelText(/section/i), 'hero')
    await user.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalledWith('item-1', 'draft')
    })
  })

  it('shows needs_review warning when status is needs_review', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'item-1', status: 'needs_review' }),
    })
    const user = userEvent.setup()
    render(<ContentGenerationForm onGenerated={mockOnGenerated} />)
    await user.selectOptions(screen.getByLabelText(/page/i), 'homepage')
    await user.selectOptions(screen.getByLabelText(/section/i), 'hero')
    await user.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => {
      expect(screen.getByText(/needs review/i)).toBeInTheDocument()
    })
  })
})
