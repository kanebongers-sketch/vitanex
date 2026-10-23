// ─── Club, boekingswidget: wie de widget mag inbedden (PUUR) ────────────────
// De widget draait in een iframe op de website van een sportschool. Welke sites
// dat mogen, staat in de Content-Security-Policy (frame-ancestors) van alleen
// de widget-route; de rest van de app houdt frame-ancestors 'none' en
// X-Frame-Options DENY (next.config.ts). De sportschool geeft haar domeinen op;
// zonder domeinen mag elke site hem inbedden (*). Alles hier is getest.

export const WIDGET_PREFIX = '/widget'
export const WIDGET_SCRIPT = '/widget/aiyourgym-widget.js'
export const MAX_DOMEINEN = 10

/** Het pad van de widget: /widget/<sportschool>/<vestiging>/rooster. */
const WIDGET_PAD = /^\/widget\/([a-z0-9][a-z0-9-]{1,38}[a-z0-9])\/([a-z0-9][a-z0-9_-]{1,59})\/rooster\/?$/

export interface WidgetPad {
  sportschool: string
  vestiging: string
}

export function leesWidgetPad(pad: string): WidgetPad | null {
  const m = WIDGET_PAD.exec(pad)
  return m ? { sportschool: m[1], vestiging: m[2] } : null
}

export function widgetPad(sportschool: string, vestiging: string): string {
  return `${WIDGET_PREFIX}/${sportschool}/${vestiging}/rooster`
}

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/

export type DomeinUitslag = { ok: true; domein: string } | { ok: false; fout: string }

/**
 * Een domein zoals de sportschool het intypt ("https://www.fitfactory.nl/",
 * "fitfactory.nl", "*.fitfactory.nl") naar een bron voor frame-ancestors:
 * altijd https, alleen de host, kleine letters. Alles met een pad, poort,
 * spatie, puntkomma of aanhalingsteken wordt geweigerd (geen CSP-injectie).
 */
export function leesDomein(ruw: unknown): DomeinUitslag {
  if (typeof ruw !== 'string') return { ok: false, fout: 'Ongeldig domein.' }
  let host = ruw.trim().toLowerCase()
  if (host.startsWith('https://')) host = host.slice(8)
  else if (host.includes('://')) return { ok: false, fout: `${ruw.trim()}: alleen https-adressen.` }
  host = host.replace(/\/+$/, '')
  if (host === '' || host.length > 253) return { ok: false, fout: 'Vul een domein in, zoals mijngym.nl.' }
  const wildcard = host.startsWith('*.')
  const kaal = wildcard ? host.slice(2) : host
  const labels = kaal.split('.')
  const geldig = labels.length >= 2 && labels.every((l) => LABEL.test(l)) && !/^\d+$/.test(labels[labels.length - 1])
  if (!geldig) return { ok: false, fout: `${ruw.trim()} is geen geldig domein. Schrijf het zoals mijngym.nl.` }
  return { ok: true, domein: wildcard ? `*.${kaal}` : kaal }
}

export type DomeinenUitslag = { ok: true; domeinen: string[] } | { ok: false; fout: string }

/** Een lijst of een tekst (een per regel, of met komma's) naar unieke domeinen. */
export function leesDomeinen(ruw: unknown): DomeinenUitslag {
  const lijst = Array.isArray(ruw) ? ruw : typeof ruw === 'string' ? ruw.split(/[\s,]+/) : null
  if (!lijst) return { ok: false, fout: 'Ongeldige lijst met domeinen.' }
  const domeinen: string[] = []
  for (const item of lijst) {
    if (typeof item === 'string' && item.trim() === '') continue
    const d = leesDomein(item)
    if (!d.ok) return d
    if (!domeinen.includes(d.domein)) domeinen.push(d.domein)
  }
  if (domeinen.length > MAX_DOMEINEN) return { ok: false, fout: `Maximaal ${MAX_DOMEINEN} domeinen.` }
  return { ok: true, domeinen }
}

/** Wat de proxy weet over de widget van een sportschool en vestiging (null = onbekend). */
export interface WidgetKader {
  aan: boolean
  domeinen: readonly string[]
}

/** Systeemgrens: het antwoord van club_widget_kader() naar een WidgetKader, of null. */
export function kaderUitJson(v: unknown): WidgetKader | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null
  const r = v as Record<string, unknown>
  if (typeof r.aan !== 'boolean' || !Array.isArray(r.domeinen)) return null
  const domeinen = r.domeinen.flatMap((d) => {
    const u = leesDomein(d)
    return u.ok ? [u.domein] : []
  })
  return { aan: r.aan, domeinen }
}

/**
 * De waarde van frame-ancestors voor de widget-pagina.
 * - Schakelaar uit, onbekend of widget uit: alleen onze eigen site ('self'),
 *   voor de voorvertoning in Club. De pagina zelf geeft dan een 404.
 * - Aan zonder domeinen: '*' (elke site), zoals de sportschool koos.
 * - Aan met domeinen: alleen die domeinen (https) plus onze eigen site.
 */
export function frameAncestors(actief: boolean, kader: WidgetKader | null): string {
  if (!actief || !kader || !kader.aan) return "'self'"
  if (kader.domeinen.length === 0) return '*'
  return ["'self'", ...kader.domeinen.map((d) => `https://${d}`)].join(' ')
}

/** De volledige Content-Security-Policy van de widget-pagina. */
export function widgetCsp(ancestors: string, isProd: boolean): string {
  return [
    "default-src 'self'",
    isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "font-src 'self' data:",
    "frame-src 'none'",
    `frame-ancestors ${ancestors}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ')
}

/** Het stukje code dat de sportschool op haar website plakt. */
export function embedCode(origin: string, sportschool: string, vestiging: string): string {
  const basis = origin.replace(/\/+$/, '')
  return `<script src="${basis}${WIDGET_SCRIPT}" data-sportschool="${sportschool}" data-vestiging="${vestiging}" async></script>`
}

/** De origin waarop de widget draait, uit de host van het verzoek (lokaal http, anders https). */
export function widgetOrigin(host: string | null | undefined): string | null {
  const h = (host ?? '').trim().toLowerCase()
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/.test(h)) return null
  const naam = h.split(':')[0]
  const lokaal = naam === 'localhost' || naam === '127.0.0.1' || naam.endsWith('.localhost')
  return `${lokaal ? 'http' : 'https'}://${h}`
}
