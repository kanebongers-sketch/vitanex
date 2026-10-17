// ─── Club, intakevragen: de lijst, secties en volgorde (PUUR) ───────────────
// De volgorde is een getal per vraag. Secties volgen de volgorde waarin hun
// eerste vraag staat. Omhoog en omlaag schuift een vraag binnen haar sectie, of
// een hele sectie langs de buursectie; daarna nummeren we alles opnieuw.

import { KERN_VRAGEN, metKernRegels, standaardVraag } from './kern'
import type { IntakeVraag } from './soorten'

export type Richting = 'omhoog' | 'omlaag'

export interface Sectie {
  naam: string
  vragen: IntakeVraag[]
}

export interface Volgorde {
  id: string
  volgorde: number
}

export function sorteer(vragen: readonly IntakeVraag[]): IntakeVraag[] {
  return [...vragen].sort((a, b) => a.volgorde - b.volgorde || a.id.localeCompare(b.id))
}

/**
 * De set van een sportschool: wat in de database staat, aangevuld met de
 * kernvragen die er (nog) niet in staan. Zonder rijen is dat de standaardset.
 */
export function vulAan(rijen: readonly IntakeVraag[]): IntakeVraag[] {
  const metRegels = rijen.map(metKernRegels)
  const aanwezig = new Set(metRegels.map((v) => v.sleutel).filter((s): s is string => s !== null))
  const ontbrekend = KERN_VRAGEN.filter((k) => !aanwezig.has(k.sleutel)).map(standaardVraag)
  return sorteer([...metRegels, ...ontbrekend])
}

/** De vragen per sectie, in volgorde. */
export function secties(vragen: readonly IntakeVraag[]): Sectie[] {
  const uit: Sectie[] = []
  for (const v of sorteer(vragen)) {
    const bestaand = uit.find((s) => s.naam === v.sectie)
    if (bestaand) bestaand.vragen.push(v)
    else uit.push({ naam: v.sectie, vragen: [v] })
  }
  return uit
}

function hernummer(secs: readonly Sectie[]): Volgorde[] {
  return secs.flatMap((s) => s.vragen).map((v, i) => ({ id: v.id, volgorde: (i + 1) * 10 }))
}

function wissel<T>(lijst: readonly T[], i: number, j: number): T[] {
  const kopie = [...lijst]
  ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
  return kopie
}

/** Nieuwe volgorde na een vraag omhoog of omlaag binnen haar sectie; null als dat niet kan. */
export function verplaatsVraag(vragen: readonly IntakeVraag[], id: string, richting: Richting): Volgorde[] | null {
  const secs = secties(vragen)
  const si = secs.findIndex((s) => s.vragen.some((v) => v.id === id))
  if (si < 0) return null
  const lijst = secs[si].vragen
  const i = lijst.findIndex((v) => v.id === id)
  const j = richting === 'omhoog' ? i - 1 : i + 1
  if (j < 0 || j >= lijst.length) return null
  const nieuw = secs.map((s, k) => (k === si ? { ...s, vragen: wissel(lijst, i, j) } : s))
  return hernummer(nieuw)
}

/** Nieuwe volgorde na een hele sectie omhoog of omlaag; null als dat niet kan. */
export function verplaatsSectie(vragen: readonly IntakeVraag[], naam: string, richting: Richting): Volgorde[] | null {
  const secs = secties(vragen)
  const i = secs.findIndex((s) => s.naam === naam)
  const j = richting === 'omhoog' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= secs.length) return null
  return hernummer(wissel(secs, i, j))
}

/** De volgorde voor een nieuwe vraag: achteraan in haar sectie, of helemaal achteraan. Daarna hernummeren. */
export function volgordeVoorNieuw(vragen: readonly IntakeVraag[], sectie: string): number {
  const inSectie = vragen.filter((v) => v.sectie === sectie)
  const bron = inSectie.length > 0 ? inSectie : vragen
  const max = bron.reduce((m, v) => Math.max(m, v.volgorde), 0)
  return max + 1
}

/** Alles opnieuw nummeren (10, 20, 30 ...) in de volgorde van de secties. */
export function hernummerAlles(vragen: readonly IntakeVraag[]): Volgorde[] {
  return hernummer(secties(vragen))
}

/** De namen van de bestaande secties, voor de keuzelijst. */
export function sectieNamen(vragen: readonly IntakeVraag[]): string[] {
  return secties(vragen).map((s) => s.naam)
}

/** Alleen wat het formulier toont. */
export function actieveVragen(vragen: readonly IntakeVraag[]): IntakeVraag[] {
  return sorteer(vragen.filter((v) => v.actief))
}
