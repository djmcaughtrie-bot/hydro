import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @anthropic-ai/sdk so no real API calls are made in tests
const mockMessagesCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return { messages: { create: mockMessagesCreate } }
  }),
}))

// Helper: make the Claude compliance API return a compliant result
function mockCompliantApiResponse() {
  mockMessagesCreate.mockResolvedValue({
    content: [
      {
        type: 'text',
        text: JSON.stringify({ compliant: true, violations: [], notes: '' }),
      },
    ],
  })
}

// Helper: make the Claude compliance API return a non-compliant result
function mockNonCompliantApiResponse(violations: { text: string; reason: string; suggestion: string }[]) {
  mockMessagesCreate.mockResolvedValue({
    content: [
      {
        type: 'text',
        text: JSON.stringify({ compliant: false, violations }),
      },
    ],
  })
}

describe('checkCompliance', () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    vi.resetAllMocks()
    // Ensure API key is set by default so stage 2 runs
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockCompliantApiResponse()
  })

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey
  })

  // --- Stage 1: hard regex violations ---

  it('detects "proven to help" as a hard violation (no API call)', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('Studies proven to help reduce fatigue')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(result.violations[0].text).toMatch(/proven to help/i)
    // Stage 1 should short-circuit before any API call
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('detects "proven to treat" as a hard violation', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('This is proven to treat chronic fatigue')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('detects "clinical-grade" as a hard violation', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('Our clinical-grade device')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(result.violations[0].reason).toMatch(/medical device/i)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('detects "medical device" claim as a hard violation', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('This is a certified medical device')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('"not a medical device" does NOT trigger hard violation (brand positioning)', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('H2 Revive is not a medical device — it is a wellness technology brand')
    expect(result.stage).toBe('context')
    expect(result.compliant).toBe(true)
  })

  it('detects "cures" as a hard violation', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('It cures inflammation')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('"cures nothing" does NOT trigger hard violation (regex boundary)', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('It cures nothing, we make no such claim')
    // Stage 1 should pass; stage 2 mock returns compliant
    expect(result.stage).toBe('context')
    expect(result.compliant).toBe(true)
  })

  it('detects "guaranteed to" as a hard violation', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('Guaranteed to improve your energy')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('detects "no side effects" as a hard violation', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('Safe with no side effects for everyone')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('detects "from my own experience" as a hard violation', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('From my own experience this really helped')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('detects "prevents disease" as a hard violation', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('This product prevents disease in users')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('hard check is case-insensitive', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance('PROVEN TO HELP recovery')
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('hard')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  // --- MHRA disclaimer must NOT trigger hard violations ---

  it('MHRA disclaimer does not trigger hard violations', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const disclaimer =
      'These statements have not been evaluated by the MHRA. This product is not intended to diagnose, treat, cure, or prevent any disease.'
    const result = await checkCompliance(disclaimer)
    // Stage 1 must pass — stage 2 mock returns compliant
    expect(result.stage).not.toBe('hard')
    expect(result.compliant).toBe(true)
  })

  // --- Stage 2: context-aware API check ---

  it('clean content passes stage 1 and stage 2 returns compliant', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance(
      'Research suggests hydrogen inhalation may support energy levels. Studies explore its role in cellular wellness.'
    )
    expect(result.compliant).toBe(true)
    expect(result.stage).toBe('context')
    expect(mockMessagesCreate).toHaveBeenCalledTimes(1)
  })

  it('stage 2 non-compliant result is returned correctly', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    mockNonCompliantApiResponse([
      { text: 'treats fatigue', reason: 'Disease treatment claim', suggestion: 'may support energy' },
    ])
    const result = await checkCompliance('Our product treats fatigue effectively')
    // Note: "treats" alone doesn't hit stage 1 (no hard pattern for standalone "treats")
    // so it reaches stage 2
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('context')
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0].text).toBe('treats fatigue')
  })

  it('stage 2 API unavailable (no API key) → returns compliant (graceful skip)', async () => {
    process.env.ANTHROPIC_API_KEY = ''
    const { checkCompliance } = await import('@/lib/compliance')
    const result = await checkCompliance(
      'Research suggests hydrogen may support energy levels.'
    )
    expect(result.compliant).toBe(true)
    expect(result.violations).toHaveLength(0)
    expect(result.stage).toBe('pass')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('stage 2 API call failure returns compliant:false with human review message', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    mockMessagesCreate.mockRejectedValue(new Error('Network error'))
    const result = await checkCompliance(
      'Research suggests hydrogen may support energy levels.'
    )
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('context')
    expect(result.violations[0].reason).toMatch(/human review required/i)
  })

  it('stage 2 parse error (invalid JSON) returns compliant:false with human review message', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not valid json {{{' }],
    })
    const result = await checkCompliance(
      'Research suggests hydrogen may support energy levels.'
    )
    expect(result.compliant).toBe(false)
    expect(result.stage).toBe('context')
    expect(result.violations[0].reason).toMatch(/human review required/i)
  })

  it('includes notes from stage 2 response when present', async () => {
    const { checkCompliance } = await import('@/lib/compliance')
    mockMessagesCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            compliant: true,
            violations: [],
            notes: 'Borderline claim about recovery — watch for escalation',
          }),
        },
      ],
    })
    const result = await checkCompliance('Some users report faster recovery times.')
    expect(result.compliant).toBe(true)
    expect(result.notes).toContain('Borderline')
  })
})
