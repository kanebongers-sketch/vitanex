// ─── Fit Factory Club, personeel: urenadministratie (PUUR) ──────────────────
// Per periode (week, maand of vier weken) per medewerker: gepland, gewerkt,
// contract, ziek, verlof, avond (na 18:00) en weekend. Plus de afwijkingen die
// de administratie moet bekijken voordat iets wordt goedgekeurd.
//
// Gewerkte tijd = gewerkt begin tot eind (of de geplande tijd als die niet is
// aangepast) min de pauze. Een dienst telt pas als gewerkt vanaf status
// "gewerkt". Avond- en weekenduren rekenen op de tijd zonder pauze.

import { isoWeekdag, maandagVan, plusDagen, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import { duurMin, vindOverlap } from './regels'
import type { Dienst, PersoneelLid } from './typen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { PERSONEEL_REGELS } from '@/lib/aiyourgym/taal/woorden/club/personeel'

export const PERIODE_SOORTEN = ['week', '4weken', 'maand'] as const
export type PeriodeSoort = (typeof PERIODE_SOORTEN)[number]

export const PERIODE_LABEL: Record<PeriodeSoort, string> = { week: 'Week', '4weken': '4 weken', maand: 'Maand' }

export interface Periode {
  soort: PeriodeSoort
  /** Eerste dag (inclusief). */
  van: string
  /** Dag na de laatste dag (exclusief). */
  tot: string
  dagen: number
}

export const AVOND_VANAF = 18 * 60

function dagenTussen(van: string, tot: string): number {
  return Math.round((Date.parse(`${tot}T12:00:00Z`) - Date.parse(`${van}T12:00:00Z`)) / 86_400_000)
}

/** De periode rond een ankerdatum: de week of vier weken vanaf de maandag, of de kalendermaand. */
export function periodeVan(soort: PeriodeSoort, anker: string): Periode {
  if (soort === 'maand') {
    const van = `${anker.slice(0, 7)}-01`
    const [j, m] = van.split('-').map(Number)
    const tot = m === 12 ? `${j + 1}-01-01` : `${j}-${String(m + 1).padStart(2, '0')}-01`
    return { soort, van, tot, dagen: dagenTussen(van, tot) }
  }
  const van = maandagVan(anker)
  const dagen = soort === 'week' ? 7 : 28
  return { soort, van, tot: plusDagen(van, dagen), dagen }
}

/** De periode ervoor of erna (richting -1 of 1). */
export function verschuifPeriode(p: Periode, richting: 1 | -1): Periode {
  if (p.soort === 'maand') return periodeVan('maand', richting === 1 ? p.tot : plusDagen(p.van, -1))
  return periodeVan(p.soort, plusDagen(p.van, richting * p.dagen))
}

export function isGewerktStatus(d: Pick<Dienst, 'uurStatus'>): boolean {
  return d.uurStatus !== 'gepland'
}

/** De werkelijke tijden: aangepast of anders de geplande. */
export function werkelijk(d: Pick<Dienst, 'begin' | 'eind' | 'gewerktBegin' | 'gewerktEind'>): { begin: string; eind: string } {
  return { begin: d.gewerktBegin ?? d.begin, eind: d.gewerktEind ?? d.eind }
}

/** Gewerkte minuten van een dienst (na pauze), of 0 als hij nog niet gewerkt is. */
export function gewerktMin(d: Dienst): number {
  if (d.uursoort !== 'werk' || d.medewerkerId === null || !isGewerktStatus(d)) return 0
  const w = werkelijk(d)
  return Math.max(0, duurMin(w.begin, w.eind) - d.pauzeMin)
}

/** Minuten na 18:00 binnen een tijdvak op een dag. */
export function avondMin(begin: string, eind: string): number {
  return Math.max(0, tijdNaarMinuten(eind) - Math.max(tijdNaarMinuten(begin), AVOND_VANAF))
}

export function isWeekend(datum: string): boolean {
  return isoWeekdag(datum) >= 6
}

export interface UrenRegel {
  medewerkerId: string
  geplandMin: number
  gewerktMin: number
  contractMin: number | null
  /** Gewerkt min contract; null zonder contract. */
  verschilMin: number | null
  ziekMin: number
  verlofMin: number
  avondMin: number
  weekendMin: number
  onbevestigd: number
  diensten: number
}

function legeRegel(lid: PersoneelLid, p: Periode): UrenRegel {
  const contractMin = lid.contracturen === null ? null : Math.round((lid.contracturen * 60 * p.dagen) / 7)
  return { medewerkerId: lid.id, geplandMin: 0, gewerktMin: 0, contractMin, verschilMin: null, ziekMin: 0, verlofMin: 0, avondMin: 0, weekendMin: 0, onbevestigd: 0, diensten: 0 }
}

function telDienst(r: UrenRegel, d: Dienst): UrenRegel {
  const gepland = duurMin(d.begin, d.eind)
  if (d.uursoort === 'ziek') return { ...r, ziekMin: r.ziekMin + gepland }
  if (d.uursoort === 'verlof') return { ...r, verlofMin: r.verlofMin + gepland }
  const gewerkt = gewerktMin(d)
  const w = werkelijk(d)
  const telt = isGewerktStatus(d)
  return {
    ...r,
    diensten: r.diensten + 1,
    geplandMin: r.geplandMin + gepland,
    gewerktMin: r.gewerktMin + gewerkt,
    avondMin: r.avondMin + (telt ? avondMin(w.begin, w.eind) : 0),
    weekendMin: r.weekendMin + (telt && isWeekend(d.datum) ? duurMin(w.begin, w.eind) : 0),
    onbevestigd: r.onbevestigd + (telt ? 0 : 1),
  }
}

/** Het urenoverzicht per medewerker over een periode. */
export function urenOverzicht(leden: readonly PersoneelLid[], diensten: readonly Dienst[], p: Periode): UrenRegel[] {
  return leden.map((lid) => {
    const eigen = diensten.filter((d) => d.medewerkerId === lid.id && d.datum >= p.van && d.datum < p.tot)
    const r = eigen.reduce(telDienst, legeRegel(lid, p))
    return { ...r, verschilMin: r.contractMin === null ? null : r.gewerktMin - r.contractMin }
  })
}

export type AfwijkingSoort = 'afwijkend' | 'onbevestigd' | 'overlap'

export interface Afwijking {
  dienstId: string
  medewerkerId: string
  datum: string
  soort: AfwijkingSoort
  tekst: string
}

/** Is deze dienst voorbij (dus had hij bevestigd moeten zijn)? */
export function isVoorbij(d: Pick<Dienst, 'datum' | 'eind'>, vandaag: string, nuMin: number): boolean {
  return d.datum < vandaag || (d.datum === vandaag && tijdNaarMinuten(d.eind) <= nuMin)
}

/** Afwijkingen in een periode: andere tijden dan gepland, niet bevestigd na afloop, overlap. */
export function afwijkingen(diensten: readonly Dienst[], vandaag: string, nuMin: number, taal: Taal = 'nl'): Afwijking[] {
  const t = PERSONEEL_REGELS[taal]
  const uit: Afwijking[] = []
  for (const d of diensten) {
    if (d.medewerkerId === null || d.uursoort !== 'werk') continue
    const basis = { dienstId: d.id, medewerkerId: d.medewerkerId, datum: d.datum }
    const w = werkelijk(d)
    if (isGewerktStatus(d) && (w.begin !== d.begin || w.eind !== d.eind)) {
      uit.push({ ...basis, soort: 'afwijkend', tekst: t.afwijkend(w.begin, w.eind, d.begin, d.eind) })
    }
    if (!isGewerktStatus(d) && isVoorbij(d, vandaag, nuMin)) {
      uit.push({ ...basis, soort: 'onbevestigd', tekst: t.onbevestigd(d.begin, d.eind) })
    }
  }
  const byId = new Map(diensten.map((d) => [d.id, d]))
  for (const o of vindOverlap(diensten)) {
    const d = byId.get(o.a)
    if (d) uit.push({ dienstId: d.id, medewerkerId: o.medewerkerId, datum: d.datum, soort: 'overlap', tekst: t.tegelijk })
  }
  return uit.sort((a, b) => a.datum.localeCompare(b.datum))
}

/** Welke diensten mogen in een keer goedgekeurd worden: gewerkt en zonder afwijking. */
export function goedTeKeuren(diensten: readonly Dienst[], afw: readonly Afwijking[]): string[] {
  const fout = new Set(afw.map((a) => a.dienstId))
  return diensten.filter((d) => d.uurStatus === 'gewerkt' && !fout.has(d.id)).map((d) => d.id)
}

/** Minuten als uren met een komma: 450 wordt "7,50". */
export function urenDecimaal(min: number): string {
  return (min / 60).toFixed(2).replace('.', ',')
}

/** Minuten als klokduur: 450 wordt "7:30", -90 wordt "-1:30". */
export function urenKlok(min: number): string {
  const teken = min < 0 ? '-' : ''
  const a = Math.abs(Math.round(min))
  return `${teken}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`
}

/** Een CSV-veld veilig maken (puntkomma, aanhalingstekens, formule-injectie). */
export function csvVeld(v: string): string {
  const veilig = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
  return /[;"\n\r]/.test(veilig) ? `"${veilig.replace(/"/g, '""')}"` : veilig
}

/** CSV voor de salarisadministratie (puntkomma en decimale komma, voor Excel in het Nederlands). */
export function urenCsv(regels: readonly UrenRegel[], leden: readonly PersoneelLid[], p: Periode): string {
  const kop = ['Medewerker', 'Van', 'Tot en met', 'Gepland', 'Gewerkt', 'Contract', 'Verschil', 'Ziek', 'Verlof', 'Avond (na 18:00)', 'Weekend', 'Niet bevestigd']
  const laatste = plusDagen(p.tot, -1)
  const rijen = regels.map((r) => [
    csvVeld(leden.find((l) => l.id === r.medewerkerId)?.naam ?? 'Onbekend'),
    p.van,
    laatste,
    urenDecimaal(r.geplandMin),
    urenDecimaal(r.gewerktMin),
    r.contractMin === null ? '' : urenDecimaal(r.contractMin),
    r.verschilMin === null ? '' : urenDecimaal(r.verschilMin),
    urenDecimaal(r.ziekMin),
    urenDecimaal(r.verlofMin),
    urenDecimaal(r.avondMin),
    urenDecimaal(r.weekendMin),
    String(r.onbevestigd),
  ])
  return [kop, ...rijen].map((r) => r.join(';')).join('\r\n') + '\r\n'
}
