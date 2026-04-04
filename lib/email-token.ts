import { createHmac } from 'crypto'

function getSecret(): string {
  const secret = process.env.EMAIL_CONFIRM_SECRET
  if (!secret) throw new Error('EMAIL_CONFIRM_SECRET not set')
  return secret
}

export function generateConfirmToken(email: string, signupId: string): string {
  const payload = `${email}:${signupId}`
  const token = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${token}`
}

export function verifyConfirmToken(token: string): { email: string; signupId: string } | null {
  try {
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return null
    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8')
    const [email, signupId] = payload.split(':')
    if (!email || !signupId) return null
    const expected = createHmac('sha256', getSecret()).update(payload).digest('hex')
    // Constant-time comparison
    if (expected.length !== signature.length) return null
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
    }
    if (diff !== 0) return null
    return { email, signupId }
  } catch {
    return null
  }
}
