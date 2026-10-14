// ─── Fit Factory Club: de behoudsscore uitgesplitst (PUUR) ──────────────────
// Per onderdeel de punten en een zin die zegt waar ze vandaan komen. Dezelfde
// woorden als in de uitleg van de lijst (perWeekTekst), zodat alles klopt.

import { noShowTekst, perWeekTekst, type Behoud } from './behoud'

export interface Onderdeel {
  label: string
  punten: number
  max: number
  uitleg: string
}

function hoofdletter(tekst: string): string {
  return tekst.charAt(0).toUpperCase() + tekst.slice(1)
}

function frequentie(b: Behoud): string {
  return b.recentPerWeek > 0 ? `${hoofdletter(perWeekTekst(b.recentPerWeek))}, laatste 4 weken` : 'Niet geweest in de laatste 4 weken'
}

function trend(b: Behoud): string {
  if (b.eerderPerWeek === null) return 'Nog te kort lid om te vergelijken'
  if (b.eerderPerWeek === 0) return 'Kwam niet in de 8 weken daarvoor'
  return `Was ${perWeekTekst(b.eerderPerWeek)} in de 8 weken daarvoor`
}

function recent(b: Behoud): string {
  if (b.dagenSinds === null) return 'Geen bezoek in 12 weken'
  if (b.dagenSinds === 0) return 'Vandaag geweest'
  if (b.dagenSinds === 1) return 'Gisteren geweest'
  return `Laatste bezoek ${b.dagenSinds} dagen geleden`
}

function lidDuur(dagen: number | null): string {
  if (dagen === null) return 'Lid sinds onbekend'
  if (dagen < 90) return 'Nieuw lid: de eerste maanden zijn kwetsbaar'
  const maanden = Math.floor(dagen / 30.44)
  if (maanden < 24) return `${maanden} maanden lid`
  return `${Math.floor(dagen / 365.25)} jaar lid`
}

export function behoudOnderdelen(b: Behoud): Onderdeel[] {
  return [
    { label: 'Frequentie', punten: b.onderdelen.frequentie, max: 30, uitleg: frequentie(b) },
    { label: 'Trend', punten: b.onderdelen.trend, max: 30, uitleg: trend(b) },
    { label: 'Recent', punten: b.onderdelen.recent, max: 25, uitleg: recent(b) },
    { label: 'No-shows', punten: b.onderdelen.noShows, max: 10, uitleg: `${noShowTekst(b.noShows)}, laatste 8 weken` },
    { label: 'Lid-duur', punten: b.onderdelen.lidDuur, max: 5, uitleg: lidDuur(b.lidDagen) },
  ]
}
