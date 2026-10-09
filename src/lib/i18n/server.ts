// ─── Taal bepalen en woordenboek laden (SERVER-ONLY) ─────────────────────────
// Volgorde: de cookie (eigen keuze) → de taal van de browser → Nederlands.
// Een woordenboek = kern (<taal>.json) + één bestand per gebied, samengevoegd.

import { cookies, headers } from 'next/headers'
import { STANDAARD_TAAL, TAAL_COOKIE, isTaal, taalUitAcceptLanguage, type Taal } from './talen'
import type { Woordenboek } from './vertaal'
import { maakTaalset, type Taalset } from './taalset'
import { LADERS, voegSamen } from './laders'

export async function huidigeTaal(): Promise<Taal> {
  const gekozen = (await cookies()).get(TAAL_COOKIE)?.value
  if (isTaal(gekozen)) return gekozen
  return taalUitAcceptLanguage((await headers()).get('accept-language')) ?? STANDAARD_TAAL
}

const cache = new Map<Taal, Promise<Woordenboek>>()

/** Het samengevoegde woordenboek van een taal (één keer per serverproces geladen). */
export function laadWoordenboek(taal: Taal): Promise<Woordenboek> {
  const bekend = cache.get(taal)
  if (bekend) return bekend
  const belofte: Promise<Woordenboek> = LADERS[taal]()
    .then(voegSamen)
    .catch((fout: unknown) => {
      console.error(`[i18n] woordenboek ${taal} laden mislukt`, fout)
      cache.delete(taal)
      return taal === STANDAARD_TAAL ? {} : laadWoordenboek(STANDAARD_TAAL)
    })
  cache.set(taal, belofte)
  return belofte
}

/** Het Nederlandse woordenboek: de bron waar elke vertaling op terugvalt. */
export function laadBron(): Promise<Woordenboek> {
  return laadWoordenboek(STANDAARD_TAAL)
}

/** Taalset (vertalen + landinstelling) voor de taal van dit verzoek. */
export async function huidigeTaalset(): Promise<Taalset> {
  const taal = await huidigeTaal()
  const [boek, bron] = await Promise.all([laadWoordenboek(taal), laadBron()])
  return maakTaalset(taal, boek, bron)
}
