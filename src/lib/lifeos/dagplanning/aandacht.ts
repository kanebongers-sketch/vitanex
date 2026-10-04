// ─── LifeOS — dagplanning: "Vraagt je aandacht" (puur) ──────────────────────
// De ochtendmail toonde je dag (agenda + taken) en Vita's observaties. Maar een
// stafchef ziet méér dan je agenda: wie je vandaag zou opvolgen (CRM), welke
// PT-klanten aandacht vragen en wat er in je inbox wacht. Dit bestand leidt die aandachtspunten
// puur af — data in → regels uit, geen fetch, geen DB — zodat de route ze
// best-effort ophaalt en de mail ze rendert.
//
// EERLIJK: elk punt steunt op een écht feit uit je eigen data (een follow-up-datum
// die jij zette, een PT-sessie in je agenda). We verzinnen hier niets bij; een lege bron
// levert gewoon geen regel op.

import type { Persoon } from '@/lib/lifeos/crm/crm'
import type { Afhaak } from '@/lib/lifeos/pt-klant/afhaak'
import type { PtWeekStatus } from '@/lib/lifeos/pt-klant/pt-klant'
import type { CoachAchterstand } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import type { VorigeEvaluatie } from '@/lib/lifeos/pt-gesprek/team'
import type { Melding } from '@/lib/lifeos/agenda/bewaker'
import type { CoachSignaal } from '@/lib/lifeos/pt-coaching/signaal'
import type { MogelijkeTypfout, OnbekendePtSessie, PtStatusHint } from '@/lib/lifeos/pt-klant/klantstatus'
import { groepKort, opsomming } from '@/lib/lifeos/crm/agenda-match'

/** Eén regel voor de "Vraagt je aandacht"-sectie. */
export interface Aandachtspunt {
  tekst: string
  /** Vraagt nú iets van je (vandaag of te laat) → cyaan accent in de mail. */
  dringend: boolean
}

/**
 * Zoveel op te volgen mensen tonen we bij naam. Daarboven één samenvattende regel:
 * een ochtendmail met veertig namen is geen overzicht meer maar een tweede takenlijst.
 */
const CRM_LIMIET = 8


const DAG_KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })

/** Een dagsleutel (YYYY-MM-DD) als moment midden op die dag: tijdzone-veilig voor de weergave. */
function dagAlsMoment(dagKey: string): Date {
  return new Date(`${dagKey}T12:00:00Z`)
}

/**
 * Wie moet je vandaag (of eerder) opvolgen? Puur op de follow-up-datum die jij zelf
 * zette — een expliciete afspraak met jezelf, niet een afgeleide gok. Dagsleutels
 * (YYYY-MM-DD) vergelijken lexicografisch gelijk aan chronologisch, dus `<`/`<=` zijn
 * hier echte datumtests.
 *
 * Te laat eerst (oudste follow-up bovenaan), daarna op naam. Alles hier is `dringend`:
 * de datum is vandaag of al verstreken.
 */
export function crmOpvolging(personen: readonly Persoon[], vandaagKey: string): Aandachtspunt[] {
  const teDoen = personen
    .filter((p) => p.followUpDatum !== null && p.followUpDatum <= vandaagKey)
    .sort((a, b) => {
      const da = a.followUpDatum as string
      const db = b.followUpDatum as string
      if (da !== db) return da < db ? -1 : 1
      return a.naam.localeCompare(b.naam, 'nl')
    })

  // Heet iemand hetzelfde als een ander in je CRM (twee Niecks)? Dan de groep
  // erbij — anders weet je niet wíe je moet opvolgen.
  const naamTelling = new Map<string, number>()
  for (const p of personen) {
    const sleutel = p.naam.trim().toLowerCase()
    naamTelling.set(sleutel, (naamTelling.get(sleutel) ?? 0) + 1)
  }
  const wie = (p: Persoon): string =>
    (naamTelling.get(p.naam.trim().toLowerCase()) ?? 0) > 1 ? `${p.naam} (${groepKort(p.groep)})` : p.naam

  const punten: Aandachtspunt[] = teDoen.slice(0, CRM_LIMIET).map((p) => {
    const datum = p.followUpDatum as string
    // "Te laat" zonder sinds-wanneer zegt niet of het gisteren was of drie weken.
    const wanneer = datum < vandaagKey ? `te laat, sinds ${DAG_KORT.format(dagAlsMoment(datum))}` : 'vandaag'
    return { tekst: `${wie(p)} opvolgen (${wanneer})`, dringend: true }
  })

  const rest = teDoen.length - CRM_LIMIET
  if (rest > 0) {
    punten.push({ tekst: `en nog ${rest} ${rest === 1 ? 'contact' : 'contacten'} om op te volgen`, dringend: false })
  }
  return punten
}

/** Zoveel afgehaakte klanten tonen we bij naam; daarboven één samenvattende regel. */
const AFHAAK_LIMIET = 5

/**
 * Wie haakt af: PT-klanten die je een tijd niet meer op PT zag (zie
 * `pt-klant/afhaak`). Niet `dringend` — het is geen "vandaag", maar een retentie-
 * seintje dat je niet wilt missen. Leeg → geen regels.
 */
export function afhaakAandacht(afhaak: readonly Afhaak[]): Aandachtspunt[] {
  const punten: Aandachtspunt[] = afhaak.slice(0, AFHAAK_LIMIET).map((a) => ({
    tekst: `${a.naam} was ${a.wekenGeleden} ${a.wekenGeleden === 1 ? 'week' : 'weken'} niet op PT — even contact?`,
    dringend: false,
  }))

  const rest = afhaak.length - AFHAAK_LIMIET
  if (rest > 0) {
    punten.push({ tekst: `en nog ${rest} ${rest === 1 ? 'klant' : 'klanten'} die je een tijd niet zag`, dringend: false })
  }
  return punten
}

/** Zoveel status-voorstellen bij naam; daarboven één samenvattende regel. */
const HINT_LIMIET = 3

/**
 * Je CRM loopt achter: iemand traint al (zie `pt-klant/klantstatus`), maar staat
 * nog op een prospect-status. Een voorstel, geen actie — LifeOS verandert je CRM
 * niet zelf. Niet `dringend`: het is administratie, geen mens die wacht.
 */
export function statusHintAandacht(hints: readonly PtStatusHint[]): Aandachtspunt[] {
  const punten: Aandachtspunt[] = hints.slice(0, HINT_LIMIET).map((h) => ({
    tekst: `${h.naam} traint al (${h.sessies}× in 8 weken) maar staat op "${h.statusLabel}" — zet op Actieve klant?`,
    dringend: false,
  }))
  const rest = hints.length - HINT_LIMIET
  if (rest > 0) {
    punten.push({ tekst: `en nog ${rest} ${rest === 1 ? 'klant' : 'klanten'} met een verouderde status`, dringend: false })
  }
  return punten
}


/**
 * PT-sessies met iemand die niet in je CRM staat (zie `pt-klant/klantstatus`):
 * die klant is onzichtbaar voor je planning en signalen tot je 'm toevoegt.
 */
export function onbekendAandacht(onbekend: readonly OnbekendePtSessie[]): Aandachtspunt[] {
  const punten: Aandachtspunt[] = onbekend.slice(0, HINT_LIMIET).map((o) => ({
    tekst: `"${o.titel}" (${o.aantal === 1 ? '' : `${o.aantal}×, `}laatst ${DAG_KORT.format(new Date(o.laatsteOp))}) — staat nog niet in je CRM`,
    dringend: false,
  }))
  const rest = onbekend.length - HINT_LIMIET
  if (rest > 0) {
    punten.push({ tekst: `en nog ${rest} PT-${rest === 1 ? 'sessie' : 'sessies'} met iemand buiten je CRM`, dringend: false })
  }
  return punten
}

/**
 * Wie mist er nog een PT-sessie (de weekstatus van de PT-kaart)? Eén regel met de
 * namen, zodat je 's ochtends meteen ziet wie je moet appen. Niet `dringend`: het
 * is inplan-werk, geen brand. "nog 1 van 2" = er mist er één van de twee deze week.
 */
export function inplanAandacht(inplannen: readonly PtWeekStatus[]): Aandachtspunt[] {
  if (inplannen.length === 0) return []
  const namen = inplannen.map((k) => {
    if (k.weken === 2) return `${k.naam} (per 2 weken)`
    return k.nodig > 1 ? `${k.naam} (nog ${k.tekort} van ${k.nodig})` : k.naam
  })
  return [{ tekst: `PT nog in te plannen: ${opsomming(namen)}`, dringend: false }]
}

/**
 * Mogelijke typfout in een klantnaam ("Kevnin" → Kevin?): die sessie telt niet mee,
 * dus staat Kevin misschien onterecht bij "nog in te plannen". Een vraag, geen actie.
 */
export function typfoutAandacht(typfouten: readonly MogelijkeTypfout[]): Aandachtspunt[] {
  return typfouten.slice(0, HINT_LIMIET).map((t) => ({
    tekst: `"${t.titel}" (${DAG_KORT.format(new Date(t.op))}) in je agenda — bedoel je ${t.bedoeld}? Die sessie telt nu niet mee.`,
    dringend: false,
  }))
}

/**
 * PT-teamleden die hun 2-wekelijkse coachgesprek missen (zie `pt-gesprek`). Eén
 * regel, met wanneer het laatste was, zodat je ziet wie het langst wacht.
 */
export function coachAandacht(achterstand: readonly CoachAchterstand[]): Aandachtspunt[] {
  if (achterstand.length === 0) return []
  const namen = achterstand.map((a) =>
    a.laatsteOp === null ? `${a.naam} (nog geen)` : `${a.naam} (laatst ${DAG_KORT.format(new Date(a.laatsteOp))})`,
  )
  return [{ tekst: `Coachgesprek inplannen: ${opsomming(namen)}`, dringend: false }]
}

/** Een coachgesprek van vandaag, met wat er vorige keer besproken is. */
export interface CoachVandaag {
  naam: string
  startOp: Date
  vorige: VorigeEvaluatie | null
}

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

/**
 * Voorbereiding: staat er vandaag een coachgesprek, dan zie je 's ochtends al wat
 * jullie vorige keer bespraken — het aandachtspunt eerst, anders de notitie.
 */
export function coachVoorbereiding(gesprekken: readonly CoachVandaag[]): Aandachtspunt[] {
  return gesprekken.map((g) => {
    const kop = `Vandaag ${TIJD.format(g.startOp)} coachgesprek met ${g.naam}`
    if (!g.vorige) return { tekst: `${kop} — nog geen eerder verslag.`, dringend: false }
    const wanneer = DAG_KORT.format(new Date(g.vorige.op))
    const inhoud = g.vorige.aandachtspunt
      ? `aandachtspunt: ${g.vorige.aandachtspunt}`
      : g.vorige.notitie
        ? g.vorige.notitie
        : `scores ${g.vorige.scores.algemeen}/${g.vorige.scores.energie}/${g.vorige.scores.voortgang}`
    return { tekst: `${kop} — vorige keer (${wanneer}) ${inhoud}`, dringend: false }
  })
}

/** De PT-signalen voor de mail, allemaal optioneel (niet nagegaan = leeg). */
export interface PtAandacht {
  afhaak?: readonly Afhaak[]
  statusHints?: readonly PtStatusHint[]
  onbekend?: readonly OnbekendePtSessie[]
  inplannen?: readonly PtWeekStatus[]
  typfouten?: readonly MogelijkeTypfout[]
  coachgesprekken?: readonly CoachAchterstand[]
  coachVandaag?: readonly CoachVandaag[]
  /** Agenda-bewaker: botsingen, reistijd, rust (zie agenda/bewaker). */
  bewaker?: readonly Melding[]
  /** Twee coachgesprekken op rij laag op hetzelfde vlak. */
  coachSignalen?: readonly CoachSignaal[]
}

/**
 * De inbox-regel: hoeveel ongelezen mails vragen een reactie. `null` = niet
 * nagegaan (Gmail niet gekoppeld of even onbereikbaar) → geen regel, geen valse
 * "0 mails" die suggereert dat we keken. 0 echte actie-mails is óók geen regel:
 * een lege to-do hoort niet als aandachtspunt.
 */
export function inboxAandacht(actie: number | null): Aandachtspunt | null {
  if (actie === null || actie <= 0) return null
  return { tekst: `${actie} ${actie === 1 ? 'mail vraagt' : 'mails vragen'} een reactie`, dringend: true }
}

/**
 * Alle aandachtspunten voor vandaag, in volgorde van "vraagt een menselijk
 * antwoord": CRM-opvolging (mensen boven cijfers), dan PT inplannen en afgehaakte klanten, dan de
 * inbox. Leeg = de mail laat de hele sectie weg.
 */
export function bouwAandacht(
  personen: readonly Persoon[],
  vandaagKey: string,
  inboxActie: number | null = null,
  pt: PtAandacht = {},
): Aandachtspunt[] {
  const inbox = inboxAandacht(inboxActie)
  const bewaker = pt.bewaker ?? []
  // Botsingen en reistijd vragen actie vóór die dag: bovenaan en dringend.
  const agendaActie = bewaker.filter((m) => m.soort !== 'rust').map((m) => ({ tekst: m.tekst, dringend: true }))
  const rust = bewaker.filter((m) => m.soort === 'rust').map((m) => ({ tekst: m.tekst, dringend: false }))
  return [
    ...agendaActie,
    // Vandaag een coachgesprek? Dan eerst je voorbereiding.
    ...coachVoorbereiding(pt.coachVandaag ?? []),
    ...(pt.coachSignalen ?? []).map((c) => ({ tekst: c.tekst, dringend: false })),
    ...crmOpvolging(personen, vandaagKey),
    ...inplanAandacht(pt.inplannen ?? []),
    // Direct eronder: een typfout verklaart vaak een naam in de inplan-regel.
    ...typfoutAandacht(pt.typfouten ?? []),
    ...coachAandacht(pt.coachgesprekken ?? []),
    ...afhaakAandacht(pt.afhaak ?? []),
    ...(inbox ? [inbox] : []),
    // Administratie achteraan: eerst mensen, dan "je CRM loopt achter".
    ...statusHintAandacht(pt.statusHints ?? []),
    ...onbekendAandacht(pt.onbekend ?? []),
    // Rust als laatste: een seintje, geen taak.
    ...rust,
  ]
}
