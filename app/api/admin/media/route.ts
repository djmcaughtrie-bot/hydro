import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('media')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

const VALID_MEDIA_TYPES = ['image', 'video-ambient', 'video-content', 'captions'] as const
const VALID_FOCAL_POINTS = [
  'top-left','top','top-right','left','center','right','bottom-left','bottom','bottom-right',
] as const

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const rawMediaType = formData.get('media_type') as string | null
  if (!rawMediaType || !VALID_MEDIA_TYPES.includes(rawMediaType as typeof VALID_MEDIA_TYPES[number])) {
    return Response.json({ error: 'Invalid media_type' }, { status: 400 })
  }
  const mediaType = rawMediaType as typeof VALID_MEDIA_TYPES[number]

  const rawFocalPoint = formData.get('focal_point') as string | null
  const focalPoint = VALID_FOCAL_POINTS.includes(rawFocalPoint as typeof VALID_FOCAL_POINTS[number])
    ? rawFocalPoint!
    : 'center'

  const width = parseInt((formData.get('width') as string) ?? '0', 10) || 0
  const height = parseInt((formData.get('height') as string) ?? '0', 10) || 0
  const fileSizeKb = Math.round(file.size / 1024)
  const filename = file.name
  const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const storagePath = `${mediaType}/${Date.now()}-${safeFilename}`

  const adminClient = createAdminClient()
  const { error: uploadError } = await adminClient.storage
    .from('media')
    .upload(storagePath, file, { contentType: file.type })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = adminClient.storage.from('media').getPublicUrl(storagePath)

  // Captions: return URL only, no media table entry
  if (mediaType === 'captions') {
    return Response.json({ url: publicUrl })
  }

  const { data, error: insertError } = await adminClient
    .from('media')
    .insert({
      filename,
      url: publicUrl,
      width,
      height,
      file_size_kb: fileSizeKb,
      focal_point: focalPoint,
      media_type: mediaType,
    })
    .select()
    .single()

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })
  return Response.json(data)
}
