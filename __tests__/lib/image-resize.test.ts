// __tests__/lib/image-resize.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resizeImage } from '@/lib/image-resize'

// Mock URL APIs
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock'),
  revokeObjectURL: vi.fn(),
})

// Mock Image constructor — regular function so it works with `new`
const mockImage = {
  naturalWidth: 1400,
  naturalHeight: 900,
  onload: null as (() => void) | null,
  set src(_: string) { this.onload?.() },
}
vi.stubGlobal('Image', vi.fn(function() { return mockImage }))

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
    mockCanvas.width = 0
    mockCanvas.height = 0
  })

  it('returns a File with the correct name and type', async () => {
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    const result = await resizeImage(file, 800, 600, 'center')
    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('hero.jpg')
    expect(result.type).toBe('image/jpeg')
  })

  it('sets canvas width and height to target dimensions', async () => {
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    await resizeImage(file, 800, 600, 'center')
    expect(mockCanvas.width).toBe(800)
    expect(mockCanvas.height).toBe(600)
  })

  it('calls ctx.drawImage with correct crop region for center focal point', async () => {
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    await resizeImage(file, 800, 600, 'center')
    expect(mockCtx.drawImage).toHaveBeenCalledOnce()
    const args = mockCtx.drawImage.mock.calls[0]
    // For 1400x900 → 800x600 center:
    // scale = max(800/1400, 600/900) = max(0.571, 0.667) = 0.667
    // cropW = 800/0.667 = 1200, cropH = 600/0.667 = 900
    // sx = (1400-1200)*0.5 = 100, sy = (900-900)*0.5 = 0
    expect(args[1]).toBeCloseTo(100)  // sx
    expect(args[2]).toBeCloseTo(0)    // sy
    expect(args[3]).toBeCloseTo(1200) // cropW
    expect(args[4]).toBeCloseTo(900)  // cropH
    expect(args[7]).toBe(800)         // destWidth
    expect(args[8]).toBe(600)         // destHeight
  })

  it('throws when canvas context is unavailable', async () => {
    mockCanvas.getContext.mockReturnValueOnce(null)
    const file = new File(['data'], 'hero.jpg', { type: 'image/jpeg' })
    await expect(resizeImage(file, 800, 600, 'center')).rejects.toThrow('Canvas context unavailable')
  })
})
