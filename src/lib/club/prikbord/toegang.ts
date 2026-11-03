// ─── Club, Prikbord: wat mag deze persoon (PUUR) ────────────────────────────
// Niveaus (sleutel prikbord): zien = lezen, bevestigen en uitvoeren; bewerken
// = een mededeling plaatsen of archiveren; beheren = werkwijzen en versies.
// Met rollen v2 telt het niveau van het profiel (rollen/wie.ts); zonder v2 de
// leiding (eigenaar, clubmanager) beheren en de rest zien. De rol lezen we
// alleen via rollen/wie.ts.

import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { onderdeelAfgenomen, type PakketSleutel } from '@/lib/club/kern/pakketten'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { MedewerkerRol } from '@/lib/club/kern/medewerker'
import { isEigenaar, isLeiding, isMedewerkerSessie, v2Niveau, type Wie } from '@/lib/club/rollen/wie'
import { minstens, type Niveau, type Rol } from '@/lib/club/rollen/typen'
import type { Kijker } from './typen'

export const PRIKBORD = 'prikbord'

export interface PrikbordWie extends Wie {
  onderdelen: readonly string[] | null
  organisatie: { afgenomen: readonly PakketSleutel[] }
  vestigingen: readonly VestigingInfo[]
  persoonId: string | null
  medewerkerRollen?: readonly MedewerkerRol[]
}

/** Is het Prikbord er voor deze persoon (pakket Team en vloer afgenomen en een recht)? */
export function prikbordZichtbaar(t: PrikbordWie): boolean {
  return onderdeelAfgenomen(t.organisatie.afgenomen, PRIKBORD) && magOnderdeel(t.onderdelen, PRIKBORD) && minstens(prikbordNiveau(t), 'zien')
}

/** Het niveau op het Prikbord. */
export function prikbordNiveau(t: PrikbordWie): Niveau {
  if (!onderdeelAfgenomen(t.organisatie.afgenomen, PRIKBORD)) return 'geen'
  const v2 = v2Niveau(t, PRIKBORD)
  if (v2 !== null) return v2
  if (isLeiding(t)) return 'beheren'
  return magOnderdeel(t.onderdelen, PRIKBORD) ? 'zien' : 'geen'
}

export function magPlaatsen(t: PrikbordWie): boolean {
  return minstens(prikbordNiveau(t), 'bewerken')
}

export function magBeheren(t: PrikbordWie): boolean {
  return minstens(prikbordNiveau(t), 'beheren')
}

/** De rollen van wie er kijkt, in de rollen van v2. */
export function rollenVan(t: PrikbordWie): Rol[] {
  if (t.profiel) return [...t.profiel.rollen]
  if (isMedewerkerSessie(t)) return [...(t.medewerkerRollen ?? [])]
  if (isEigenaar(t)) return ['eigenaar']
  return isLeiding(t) ? ['manager'] : []
}

/** Het profiel (club_medewerkers.id) van wie er kijkt, of null (dan kan hij niets bevestigen). */
export function profielIdVan(t: PrikbordWie): string | null {
  if (t.profiel) return t.profiel.id
  return isMedewerkerSessie(t) ? t.persoonId : null
}

export function kijkerVan(t: PrikbordWie): Kijker {
  return { profielId: profielIdVan(t), rollen: rollenVan(t), vestigingen: t.vestigingen.map((v) => v.sleutel) }
}
