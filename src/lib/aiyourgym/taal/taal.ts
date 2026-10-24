// ─── AI Your Gym: de twee talen (PUUR) ──────────────────────────────────────
// Besluit Kane (24-10-2026): heel AI Your Gym in Nederlands en Engels. Nederlands
// is de bron. Puur en zonder Next, zodat het overal te gebruiken en te testen is
// (proxy, server, client, mails). Staat volledig los van de MentaForce-i18n.
// Werkwijze en regels: docs/aiyourgym/TALEN.md.

export type Taal = 'nl' | 'en'

export const TALEN: readonly Taal[] = ['nl', 'en']
export const STANDAARD_TAAL: Taal = 'nl'

/** De locale voor datums, getallen en bedragen per taal. */
export const LOCALE: Readonly<Record<Taal, string>> = { nl: 'nl-NL', en: 'en-GB' }

/** Voor <html lang> en hreflang. */
export const HTML_LANG: Readonly<Record<Taal, string>> = { nl: 'nl', en: 'en' }

/** Voor og:locale. */
export const OG_LOCALE: Readonly<Record<Taal, string>> = { nl: 'nl_NL', en: 'en_GB' }

/** De voorkeur van de gebruiker (Club, ledenapp), gezet door de taalkeuze. */
export const TAAL_COOKIE = 'ayg-taal'
/** Een jaar bewaren. */
export const TAAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * De kop waarmee de proxy de taal van een websitepagina meegeeft (uit het pad:
 * /en/... is Engels). Alleen de proxy zet hem; hij wist hem altijd eerst.
 */
export const TAAL_KOP = 'x-ayg-taal'
/** De kop met het publieke pad van een websitepagina zonder taal, voor hreflang. */
export const SITE_PAD_KOP = 'x-ayg-site-pad'

export function isTaal(waarde: unknown): waarde is Taal {
  return waarde === 'nl' || waarde === 'en'
}

/**
 * De beste taal uit een Accept-Language-kop ("en-GB,en;q=0.9,nl;q=0.8"), of null
 * als de browser geen van onze talen noemt. Hoogste q wint, bij gelijke q de
 * eerste in de kop.
 */
export function taalUitAcceptLanguage(kop: string | null | undefined): Taal | null {
  if (!kop) return null
  let beste: { taal: Taal; q: number } | null = null
  for (const deel of kop.split(',')) {
    const [code, ...params] = deel.trim().split(';')
    const basis = code.trim().toLowerCase().split('-')[0]
    if (!isTaal(basis)) continue
    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
    const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1
    if (!Number.isFinite(q) || q <= 0) continue
    if (!beste || q > beste.q) beste = { taal: basis, q }
  }
  return beste?.taal ?? null
}

/**
 * De taal voor Club en de ledenapp: eerst de gekozen voorkeur (cookie, later per
 * account), dan de browser, dan Nederlands.
 */
export function kiesTaal(voorkeur: string | null | undefined, acceptLanguage: string | null | undefined): Taal {
  if (isTaal(voorkeur)) return voorkeur
  return taalUitAcceptLanguage(acceptLanguage) ?? STANDAARD_TAAL
}
