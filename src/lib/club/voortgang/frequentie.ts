// ─── Club, voortgang: trainingen per week, reeksen en mijlpalen (PUUR) ──────
// Bron: club_trainingslog (wat het lid in de ledenapp afvinkte). Weken lopen
// van maandag tot en met zondag, in Nederlandse tijd.

import { weekStart } from '@/lib/club/training/weergave'

export interface WeekTelling {
  /** Maandag van de week, yyyy-mm-dd. */
  week: string
  aantal: number
}

export interface Mijlpaal {
  sleutel: string
  titel: string
  behaald: boolean
}

export interface VolgendeMijlpaal {
  titel: string
  /** Hoe ver het lid is, 0 tot en met 1. */
  voortgang: number
  nogTeGaan: number
}

export const TRAINING_MIJLPALEN = [1, 10, 25, 50, 100, 250, 500] as const
export const REEKS_MIJLPALEN = [4, 8, 12, 26] as const

function maandagVan(nu: Date, wekenTerug: number): string {
  const d = new Date(`${weekStart(nu.toISOString())}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 7 * wekenTerug)
  return d.toISOString().slice(0, 10)
}

function telPerWeek(ops: readonly string[]): Map<string, number> {
  const telling = new Map<string, number>()
  for (const op of ops) {
    const w = weekStart(op)
    telling.set(w, (telling.get(w) ?? 0) + 1)
  }
  return telling
}

/** Trainingen per week over de laatste `weken` weken, oudste eerst, ook lege weken. */
export function perWeek(ops: readonly string[], nu: Date, weken = 12): WeekTelling[] {
  const telling = telPerWeek(ops)
  return Array.from({ length: weken }, (_, i) => {
    const week = maandagVan(nu, weken - 1 - i)
    return { week, aantal: telling.get(week) ?? 0 }
  })
}

/**
 * Gemiddeld aantal trainingen per week, op een decimaal. De lopende week telt
 * niet mee (die is nog niet af), tenzij het de enige week is.
 */
export function gemiddeldPerWeek(weken: readonly WeekTelling[]): number {
  const af = weken.length > 1 ? weken.slice(0, -1) : weken
  if (af.length === 0) return 0
  const som = af.reduce((t, w) => t + w.aantal, 0)
  return Math.round((som / af.length) * 10) / 10
}

/**
 * Aantal weken op rij met minstens een training, tot en met nu. Een lopende
 * week zonder training breekt de reeks nog niet: dan tellen we vanaf vorige week.
 */
export function wekenOpRij(ops: readonly string[], nu: Date): number {
  const telling = telPerWeek(ops)
  let terug = telling.has(maandagVan(nu, 0)) ? 0 : 1
  let reeks = 0
  while (telling.has(maandagVan(nu, terug))) {
    reeks += 1
    terug += 1
  }
  return reeks
}

function trainingTitel(n: number): string {
  return n === 1 ? 'Eerste training' : `${n} trainingen`
}

/** Alle mijlpalen met behaald ja of nee: trainingen in totaal en weken op rij. */
export function mijlpalen(totaal: number, opRij: number): Mijlpaal[] {
  return [
    ...TRAINING_MIJLPALEN.map((n) => ({ sleutel: `t${n}`, titel: trainingTitel(n), behaald: totaal >= n })),
    ...REEKS_MIJLPALEN.map((n) => ({ sleutel: `r${n}`, titel: `${n} weken op rij`, behaald: opRij >= n })),
  ]
}

/** De eerstvolgende trainingsmijlpaal, of null als alles behaald is. */
export function volgendeMijlpaal(totaal: number): VolgendeMijlpaal | null {
  const doel = TRAINING_MIJLPALEN.find((n) => totaal < n)
  if (doel === undefined) return null
  const vorige = [...TRAINING_MIJLPALEN].reverse().find((n) => n <= totaal) ?? 0
  return {
    titel: trainingTitel(doel),
    voortgang: Math.max(0, Math.min(1, (totaal - vorige) / (doel - vorige))),
    nogTeGaan: doel - totaal,
  }
}
