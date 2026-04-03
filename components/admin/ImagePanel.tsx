'use client'

import { useRef, useState } from 'react'
import type { ImageGuidelines } from '@/lib/content-config'
import type { MediaItem } from '@/lib/types'
import { FocalPointSelector } from './FocalPointSelector'
import { ImageLibraryPicker } from './ImageLibraryPicker'
import { resizeImage } from '@/lib/image-resize'

type FocalPoint =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'center' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right'

interface Props {
  contentJson: Record<string, unknown>
  imageGuidelines?: ImageGuidelines
  onChange: (updates: Record<string, unknown>) => void
}

type Slot = 'desktop' | 'mobile'

interface ResizeState {
  file: File
  slot: Slot
  objectUrl: string
  focalPoint: FocalPoint
}

interface SuggestedMeta {
  alt: string
  title: string
  caption: string
}

interface MetaFieldsProps {
  prefix: string
  url: string | undefined
  contentJson: Record<string, unknown>
  onChange: (updates: Record<string, unknown>) => void
  generatingMeta?: boolean
  suggestedMeta?: SuggestedMeta | null
}

function MetaFields({ prefix, url, contentJson, onChange, generatingMeta, suggestedMeta }: MetaFieldsProps) {
  const [alt, setAlt] = useState((contentJson[`${prefix}_alt`] as string) ?? '')
  const [title, setTitle] = useState((contentJson[`${prefix}_title`] as string) ?? '')
  const [caption, setCaption] = useState((contentJson[`${prefix}_caption`] as string) ?? '')

  // When the image URL changes (new upload or library pick), reset the text fields
  const prevUrlRef = useRef<string | undefined>(url)
  if (url !== prevUrlRef.current) {
    prevUrlRef.current = url
    setAlt((contentJson[`${prefix}_alt`] as string) ?? '')
    setTitle((contentJson[`${prefix}_title`] as string) ?? '')
    setCaption((contentJson[`${prefix}_caption`] as string) ?? '')
  }

  // When AI-generated meta arrives, apply it to local state and propagate up
  const prevSuggestedRef = useRef<SuggestedMeta | null | undefined>(suggestedMeta)
  if (suggestedMeta && suggestedMeta !== prevSuggestedRef.current) {
    prevSuggestedRef.current = suggestedMeta
    setAlt(suggestedMeta.alt)
    setTitle(suggestedMeta.title)
    setCaption(suggestedMeta.caption)
    onChange({
      [`${prefix}_alt`]: suggestedMeta.alt,
      [`${prefix}_title`]: suggestedMeta.title,
      [`${prefix}_caption`]: suggestedMeta.caption,
    })
  }

  if (!url) return null
  return (
    <div className="mt-3 space-y-2">
      {generatingMeta && (
        <p className="font-mono text-xs text-teal">✦ Generating metadata…</p>
      )}
      <div>
        <label htmlFor={`${prefix}_alt`} className="font-sans text-xs font-medium text-ink">
          Alt text <span className="text-red-500">*</span>
          <span className="ml-1 font-mono text-xs text-ink-light">accessibility · SEO signal</span>
        </label>
        <input
          id={`${prefix}_alt`}
          type="text"
          value={alt}
          onChange={(e) => { setAlt(e.target.value); onChange({ [`${prefix}_alt`]: e.target.value }) }}
          className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
        />
      </div>
      <div>
        <label htmlFor={`${prefix}_title`} className="font-sans text-xs font-medium text-ink">
          Title
          <span className="ml-1 font-mono text-xs text-ink-light">tooltip · image search</span>
        </label>
        <input
          id={`${prefix}_title`}
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); onChange({ [`${prefix}_title`]: e.target.value }) }}
          className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
        />
      </div>
      <div>
        <label htmlFor={`${prefix}_caption`} className="font-sans text-xs font-medium text-ink">
          Caption
          <span className="ml-1 font-mono text-xs text-ink-light">figure element · GEO context</span>
        </label>
        <input
          id={`${prefix}_caption`}
          type="text"
          value={caption}
          onChange={(e) => { setCaption(e.target.value); onChange({ [`${prefix}_caption`]: e.target.value }) }}
          className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
        />
      </div>
    </div>
  )
}

export function ImagePanel({ contentJson, imageGuidelines, onChange }: Props) {
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const [showLibrary, setShowLibrary] = useState(false)
  const [activeSlot, setActiveSlot] = useState<Slot>('desktop')
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [generatingMeta, setGeneratingMeta] = useState<{ desktop: boolean; mobile: boolean }>({ desktop: false, mobile: false })
  const [suggestedMeta, setSuggestedMeta] = useState<{ desktop: SuggestedMeta | null; mobile: SuggestedMeta | null }>({ desktop: null, mobile: null })

  async function generateMeta(imageUrl: string, slot: Slot) {
    setGeneratingMeta(prev => ({ ...prev, [slot]: true }))
    try {
      const res = await fetch('/api/admin/generate-image-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      if (res.ok) {
        const meta = await res.json() as SuggestedMeta
        setSuggestedMeta(prev => ({ ...prev, [slot]: meta }))
      }
    } finally {
      setGeneratingMeta(prev => ({ ...prev, [slot]: false }))
    }
  }

  const desktopUrl = contentJson.image_url as string | undefined
  const mobileUrl = contentJson.mobile_image_url as string | undefined

  async function handleUpload(file: File, slot: Slot, focalPoint: FocalPoint = 'center') {
    setUploading(true)
    setUploadError('')
    // Revoke any pending resize preview URL before clearing
    setResizeState(prev => {
      if (prev) URL.revokeObjectURL(prev.objectUrl)
      return null
    })

    // Read dimensions from image
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.src = objectUrl
    })
    URL.revokeObjectURL(objectUrl)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('width', String(width))
    formData.append('height', String(height))
    formData.append('focal_point', focalPoint)
    formData.append('media_type', 'image')

    try {
      const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Upload failed'); return }

      if (slot === 'desktop') {
        onChange({ image_url: data.url, image_width: data.width, image_height: data.height })
        if (desktopInputRef.current) desktopInputRef.current.value = ''
      } else {
        onChange({ mobile_image_url: data.url, mobile_image_width: data.width, mobile_image_height: data.height })
        if (mobileInputRef.current) mobileInputRef.current.value = ''
      }
      // Reset previous suggestions and generate new metadata
      setSuggestedMeta(prev => ({ ...prev, [slot]: null }))
      generateMeta(data.url, slot)
    } catch {
      setUploadError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileSelect(slot: Slot) {
    return async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const sizeKb = file.size / 1024
      const maxKb = imageGuidelines?.maxFileSizeKb ?? Infinity

      if (sizeKb > maxKb) {
        const objectUrl = URL.createObjectURL(file)
        setResizeState({ file, slot, objectUrl, focalPoint: 'center' })
        return
      }

      await handleUpload(file, slot)
    }
  }

  async function handleResizeAndUpload() {
    if (!resizeState || !imageGuidelines) return
    const { file, slot, focalPoint } = resizeState
    const [targetW, targetH] = slot === 'desktop'
      ? imageGuidelines.desktopDimensions
      : imageGuidelines.mobileDimensions
    const resized = await resizeImage(file, targetW, targetH, focalPoint)
    await handleUpload(resized, slot, focalPoint)
  }

  function handleLibrarySelect(item: MediaItem) {
    setShowLibrary(false)
    if (activeSlot === 'desktop') {
      onChange({
        image_url: item.url, image_width: item.width, image_height: item.height,
        focal_point: item.focal_point,
      })
    } else {
      onChange({
        mobile_image_url: item.url,
        mobile_image_width: item.width,
        mobile_image_height: item.height,
        mobile_focal_point: item.focal_point,
      })
    }
    setSuggestedMeta(prev => ({ ...prev, [activeSlot]: null }))
    generateMeta(item.url, activeSlot)
  }

  return (
    <div className="space-y-5">
      {/* Resize modal */}
      {resizeState && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 font-sans text-sm font-medium text-amber-800">
            ⚠ Image exceeds {imageGuidelines?.maxFileSizeKb}KB limit ({Math.round(resizeState.file.size / 1024)}KB)
          </p>
          <p className="mb-3 font-sans text-xs text-amber-700">
            Choose a focal point, then resize to recommended dimensions.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resizeState.objectUrl} alt="Preview" className="mb-3 max-h-32 rounded object-contain" />
          <FocalPointSelector
            value={resizeState.focalPoint}
            onChange={(fp) => setResizeState(s => s ? { ...s, focalPoint: fp } : s)}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleResizeAndUpload}
              disabled={uploading}
              className="rounded-lg bg-teal px-3 py-1.5 font-sans text-xs font-medium text-white hover:bg-teal-dark disabled:opacity-50"
            >
              {uploading ? 'Resizing…' : 'Resize & Upload'}
            </button>
            <button
              type="button"
              onClick={() => handleUpload(resizeState.file, resizeState.slot)}
              disabled={uploading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
            >
              Upload anyway
            </button>
            <button
              type="button"
              onClick={() => { URL.revokeObjectURL(resizeState.objectUrl); setResizeState(null) }}
              className="rounded-lg px-3 py-1.5 font-sans text-xs text-ink-light hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}

      {/* Desktop slot */}
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
          Desktop image
          {imageGuidelines && (
            <span className="ml-1 font-normal normal-case">
              ({imageGuidelines.desktopDimensions[0]}×{imageGuidelines.desktopDimensions[1]}, max {imageGuidelines.maxFileSizeKb}KB)
            </span>
          )}
        </p>
        {desktopUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={desktopUrl} alt="Desktop preview" aria-label="desktop" className="mb-2 w-full rounded-lg object-cover" style={{ maxHeight: 120 }} />
        ) : (
          <div className="mb-2 flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
            <p className="font-sans text-xs text-ink-light">No image</p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => desktopInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => { setActiveSlot('desktop'); setShowLibrary(true) }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50"
          >
            Browse library
          </button>
        </div>
        <input
          ref={desktopInputRef}
          type="file"
          accept="image/*"
          data-testid="desktop-file-input"
          className="hidden"
          onChange={handleFileSelect('desktop')}
        />
        <MetaFields prefix="image" url={desktopUrl} contentJson={contentJson} onChange={onChange} generatingMeta={generatingMeta.desktop} suggestedMeta={suggestedMeta.desktop} />
      </div>

      {/* Mobile slot */}
      <div className="border-t border-gray-100 pt-4">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
          Mobile image
          <span className="ml-1 font-mono text-xs font-normal normal-case text-ink-light">optional — portrait/square art direction</span>
          {imageGuidelines && (
            <span className="ml-1 font-normal normal-case">
              ({imageGuidelines.mobileDimensions[0]}×{imageGuidelines.mobileDimensions[1]})
            </span>
          )}
        </p>
        {mobileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mobileUrl} alt="Mobile preview" className="mb-2 w-full rounded-lg object-cover" style={{ maxHeight: 80 }} />
        ) : (
          <div className="mb-2 flex h-14 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
            <p className="font-sans text-xs text-ink-light">No image set</p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => mobileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => { setActiveSlot('mobile'); setShowLibrary(true) }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50"
          >
            Browse library
          </button>
        </div>
        <input
          ref={mobileInputRef}
          type="file"
          accept="image/*"
          data-testid="mobile-file-input"
          className="hidden"
          onChange={handleFileSelect('mobile')}
        />
        <MetaFields prefix="mobile_image" url={mobileUrl} contentJson={contentJson} onChange={onChange} generatingMeta={generatingMeta.mobile} suggestedMeta={suggestedMeta.mobile} />
      </div>

      {showLibrary && (
        <ImageLibraryPicker
          onSelect={handleLibrarySelect}
          onClose={() => setShowLibrary(false)}
          guidelines={imageGuidelines}
        />
      )}
    </div>
  )
}
