// ─── Club: rapporten, de keuze uit de URL (PUUR) ────────────────────────────
// Rapport, maand en vestigingen staan in de URL, zodat een rapport deelbaar is
// en terug/vooruit werkt: ?rapport=bezoek&maand=2026-09&vs=budel&vs=eersel.
// "vs" (meervoud) staat los van "v", de vestiging van de balk bovenin.
// Alleen vestigingen van de eigen sportschool komen erdoor.

import { eersteDag, kiesMaand, laatsteDag, maandenReeks, maandGrenzen, maandNaam, maandVan, VROEGSTE_MAAND, type Maand } from '@/lib/club/cijfers/maand'
import type { VestigingInfo, VestigingSleutel } from '@/lib/club/kern/vestigingen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { kiesRapport, type RapportSleutel } from './definities'

export const VESTIGINGEN_PARAM = 'vs'
export const ALLE = 'alle'

type Ruw = string | string[] | undefined | null

export interface RapportKeuze {
  rapport: RapportSleutel
  maand: Maand
  /** Altijd minstens een, alleen eigen vestigingen, in de volgorde van de sportschool. */
  vestigingen: VestigingSleutel[]
}

/** De kalendermaand: datums (1e en laatste dag, inbegrepen) en momenten (van inbegrepen, tot exclusief). */
export interface RapportPeriode {
  eerste: string
  laatste: string
  van: Date
  tot: Date
}

function lijstVan(ruw: Ruw): string[] {
  if (ruw === undefined || ruw === null) return []
  return (Array.isArray(ruw) ? ruw : [ruw]).flatMap((w) => w.split(',')).map((w) => w.trim()).filter(Boolean)
}

/**
 * De gekozen vestigingen: "alle" of losse sleutels. Onbekende sleutels vallen
 * weg; blijft er niets over, dan de vestiging van de balk (of de standaard).
 */
export function kiesVestigingen(lijst: readonly VestigingInfo[], ruw: Ruw, balk: VestigingSleutel | null): VestigingSleutel[] {
  const gevraagd = lijstVan(ruw)
  if (gevraagd.includes(ALLE)) return lijst.map((v) => v.sleutel)
  const gekozen = lijst.filter((v) => gevraagd.includes(v.sleutel)).map((v) => v.sleutel)
  if (gekozen.length > 0) return gekozen
  const terug = lijst.find((v) => v.sleutel === balk) ?? lijst.find((v) => v.standaard) ?? lijst[0]
  return terug ? [terug.sleutel] : []
}

/**
 * Voor de export: noemt het verzoek een vestiging die niet bij deze
 * sportschool hoort? Dan weigeren we, in plaats van stil iets anders te geven.
 */
export function heeftVreemdeVestiging(lijst: readonly VestigingInfo[], ruw: Ruw): boolean {
  return lijstVan(ruw).some((w) => w !== ALLE && !lijst.some((v) => v.sleutel === w))
}

export function rapportKeuze(zoek: Record<string, Ruw>, lijst: readonly VestigingInfo[], balk: VestigingSleutel | null, vandaag: string): RapportKeuze {
  return {
    rapport: kiesRapport(zoek.rapport),
    maand: kiesMaand(zoek.maand, vandaag),
    vestigingen: kiesVestigingen(lijst, zoek[VESTIGINGEN_PARAM], balk),
  }
}

export function rapportPeriode(m: Maand): RapportPeriode {
  const { van, tot } = maandGrenzen(m)
  return { eerste: eersteDag(m), laatste: laatsteDag(m), van, tot }
}

/** De zoekparameters van een keuze, voor links en de CSV-route. */
export function keuzeZoek(k: RapportKeuze, alle: boolean): URLSearchParams {
  const zoek = new URLSearchParams({ rapport: k.rapport, maand: k.maand })
  if (alle) zoek.append(VESTIGINGEN_PARAM, ALLE)
  else for (const v of k.vestigingen) zoek.append(VESTIGINGEN_PARAM, v)
  return zoek
}

/** Zijn alle vestigingen van de sportschool gekozen? */
export function isAlles(k: RapportKeuze, lijst: readonly VestigingInfo[]): boolean {
  return lijst.length > 0 && lijst.every((v) => k.vestigingen.includes(v.sleutel))
}

/** Zoveel maanden terug staan in de keuzelijst. */
export const KEUZE_MAANDEN = 36

export interface MaandKeuze {
  maand: Maand
  /** "September 2026" */
  label: string
}

/** De kiesbare maanden, nieuwste eerst: de lopende maand en de 35 ervoor. */
export function maandKeuzes(vandaag: string, taal: Taal = 'nl'): MaandKeuze[] {
  return maandenReeks(maandVan(vandaag), KEUZE_MAANDEN)
    .filter((m) => m >= VROEGSTE_MAAND)
    .reverse()
    .map((m) => {
      const naam = maandNaam(m, taal)
      return { maand: m, label: naam.charAt(0).toUpperCase() + naam.slice(1) }
    })
}
