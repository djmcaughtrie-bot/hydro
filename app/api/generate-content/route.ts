import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCompliance } from '@/lib/compliance'
import { CONTENT_CONFIG } from '@/lib/content-config'

const SYSTEM_PROMPT = `You are the content writer for H2 Revive, a UK wellness brand specialising in molecular hydrogen inhalation therapy. Write in the H2 Revive brand voice:

VOICE PILLARS:
- Curious and confident: share discoveries, not sales pitches
- Human, not clinical: translate science into feeling
- Quietly British: understated authority, no hype, no exclamation marks
- Intellectually honest: hedge claims accurately

ALWAYS USE: "may support", "research suggests", "some users report", "studies explore", "we believe", "the science is pointing toward", "a [year] study in [journal] found"

NEVER USE: "treats", "cures", "proven to", "proven to help", "guaranteed", "eliminates", "heals", "clinical grade", "medical device", "therapeutic treatment", "diagnose", "prevent disease", "from my own experience"

CITATION RULE: Always link to primary sources (PubMed DOI, journal page). Never reference third-party aggregator sites.

COMPLIANCE DISCLAIMER (include near any health claim): "These statements have not been evaluated by the MHRA. This product is not intended to diagnose, treat, cure, or prevent any disease."

BRAND: H2 Revive is a wellness technology brand, not a medical device company. UK-first positioning. CEO-led authentic voice. Science-backed but honest about the state of the evidence.

Respond with valid JSON only. No markdown, no preamble.`

function createAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { page, section, persona, additional_context } = await request.json()

  const sectionConfig = CONTENT_CONFIG[page]?.sections[section]
  if (!sectionConfig) return Response.json({ error: 'Invalid page/section' }, { status: 400 })

  const fieldList = [...Object.keys(sectionConfig.fields), 'image_suggestion'].join(', ')
  const generation_prompt = `Generate content for the H2 Revive ${page} page, ${section} section.
${persona ? `Persona: ${persona}` : 'Persona: General audience'}
${additional_context ? `Additional context: ${additional_context}` : ''}

Return a JSON object with exactly these fields: ${fieldList}.
The image_suggestion should be a vivid description for a photographer, 1-2 sentences.`

  const anthropic = createAnthropicClient()

  async function generate(): Promise<Record<string, unknown>> {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: generation_prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    return JSON.parse(text)
  }

  let content: Record<string, unknown> = {}
  let complianceResult = checkCompliance({})
  let attempts = 0

  while (attempts < 3) {
    content = await generate()
    const textFields = Object.fromEntries(
      Object.entries(content).filter(([, v]) => typeof v === 'string')
    ) as Record<string, string>
    complianceResult = checkCompliance(textFields)
    attempts++
    if (complianceResult.pass) break
  }

  const status = complianceResult.pass ? 'draft' : 'needs_review'
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('content_items')
    .insert({
      page,
      section,
      persona: persona ?? null,
      content_type: sectionConfig.contentType,
      content_json: content,
      status,
      generation_prompt,
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id, status })
}
