import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock URL APIs
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock'),
  revokeObjectURL: vi.fn(),
})

// Mock Image constructor
const mockImage = {
  naturalWidth: 1400,
  naturalHeight: 900,
  onload: null as (() => void) | null,
  set src(_: string) { this.onload?.() },
}
vi.stubGlobal('Image', vi.fn(() => mockImage))

// Mock Canvas
const mockCtx = { drawImage: vi.fn() }
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
  toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
    cb(new Blob(['resized'], { type: 'image/jpeg' }))
  }),
}
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
  return document.createElement(tag)
})

describe('resizeImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset canvas size so each test starts clean
    mockCanvas.width = 0
    mockCanvas.height = 0
  })

  it('returns a File with the target dimensions in its name context', async () => {
    const { resizeImage } = await import('@/lib/image-resize')
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    const result = await resizeImage(file, 800, 600, 'center')
    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('hero.jpg')
    expect(result.type).toBe('image/jpeg')
  })

  it('sets canvas width and height to target dimensions', async () => {
    const { resizeImage } = await import('@/lib/image-resize')
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    await resizeImage(file, 800, 600, 'center')
    expect(mockCanvas.width).toBe(800)
    expect(mockCanvas.height).toBe(600)
  })

  it('calls ctx.drawImage with cropped region for focal point', async () => {
    const { resizeImage } = await import('@/lib/image-resize')
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    await resizeImage(file, 800, 600, 'center')
    expect(mockCtx.drawImage).toHaveBeenCalledOnce()
    const args = mockCtx.drawImage.mock.calls[0]
    // drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH)
    expect(args[7]).toBe(800) // destWidth
    expect(args[8]).toBe(600) // destHeight
  })

  it('throws when canvas context is unavailable', async () => {
    mockCanvas.getContext.mockReturnValueOnce(null)
    const { resizeImage } = await import('@/lib/image-resize')
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    await expect(resizeImage(file, 800, 600, 'center')).rejects.toThrow('Canvas context unavailable')
  })
})
