// ─── Club, voortgang: kleine weergavehulpjes voor de componenten ────────────

import { LOCALE, type Taal } from '@/lib/aiyourgym/taal/taal'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import type { VoortgangTekst } from '@/lib/aiyourgym/taal/woorden/club/voortgang'
import type { ReeksInfo } from '@/lib/club/voortgang/tijdlijn'

function alsDatum(iso: string): Date | null {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "1 aug" | "1 Aug" (zonder punt). */
export function datumKort(iso: string, taal: Taal = 'nl'): string {
  const d = alsDatum(iso)
  return d ? new Intl.DateTimeFormat(LOCALE[taal], { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(d).replace('.', '') : iso
}

/** "1 augustus 2026" | "1 August 2026". */
export function datumLang(iso: string, taal: Taal = 'nl'): string {
  const d = alsDatum(iso)
  return d ? new Intl.DateTimeFormat(LOCALE[taal], { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(d) : iso
}

/** Getal in de taal, hoogstens een decimaal. */
export function getal(n: number, taal: Taal = 'nl'): string {
  return formatGetal(n, taal, { maximumFractionDigits: 1 })
}

/** Een verschil met teken (+1,5 | -0.5), in de taal. */
export function verschilTekst(v: number, taal: Taal = 'nl'): string {
  if (v === 0) return '0'
  const tekst = getal(Math.abs(v), taal)
  return v > 0 ? `+${tekst}` : `-${tekst}`
}

/** Naam, korte naam en eenheid van een meetwaarde in de taal van het scherm. */
export function reeksTekst(info: ReeksInfo, t: VoortgangTekst): ReeksInfo {
  const m = t.meet[info.sleutel as keyof VoortgangTekst['meet']]
  const eenheid = info.eenheid === 'per min' ? t.perMinuut : info.eenheid
  return m ? { ...info, label: m.label, kort: m.kort, eenheid } : { ...info, eenheid }
}
