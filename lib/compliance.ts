// Phrases are deduplicated per field: if "proven to help" and "proven to" both match,
// only the longer phrase is reported. Array order does not affect the result.
const PROHIBITED = [
  'proven to help',
  'proven to',
  'treats',
  'cures',
  'guaranteed',
  'eliminates',
  'heals',
  'clinical grade',
  'medical device',
  'therapeutic treatment',
  'diagnose',
  'prevent disease',
  'from my own experience',
  'no side effects',
] as const

export type ComplianceResult =
  | { pass: true }
  | { pass: false; violations: { field: string; word: string }[] }

/**
 * Scans content fields for prohibited marketing claims.
 * Accepts `Record<string, unknown>` (not `string`) to handle JSONB objects
 * from Supabase that may contain non-string values (numbers, URLs, booleans).
 * Non-string values are silently skipped.
 * Deduplication: if both "proven to help" and "proven to" match in a field,
 * only the longer phrase is reported. The deduplication assumes no two phrases
 * in PROHIBITED are independent substrings of each other — verify this holds
 * when adding new entries.
 */
export function checkCompliance(fields: Record<string, unknown>): ComplianceResult {
  const violations: { field: string; word: string }[] = []
  for (const [field, value] of Object.entries(fields)) {
    if (typeof value !== 'string') continue
    const lower = value.toLowerCase()
    // Track which prohibited words match in this field
    const matchedWords = new Set<string>()
    for (const word of PROHIBITED) {
      if (lower.includes(word)) {
        matchedWords.add(word)
      }
    }
    // Filter out substrings: if "proven to help" matched, remove "proven to"
    for (const word of Array.from(matchedWords)) {
      let isSubstring = false
      for (const other of Array.from(matchedWords)) {
        if (word !== other && other.includes(word)) {
          isSubstring = true
          break
        }
      }
      if (!isSubstring) {
        violations.push({ field, word })
      }
    }
  }
  return violations.length ? { pass: false, violations } : { pass: true }
}
