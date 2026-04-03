import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyForm } from '@/components/admin/StudyForm'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}))

const mockFetch = vi.fn()

describe('StudyForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders title, summary, study type, evidence level, and category fields', () => {
    render(<StudyForm />)
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/summary/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/study type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/evidence level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/energy/i)).toBeInTheDocument()
  })

  it('shows validation error when title is empty on submit', async () => {
    const user = userEvent.setup()
    render(<StudyForm />)
    await user.click(screen.getByRole('button', { name: /save study/i }))
    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
  })

  it('shows validation error when no category selected on submit', async () => {
    const user = userEvent.setup()
    render(<StudyForm />)
    await user.type(screen.getByLabelText(/title/i), 'Test study')
    await user.type(screen.getByLabelText(/summary/i), 'Test summary')
    await user.click(screen.getByRole('button', { name: /save study/i }))
    expect(screen.getByText(/at least one category/i)).toBeInTheDocument()
  })

  it('calls POST /api/admin/studies on submit for new study', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-id' }) })
    const user = userEvent.setup()
    render(<StudyForm />)
    await user.type(screen.getByLabelText(/title/i), 'Test study')
    await user.type(screen.getByLabelText(/summary/i), 'Test summary')
    await user.click(screen.getByLabelText(/energy/i))
    await user.click(screen.getByRole('button', { name: /save study/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('calls PATCH /api/admin/studies/abc on submit for edit', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    const user = userEvent.setup()
    render(<StudyForm
      studyId="abc"
      initialData={{
        title: 'Existing',
        summary: 'Existing summary',
        study_type: 'Human RCT',
        evidence_level: 'Strong',
        categories: ['energy'],
        is_featured: false,
        is_published: true,
      }}
    />)
    await user.click(screen.getByRole('button', { name: /save study/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/studies/abc',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('redirects to /admin/science on successful save', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-id' }) })
    const user = userEvent.setup()
    render(<StudyForm />)
    await user.type(screen.getByLabelText(/title/i), 'Test study')
    await user.type(screen.getByLabelText(/summary/i), 'Test summary')
    await user.click(screen.getByLabelText(/energy/i))
    await user.click(screen.getByRole('button', { name: /save study/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/science')
    })
  })
})
