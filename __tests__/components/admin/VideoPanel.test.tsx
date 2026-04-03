import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VideoPanel } from '@/components/admin/VideoPanel'

const mockFetch = vi.fn()

describe('VideoPanel — ambient', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })
  })

  it('renders ambient video upload controls', () => {
    render(
      <VideoPanel contentJson={{}} videoType="ambient" lazyLoadDefault={true} onChange={vi.fn()} />
    )
    expect(screen.getByText(/ambient video/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /autoplay/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /loop/i })).toBeInTheDocument()
  })

  it('shows lazy-load warning for above-fold sections (lazyLoadDefault=false)', () => {
    render(
      <VideoPanel contentJson={{}} videoType="ambient" lazyLoadDefault={false} onChange={vi.fn()} />
    )
    expect(screen.getByText(/above.fold/i)).toBeInTheDocument()
  })

  it('calls onChange when autoplay toggle changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <VideoPanel contentJson={{}} videoType="ambient" lazyLoadDefault={true} onChange={onChange} />
    )
    await user.click(screen.getByRole('checkbox', { name: /autoplay/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ video_autoplay: true }))
  })
})

describe('VideoPanel — content', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('renders content video URL input and accessible title', () => {
    render(
      <VideoPanel contentJson={{}} videoType="content" lazyLoadDefault={true} onChange={vi.fn()} />
    )
    expect(screen.getByLabelText(/stream url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/accessible title/i)).toBeInTheDocument()
  })

  it('does not show autoplay for content video', () => {
    render(
      <VideoPanel contentJson={{}} videoType="content" lazyLoadDefault={true} onChange={vi.fn()} />
    )
    expect(screen.queryByRole('checkbox', { name: /autoplay/i })).not.toBeInTheDocument()
  })

  it('calls onChange when stream URL is typed', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <VideoPanel contentJson={{}} videoType="content" lazyLoadDefault={true} onChange={onChange} />
    )
    await user.type(screen.getByLabelText(/stream url/i), 'https://stream.mux.com/abc')
    // Should be called multiple times as user types
    expect(onChange).toHaveBeenCalled()
    // Since input is controlled and contentJson isn't updated, just verify structure
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ video_url: expect.any(String) }))
  })
})
