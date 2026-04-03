import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageLibraryPicker } from '@/components/admin/ImageLibraryPicker'
import type { MediaItem } from '@/lib/types'

const mockFetch = vi.fn()

const imageItem: MediaItem = {
  id: 'm-1', created_at: '2026-04-03T10:00:00Z', filename: 'hero.jpg',
  url: 'https://cdn.test/hero.jpg', width: 1400, height: 900,
  file_size_kb: 320, focal_point: 'center', media_type: 'image',
  uploaded_at: '2026-04-03T10:00:00Z',
}

const videoItem: MediaItem = {
  id: 'm-2', created_at: '2026-04-03T10:00:00Z', filename: 'ambient.mp4',
  url: 'https://cdn.test/ambient.mp4', width: 0, height: 0,
  file_size_kb: 4000, focal_point: 'center', media_type: 'video-ambient',
  uploaded_at: '2026-04-03T10:00:00Z',
}

describe('ImageLibraryPicker', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
  })

  it('shows loading state then renders image items from API', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [imageItem, videoItem] })
    render(
      <ImageLibraryPicker
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('hero.jpg')).toBeInTheDocument()
    })
    // Video items should not appear in image picker
    expect(screen.queryByText('ambient.mp4')).not.toBeInTheDocument()
  })

  it('calls onSelect when an image is clicked', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [imageItem] })
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ImageLibraryPicker onSelect={onSelect} onClose={vi.fn()} />)
    await waitFor(() => screen.getByText('hero.jpg'))
    await user.click(screen.getByRole('button', { name: /hero\.jpg/i }))
    expect(onSelect).toHaveBeenCalledWith(imageItem)
  })

  it('calls onClose when close button is clicked', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ImageLibraryPicker onSelect={vi.fn()} onClose={onClose} />)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows oversized warning when file exceeds guidelines', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [imageItem] })
    render(
      <ImageLibraryPicker
        onSelect={vi.fn()}
        onClose={vi.fn()}
        guidelines={{ desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 200 }}
      />
    )
    await waitFor(() => screen.getByText('hero.jpg'))
    expect(screen.getByText(/oversized/i)).toBeInTheDocument()
  })
})
