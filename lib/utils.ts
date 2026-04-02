export function extractUtmParams(url: string): {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
} {
  try {
    const { searchParams } = new URL(url)
    return {
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
    }
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null }
  }
}
