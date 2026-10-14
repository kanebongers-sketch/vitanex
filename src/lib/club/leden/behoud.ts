// ─── Fit Factory Club: behoudsscore (PUUR) ──────────────────────────────────
// Hoe groot is de kans dat een lid afhaakt? Een eerlijke, uitlegbare score van
// 0 tot 100 uit vijf dingen die we echt meten (geen voorspelmodel):
//
//   Frequentie   30 punten  bezoeken per week, laatste 4 weken (2x of meer = vol)
//   Trend        30 punten  laatste 4 weken ten opzichte van de 8 weken daarvoor
//   Recent       25 punten  dagen sinds het laatste bezoek (7 of minder = vol, 28+ = 0)
//   No-shows     10 punten  niet op komen dagen bij een geboekte les, laatste 8 weken
//   Lid-duur      5 punten  nieuwe leden (korter dan 3 maanden) haken vaker af
//
// Label: 70 of meer = goed, 45 tot 70 = let op, onder 45 = risico.
// Bezoeken tellen per kalenderdag: twee keer inchecken op een dag is een bezoek.

import { dagNummer, dagSleutel } from './tijd'

export type BehoudLabel = 'goed' | 'let_op' | 'risico'

export const BEHOUD_LABEL: Record<BehoudLabel, string> = { goed: 'Goed', let_op: 'Let op', risico: 'Risico' }

export const RECENT_DAGEN = 28
export const EERDER_DAGEN = 56
export const VENSTER_DAGEN = RECENT_DAGEN + EERDER_DAGEN
export const NO_SHOW_DAGEN = 56
export const GRENS_GOED = 70
export const GRENS_RISICO = 45

export interface BehoudInvoer {
  /** Check-ins (mogen dubbel per dag en ouder dan 12 weken zijn; we filteren zelf). */
  bezoeken: readonly Date[]
  /** No-shows in de laatste 8 weken. */
  noShows: number
  /** Lid sinds (YYYY-MM-DD), of null als onbekend. */
  lidSinds: string | null
  nu: Date
}

export interface BehoudOnderdelen {
  frequentie: number
  trend: number
  recent: number
  noShows: number
  lidDuur: number
}

export interface Behoud {
  score: number
  label: BehoudLabel
  /** Een zin in mensentaal: "Kwam 3x per week, nu 0x in 2 weken". */
  uitleg: string
  recentPerWeek: number
  /** Null als er nog geen 2 weken historie voor de laatste 4 weken is. */
  eerderPerWeek: number | null
  dagenSinds: number | null
  noShows: number
  lidDagen: number | null
  onderdelen: BehoudOnderdelen
}

interface Meting {
  recentPerWeek: number
  eerderPerWeek: number | null
  dagenSinds: number | null
  lidDagen: number | null
  noShows: number
}

function meet(invoer: BehoudInvoer): Meting {
  const vandaag = dagNummer(dagSleutel(invoer.nu))
  const dagen = new Set<number>()
  for (const b of invoer.bezoeken) {
    const geleden = vandaag - dagNummer(dagSleutel(b))
    if (geleden >= 0 && geleden < VENSTER_DAGEN) dagen.add(geleden)
  }
  const lidDagen = invoer.lidSinds && /^\d{4}-\d{2}-\d{2}/.test(invoer.lidSinds)
    ? Math.max(0, vandaag - dagNummer(invoer.lidSinds.slice(0, 10)))
    : null
  const recent = [...dagen].filter((d) => d < RECENT_DAGEN).length
  const eerder = dagen.size - recent
  const recentWeken = lidDagen === null ? 4 : Math.min(4, Math.max(1, (lidDagen + 1) / 7))
  const eerderWeken = lidDagen === null ? 8 : Math.min(8, Math.max(0, (lidDagen + 1 - RECENT_DAGEN) / 7))
  const geleden = [...dagen]
  return {
    recentPerWeek: recent / recentWeken,
    eerderPerWeek: eerderWeken >= 2 ? eerder / eerderWeken : null,
    dagenSinds: geleden.length ? Math.min(...geleden) : null,
    lidDagen,
    noShows: Math.max(0, Math.floor(invoer.noShows)),
  }
}

function punten(m: Meting): BehoudOnderdelen {
  const frequentie = Math.round(30 * Math.min(m.recentPerWeek / 2, 1))
  const heeftBasis = m.eerderPerWeek !== null && m.eerderPerWeek >= 0.25
  const trend = heeftBasis && m.eerderPerWeek !== null
    ? Math.round(30 * Math.min(m.recentPerWeek / m.eerderPerWeek, 1))
    : m.recentPerWeek > 0 ? 30 : 10
  const recent = m.dagenSinds === null ? 0
    : m.dagenSinds <= 7 ? 25
    : Math.max(0, Math.round((25 * (RECENT_DAGEN - m.dagenSinds)) / (RECENT_DAGEN - 7)))
  const noShows = [10, 6, 3, 0][Math.min(m.noShows, 3)]
  const lidDuur = m.lidDagen === null ? 3 : m.lidDagen < 90 ? 0 : m.lidDagen < 365 ? 3 : 5
  return { frequentie, trend, recent, noShows, lidDuur }
}

/** 1 decimaal met komma, zonder ",0": 3 wordt "3x", 1.5 wordt "1,5x". */
export function keerTekst(n: number): string {
  const afgerond = Math.round(n * 10) / 10
  return `${String(afgerond).replace('.', ',')}x`
}

function hoofdzin(m: Meting): string {
  const r = m.recentPerWeek
  const b = m.eerderPerWeek
  const nieuw = m.lidDagen !== null && m.lidDagen < VENSTER_DAGEN
  if (m.dagenSinds === null) return nieuw ? 'Nog niet geweest sinds de inschrijving' : 'Geen bezoek in de laatste 12 weken'
  if (b !== null && b >= 0.5 && m.dagenSinds >= 14) {
    return `Kwam ${keerTekst(b)} per week, nu 0x in ${Math.floor(m.dagenSinds / 7)} weken`
  }
  if (b !== null && b >= 0.5 && r < b * 0.6) return `Kwam ${keerTekst(b)} per week, nu ${keerTekst(r)} per week`
  if (b !== null && b >= 0.25 && r >= 0.5 && r > b * 1.3) return `Komt vaker: ${keerTekst(r)} per week (was ${keerTekst(b)})`
  if (m.dagenSinds >= 14) return `${m.dagenSinds} dagen niet geweest`
  if (nieuw && b === null) return `Nieuw lid, komt ${keerTekst(r)} per week`
  if (r < 0.5) return `Komt weinig: ${keerTekst(r)} per week`
  return `Komt ${keerTekst(r)} per week, stabiel`
}

function uitleg(m: Meting): string {
  const zin = hoofdzin(m)
  if (m.noShows === 0) return zin
  return `${zin}. ${m.noShows}x niet gekomen bij een geboekte les`
}

export function labelVoorScore(score: number): BehoudLabel {
  if (score >= GRENS_GOED) return 'goed'
  if (score >= GRENS_RISICO) return 'let_op'
  return 'risico'
}

/** De behoudsscore van een lid. */
export function berekenBehoud(invoer: BehoudInvoer): Behoud {
  const m = meet(invoer)
  const onderdelen = punten(m)
  const score = Math.max(0, Math.min(100, Object.values(onderdelen).reduce((s, p) => s + p, 0)))
  return { ...m, score, label: labelVoorScore(score), uitleg: uitleg(m), onderdelen }
}
