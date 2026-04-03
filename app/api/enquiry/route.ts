import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendLeadNotification } from '@/lib/resend'
import { extractUtmParams } from '@/lib/utils'

const enquirySchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email({ message: 'A valid email address is required' }),
  phone: z.string().optional().nullable(),
  persona: z.enum(['energy', 'performance', 'longevity', 'clinic', 'general']).optional().nullable(),
  enquiry_type: z.enum(['product', 'clinic', 'waitlist', 'general']),
  message: z.string().optional().nullable(),
  source_page: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = enquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation error' },
      { status: 400 }
    )
  }

  const data = parsed.data
  const utmParams = extractUtmParams(request.url)

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('leads').insert({
    ...data,
    ...utmParams,
    status: 'new',
  })

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return NextResponse.json({ error: 'Failed to save enquiry' }, { status: 500 })
  }

  // Fire and forget — don't fail the request if email fails
  sendLeadNotification(data).catch(console.error)

  return NextResponse.json({ success: true }, { status: 200 })
}
