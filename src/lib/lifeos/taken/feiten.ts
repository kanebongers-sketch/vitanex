// ─── LifeOS — de vier feiten in gewoon Nederlands ───────────────────────────
// `prioriteit.ts` weet wat de feiten BETEKENEN, dit bestand weet hoe je ze
// NOEMT. Gedeeld door het taak-detail (waar je ze invult), de takenrij (waar je
// ziet wat er ontbreekt) en de dagplankaart (waar je hoort waarom iets niet
// paste) — anders heet inspanning op drie plekken iets anders.
//
// Puur: geen fetch, geen React. Alleen woorden.

import type { EnergieNiveau, TaakFeit } from '@/lib/lifeos/taken/prioriteit'

export const FEIT_LABEL: Record<TaakFeit, string> = Object.freeze({
  impact: 'impact',
  deadline: 'deadline',
  inspanning: 'tijdsinschatting',
  energie: 'energie',
})

/**
 * De impact-schaal. De uiteinden komen uit migratie 100 ("1 = ruis, 5 = dit
 * verandert iets"); de drie ertussen zijn woorden voor de tussenstanden, geen
 * belofte over hoeveel een 3 "waard" is.
 */
export interface ImpactStap {
  waarde: number
  label: string
}

export const IMPACT_SCHAAL: readonly ImpactStap[] = Object.freeze([
  { waarde: 1, label: 'Ruis' },
  { waarde: 2, label: 'Klein' },
  { waarde: 3, label: 'Telt mee' },
  { waarde: 4, label: 'Belangrijk' },
  { waarde: 5, label: 'Verandert iets' },
])

export const ENERGIE_LABEL: Record<EnergieNiveau, string> = Object.freeze({
  laag: 'Laag',
  midden: 'Midden',
  hoog: 'Hoog',
})

/** Wat een energie-niveau in de praktijk betekent. Voor de uitleg bij het veld. */
export const ENERGIE_UITLEG: Record<EnergieNiveau, string> = Object.freeze({
  laag: 'kan als je leeg bent',
  midden: 'gewoon werk',
  hoog: 'diep werk, volle aandacht',
})

/**
 * De feiten waar een score op steunt. Eén ervan is genoeg: `weegSignalen`
 * herverdeelt het gewicht van wat ontbreekt over wat er wél is.
 */
const SCORE_FEITEN: readonly TaakFeit[] = Object.freeze(['impact', 'deadline'])

/** 'impact' · 'impact en deadline' · 'impact, deadline en energie' */
function feitenOpsomming(feiten: readonly TaakFeit[]): string {
  const woorden = feiten.map((f) => FEIT_LABEL[f])
  if (woorden.length === 0) return ''
  if (woorden.length === 1) return woorden[0] ?? ''
  return `${woorden.slice(0, -1).join(', ')} en ${woorden[woorden.length - 1]}`
}

/**
 * Waarom deze taak geen plek in de volgorde heeft — en wat je eraan doet.
 *
 * Dit is de tekst die in de plaats komt van een verzonnen positie. De taak staat
 * niet onderaan omdat hij onbelangrijk is; er valt niets over te zeggen tot je
 * één feit invult, en dat is precies wat hier staat.
 */
export function geenOordeelZin(ontbreekt: readonly TaakFeit[]): string {
  const nodig = ontbreekt.filter((f) => SCORE_FEITEN.includes(f))
  if (nodig.length === 0) return 'Nog geen oordeel.'
  return `Nog geen oordeel: ${feitenOpsomming(nodig)} onbekend. Eén ervan is genoeg om dit te wegen.`
}
