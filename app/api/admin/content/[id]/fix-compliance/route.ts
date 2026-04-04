import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ComplianceViolation } from '@/lib/compliance'

const SYSTEM_PROMPT = `You are a UK advertising compliance editor for H2 Revive, a molecular hydrogen inhalation wellness brand.

You will be given a JSON object of copy fields and a list of compliance violations. Fix ONLY the flagged phrases, leaving everything else character-for-character identical. Do not rewrite, expand, or improve anything beyond resolving the violations.

ALWAYS USE: "may support", "research suggests", "some users report", "studies explore", "we believe"
NEVER USE: "treats", "cures", "proven to", "guaranteed", "clinical grade", "medical device", "therapeutic treatment"

OUTPUT RULES — these are absolute:
- Output the corrected JSON object and nothing else
- No explanation, no preamble, no markdown code fences
- The JSON must have exactly the same keys as the input
- First character of your response must be {`

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const { id } = await params
  const adminClient = createAdminClient()

  const { data: item, error: fetchError } = await adminClient
    .from('content_items')
    .select('id, content_json')
    .eq('id', id)
    .single()

  if (fetchError || !item) return Response.json({ error: 'Not found' }, { status: 404 })

  let violations: ComplianceViolation[]
  try {
    const body = await request.json()
    violations = body.violations ?? []
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const violationContext = violations
    .map(v => `- "${v.text}": ${v.reason}. Suggested fix: ${v.suggestion || 'use hedged language'}`)
    .join('\n')

  const prompt = `Fix these compliance violations in the following JSON content object:

VIOLATIONS TO FIX:
${violationContext}

CONTENT TO FIX:
${JSON.stringify(item.content_json, null, 2)}

Return the corrected JSON object with the same keys. Fix only the flagged phrases.`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : null
    if (!raw) return Response.json({ error: 'No response from model' }, { status: 500 })

    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let fixed: Record<string, unknown>
    try {
      fixed = JSON.parse(text) as Record<string, unknown>
    } catch {
      // Model returned non-JSON — surface the raw response to help debug
      return Response.json(
        { error: `Model returned non-JSON response: ${text.slice(0, 200)}` },
        { status: 500 }
      )
    }

    const { error: updateError } = await adminClient
      .from('content_items')
      .update({ content_json: fixed, status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

    return Response.json({ content_json: fixed })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fix failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
