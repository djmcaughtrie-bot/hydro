import Anthropic from '@anthropic-ai/sdk'

// Stage 1: Hard regex violations — always wrong, no context needed
const HARD_VIOLATIONS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\bproven to (help|treat|cure|prevent|heal|reduce|eliminate)\b/i,
    reason: 'Absolute efficacy claim — use "research suggests" instead',
  },
  {
    pattern: /\bclinical[\s-]grade\b/i,
    reason: 'Implies medical device status — prohibited',
  },
  {
    // Allow "not a medical device" (legitimate brand positioning) but block "is a medical device" / "medical device" as a claim
    pattern: /(?<!not\s+a\s+)\bmedical device\b/i,
    reason: 'MHRA classification claim — we are a wellness technology brand',
  },
  {
    pattern: /\btherapeutic treatment\b/i,
    reason: 'Medical framing — use "wellness session" or "daily practice"',
  },
  {
    pattern: /\b(cures|cure[sd])\b(?!\s+nothing|\s+that)/i,
    reason: 'Disease cure claim — never acceptable',
  },
  {
    pattern: /\bguaranteed to\b/i,
    reason: 'Absolute outcome guarantee — not substantiated',
  },
  {
    pattern: /\bno side effects\b/i,
    reason: 'Unsubstantiated absolute safety claim',
  },
  {
    pattern: /\bfrom my own experience\b/i,
    reason: 'Personal testimony as evidence — ASA violation',
  },
  {
    pattern: /\bprevents?\s+(cancer|disease|illness|infection|ageing|aging)\b/i,
    reason: 'Disease prevention claim — not permitted',
  },
]

const COMPLIANCE_SYSTEM_PROMPT = `You are a UK advertising compliance expert reviewing copy for H2 Revive, a molecular hydrogen inhalation wellness brand. Identify ASA/CAP and MHRA violations — specifically unsubstantiated health claims.

CONTEXT — understand before reviewing:
- "not intended to diagnose, treat, cure, or prevent any disease" is the REQUIRED MHRA disclaimer. Always compliant. Never flag it.
- "clinical evidence", "clinical research", "clinical trial" are neutral study descriptors. Fine.
- "treats" is only a violation when claiming the product treats a condition.
- "proven" is only a violation in "proven to [benefit]" constructions. "not proven to" and "unproven" are fine.
- "heals" is a violation if claiming the product heals. "the body heals itself" is biology, not a product claim — fine.
- "diagnose" is only a violation if claiming the product can diagnose. It appears correctly in our required disclaimer.
- "hydrogen therapy" as a category/SEO term in educational context is fine. "hydrogen therapy treats X" is not.

FLAG ONLY:
1. Claims the product treats, cures, or heals a specific medical condition
2. Guaranteed or proven outcome claims
3. Personal testimony presented as clinical evidence
4. "Clinical grade" or "medical device" language
5. Disease prevention claims

DO NOT FLAG:
- The standard MHRA disclaimer (required copy)
- Study citations and research summaries
- Hedged language ("may support", "research suggests", "some users report")
- Biological descriptions not presented as product benefits
- "Clinical" in research/study contexts

Respond with JSON only:
{
  "compliant": boolean,
  "violations": [{ "text": "exact phrase", "reason": "plain English explanation", "suggestion": "compliant alternative" }],
  "notes": "optional borderline items"
}`

export interface ComplianceViolation {
  text: string
  reason: string
  suggestion: string
}

export interface ComplianceResult {
  compliant: boolean
  violations: ComplianceViolation[]
  notes?: string
  stage: 'hard' | 'context' | 'pass'
}

/**
 * 2-stage compliance validator.
 *
 * Stage 1: Hard regex violations — fast, synchronous patterns, always wrong.
 * Stage 2: Context-aware Claude API check — catches nuanced violations.
 *
 * If ANTHROPIC_API_KEY is absent, stage 2 is skipped and the result is treated
 * as compliant (graceful degradation). If stage 2 fails (network/parse error),
 * returns a failing result requesting human review.
 */
export async function checkCompliance(content: string): Promise<ComplianceResult> {
  // Stage 1: hard regex check
  for (const { pattern, reason } of HARD_VIOLATIONS) {
    const match = pattern.exec(content)
    if (match) {
      return {
        compliant: false,
        violations: [
          {
            text: match[0],
            reason,
            suggestion: '',
          },
        ],
        stage: 'hard',
      }
    }
  }

  // Stage 2: context-aware Claude API check
  if (!process.env.ANTHROPIC_API_KEY) {
    return { compliant: true, violations: [], stage: 'pass' }
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: COMPLIANCE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : null
    if (!text) throw new Error('Empty response from compliance check')

    const parsed = JSON.parse(text) as {
      compliant: boolean
      violations: ComplianceViolation[]
      notes?: string
    }

    return {
      compliant: parsed.compliant,
      violations: parsed.violations ?? [],
      notes: parsed.notes,
      stage: 'context',
    }
  } catch {
    return {
      compliant: false,
      violations: [
        {
          text: '',
          reason: 'Compliance check failed — human review required',
          suggestion: '',
        },
      ],
      stage: 'context',
    }
  }
}
