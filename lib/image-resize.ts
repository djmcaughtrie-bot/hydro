type FocalPoint =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'center' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right'

const FOCAL_OFFSETS: Record<FocalPoint, [number, number]> = {
  'top-left':     [0,   0],
  'top':          [0.5, 0],
  'top-right':    [1,   0],
  'left':         [0,   0.5],
  'center':       [0.5, 0.5],
  'right':        [1,   0.5],
  'bottom-left':  [0,   1],
  'bottom':       [0.5, 1],
  'bottom-right': [1,   1],
}

export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  focalPoint: FocalPoint,
): Promise<File> {
  const objectUrl = URL.createObjectURL(file)

  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = objectUrl
  })

  const srcW = img.naturalWidth
  const srcH = img.naturalHeight

  // Scale to cover target dimensions (scale-to-fill, may crop)
  const scaleX = targetWidth / srcW
  const scaleY = targetHeight / srcH
  const scale = Math.max(scaleX, scaleY)

  // Crop region in source coordinates (pre-scale)
  const cropW = targetWidth / scale
  const cropH = targetHeight / scale

  const [xFrac, yFrac] = FOCAL_OFFSETS[focalPoint] ?? FOCAL_OFFSETS.center
  const sx = (srcW - cropW) * xFrac
  const sy = (srcH - cropH) * yFrac

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, targetWidth, targetHeight)

  URL.revokeObjectURL(objectUrl)

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('Canvas toBlob failed')); return }
        resolve(new File([blob], file.name, { type: file.type }))
      },
      file.type,
      0.88,
    )
  })
}
