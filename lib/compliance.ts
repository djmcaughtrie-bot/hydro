// Longer phrases must appear before shorter substrings they contain,
// so "proven to help" is checked before "proven to".
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
]

export type ComplianceResult =
  | { pass: true }
  | { pass: false; violations: { field: string; word: string }[] }

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
    for (const word of matchedWords) {
      let isSubstring = false
      for (const other of matchedWords) {
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
