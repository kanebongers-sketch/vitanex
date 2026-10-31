// ─── AI Your Gym, tweestaps: foutcodes naar tekst (PUUR, ook in de browser) ──
// De API geeft een vaste code; hier wordt dat de tekst in de taal van de pagina.

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { TWEESTAPS } from '@/lib/aiyourgym/taal/woorden/club/tweestaps'

export const FOUT_CODES = ['leeg', 'fout', 'geblokkeerd', 'gesloten', 'geen_sleutel', 'verlopen', 'geremd', 'al_aan', 'niet_bezig', 'algemeen'] as const
export type FoutCode = (typeof FOUT_CODES)[number]

function isFoutCode(v: unknown): v is FoutCode {
  return typeof v === 'string' && (FOUT_CODES as readonly string[]).includes(v)
}

/** De tekst bij een antwoord van de API (onbekend antwoord: de algemene melding). */
export function foutTekst(data: unknown, taal: Taal): string {
  const t = TWEESTAPS[taal].fouten
  const r = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const code = isFoutCode(r.code) ? r.code : 'algemeen'
  switch (code) {
    case 'fout':
      return t.fout(typeof r.over === 'number' ? r.over : 0)
    case 'geblokkeerd': {
      const tot = typeof r.totOp === 'string' ? new Date(r.totOp) : null
      const tijd = tot && !Number.isNaN(tot.getTime())
        ? new Intl.DateTimeFormat(taal === 'en' ? 'en-GB' : 'nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' }).format(tot)
        : '?'
      return t.geblokkeerd(tijd)
    }
    case 'gesloten':
      return t.gesloten
    case 'geen_sleutel':
      return t.geenSleutel
    case 'verlopen':
      return t.verlopen
    case 'geremd':
      return t.geremd
    case 'al_aan':
      return t.alAan
    case 'niet_bezig':
      return t.nietBezig
    case 'leeg':
      return t.leeg
    default:
      return t.algemeen
  }
}
