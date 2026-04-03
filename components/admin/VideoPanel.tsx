'use client'

import { useRef, useState } from 'react'

interface Props {
  contentJson: Record<string, unknown>
  videoType: 'ambient' | 'content'
  lazyLoadDefault: boolean
  onChange: (updates: Record<string, unknown>) => void
}

export function VideoPanel({ contentJson, videoType, lazyLoadDefault, onChange }: Props) {
  const videoInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)
  const captionsInputRef = useRef<HTMLInputElement>(null)
  const mobileVideoInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const videoUrl = contentJson.video_url as string | undefined
  const posterUrl = contentJson.video_poster_url as string | undefined
  const autoplay = Boolean(contentJson.video_autoplay)
  const loop = Boolean(contentJson.video_loop)
  const controls = Boolean(contentJson.video_controls)
  const lazyLoad = contentJson.video_lazy_load !== undefined
    ? Boolean(contentJson.video_lazy_load)
    : lazyLoadDefault

  async function uploadFile(file: File, mediaType: 'video-ambient' | 'video-content' | 'image' | 'captions') {
    setUploading(true)
    setUploadError('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('media_type', mediaType)
    formData.append('width', '0')
    formData.append('height', '0')
    formData.append('focal_point', 'center')
    try {
      const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Upload failed'); return null }
      return data as { url: string; id?: string }
    } catch {
      setUploadError('Network error. Please try again.')
      return null
    } finally {
      setUploading(false)
    }
  }

  function Toggle({ name, label, checked, onToggle }: {
    name: string; label: string; checked: boolean; onToggle: (v: boolean) => void
  }) {
    return (
      <label className="flex items-center gap-2 font-sans text-sm text-ink">
        <input
          type="checkbox"
          name={name}
          aria-label={label}
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="rounded border-gray-300"
        />
        {label}
      </label>
    )
  }

  if (videoType === 'ambient') {
    return (
      <div className="space-y-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
          Ambient video
          <span className="ml-1 font-normal normal-case text-ink-light">
            H.264 MP4 + WebM · &lt;15s · max 10MB
          </span>
        </p>

        {videoUrl ? (
          <p className="font-mono text-xs text-teal">{videoUrl}</p>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload video'}
          </button>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          data-testid="video-file-input"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const result = await uploadFile(file, 'video-ambient')
            if (result) onChange({ video_url: result.url })
          }}
        />

        {/* Poster image */}
        <div>
          <p className="mb-1 font-sans text-xs font-medium text-ink">
            Poster image <span className="text-red-500">*</span>
            <span className="ml-1 font-mono text-xs text-ink-light">required · LCP element</span>
          </p>
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={posterUrl} alt="Poster" className="mb-2 max-h-20 rounded object-cover" />
          ) : (
            <div className="mb-2 flex h-14 items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50">
              <p className="font-sans text-xs text-ink-light">No poster</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => posterInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            Upload poster
          </button>
          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const result = await uploadFile(file, 'image')
              if (result) onChange({ video_poster_url: result.url })
            }}
          />
        </div>

        {/* Playback toggles */}
        <div className="space-y-2">
          <Toggle
            name="autoplay" label="Autoplay (muted)"
            checked={autoplay}
            onToggle={(v) => onChange({ video_autoplay: v })}
          />
          <Toggle
            name="loop" label="Loop"
            checked={loop}
            onToggle={(v) => onChange({ video_loop: v })}
          />
          <Toggle
            name="controls" label="Show controls"
            checked={controls}
            onToggle={(v) => onChange({ video_controls: v })}
          />
          <div>
            <Toggle
              name="lazy_load" label="Lazy load"
              checked={lazyLoad}
              onToggle={(v) => onChange({ video_lazy_load: v })}
            />
            {!lazyLoadDefault && (
              <p className="mt-0.5 font-sans text-xs text-amber-600">
                ⚠ Above-fold section — lazy load is off by default for LCP
              </p>
            )}
          </div>
        </div>

        {/* Mobile video */}
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
            Mobile video <span className="font-normal normal-case">optional</span>
          </p>
          <button
            type="button"
            onClick={() => mobileVideoInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            {contentJson.mobile_video_url ? 'Replace mobile video' : 'Upload mobile video'}
          </button>
          <input
            ref={mobileVideoInputRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const result = await uploadFile(file, 'video-ambient')
              if (result) onChange({ mobile_video_url: result.url })
            }}
          />
        </div>

        {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}
      </div>
    )
  }

  // Content video
  return (
    <div className="space-y-4">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-light">
        Content video
        <span className="ml-1 font-normal normal-case text-ink-light">Mux / Cloudflare Stream</span>
      </p>

      <div>
        <label htmlFor="video_url" className="font-sans text-sm font-medium text-ink">
          Stream URL
        </label>
        <input
          id="video_url"
          type="url"
          value={(contentJson.video_url as string) ?? ''}
          onChange={(e) => onChange({ video_url: e.target.value })}
          placeholder="https://stream.mux.com/…"
          className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
        />
      </div>

      {/* Poster image */}
      <div>
        <p className="mb-1 font-sans text-xs font-medium text-ink">
          Poster image <span className="text-red-500">*</span>
          <span className="ml-1 font-mono text-xs text-ink-light">required · LCP element</span>
        </p>
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt="Poster" className="mb-2 max-h-20 rounded object-cover" />
        ) : (
          <div className="mb-2 flex h-14 items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50">
            <p className="font-sans text-xs text-ink-light">No poster</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => posterInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
        >
          Upload poster
        </button>
        <input
          ref={posterInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const result = await uploadFile(file, 'image')
            if (result) onChange({ video_poster_url: result.url })
          }}
        />
      </div>

      {/* Captions */}
      <div>
        <p className="mb-1 font-sans text-xs font-medium text-ink">
          Captions (.vtt) <span className="text-red-500">*</span>
          <span className="ml-1 font-mono text-xs text-ink-light">required · WCAG AA</span>
        </p>
        {contentJson.video_captions_url ? (
          <p className="font-mono text-xs text-teal">{contentJson.video_captions_url as string}</p>
        ) : (
          <button
            type="button"
            onClick={() => captionsInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-teal/50 disabled:opacity-50"
          >
            Upload captions
          </button>
        )}
        <input
          ref={captionsInputRef}
          type="file"
          accept=".vtt,text/vtt"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const result = await uploadFile(file, 'captions')
            if (result) onChange({ video_captions_url: result.url })
          }}
        />
      </div>

      {/* Accessible title */}
      <div>
        <label htmlFor="video_accessible_title" className="font-sans text-sm font-medium text-ink">
          Accessible title
          <span className="ml-1 font-mono text-xs text-ink-light">aria-label · required</span>
        </label>
        <input
          id="video_accessible_title"
          type="text"
          value={(contentJson.video_accessible_title as string) ?? ''}
          onChange={(e) => onChange({ video_accessible_title: e.target.value })}
          className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 font-sans text-sm text-ink"
        />
      </div>

      <div className="space-y-2">
        <Toggle
          name="controls" label="Show controls"
          checked={controls}
          onToggle={(v) => onChange({ video_controls: v })}
        />
        <Toggle
          name="lazy_load" label="Lazy load"
          checked={lazyLoad}
          onToggle={(v) => onChange({ video_lazy_load: v })}
        />
      </div>

      {uploadError && <p className="font-sans text-xs text-red-500">{uploadError}</p>}
    </div>
  )
}
