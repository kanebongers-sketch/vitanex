// ─── Club: wat een ingelogde medewerker mag (PUUR) ──────────────────────────
// Een medewerker ziet de onderdelen van al zijn rollen samen (de rechten per
// rol stelt de eigenaar in bij Beheer > Rechten), altijd met Vandaag, en nooit
// de beheeronderdelen. Hij ziet alleen zijn eigen vestigingen. Een paar
// sportschoolbrede acties blijven dicht, ook als hij Instellingen mag:
// vestigingen beheren en collega's uitnodigen of hun login intrekken.

import type { MedewerkerRol } from '@/lib/club/kern/medewerker'
import type { Rechten } from '@/lib/club/kern/org-instellingen'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { NOOIT_VOOR_CLUBMANAGER, magOnderdeel, type WieMag } from '@/lib/club/beheerders/rechten'
import { isClubmanagerSessie, isEigenaar, v2Minstens } from '@/lib/club/rollen/wie'

/** Minstens zo streng als voor een clubmanager; daarnaast zijn sommige API's dicht (zie hieronder). */
export const NOOIT_VOOR_MEDEWERKER: ReadonlySet<string> = new Set([...NOOIT_VOOR_CLUBMANAGER])

/** De onderdelen van deze rollen samen, in de volgorde van de rechten; null-vrij. */
export function medewerkerOnderdelen(rollen: readonly MedewerkerRol[], rechten: Rechten): string[] {
  const alles = ['vandaag', ...rollen.flatMap((r) => rechten[r] ?? [])]
  return [...new Set(alles)].filter((s) => !NOOIT_VOOR_MEDEWERKER.has(s))
}

/** Alleen de vestigingen van de sportschool waar de medewerker zelf werkt, in de vaste volgorde. */
export function medewerkerVestigingen(alle: readonly VestigingInfo[], eigen: readonly string[]): VestigingInfo[] {
  return alle.filter((v) => eigen.includes(v.sleutel))
}

/** API-paden die voor een medewerker altijd dicht zijn, wat zijn rechten ook zeggen. */
const DICHT_VOOR_MEDEWERKER = ['/api/club/vestigingen', '/api/club/medewerker-toegang', '/api/club/beheerders', '/api/club/organisatie/nieuw', '/api/club/organisatie/wissel']

export function magApiAlsMedewerker(pad: string, methode: string): boolean {
  const schoon = pad.split('?')[0]
  const dicht = DICHT_VOOR_MEDEWERKER.some((p) => schoon === p || schoon.startsWith(`${p}/`))
  if (!dicht) return true
  // De vestigingen lezen mag (de keuzelijst); wijzigen niet.
  return schoon.startsWith('/api/club/vestigingen') && (methode === 'GET' || methode === 'HEAD')
}

/**
 * Medewerkers uitnodigen en hun login intrekken: Kane, de eigenaar, en de
 * clubmanager (beheerder) die van de eigenaar het onderdeel Instellingen
 * (met Medewerkers) heeft. Een medewerker nooit, ook niet met de rol
 * Clubmanager: dan kan niemand zichzelf of een collega binnenlaten.
 */
export function magMedewerkerLoginsBeheren(t: WieMag & { onderdelen?: readonly string[] | null }): boolean {
  // Rollen v2: wie het team beheert (clubmanager standaard), en Kane en de eigenaar.
  const v2 = v2Minstens(t, 'team', 'beheren')
  if (v2 !== null) return v2 || isEigenaar(t)
  if (isEigenaar(t)) return true
  return isClubmanagerSessie(t) && t.onderdelen !== undefined && magOnderdeel(t.onderdelen, 'instellingen')
}
