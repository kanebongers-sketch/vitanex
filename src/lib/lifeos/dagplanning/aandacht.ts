// ─── LifeOS — dagplanning: "Vraagt je aandacht" (puur) ──────────────────────
// De ochtendmail toonde je dag (agenda + taken) en Vita's observaties. Maar een
// stafchef ziet méér dan je agenda: wie je vandaag zou opvolgen (CRM) en welke
// facturen open of te laat staan (finance). Dit bestand leidt die aandachtspunten
// puur af — data in → regels uit, geen fetch, geen DB — zodat de route ze
// best-effort ophaalt en de mail ze rendert.
//
// EERLIJK: elk punt steunt op een écht feit uit je eigen data (een follow-up-datum
// die jij zette, een factuurstatus). We verzinnen hier niets bij; een lege bron
// levert gewoon geen regel op.

import type { Persoon } from '@/lib/lifeos/crm/crm'
import type { Factuur } from '@/lib/lifeos/finance/finance'
import type { Afhaak } from '@/lib/lifeos/pt-klant/afhaak'
import type { OnbekendePtSessie, PtStatusHint } from '@/lib/lifeos/pt-klant/klantstatus'
import { naarCenten, naarEuro } from '@/lib/lifeos/finance/finance'
import { groepKort } from '@/lib/lifeos/crm/agenda-match'

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

const EURO_FMT = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

const DAG_KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })

/** Een dagsleutel (YYYY-MM-DD) als moment midden op die dag: tijdzone-veilig voor de weergave. */
function dagAlsMoment(dagKey: string): Date {
  return new Date(`${dagKey}T12:00:00Z`)
}

/** Centen → '€ 1.234,56'. Sommeren gebeurt in centen om float-drift te vermijden. */
function euroTekst(centen: number): string {
  return EURO_FMT.format(naarEuro(centen))
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

/** De PT-signalen voor de mail, allemaal optioneel (niet nagegaan = leeg). */
export interface PtAandacht {
  afhaak?: readonly Afhaak[]
  statusHints?: readonly PtStatusHint[]
  onbekend?: readonly OnbekendePtSessie[]
}

/**
 * Eén samenvattende factuurregel, of `null` als er niets openstaat.
 *
 * "Te laat" is hier bewust breder dan finance's interne `isVerlopen` (die telt
 * alleen status 'open' over de vervaldatum): voor een ochtend-nudge is óók een
 * factuur die jij handmatig op 'verlopen' zette te laat. Openstaand = niet 'betaald',
 * gelijk aan finance's eigen definitie. Te laat wint van gewoon-open: dat is de regel
 * die actie vraagt.
 */
export function factuurAandacht(facturen: readonly Factuur[], vandaagKey: string): Aandachtspunt | null {
  const openstaand = facturen.filter((f) => f.status !== 'betaald')
  if (openstaand.length === 0) return null

  const somCenten = (lijst: readonly Factuur[]): number =>
    lijst.reduce((som, f) => som + naarCenten(f.bedrag), 0)

  const teLaat = openstaand.filter(
    (f) => f.status === 'verlopen' || (f.vervaldatum !== null && f.vervaldatum < vandaagKey),
  )

  if (teLaat.length > 0) {
    const n = teLaat.length
    return {
      tekst: `${n} ${n === 1 ? 'factuur' : 'facturen'} over de vervaldatum — ${euroTekst(somCenten(teLaat))}`,
      dringend: true,
    }
  }

  const n = openstaand.length
  return {
    tekst: `${n} openstaande ${n === 1 ? 'factuur' : 'facturen'} — ${euroTekst(somCenten(openstaand))}`,
    dringend: false,
  }
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
 * antwoord": CRM-opvolging (mensen boven cijfers), dan afgehaakte klanten, dan de
 * inbox, dan de facturen. Leeg = de mail laat de hele sectie weg.
 */
export function bouwAandacht(
  personen: readonly Persoon[],
  facturen: readonly Factuur[],
  vandaagKey: string,
  inboxActie: number | null = null,
  pt: PtAandacht = {},
): Aandachtspunt[] {
  const inbox = inboxAandacht(inboxActie)
  const factuur = factuurAandacht(facturen, vandaagKey)
  return [
    ...crmOpvolging(personen, vandaagKey),
    ...afhaakAandacht(pt.afhaak ?? []),
    ...(inbox ? [inbox] : []),
    ...(factuur ? [factuur] : []),
    // Administratie achteraan: eerst mensen en geld, dan "je CRM loopt achter".
    ...statusHintAandacht(pt.statusHints ?? []),
    ...onbekendAandacht(pt.onbekend ?? []),
  ]
}
