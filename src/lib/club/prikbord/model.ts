// ─── Club, Prikbord: wie ziet wat, wat staat open, wie bevestigde (PUUR) ────
// Een plek voor de regels van het Prikbord:
// - voor wie een mededeling of werkwijze is (vestiging en rol, leeg = iedereen);
// - wat er voor een persoon open staat (lezen, of bij verplicht bevestigen);
// - "7 van 9 bevestigd" en wie nog niet;
// - een nieuwe versie van een werkwijze met "Belangrijke wijziging" maakt een
//   verplichte mededeling (soort wijziging, met de versie);
// - bevestigen telt alleen voor de versie waar de mededeling over gaat: een
//   oudere wijziging is vervangen en staat niet meer open.
// Verplichte mededelingen blokkeren niemand: ze staan alleen bovenaan Vandaag.

import type { Rol } from '@/lib/club/rollen/typen'
import type { Doelgroep, Gelezen, Kijker, Mededeling, Stap, TeamPersoon, Werkwijze } from './typen'

/** Raakt deze doelgroep deze vestigingen en rollen? Leeg = iedereen. */
export function raakt(d: Doelgroep, vestigingen: readonly string[], rollen: readonly Rol[], alleVestigingen = false): boolean {
  const vestigingOk = d.vestigingen.length === 0 || alleVestigingen || d.vestigingen.some((v) => vestigingen.includes(v))
  const rolOk = d.rollen.length === 0 || d.rollen.some((r) => rollen.includes(r))
  return vestigingOk && rolOk
}

/** Is dit voor deze kijker? */
export function isVoor(d: Doelgroep, k: Kijker): boolean {
  return raakt(d, k.vestigingen, k.rollen)
}

/** Een mededeling die nog geldt: niet gearchiveerd en niet verlopen. */
export function isLopend(m: Mededeling, nu: Date): boolean {
  if (m.gearchiveerd) return false
  return m.verlooptOp === null || new Date(m.verlooptOp).getTime() > nu.getTime()
}

/**
 * Een wijziging is vervangen als de werkwijze inmiddels een nieuwere versie
 * heeft (of weg is): wie versie 3 nog niet bevestigde, bevestigt nu versie 4.
 */
export function isVervangen(m: Mededeling, werkwijzen: readonly Werkwijze[]): boolean {
  if (m.soort !== 'wijziging') return false
  const w = werkwijzen.find((x) => x.id === m.werkwijzeId)
  return !w || w.gearchiveerd || (m.werkwijzeVersie ?? 0) < w.versie
}

/** De gelezen-regel van deze persoon bij deze mededeling. */
export function regelVan(gelezen: readonly Gelezen[], mededelingId: string, profielId: string): Gelezen | undefined {
  return gelezen.find((g) => g.mededelingId === mededelingId && g.profielId === profielId)
}

/** Is de mededeling voor deze persoon af: gelezen, of bij verplicht bevestigd. */
export function isAf(m: Mededeling, regel: Gelezen | undefined): boolean {
  if (!regel) return false
  return m.verplicht ? regel.bevestigdOp !== null : true
}

export interface OpenVraag {
  kijker: Kijker
  mededelingen: readonly Mededeling[]
  gelezen: readonly Gelezen[]
  werkwijzen: readonly Werkwijze[]
  nu: Date
}

/** De mededelingen die voor deze persoon open staan (nieuwste eerst, verplicht voorop). */
export function openVoor({ kijker, mededelingen, gelezen, werkwijzen, nu }: OpenVraag): Mededeling[] {
  const id = kijker.profielId
  if (!id) return []
  return mededelingen
    .filter((m) => isLopend(m, nu) && !isVervangen(m, werkwijzen) && m.doorProfiel !== id && isVoor(m, kijker))
    .filter((m) => !isAf(m, regelVan(gelezen, m.id, id)))
    .sort(volgorde)
}

/** Verplicht eerst, daarna de nieuwste. */
export function volgorde(a: Mededeling, b: Mededeling): number {
  if (a.verplicht !== b.verplicht) return a.verplicht ? -1 : 1
  return b.geplaatstOp.localeCompare(a.geplaatstOp)
}

export interface OpenTelling {
  /** Nieuwe mededelingen (soort mededeling). */
  mededelingen: number
  /** Werkwijzen te bevestigen (soort wijziging). */
  werkwijzen: number
}

/** De regel op Vandaag: "2 nieuwe mededelingen, 1 werkwijze te bevestigen". */
export function telOpen(open: readonly Mededeling[]): OpenTelling {
  const werkwijzen = open.filter((m) => m.soort === 'wijziging').length
  return { mededelingen: open.length - werkwijzen, werkwijzen }
}

export function totaalOpen(t: OpenTelling): number {
  return t.mededelingen + t.werkwijzen
}

export interface Bevestiging {
  /** Hoeveel mensen het moeten lezen (of bevestigen). */
  totaal: number
  /** Hoeveel het gedaan hebben. */
  gedaan: number
  /** Wie nog niet, op naam. */
  nogNiet: string[]
}

/** Wie in het team hoort bij deze mededeling (niet de schrijver zelf). */
export function doelgroepVan(m: Mededeling, team: readonly TeamPersoon[]): TeamPersoon[] {
  return team.filter((p) => p.id !== m.doorProfiel && raakt(m, p.vestigingen, p.rollen, p.alleVestigingen))
}

/** "7 van 9 bevestigd" (bij verplicht) of "7 van 9 gelezen", met wie nog niet. */
export function telBevestigd(m: Mededeling, team: readonly TeamPersoon[], gelezen: readonly Gelezen[]): Bevestiging {
  const groep = doelgroepVan(m, team)
  const nogNiet = groep.filter((p) => !isAf(m, regelVan(gelezen, m.id, p.id))).map((p) => p.naam)
  return { totaal: groep.length, gedaan: groep.length - nogNiet.length, nogNiet }
}

/**
 * De hoogste versie van een werkwijze die deze persoon bevestigde (via een
 * wijziging), of null. Bevestigen telt alleen voor de versie van die wijziging.
 */
export function bevestigdeVersie(werkwijzeId: string, profielId: string, mededelingen: readonly Mededeling[], gelezen: readonly Gelezen[]): number | null {
  let hoogste: number | null = null
  for (const m of mededelingen) {
    if (m.soort !== 'wijziging' || m.werkwijzeId !== werkwijzeId || m.werkwijzeVersie === null) continue
    const r = regelVan(gelezen, m.id, profielId)
    if (r?.bevestigdOp && (hoogste === null || m.werkwijzeVersie > hoogste)) hoogste = m.werkwijzeVersie
  }
  return hoogste
}

/** Mag deze persoon deze mededeling (nog) bevestigen? Alleen als hij voor hem is en niet vervangen. */
export function magBevestigen(m: Mededeling, k: Kijker, werkwijzen: readonly Werkwijze[], nu: Date): boolean {
  return k.profielId !== null && isLopend(m, nu) && !isVervangen(m, werkwijzen) && isVoor(m, k)
}

export interface NieuweVersieInvoer {
  stappen: Stap[]
  watAnders: string | null
  belangrijk: boolean
}

export interface NieuweMededeling extends Doelgroep {
  titel: string
  inhoud: string
  verplicht: boolean
  soort: 'mededeling' | 'wijziging'
  werkwijzeId: string | null
  werkwijzeVersie: number | null
}

export interface NieuweVersie {
  versie: number
  stappen: Stap[]
  watAnders: string | null
  /** Bij een belangrijke wijziging: de verplichte mededeling voor de doelgroep van de werkwijze. */
  mededeling: NieuweMededeling | null
}

/**
 * Een nieuwe versie van een werkwijze. Met "Belangrijke wijziging" maakt Club
 * zelf een verplichte mededeling voor de rollen en vestigingen van de werkwijze,
 * met de zin wat er anders is. Zonder die zin geen belangrijke wijziging.
 */
export function nieuweVersie(w: Werkwijze, invoer: NieuweVersieInvoer, titel: (naam: string, versie: number) => string): NieuweVersie | null {
  if (invoer.belangrijk && !invoer.watAnders) return null
  const versie = w.versie + 1
  return {
    versie,
    stappen: invoer.stappen,
    watAnders: invoer.watAnders,
    mededeling: invoer.belangrijk
      ? {
          titel: titel(w.titel, versie).slice(0, 120),
          inhoud: invoer.watAnders ?? '',
          verplicht: true,
          soort: 'wijziging',
          werkwijzeId: w.id,
          werkwijzeVersie: versie,
          vestigingen: w.vestigingen,
          rollen: w.rollen,
        }
      : null,
  }
}

/** De werkwijzen voor deze kijker; de leiding ziet ze allemaal. */
export function werkwijzenVoor(werkwijzen: readonly Werkwijze[], k: Kijker, leiding: boolean): Werkwijze[] {
  return werkwijzen.filter((w) => !w.gearchiveerd && (leiding || isVoor(w, k))).sort((a, b) => a.titel.localeCompare(b.titel, 'nl'))
}

/** Stappen uit de tekst van een notitie: elke niet-lege regel een stap, zonder opsommingstekens of vinkjes. */
export function stappenUitTekst(tekst: string, max = 40): Stap[] {
  return tekst
    .split(/\r?\n/)
    .map((r) => r.replace(/^(?:\s*(?:[-*•]|\d+[.)]|\[[ xX]?\]|#+)\s+)+/, '').trim())
    .filter((r) => r.length > 0)
    .slice(0, max)
    .map((r) => ({ tekst: r.slice(0, 200), uitleg: null }))
}
