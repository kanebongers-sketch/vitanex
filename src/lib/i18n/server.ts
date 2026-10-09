// ─── Taal bepalen en woordenboek laden (SERVER-ONLY) ─────────────────────────
// Volgorde: de cookie (eigen keuze) → de taal van de browser → Nederlands.

import { cookies, headers } from 'next/headers'
import { STANDAARD_TAAL, TAAL_COOKIE, isTaal, taalUitAcceptLanguage, type Taal } from './talen'
import type { Woordenboek } from './vertaal'
import { maakTaalset, type Taalset } from './taalset'
import nl from './woordenboeken/nl.json'

const LADERS: Record<Taal, () => Promise<{ default: Woordenboek }>> = {
  nl: async () => ({ default: nl }),
  en: () => import('./woordenboeken/en.json'),
  zh: () => import('./woordenboeken/zh.json'),
  hi: () => import('./woordenboeken/hi.json'),
  es: () => import('./woordenboeken/es.json'),
  ar: () => import('./woordenboeken/ar.json'),
  fr: () => import('./woordenboeken/fr.json'),
  bn: () => import('./woordenboeken/bn.json'),
  pt: () => import('./woordenboeken/pt.json'),
  ru: () => import('./woordenboeken/ru.json'),
  ur: () => import('./woordenboeken/ur.json'),
}

export const BRON: Woordenboek = nl

export async function huidigeTaal(): Promise<Taal> {
  const gekozen = (await cookies()).get(TAAL_COOKIE)?.value
  if (isTaal(gekozen)) return gekozen
  return taalUitAcceptLanguage((await headers()).get('accept-language')) ?? STANDAARD_TAAL
}

export async function laadWoordenboek(taal: Taal): Promise<Woordenboek> {
  try {
    return (await LADERS[taal]()).default
  } catch (fout) {
    console.error(`[i18n] woordenboek ${taal} laden mislukt`, fout)
    return nl
  }
}

/** Taalset (vertalen + landinstelling) voor de taal van dit verzoek. */
export async function huidigeTaalset(): Promise<Taalset> {
  const taal = await huidigeTaal()
  return maakTaalset(taal, await laadWoordenboek(taal))
}
