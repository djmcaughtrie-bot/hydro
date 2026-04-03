import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImagePanel } from '@/components/admin/ImagePanel'
import type { ImageGuidelines } from '@/lib/content-config'

const mockFetch = vi.fn()
vi.mock('@/lib/image-resize', () => ({
  resizeImage: vi.fn(async (file: File) => file),
}))

const guidelines: ImageGuidelines = {
  desktopDimensions: [1400, 900],
  mobileDimensions: [800, 1000],
  maxFileSizeKb: 400,
}

describe('ImagePanel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })
  })

  it('renders desktop and mobile image slots', () => {
    render(
      <ImagePanel contentJson={{}} imageGuidelines={guidelines} onChange={vi.fn()} />
    )
    expect(screen.getByText(/desktop image/i)).toBeInTheDocument()
    expect(screen.getByText(/mobile image/i)).toBeInTheDocument()
  })

  it('shows existing image url when contentJson has image_url', () => {
    render(
      <ImagePanel
        contentJson={{ image_url: 'https://cdn.test/hero.jpg' }}
        imageGuidelines={guidelines}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByRole('img', { name: /desktop/i })).toBeInTheDocument()
  })

  it('shows alt text field when image_url is present', () => {
    render(
      <ImagePanel
        contentJson={{ image_url: 'https://cdn.test/hero.jpg', image_alt: 'Hero image' }}
        imageGuidelines={guidelines}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('Hero image')).toBeInTheDocument()
  })

  it('calls onChange with image fields when alt text changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ImagePanel
        contentJson={{ image_url: 'https://cdn.test/hero.jpg', image_alt: '' }}
        imageGuidelines={guidelines}
        onChange={onChange}
      />
    )
    const altInput = screen.getByLabelText(/alt text/i)
    await user.clear(altInput)
    await user.type(altInput, 'Woman at rest')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ image_alt: 'Woman at rest' }))
  })

  it('shows size warning when file exceeds maxFileSizeKb', async () => {
    const user = userEvent.setup()
    render(<ImagePanel contentJson={{}} imageGuidelines={guidelines} onChange={vi.fn()} />)
    const input = screen.getByTestId('desktop-file-input')
    // 401KB file (just over the 400KB limit)
    const largeFile = new File(['x'.repeat(401 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    await user.upload(input, largeFile)
    await waitFor(() => {
      expect(screen.getByText(/exceeds/i)).toBeInTheDocument()
    })
  })
})
