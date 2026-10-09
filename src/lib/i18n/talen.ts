// ─── Talen van MentaForce ────────────────────────────────────────────────────
// Nederlands is de brontaal. Daarnaast de 10 meest gesproken talen ter wereld
// (Ethnologue, totaal aantal sprekers). De keuze staat in een cookie, zodat de
// adressen hetzelfde blijven (geen /en/... in de URL).
//
// Puur: geen server- of browser-API's, dus overal te importeren.

export const TALEN = [
  { code: 'nl', naam: 'Nederlands', dir: 'ltr' },
  { code: 'en', naam: 'English', dir: 'ltr' },
  { code: 'zh', naam: '中文（简体）', dir: 'ltr' },
  { code: 'hi', naam: 'हिन्दी', dir: 'ltr' },
  { code: 'es', naam: 'Español', dir: 'ltr' },
  { code: 'ar', naam: 'العربية', dir: 'rtl' },
  { code: 'fr', naam: 'Français', dir: 'ltr' },
  { code: 'bn', naam: 'বাংলা', dir: 'ltr' },
  { code: 'pt', naam: 'Português', dir: 'ltr' },
  { code: 'ru', naam: 'Русский', dir: 'ltr' },
  { code: 'ur', naam: 'اردو', dir: 'rtl' },
] as const

export type Taal = (typeof TALEN)[number]['code']
export type Richting = 'ltr' | 'rtl'

export const STANDAARD_TAAL: Taal = 'nl'

/** Landinstelling voor getallen, datums en tijden (Intl) per taal. */
export const INTL_LOCALE: Record<Taal, string> = {
  nl: 'nl-NL', en: 'en-GB', zh: 'zh-CN', hi: 'hi-IN', es: 'es-ES', ar: 'ar',
  fr: 'fr-FR', bn: 'bn-BD', pt: 'pt-PT', ru: 'ru-RU', ur: 'ur-PK',
}
export const TAAL_COOKIE = 'mf-taal'
/** Een jaar onthouden. */
export const TAAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const CODES = new Set<string>(TALEN.map((t) => t.code))

export function isTaal(waarde: unknown): waarde is Taal {
  return typeof waarde === 'string' && CODES.has(waarde)
}

export function richtingVan(taal: Taal): Richting {
  return TALEN.find((t) => t.code === taal)?.dir ?? 'ltr'
}

/**
 * Kiest een taal uit een Accept-Language-header ("en-US,en;q=0.9,nl;q=0.8"):
 * de eerste ondersteunde, op volgorde van voorkeur. Anders null.
 */
export function taalUitAcceptLanguage(header: string | null | undefined): Taal | null {
  if (!header) return null
  const voorkeuren = header
    .split(',')
    .map((deel) => {
      const [tag, ...rest] = deel.trim().split(';')
      const q = rest.find((r) => r.trim().startsWith('q='))
      const gewicht = q ? Number(q.trim().slice(2)) : 1
      return { basis: tag.trim().toLowerCase().split('-')[0], gewicht: Number.isFinite(gewicht) ? gewicht : 0 }
    })
    .filter((v) => v.basis && v.gewicht > 0)
    .sort((a, b) => b.gewicht - a.gewicht)
  return voorkeuren.map((v) => v.basis).find(isTaal) ?? null
}
