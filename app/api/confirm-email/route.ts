import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { verifyConfirmToken } from '@/lib/email-token'
import { createAdminClient } from '@/lib/supabase/admin'

const AUDIENCE_ID_MAP: Record<string, string | undefined> = {
  energy: process.env.RESEND_AUDIENCE_ID_ENERGY,
  performance: process.env.RESEND_AUDIENCE_ID_PERFORMANCE,
  longevity: process.env.RESEND_AUDIENCE_ID_LONGEVITY,
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')

  if (!token) {
    return Response.redirect(new URL('/confirm?status=invalid', request.nextUrl.origin))
  }

  const verified = verifyConfirmToken(token)
  if (!verified) {
    return Response.redirect(new URL('/confirm?status=invalid', request.nextUrl.origin))
  }

  const { email, signupId } = verified
  const adminClient = createAdminClient()

  const { data: signup, error: fetchError } = await adminClient
    .from('email_signups')
    .select('id, email, persona, name, double_opt_in_confirmed')
    .eq('id', signupId)
    .single()

  if (fetchError || !signup) {
    return Response.redirect(new URL('/confirm?status=invalid', request.nextUrl.origin))
  }

  if (signup.email !== email) {
    return Response.redirect(new URL('/confirm?status=invalid', request.nextUrl.origin))
  }

  if (signup.double_opt_in_confirmed) {
    return Response.redirect(new URL('/confirm?status=already_confirmed', request.nextUrl.origin))
  }

  const { error: updateError } = await adminClient
    .from('email_signups')
    .update({
      double_opt_in_confirmed: true,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', signupId)

  if (updateError) {
    console.error('[confirm-email] failed to update signup:', updateError)
    return Response.redirect(new URL('/confirm?status=invalid', request.nextUrl.origin))
  }

  // Add to persona audience if set
  if (signup.persona) {
    const audienceId = AUDIENCE_ID_MAP[signup.persona]
    if (audienceId && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      try {
        await resend.contacts.create({
          audienceId,
          email: signup.email,
          firstName: signup.name ?? undefined,
          unsubscribed: false,
        })
      } catch (err) {
        // Non-fatal — confirmation succeeded; log and proceed
        console.error('[confirm-email] resend.contacts.create failed:', err)
      }
    }
  }

  return Response.redirect(new URL('/confirm?status=success', request.nextUrl.origin))
}
