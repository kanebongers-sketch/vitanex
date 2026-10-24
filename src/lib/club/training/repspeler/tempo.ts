// ─── Club, rep-speler: tempo uit het schema lezen (PUUR) ────────────────────
// Het schema bewaart tempo als vier tekens (zie leesTempo in ../invoer.ts):
// "3110" is 3 seconden excentrisch (remmen), 1 seconde stil op het gerekte punt,
// 1 seconde concentrisch (duwen of trekken), 0 seconden stil op het
// samengetrokken punt. X betekent explosief. Ook "3-1-1-0" en "3 1 1 0" lezen we.
// Leeg of onleesbaar: het standaardtempo 2-0-2-0.

import type { Tempo } from './typen'

/** Standaard als het schema geen tempo heeft: 2 seconden heen, 2 terug, geen stilstand. */
export const STANDAARD_TEMPO: Tempo = { excentrisch: 2, pauzeGerekt: 0, concentrisch: 2, pauzeSamen: 0 }

/** Een X (explosief) speelt zo snel als netjes kan. */
export const EXPLOSIEF_SEC = 0.6

/** Een beweging duurt nooit korter dan dit: een 0 bij heen of terug lezen we als explosief. */
export const MIN_BEWEGING_SEC = EXPLOSIEF_SEC

function teken(c: string): number {
  return c === 'X' ? EXPLOSIEF_SEC : Number(c)
}

/** Lees het tempo uit het schema. Geeft het standaardtempo bij leeg of onleesbaar. */
export function leesRepTempo(ruw: string | null | undefined): Tempo {
  if (typeof ruw !== 'string') return STANDAARD_TEMPO
  const t = ruw.toUpperCase().replace(/[\s.:/,-]/g, '')
  if (!/^[0-9X]{4}$/.test(t)) return STANDAARD_TEMPO
  const [e, g, c, s] = t.split('').map(teken)
  return {
    excentrisch: Math.max(MIN_BEWEGING_SEC, e),
    pauzeGerekt: t[1] === 'X' ? 0 : g,
    concentrisch: Math.max(MIN_BEWEGING_SEC, c),
    pauzeSamen: t[3] === 'X' ? 0 : s,
  }
}

/** Seconden als korte tekst: 2 wordt "2 sec", 0,6 wordt "explosief". */
export function secTekst(sec: number): string {
  if (sec <= EXPLOSIEF_SEC + 1e-9) return 'explosief'
  const afgerond = Math.round(sec * 10) / 10
  return `${String(afgerond).replace('.', ',')} sec`
}
