// ─── Club: exports op Cijfers, dezelfde als Rapporten (PUUR) ────────────────
// Ontwerp "Club in 10 minuten" (03-11-2026): Rapporten zijn de cijfers als
// Excel. Op Cijfers staat bij elk hoofdstuk een knop Exporteren en onderaan de
// sectie "Alle exports" (#exports). Elke knop maakt precies dezelfde link als
// /club/rapporten voor dezelfde keuze, zodat een download nooit iets anders
// bevat dan het rapport. /club/rapporten blijft het volledige scherm met voorbeeld.

import type { Maand } from '@/lib/club/cijfers/maand'
import type { VestigingSleutel } from '@/lib/club/kern/vestigingen'
import { RAPPORT_GROEPEN, RAPPORT_SLEUTELS, RAPPORTEN, type RapportGroep, type RapportSleutel } from './definities'
import { keuzeZoek, type RapportKeuze } from './keuze'

/** De hoofdstukken van Cijfers met een export erachter. */
export const CIJFER_HOOFDSTUKKEN = ['leden', 'bezoek', 'lessen', 'leads'] as const
export type CijferHoofdstuk = (typeof CIJFER_HOOFDSTUKKEN)[number]

/** Welke rapporten bij welk hoofdstuk horen; team (afspraken, uren, opvolging) staat alleen in Alle exports. */
export const CIJFER_EXPORTS: Readonly<Record<CijferHoofdstuk, readonly RapportSleutel[]>> = {
  leden: ['ledenlijst', 'instroom'],
  bezoek: ['bezoek'],
  lessen: ['bezetting', 'noshows'],
  leads: ['leads'],
}

/** Het pad van de CSV-route voor een keuze; Rapporten gebruikt dezelfde functie. */
export function exportHref(k: RapportKeuze, alle: boolean): string {
  return `/api/club/rapporten/csv?${keuzeZoek(k, alle).toString()}`
}

/** Het rapport met voorbeeld op /club/rapporten, met dezelfde keuze. */
export function rapportPaginaHref(k: RapportKeuze, alle: boolean): string {
  return `/club/rapporten?${keuzeZoek(k, alle).toString()}`
}

export interface ExportLink {
  rapport: RapportSleutel
  /** CSV-download. */
  href: string
  /** Het rapport met voorbeeld. */
  voorbeeld: string
}

export interface ExportBasis {
  maand: Maand
  /** De vestigingen van het bereik op Cijfers (een, of alle). */
  vestigingen: readonly VestigingSleutel[]
  alle: boolean
}

export function exportLink(rapport: RapportSleutel, b: ExportBasis): ExportLink {
  const k: RapportKeuze = { rapport, maand: b.maand, vestigingen: [...b.vestigingen] }
  return { rapport, href: exportHref(k, b.alle), voorbeeld: rapportPaginaHref(k, b.alle) }
}

/** De exportknoppen per hoofdstuk van Cijfers. */
export function hoofdstukExports(b: ExportBasis): Record<CijferHoofdstuk, ExportLink[]> {
  return Object.fromEntries(CIJFER_HOOFDSTUKKEN.map((h) => [h, CIJFER_EXPORTS[h].map((r) => exportLink(r, b))])) as Record<CijferHoofdstuk, ExportLink[]>
}

/** Alle exports, per groep van Rapporten, in vaste volgorde. */
export function alleExports(b: ExportBasis): { groep: RapportGroep; links: ExportLink[] }[] {
  return RAPPORT_GROEPEN.map((groep) => ({ groep, links: RAPPORT_SLEUTELS.filter((s) => RAPPORTEN[s].groep === groep).map((s) => exportLink(s, b)) }))
}
