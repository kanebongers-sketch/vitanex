// ─── Club, rep-speler: tempo uit het schema lezen (PUUR) ────────────────────
// Het schema bewaart tempo als vier tekens (zie leesTempo in ../invoer.ts):
// "3110" is 3 seconden excentrisch (remmen), 1 seconde stil op het gerekte punt,
// 1 seconde concentrisch (duwen of trekken), 0 seconden stil op het
// samengetrokken punt. X betekent explosief. Ook "3-1-1-0" en "3 1 1 0" lezen we.
// Leeg of onleesbaar: het standaardtempo 2-0-2-0.
// Let op (besluit Kane 29-10-2026): dit tempo stuurt het beeld NIET meer. Het
// beeld speelt altijd op AFSPEEL_TEMPO (1 seconde heen, 1 seconde terug); het
// schematempo staat erbij als tekst en curve.

import type { Tempo } from './typen'

/** Standaard als het schema geen tempo heeft: 2 seconden heen, 2 terug, geen stilstand. */
export const STANDAARD_TEMPO: Tempo = { excentrisch: 2, pauzeGerekt: 0, concentrisch: 2, pauzeSamen: 0 }

/**
 * Het tempo waarop het beeld altijd speelt (besluit Kane 29-10-2026): 1 seconde
 * heen, 1 seconde terug, geen vastmomenten. Zo speelt de render op zijn eigen
 * snelheid en worden de beelden nooit uitgerekt. Een herhaling duurt 2 seconden.
 */
export const AFSPEEL_SEC_PER_RICHTING = 1
export const AFSPEEL_TEMPO: Tempo = { excentrisch: AFSPEEL_SEC_PER_RICHTING, pauzeGerekt: 0, concentrisch: AFSPEEL_SEC_PER_RICHTING, pauzeSamen: 0 }

/** Een X (explosief) speelt zo snel als netjes kan. */
export const EXPLOSIEF_SEC = 0.6

/** Een beweging duurt nooit korter dan dit: een 0 bij heen of terug lezen we als explosief. */
export const MIN_BEWEGING_SEC = EXPLOSIEF_SEC

function teken(c: string): number {
  return c === 'X' ? EXPLOSIEF_SEC : Number(c)
}

/** Lees het tempo uit het schema, of null bij leeg of onleesbaar. */
export function leesSchemaTempo(ruw: string | null | undefined): Tempo | null {
  if (typeof ruw !== 'string') return null
  const t = ruw.toUpperCase().replace(/[\s.:/,-]/g, '')
  if (!/^[0-9X]{4}$/.test(t)) return null
  const [e, g, c, s] = t.split('').map(teken)
  return {
    excentrisch: Math.max(MIN_BEWEGING_SEC, e),
    pauzeGerekt: t[1] === 'X' ? 0 : g,
    concentrisch: Math.max(MIN_BEWEGING_SEC, c),
    pauzeSamen: t[3] === 'X' ? 0 : s,
  }
}

/** Lees het tempo uit het schema. Geeft het standaardtempo bij leeg of onleesbaar. */
export function leesRepTempo(ruw: string | null | undefined): Tempo {
  return leesSchemaTempo(ruw) ?? STANDAARD_TEMPO
}

/** Seconden als korte tekst: 2 wordt "2 sec", 0,6 wordt "explosief". */
export function secTekst(sec: number): string {
  if (sec <= EXPLOSIEF_SEC + 1e-9) return 'explosief'
  const afgerond = Math.round(sec * 10) / 10
  return `${String(afgerond).replace('.', ',')} sec`
}
