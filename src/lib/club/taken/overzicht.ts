// ─── Fit Factory Club, taken: overzicht voor de manager (PUUR) ──────────────
// Wat is er deze week niet gedaan, en hoe vaak is elke taak de laatste vier
// weken gedaan tegenover het minimum.

import { dagenVanWeek, plusDagen } from '@/lib/club/rooster/tijd'
import type { Afvinking, Taak } from './typen'
import { afvinkIndex, normPerWeek, telGedaan, vakSleutel, weekTeller } from './voortgang'

export interface AchterstandRegel {
  taak: Taak
  /** Dagtaken: de dagen (voor vandaag) zonder vinkje. */
  gemisteDagen: string[]
  /** Weektaken: hoeveel keer er nog te weinig is gedaan. */
  tekort: number
  /** true = de week is voorbij (of de dag), dit is niet meer in te halen. */
  definitief: boolean
}

function dagAchterstand(taak: Taak, index: Map<string, Afvinking>, dagen: readonly string[], vandaag: string): AchterstandRegel | null {
  const gemisteDagen = dagen.filter((d) => d < vandaag && !index.has(vakSleutel(taak.id, d)))
  if (gemisteDagen.length === 0) return null
  return { taak, gemisteDagen, tekort: gemisteDagen.length, definitief: true }
}

function weekAchterstand(taak: Taak, afvinkingen: readonly Afvinking[], dagen: readonly string[], vandaag: string): AchterstandRegel | null {
  const teller = weekTeller(taak, afvinkingen, dagen, vandaag)
  if (teller.status !== 'achter' || teller.minimum === null) return null
  const voorbij = dagen.every((d) => d < vandaag)
  return { taak, gemisteDagen: [], tekort: teller.minimum - teller.gedaan, definitief: voorbij }
}

/**
 * Wat er in deze week niet gedaan is. Vandaag telt nog niet mee als gemist;
 * weektaken staan erin zodra ze achter lopen. Taken zonder minimum nooit.
 */
export function achterstand(taken: readonly Taak[], afvinkingen: readonly Afvinking[], dagen: readonly string[], vandaag: string): AchterstandRegel[] {
  const index = afvinkIndex(afvinkingen)
  const uit: AchterstandRegel[] = []
  for (const taak of taken) {
    if (!taak.actief) continue
    const regel =
      taak.frequentie === 'dagelijks'
        ? dagAchterstand(taak, index, dagen, vandaag)
        : taak.frequentie === 'per_week'
          ? weekAchterstand(taak, afvinkingen, dagen, vandaag)
          : null
    if (regel) uit.push(regel)
  }
  return uit
}

export interface TaakHistorie {
  taak: Taak
  /** Aantal keer gedaan per week, in de volgorde van de maandagen. */
  perWeek: number[]
  /** Minimum per week (7 bij elke dag), null = geen minimum. */
  norm: number | null
  /** In hoeveel van de weken het minimum gehaald is. */
  wekenGehaald: number
  totaal: number
  /** Totaal gedaan gedeeld door totaal nodig (0 tot 1), null = geen minimum. */
  score: number | null
}

/** Per taak hoe vaak gedaan per week tegenover het minimum, over de gegeven weken. */
export function historie(taken: readonly Taak[], afvinkingen: readonly Afvinking[], maandagen: readonly string[]): TaakHistorie[] {
  const weken = maandagen.map(dagenVanWeek)
  return taken
    .filter((t) => t.actief)
    .map((taak) => {
      const perWeek = weken.map((dagen) => telGedaan(taak.id, afvinkingen, dagen))
      const norm = normPerWeek(taak)
      const totaal = perWeek.reduce((s, n) => s + n, 0)
      const wekenGehaald = norm === null ? 0 : perWeek.filter((n) => n >= norm).length
      const nodig = norm === null ? 0 : norm * weken.length
      const score = norm === null || nodig === 0 ? null : Math.min(1, totaal / nodig)
      return { taak, perWeek, norm, wekenGehaald, totaal, score }
    })
}

/** De maandagen van de n volledige weken voor de week van `maandag`, oudste eerst. */
export function vorigeMaandagen(maandag: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => plusDagen(maandag, -7 * (n - i)))
}
