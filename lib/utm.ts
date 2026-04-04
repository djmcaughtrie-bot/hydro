export interface UTMParams {
  utm_source?:   string
  utm_medium?:   string
  utm_campaign?: string
  utm_content?:  string
  utm_term?:     string
}

const SESSION_KEY = 'h2r_utms'

export function getUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const result: UTMParams = {}
  const source   = params.get('utm_source');   if (source)   result.utm_source   = source
  const medium   = params.get('utm_medium');   if (medium)   result.utm_medium   = medium
  const campaign = params.get('utm_campaign'); if (campaign) result.utm_campaign = campaign
  const content  = params.get('utm_content');  if (content)  result.utm_content  = content
  const term     = params.get('utm_term');     if (term)     result.utm_term     = term
  return result
}

export function getUTMParamsWithFallback(): UTMParams {
  if (typeof window === 'undefined') return {}
  const current = getUTMParams()
  if (current.utm_source) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(current))
    return current
  }
  const stored = sessionStorage.getItem(SESSION_KEY)
  return stored ? (JSON.parse(stored) as UTMParams) : {}
}
