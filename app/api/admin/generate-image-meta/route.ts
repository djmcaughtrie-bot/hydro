import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let imageUrl: string
  try {
    const body = await request.json()
    imageUrl = body.imageUrl
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!imageUrl || typeof imageUrl !== 'string') {
    return Response.json({ error: 'imageUrl required' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: imageUrl },
          },
          {
            type: 'text',
            text: `You are writing image metadata for H2 Revive — a UK premium wellness brand specialising in molecular hydrogen inhalation therapy. Images appear on a health and wellness website targeting adults interested in energy, recovery, and longevity.

Generate concise, accurate metadata for this image:
- alt: Descriptive alt text for accessibility (1-2 sentences describing what's in the image; include natural wellness context if relevant)
- title: Short tooltip title (4-8 words)
- caption: Short caption for below the image (1 sentence, can be evocative and brand-aligned)

Respond with valid JSON only, no markdown: {"alt":"...","title":"...","caption":"..."}`,
          },
        ],
      }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : null
    if (!text) return Response.json({ error: 'No response from AI' }, { status: 500 })

    const meta = JSON.parse(text) as { alt: string; title: string; caption: string }
    return Response.json(meta)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
