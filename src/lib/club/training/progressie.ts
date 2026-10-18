// ─── Fit Factory Club, training: progressie per oefening (PUUR) ─────────────
// Vaste vakregels, geen AI. De basis is dubbele progressie:
//   1. Haalt het lid op alle sets de bovenkant van het bereik met hetzelfde
//      gewicht, dan gaat het gewicht de kleinste stap omhoog en begin je weer
//      onderaan het bereik.
//   2. Alle sets binnen het bereik maar nog niet bovenaan: zelfde gewicht,
//      per set een herhaling meer.
//   3. Een set onder het bereik: gewicht vasthouden. Twee keer op rij onder
//      het bereik: een stap terug.
// Zonder extra gewicht (lichaamsgewicht, elastiek) is de volgende stap een
// zwaardere variant. Op tijd: 5 seconden erbij zodra alle sets gehaald zijn.

import type { Materiaal } from './typen'

export interface GelogdeSet {
  trainingId: string
  /** ISO-tijdstip van de training */
  op: string
  setNr: number
  herhalingen: number | null
  gewichtKg: number | null
  tijdSec: number | null
}

export interface Sessie {
  trainingId: string
  op: string
  sets: GelogdeSet[]
}

export interface Voorschrift {
  sets: number | null
  herhalingen: string | null
  tijdSec: number | null
}

export type SuggestieSoort = 'start' | 'gewicht_omhoog' | 'herhalingen_omhoog' | 'vasthouden' | 'gewicht_omlaag' | 'zwaardere_variant' | 'tijd_omhoog'

export interface Suggestie {
  soort: SuggestieSoort
  /** Het gewicht voor de volgende keer, of null als dat niet van toepassing is. */
  gewichtKg: number | null
  /** Doel per set, bijvoorbeeld "10, 10, 9". */
  doel: string | null
  tekst: string
}

/** De kleinste gangbare stap per materiaal; 0 = geen extra gewicht om te verhogen. */
export const KLEINSTE_STAP: Record<Materiaal, number> = {
  barbell: 2.5,
  dumbbell: 2,
  kettlebell: 4,
  machine: 5,
  kabel: 2.5,
  geen: 0,
  band: 0,
  bank: 0,
  cardio_apparaat: 0,
  overig: 0,
}

export const REGEL_NAAM = 'Vaste vakregel: dubbele progressie'

/** "8-10", "8 tot 10" of "10" naar een bereik; null voor "AMRAP" of tijd. */
export function bereik(herhalingen: string | null): { laag: number; hoog: number } | null {
  if (!herhalingen) return null
  const t = herhalingen.trim().toLowerCase().replace(/\s+tot\s+/g, '-').replace(/\s*-\s*/g, '-')
  const m = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(t)
  if (!m) return null
  const laag = Number(m[1])
  const hoog = m[2] ? Number(m[2]) : laag
  return hoog >= laag && laag > 0 ? { laag, hoog } : null
}

const kg = (v: number): string => v.toLocaleString('nl-NL', { maximumFractionDigits: 2 })
const rond = (v: number): number => Math.round(v * 4) / 4

/** Gelogde sets per training, oudste eerst, sets op volgorde. */
export function sessiesUit(sets: readonly GelogdeSet[]): Sessie[] {
  const per = new Map<string, GelogdeSet[]>()
  for (const s of sets) per.set(s.trainingId, [...(per.get(s.trainingId) ?? []), s])
  return [...per.entries()]
    .map(([trainingId, lijst]) => ({ trainingId, op: lijst[0].op, sets: [...lijst].sort((a, b) => a.setNr - b.setNr) }))
    .sort((a, b) => a.op.localeCompare(b.op))
}

/** Het gewicht waarmee de meeste sets gedaan zijn; bij gelijkspel het zwaarste. */
export function werkgewicht(sets: readonly GelogdeSet[]): number | null {
  const telling = new Map<number, number>()
  for (const s of sets) if (s.gewichtKg !== null && s.gewichtKg > 0) telling.set(s.gewichtKg, (telling.get(s.gewichtKg) ?? 0) + 1)
  let beste: number | null = null
  let aantal = 0
  for (const [w, n] of telling) {
    if (n > aantal || (n === aantal && beste !== null && w > beste)) {
      beste = w
      aantal = n
    }
  }
  return beste
}

/** Een punt per training voor de kleine grafiek: werkgewicht, anders meeste herhalingen, anders langste tijd. */
export interface VerloopPunt {
  label: string
  waarde: number
  eenheid: 'kg' | 'herh' | 'sec'
}

export function verloop(sessies: readonly Sessie[]): VerloopPunt[] {
  const metGewicht = sessies.some((s) => werkgewicht(s.sets) !== null)
  const metHerh = sessies.some((s) => s.sets.some((x) => x.herhalingen !== null))
  return sessies.flatMap((s): VerloopPunt[] => {
    if (metGewicht) {
      const w = werkgewicht(s.sets)
      return w === null ? [] : [{ label: s.op, waarde: w, eenheid: 'kg' }]
    }
    if (metHerh) {
      const h = Math.max(...s.sets.map((x) => x.herhalingen ?? 0))
      return [{ label: s.op, waarde: h, eenheid: 'herh' }]
    }
    const t = Math.max(...s.sets.map((x) => x.tijdSec ?? 0))
    return t > 0 ? [{ label: s.op, waarde: t, eenheid: 'sec' }] : []
  })
}

/** Kort wat er de laatste keer gedaan is: "40 kg: 10, 10, 9". */
export function toonSessie(s: Sessie): string {
  const w = werkgewicht(s.sets)
  const herh = s.sets.map((x) => (x.herhalingen !== null ? String(x.herhalingen) : x.tijdSec !== null ? `${x.tijdSec} sec` : '?')).join(', ')
  return w !== null ? `${kg(w)} kg: ${herh}` : herh
}

function opTijd(v: Voorschrift, laatste: Sessie): Suggestie {
  const gedaan = laatste.sets.map((s) => s.tijdSec ?? 0)
  const doel = v.tijdSec ?? Math.max(...gedaan)
  const nodig = v.sets ?? gedaan.length
  if (gedaan.length >= nodig && gedaan.every((t) => t >= doel)) {
    return { soort: 'tijd_omhoog', gewichtKg: null, doel: `${doel + 5} sec`, tekst: `Alle sets ${doel} seconden volgehouden. Volgende keer ${doel + 5} seconden per set.` }
  }
  return { soort: 'vasthouden', gewichtKg: null, doel: `${doel} sec`, tekst: `Nog niet alle sets ${doel} seconden. Zelfde tijd aanhouden tot elke set lukt.` }
}

/** Sets op het werkgewicht (of alle sets zonder gewicht). */
function werksets(s: Sessie): { gewicht: number | null; herh: number[] } {
  const gewicht = werkgewicht(s.sets)
  const sets = gewicht === null ? s.sets : s.sets.filter((x) => x.gewichtKg === gewicht)
  return { gewicht, herh: sets.map((x) => x.herhalingen ?? 0) }
}

/** De suggestie voor de volgende training van deze oefening. */
export function suggestie(v: Voorschrift, materiaal: Materiaal, sessies: readonly Sessie[]): Suggestie {
  const laatste = sessies[sessies.length - 1]
  if (!laatste || laatste.sets.length === 0) {
    return { soort: 'start', gewichtKg: null, doel: null, tekst: 'Nog niets gelogd. Begin rustig; zodra het lid de sets invult in de app, volgt hier de volgende stap.' }
  }
  const metTijd = laatste.sets.every((s) => s.herhalingen === null && s.tijdSec !== null)
  if (metTijd || (v.tijdSec !== null && !v.herhalingen)) return opTijd(v, laatste)

  const b = bereik(v.herhalingen)
  const { gewicht, herh } = werksets(laatste)
  if (!b) return { soort: 'vasthouden', gewichtKg: gewicht, doel: null, tekst: 'Geen vast bereik in het schema. Vergelijk met de vorige keer en verhoog als het makkelijk ging.' }

  const nodig = v.sets ?? herh.length
  const stap = KLEINSTE_STAP[materiaal]
  const volledig = herh.length >= nodig
  const w = gewicht !== null ? `${kg(gewicht)} kg` : 'eigen gewicht'

  if (volledig && herh.every((h) => h >= b.hoog)) {
    if (gewicht !== null && stap > 0) {
      const nieuw = rond(gewicht + stap)
      return {
        soort: 'gewicht_omhoog', gewichtKg: nieuw, doel: Array(nodig).fill(b.laag).join(', '),
        tekst: `Alle ${nodig} sets op ${b.hoog} herhalingen met ${w}. Volgende keer ${kg(nieuw)} kg en terug naar ${b.laag} herhalingen.`,
      }
    }
    return { soort: 'zwaardere_variant', gewichtKg: gewicht, doel: null, tekst: `Alle sets op ${b.hoog} herhalingen zonder extra gewicht. Tijd voor een zwaardere variant, een langzamer tempo of extra gewicht.` }
  }

  if (volledig && herh.every((h) => h >= b.laag)) {
    const doel = herh.slice(0, nodig).map((h) => Math.min(b.hoog, h + 1)).join(', ')
    return { soort: 'herhalingen_omhoog', gewichtKg: gewicht, doel, tekst: `Zelfde gewicht (${w}), per set een herhaling meer: ${doel}. Pas bij ${b.hoog} op elke set gaat het gewicht omhoog.` }
  }

  const vorige = sessies[sessies.length - 2]
  const vorigeOnder = vorige ? werksets(vorige) : null
  if (vorigeOnder && gewicht !== null && stap > 0 && vorigeOnder.gewicht === gewicht && vorigeOnder.herh.some((h) => h < b.laag)) {
    const nieuw = rond(Math.max(0, gewicht - stap))
    return { soort: 'gewicht_omlaag', gewichtKg: nieuw, doel: Array(nodig).fill(b.laag).join(', '), tekst: `Twee keer op rij onder ${b.laag} herhalingen met ${w}. Een stap terug naar ${kg(nieuw)} kg en opnieuw opbouwen.` }
  }
  return { soort: 'vasthouden', gewichtKg: gewicht, doel: Array(nodig).fill(b.laag).join(', '), tekst: `Niet alle sets gehaald. Zelfde gewicht (${w}) tot elke set minstens ${b.laag} herhalingen is.` }
}

export interface ProgressieRegel {
  oefeningId: string
  naam: string
  /** Aantal trainingen met deze oefening. */
  aantal: number
  laatste: string | null
  laatsteOp: string | null
  reeks: { label: string; waarde: number }[]
  eenheid: 'kg' | 'herh' | 'sec' | null
  suggestie: Suggestie
}

interface RegelVoorschrift extends Voorschrift {
  oefeningId: string
}

/** Per oefening in het schema (eerste keer dat hij voorkomt): verloop en suggestie. */
export function progressieOverzicht(
  regels: readonly RegelVoorschrift[],
  oefeningen: ReadonlyMap<string, { naam: string; materiaal: Materiaal }>,
  logs: ReadonlyMap<string, readonly GelogdeSet[]>,
): ProgressieRegel[] {
  const gezien = new Set<string>()
  const uit: ProgressieRegel[] = []
  for (const r of regels) {
    const o = oefeningen.get(r.oefeningId)
    if (!o || gezien.has(r.oefeningId) || o.materiaal === 'cardio_apparaat') continue
    gezien.add(r.oefeningId)
    const sessies = sessiesUit(logs.get(r.oefeningId) ?? [])
    const punten = verloop(sessies)
    const laatste = sessies[sessies.length - 1]
    uit.push({
      oefeningId: r.oefeningId,
      naam: o.naam,
      aantal: sessies.length,
      laatste: laatste ? toonSessie(laatste) : null,
      laatsteOp: laatste?.op ?? null,
      reeks: punten.map(({ label, waarde }) => ({ label, waarde })),
      eenheid: punten[0]?.eenheid ?? null,
      suggestie: suggestie(r, o.materiaal, sessies),
    })
  }
  return uit
}
