// ─── Club: rapporten over het team (PUUR) ───────────────────────────────────
// Afspraken per trainer, uren uit het personeelsrooster en afgehandelde
// opvolgtaken. Steeds een rij per medewerker en vestiging.

import { REGEL_SLEUTELS } from '@/lib/club/automatisering/regels'
import { duurMin } from '@/lib/club/personeel/regels'
import type { Dienst } from '@/lib/club/personeel/typen'
import { gewerktMin } from '@/lib/club/personeel/uren'
import { groepeer, type VestigingNaam } from './bouw-leden'
import type { CsvWaarde } from './csv'
import { uren, vergelijkNaam } from './opmaak'
import type { AfspraakRij, OpvolgRij } from './rijen'

export type DienstRij = Dienst & { vestiging: string }

const ONBEKEND = '(onbekende medewerker)'

interface Groep<T> {
  naam: string
  vestiging: string
  rijen: T[]
}

/** Groepen per persoon en vestiging, op naam en dan vestiging. */
function perPersoon<T>(rijen: readonly T[], persoon: (r: T) => string, vestiging: (r: T) => string, naam: (p: string) => string, vestNaam: VestigingNaam): Groep<T>[] {
  return [...groepeer(rijen, (r) => `${persoon(r)}\u0000${vestiging(r)}`).values()]
    .map((eigen) => ({ naam: naam(persoon(eigen[0])), vestiging: vestNaam(vestiging(eigen[0])), rijen: eigen }))
    .sort((a, b) => vergelijkNaam(a.naam, b.naam) || vergelijkNaam(a.vestiging, b.vestiging))
}

function tel<T>(rijen: readonly T[], wel: (r: T) => boolean): number {
  return rijen.reduce((n, r) => n + (wel(r) ? 1 : 0), 0)
}

function som<T>(rijen: readonly T[], waarde: (r: T) => number): number {
  return rijen.reduce((n, r) => n + waarde(r), 0)
}

export function afsprakenPerTrainer(afspraken: readonly AfspraakRij[], medewerkers: ReadonlyMap<string, string>, vestiging: VestigingNaam): CsvWaarde[][] {
  const groepen = perPersoon(afspraken, (a) => a.medewerkerId, (a) => a.vestiging, (id) => medewerkers.get(id) ?? ONBEKEND, vestiging)
  return groepen.map(({ naam, vestiging: v, rijen }) => [
    naam,
    v,
    rijen.length,
    tel(rijen, (a) => a.status === 'geweest'),
    tel(rijen, (a) => a.status === 'niet_gekomen'),
    tel(rijen, (a) => a.status === 'geannuleerd'),
    tel(rijen, (a) => a.status === 'gepland'),
    uren(som(rijen, (a) => (a.status === 'geannuleerd' ? 0 : Math.max(0, (a.eind.getTime() - a.start.getTime()) / 60_000)))),
  ])
}

function geplandWerk(d: DienstRij): number {
  return d.uursoort === 'werk' ? duurMin(d.begin, d.eind) : 0
}

function alleenStatus(d: DienstRij, statussen: readonly string[]): number {
  return statussen.includes(d.uurStatus) ? gewerktMin(d) : 0
}

/** Uren per medewerker en vestiging. Open diensten (zonder medewerker) tellen niet. */
export function urenPerMedewerker(diensten: readonly DienstRij[], medewerkers: ReadonlyMap<string, string>, vestiging: VestigingNaam): CsvWaarde[][] {
  const bemand = diensten.filter((d): d is DienstRij & { medewerkerId: string } => d.medewerkerId !== null)
  const groepen = perPersoon(bemand, (d) => d.medewerkerId, (d) => d.vestiging, (id) => medewerkers.get(id) ?? ONBEKEND, vestiging)
  return groepen.map(({ naam, vestiging: v, rijen }) => [
    naam,
    v,
    tel(rijen, (d) => d.uursoort === 'werk'),
    uren(som(rijen, geplandWerk)),
    uren(som(rijen, gewerktMin)),
    uren(som(rijen, (d) => alleenStatus(d, ['goedgekeurd', 'verwerkt']))),
    uren(som(rijen, (d) => alleenStatus(d, ['verwerkt']))),
    uren(som(rijen, (d) => alleenStatus(d, ['gewerkt']))),
    uren(som(rijen, (d) => (d.uursoort === 'ziek' ? duurMin(d.begin, d.eind) : 0))),
    uren(som(rijen, (d) => (d.uursoort === 'verlof' ? duurMin(d.begin, d.eind) : 0))),
  ])
}

/** Afgehandelde opvolgtaken per persoon en vestiging, meeste eerst. */
export function opvolgPerMedewerker(taken: readonly OpvolgRij[], vestiging: VestigingNaam): CsvWaarde[][] {
  const groepen = perPersoon(taken, (t) => t.door ?? '(onbekend)', (t) => t.vestiging, (n) => n, vestiging)
  return groepen
    .sort((a, b) => b.rijen.length - a.rijen.length)
    .map(({ naam, vestiging: v, rijen }) => [
      naam,
      v,
      rijen.length,
      tel(rijen, (t) => t.status === 'gedaan'),
      tel(rijen, (t) => t.status === 'overgeslagen'),
      ...REGEL_SLEUTELS.map((s) => tel(rijen, (t) => t.regel === s)),
    ])
}
