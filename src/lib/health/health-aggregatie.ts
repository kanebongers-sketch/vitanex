/**
 * Pure aggregatie van ruwe gezondheidsmetingen naar één dagmeting per datum.
 * Geen plugin-, netwerk- of DOM-code: alles hier is unit-testbaar.
 *
 * Afspraken (zoals Apple Health en Health Connect zelf rapporteren):
 * - Een dag is een kalenderdag in Europe/Amsterdam.
 * - Een nacht slaap hoort bij de dag waarop je wakker wordt.
 * - Sommen (stappen, kcal, afstand) tellen op; momentmetingen (rusthartslag,
 *   HRV, zuurstof, ademhaling) middelen; gewicht en VO2max nemen de laatste.
 */
import { datumInNL, type DagMeting, type NumeriekVeld, type WorkoutMeting } from './health-data'

export type DagWaarden = Partial<Record<NumeriekVeld, number>> & {
  bedtijd?: string
  wektijd?: string
}
export type PerDag = Map<string, DagWaarden>

export interface Interval { start: string; eind: string; waarde: number }
export interface Punt { tijd: string; waarde: number }
export type PuntModus = 'gemiddelde' | 'laatste' | 'som'

export type SlaapStadium = 'wakker' | 'uit_bed' | 'licht' | 'diep' | 'rem' | 'slaap' | 'onbekend'
export interface SlaapSessie {
  start: string
  eind: string
  stadia?: { start: string; eind: string; stadium: SlaapStadium }[]
}

const MIN = 60_000

function ms(iso: string): number {
  return Date.parse(iso)
}

/** Datum (NL) van het midden van een interval: robuust bij zomer/wintertijd. */
export function dagVanInterval(start: string, eind: string): string {
  return datumInNL(new Date((ms(start) + ms(eind)) / 2))
}

/**
 * Dag-buckets (zoals aggregateRecords/queryAggregated ze leveren) naar één
 * waarde per datum. Lege buckets (0) tellen alleen mee als `nulIsWaarde`.
 */
export function bucketsPerDag(buckets: Interval[], nulIsWaarde = false): Map<string, number> {
  const perDag = new Map<string, number>()
  for (const b of buckets) {
    if (!Number.isFinite(b.waarde) || Number.isNaN(ms(b.start)) || Number.isNaN(ms(b.eind))) continue
    if (b.waarde < 0 || (b.waarde === 0 && !nulIsWaarde)) continue
    const datum = dagVanInterval(b.start, b.eind)
    perDag.set(datum, (perDag.get(datum) ?? 0) + b.waarde)
  }
  return perDag
}

/** Momentmetingen per datum: gemiddelde, laatste of som. */
export function puntenPerDag(punten: Punt[], modus: PuntModus): Map<string, number> {
  const groepen = new Map<string, Punt[]>()
  for (const p of punten) {
    if (!Number.isFinite(p.waarde) || Number.isNaN(ms(p.tijd))) continue
    const datum = datumInNL(new Date(p.tijd))
    groepen.set(datum, [...(groepen.get(datum) ?? []), p])
  }
  const perDag = new Map<string, number>()
  for (const [datum, groep] of groepen) {
    perDag.set(datum, vatSamen(groep, modus))
  }
  return perDag
}

function vatSamen(groep: Punt[], modus: PuntModus): number {
  if (modus === 'laatste') {
    return groep.reduce((a, b) => (ms(b.tijd) >= ms(a.tijd) ? b : a)).waarde
  }
  const som = groep.reduce((s, p) => s + p.waarde, 0)
  return modus === 'som' ? som : som / groep.length
}

function minutenTussen(start: string, eind: string): number {
  return Math.max(0, (ms(eind) - ms(start)) / MIN)
}

/** Minuten per slaapstadium binnen één sessie. */
function stadiumMinuten(sessie: SlaapSessie): Record<SlaapStadium, number> {
  const totaal: Record<SlaapStadium, number> = {
    wakker: 0, uit_bed: 0, licht: 0, diep: 0, rem: 0, slaap: 0, onbekend: 0,
  }
  for (const s of sessie.stadia ?? []) {
    totaal[s.stadium] += minutenTussen(s.start, s.eind)
  }
  return totaal
}

interface NachtTotaal {
  slaap: number; diep: number; licht: number; rem: number; wakker: number
  heeftStadia: boolean; langste: SlaapSessie; langsteDuur: number
}

function telSessie(nacht: NachtTotaal | undefined, sessie: SlaapSessie): NachtTotaal {
  const duur = minutenTussen(sessie.start, sessie.eind)
  const st = stadiumMinuten(sessie)
  const wakker = st.wakker + st.uit_bed
  const basis: NachtTotaal = nacht ?? {
    slaap: 0, diep: 0, licht: 0, rem: 0, wakker: 0, heeftStadia: false, langste: sessie, langsteDuur: 0,
  }
  return {
    slaap: basis.slaap + Math.max(0, duur - wakker),
    diep: basis.diep + st.diep,
    licht: basis.licht + st.licht,
    rem: basis.rem + st.rem,
    wakker: basis.wakker + wakker,
    heeftStadia: basis.heeftStadia || (sessie.stadia?.length ?? 0) > 0,
    langste: duur > basis.langsteDuur ? sessie : basis.langste,
    langsteDuur: Math.max(duur, basis.langsteDuur),
  }
}

/**
 * Slaapsessies per nacht, toegewezen aan de wekdag. Totaal = sessieduur min
 * wakker/uit-bed; bed- en wektijd komen van de langste sessie (de hoofdslaap).
 */
export function slaapPerNacht(sessies: SlaapSessie[]): PerDag {
  const nachten = new Map<string, NachtTotaal>()
  for (const s of sessies) {
    if (Number.isNaN(ms(s.start)) || Number.isNaN(ms(s.eind)) || ms(s.eind) <= ms(s.start)) continue
    const datum = datumInNL(new Date(s.eind))
    nachten.set(datum, telSessie(nachten.get(datum), s))
  }
  const perDag: PerDag = new Map()
  for (const [datum, n] of nachten) {
    const waarden: DagWaarden = {
      slaapMinuten: Math.round(n.slaap),
      bedtijd: new Date(n.langste.start).toISOString(),
      wektijd: new Date(n.langste.eind).toISOString(),
    }
    if (n.heeftStadia) {
      waarden.slaapDiepMin = Math.round(n.diep)
      waarden.slaapLichtMin = Math.round(n.licht)
      waarden.slaapRemMin = Math.round(n.rem)
      waarden.slaapWakkerMin = Math.round(n.wakker)
    }
    perDag.set(datum, waarden)
  }
  return perDag
}

/** Trainingsminuten per dag (dag van de start), als maat voor beweegminuten. */
export function workoutMinutenPerDag(workouts: WorkoutMeting[]): Map<string, number> {
  const perDag = new Map<string, number>()
  for (const w of workouts) {
    const minuten = minutenTussen(w.start, w.eind)
    if (minuten <= 0) continue
    const datum = datumInNL(new Date(w.start))
    perDag.set(datum, Math.min(1440, (perDag.get(datum) ?? 0) + minuten))
  }
  return perDag
}

/** Zet een Map<datum, getal> om naar een PerDag voor één veld. */
export function alsVeld(veld: NumeriekVeld, waarden: Map<string, number>): PerDag {
  const perDag: PerDag = new Map()
  for (const [datum, waarde] of waarden) perDag.set(datum, { [veld]: waarde })
  return perDag
}

/**
 * Voegt deelresultaten samen tot één gesorteerde lijst dagmetingen.
 * Bij dubbele velden wint de eerste bron die het veld vult.
 */
export function combineerPerDag(...delen: PerDag[]): DagMeting[] {
  const totaal = new Map<string, DagMeting>()
  for (const deel of delen) {
    for (const [datum, waarden] of deel) {
      const bestaand = totaal.get(datum) ?? { datum }
      const aanvulling = Object.fromEntries(
        Object.entries(waarden).filter(([veld, w]) =>
          w !== undefined && bestaand[veld as keyof DagMeting] === undefined),
      )
      totaal.set(datum, { ...bestaand, ...aanvulling })
    }
  }
  return [...totaal.values()].sort((a, b) => a.datum.localeCompare(b.datum))
}
