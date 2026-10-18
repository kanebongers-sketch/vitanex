// ─── Club, meldingen: welke melding wanneer (PUUR) ──────────────────────────
// Uit een gebeurtenis (les geboekt, afspraak verplaatst, ...) de rijen voor de
// wachtrij: per melding een rij voor de app en een voor de mail, plus een
// herinnering als die aan staat en nog in de toekomst valt. De sleutel is
// uniek per gebeurtenis, zodat dezelfde gebeurtenis nooit twee keer telt.

import { tekstVoor, type AfspraakGegevens, type LesGegevens, type Ontvanger } from './sjablonen'
import { soortAan, type AfspraakSoort, type Kanaal, type LesSoort, type MeldingInstellingen, type MeldingStatus, type Soort } from './soorten'

/** Een les-gebeurtenis voor een reservering. `geboektOp` maakt een nieuwe boeking na annuleren uniek. */
export interface LesGebeurtenis {
  soort: Exclude<LesSoort, 'les_herinnering'>
  reserveringId: string
  geboektOp: string
  les: LesGegevens
}

export interface AfspraakGebeurtenis {
  soort: Exclude<AfspraakSoort, 'afspraak_herinnering'>
  afspraakId: string
  afspraak: AfspraakGegevens
}

export type Gebeurtenis = LesGebeurtenis | AfspraakGebeurtenis

export interface NieuweMelding {
  soort: Soort
  kanaal: Kanaal
  sleutel: string
  onderwerp: string
  inhoud: string
  status: MeldingStatus
  bron_soort: 'reservering' | 'afspraak'
  bron_id: string
  bron_start: string
  gepland_op: string
  verstuurd_op: string | null
}

const MIN_MS = 60_000

function ms(iso: string): number {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

function isLes(g: Gebeurtenis): g is LesGebeurtenis {
  return 'les' in g
}

/** De sleutel van een melding: soort, bron en wat de gebeurtenis uniek maakt. */
export function sleutelVan(soort: Soort, g: Gebeurtenis): string {
  if (isLes(g)) {
    const boeking = `${g.reserveringId}:${ms(g.geboektOp)}`
    return soort === 'les_geannuleerd' ? `${soort}:${g.reserveringId}` : `${soort}:${boeking}`
  }
  const start = ms(g.afspraak.start)
  if (soort === 'afspraak_herinnering' || soort === 'afspraak_verplaatst') return `${soort}:${g.afspraakId}:${start}`
  return `${soort}:${g.afspraakId}`
}

/** Welke herinnering hoort bij deze gebeurtenis, of null. */
export function herinneringVoor(g: Gebeurtenis): Soort | null {
  if (g.soort === 'les_geboekt' || g.soort === 'les_doorgeschoven') return 'les_herinnering'
  if (g.soort === 'afspraak_geboekt' || g.soort === 'afspraak_verplaatst') return 'afspraak_herinnering'
  return null
}

/** Wanneer de herinnering gaat, of null als dat moment al voorbij is (de bevestiging is dan genoeg). */
export function herinnerMoment(start: string, minutenVooraf: number, nu: Date): Date | null {
  const op = ms(start) - minutenVooraf * MIN_MS
  return op > nu.getTime() ? new Date(op) : null
}

function rijen(soort: Soort, g: Gebeurtenis, ontvanger: Ontvanger, op: Date, direct: boolean): NieuweMelding[] {
  const onderwerp = isLes(g) ? { soort: soort as LesSoort, les: g.les } : { soort: soort as AfspraakSoort, afspraak: g.afspraak }
  const tekst = tekstVoor(onderwerp, ontvanger, op)
  const basis = {
    soort,
    sleutel: sleutelVan(soort, g),
    onderwerp: tekst.onderwerp,
    bron_soort: isLes(g) ? ('reservering' as const) : ('afspraak' as const),
    bron_id: isLes(g) ? g.reserveringId : g.afspraakId,
    bron_start: isLes(g) ? g.les.start : g.afspraak.start,
    gepland_op: op.toISOString(),
  }
  // In de app staat een directe melding meteen in de lijst; de mail gaat via de wachtrij.
  return [
    { ...basis, kanaal: 'app', inhoud: tekst.kort, status: direct ? 'verstuurd' : 'gepland', verstuurd_op: direct ? op.toISOString() : null },
    { ...basis, kanaal: 'email', inhoud: tekst.mail, status: 'gepland', verstuurd_op: null },
  ]
}

/**
 * Alle rijen voor de wachtrij bij deze gebeurtenis. Niets als de les of
 * afspraak al begonnen is, of als de sportschool de soort uit heeft gezet.
 */
export function bouwMeldingen(g: Gebeurtenis, ontvanger: Ontvanger, inst: MeldingInstellingen, nu: Date): NieuweMelding[] {
  const start = isLes(g) ? g.les.start : g.afspraak.start
  if (ms(start) <= nu.getTime()) return []
  const uit: NieuweMelding[] = soortAan(inst, g.soort) ? rijen(g.soort, g, ontvanger, nu, true) : []
  const herinnering = herinneringVoor(g)
  if (!herinnering || !soortAan(inst, herinnering)) return uit
  const minuten = isLes(g) ? inst.lesHerinneringMin : inst.afspraakHerinneringMin
  const op = herinnerMoment(start, minuten, nu)
  return op ? [...uit, ...rijen(herinnering, g, ontvanger, op, false)] : uit
}

/**
 * Bij elke melding voor de app ook een push (migratie 438): zelfde soort,
 * sleutel en korte tekst, altijd via de wachtrij. De cron beslist of hij echt
 * gaat (schakelaar, abonnement, voorkeur van het lid, nooit demo).
 */
export function metPush(meldingen: readonly NieuweMelding[]): NieuweMelding[] {
  const push = meldingen.filter((m) => m.kanaal === 'app').map((m): NieuweMelding => ({ ...m, kanaal: 'push', status: 'gepland', verstuurd_op: null }))
  return [...meldingen, ...push]
}
