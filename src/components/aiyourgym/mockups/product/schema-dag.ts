// ─── Voorpagina: het voorbeeldschema van het schemascherm (PUUR) ────────────
// Besluit Kane (29-10-2026): het schemascherm op de voorpagina toont de eigen
// Blender-renders, statisch en rustig. Een lid van Kernhal (verzonnen), doel
// kracht, niveau 2, full body drie keer per week. De dosering volgt de regels van
// het schemavoorstel (voorstel-regels.ts) en de basisschema's (sjablonen/basis.ts):
// de hoofdoefening 4 × 4 tot 6 met 2:30 rust, aanvullend werk 3 sets (in een
// superset rust pas na de ronde), isolatie 3 × 8 tot 10, romp 3 × 30 tot 45
// seconden, RIR 2 behalve de romp. Volgorde: groot naar klein, de romp als laatste.
// De herhalingen staan als een getal binnen dat bereik, zoals een trainer ze
// voorschrijft. Oefeningen staan op slug (map van de render); een oefening zonder
// render valt weg, een nieuwe render verschijnt vanzelf bij de volgende dag.

import { leesRepTempo } from '@/lib/club/training/repspeler/tempo'
import type { OefenRender } from '@/components/aiyourgym/inhoud/oefenrenders'

export interface SchemaRegel {
  slug: string
  /** Zelfde letter = superset (direct na elkaar). */
  blok: string
  sets: number
  /** Herhalingen per set, of seconden bij vasthouden. */
  doel: number
  /** Doel in seconden (plank). */
  opTijd?: boolean
  /** null = eigen lichaamsgewicht of geen gewicht. */
  kg: number | null
  rir: number | null
  rustSec: number
  /** Vier tekens, zie leesRepTempo; null bij vasthouden. */
  tempo: string | null
  /** Per been (lunge). */
  perKant?: boolean
}

/** Dag B: de dag die het scherm laat zien. */
export const DAG_B: readonly SchemaRegel[] = [
  { slug: 'back-squat', blok: 'A', sets: 4, doel: 5, kg: 62.5, rir: 2, rustSec: 150, tempo: '3110' },
  { slug: 'overhead-press', blok: 'B', sets: 3, doel: 6, kg: 30, rir: 2, rustSec: 0, tempo: '2010' },
  { slug: 'barbell-row', blok: 'B', sets: 3, doel: 8, kg: 45, rir: 2, rustSec: 120, tempo: '2011' },
  { slug: 'lunge-met-barbell', blok: 'C', sets: 3, doel: 8, kg: 30, rir: 2, rustSec: 90, tempo: '2010', perKant: true },
  { slug: 'push-up', blok: 'D', sets: 3, doel: 10, kg: null, rir: 2, rustSec: 0, tempo: '3110' },
  { slug: 'barbell-curl', blok: 'D', sets: 3, doel: 10, kg: 20, rir: 2, rustSec: 90, tempo: '3010' },
  { slug: 'glute-bridge', blok: 'E', sets: 3, doel: 10, kg: 70, rir: 2, rustSec: 0, tempo: '2011' },
  { slug: 'plank', blok: 'E', sets: 3, doel: 40, opTijd: true, kg: null, rir: null, rustSec: 60, tempo: null },
]

/** De zwaarste set back squat over de laatste zes trainingen (kg), de oefening in het paneel. */
export const UITGELICHT = { slug: 'back-squat', zwaarste: [55, 57.5, 57.5, 60, 60, 62.5] } as const

export interface RegelMetRender extends SchemaRegel {
  render: OefenRender
  /** A1, B1, B2 ... */
  code: string
}

export interface SchemaBlok {
  letter: string
  regels: readonly RegelMetRender[]
}

/** De regels van de dag met hun render, in blokken; regels zonder render vallen weg. */
export function schemaBlokken(regels: readonly SchemaRegel[], renders: readonly OefenRender[]): SchemaBlok[] {
  const opSlug = new Map(renders.map((r) => [r.slug, r]))
  const uit: { letter: string; regels: RegelMetRender[] }[] = []
  for (const regel of regels) {
    const render = opSlug.get(regel.slug)
    if (!render) continue
    const laatste = uit[uit.length - 1]
    const blok = laatste && laatste.letter === regel.blok ? laatste : null
    if (blok) blok.regels.push({ ...regel, render, code: '' })
    else uit.push({ letter: regel.blok, regels: [{ ...regel, render, code: '' }] })
  }
  // Letters opnieuw nummeren, zodat een weggevallen oefening geen gat laat.
  return uit.map((b, i) => {
    const letter = String.fromCharCode(65 + i)
    return { letter, regels: b.regels.map((r, j) => ({ ...r, code: `${letter}${j + 1}` })) }
  })
}

/** De renders die niet op deze dag staan: die komen bij de volgende dag (nieuwe renders vanzelf). */
export function volgendeDag(regels: readonly SchemaRegel[], renders: readonly OefenRender[]): OefenRender[] {
  const opDag = new Set(regels.map((r) => r.slug))
  return renders.filter((r) => !opDag.has(r.slug))
}

export type TempoDeelSoort = 'omlaag' | 'vast' | 'omhoog'

export interface TempoDeel {
  soort: TempoDeelSoort
  sec: number
}

/**
 * Het tempo als vier balkjes: omlaag (remmen), vast onderin, omhoog, vast
 * bovenin. Een deel van 0 seconden valt weg. null bij vasthouden.
 */
export function tempoDelen(tempo: string | null): TempoDeel[] | null {
  if (!tempo) return null
  const t = leesRepTempo(tempo)
  const delen: TempoDeel[] = [
    { soort: 'omlaag', sec: t.excentrisch },
    { soort: 'vast', sec: t.pauzeGerekt },
    { soort: 'omhoog', sec: t.concentrisch },
    { soort: 'vast', sec: t.pauzeSamen },
  ]
  return delen.filter((d) => d.sec > 0)
}

/** Rust als m:ss. */
export function rustTekst(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Totaal aantal sets van de dag. */
export function totaalSets(blokken: readonly SchemaBlok[]): number {
  return blokken.reduce((som, b) => som + b.regels.reduce((s, r) => s + r.sets, 0), 0)
}
