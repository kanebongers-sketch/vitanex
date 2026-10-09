// ─── Taalset: vertalen + getallen/tijden in één ──────────────────────────────
// Voor pure modules (zoals de Vandaag-engine) die tekst maken: ze krijgen een
// taalset mee en blijven zo vrij van server- of browser-API's. Zonder taalset
// gebruiken ze Nederlands, dus bestaande aanroepen en tests veranderen niet.

import nl from './woordenboeken/nl.json'
import { INTL_LOCALE, STANDAARD_TAAL, type Taal } from './talen'
import { vertaal, type Params, type Woordenboek } from './vertaal'

export interface Taalset {
  taal: Taal
  /** Intl-landinstelling, bv. 'nl-NL'. */
  locale: string
  t: (sleutel: string, params?: Params) => string
}

export const BRON_WOORDENBOEK: Woordenboek = nl

export function maakTaalset(taal: Taal, boek: Woordenboek): Taalset {
  return { taal, locale: INTL_LOCALE[taal], t: (sleutel, params) => vertaal(boek, nl, sleutel, params) }
}

export const NL: Taalset = maakTaalset(STANDAARD_TAAL, nl)
