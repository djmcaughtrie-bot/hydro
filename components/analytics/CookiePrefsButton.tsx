'use client'

export function CookiePrefsButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') {
          const w = window as unknown as { CookieConsent?: { preferences: () => void } }
          w.CookieConsent?.preferences()
        }
      }}
      className="rounded-lg border border-teal px-4 py-2 font-sans text-sm font-medium text-teal transition-colors hover:bg-teal hover:text-white"
    >
      Manage cookie preferences
    </button>
  )
}
