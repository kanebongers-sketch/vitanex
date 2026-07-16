// ─── LifeOS — een intentie uitvoeren ────────────────────────────────────────
// Gegeven een `Intentie` (uit het brein) en de gekozen `TelegramActie`: maak het
// echt. Een taak, een notitie (brain dump) of een agenda-afspraak — op de vaste
// LifeOS-gebruiker.
//
// PUUR + INJECTEERBAAR, exact zoals `intentie.ts` de modelaanroep injecteert. De
// databaseschrijf-operaties komen als `UitvoerDeps` binnen, zodat dit bestand
// zonder echte database (nep-admin/nep-opslag) te testen is. De webhook-route is
// de compositie-plek die de échte operaties bedraadt — inclusief `maakAgendaEvent`
// uit `@/lib/lifeos/agenda/schrijven`.
//
// ─── FOUT ≠ STIL ────────────────────────────────────────────────────────────
// Een mislukte insert geeft `gelukt: false`. De bot bevestigt dan niets — hij
// zegt eerlijk dat het opslaan niet lukte (zie `antwoordTekst`).
//
// ─── GEEN DATUM → GEEN AFSPRAAK ─────────────────────────────────────────────
// `maak_agenda` zonder een geldige tijd maakt niets aan (`gelukt: false`). Het
// brein verzint nooit een datum; deze laag zet er ook nooit een.

import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { MAX_TITEL_LENGTE, type NieuweTaak } from '@/lib/lifeos/taken/taken'
import { MAX_TEKST_LENGTE, type NieuweNotitie } from '@/lib/lifeos/notities/notities'
import type { Intentie } from '@/lib/lifeos/intentie/intentie'
import type { TelegramActie } from './antwoord'

/**
 * De invoer voor een agenda-afspraak. Structureel gelijk aan `NieuwAgendaEvent`
 * uit `@/lib/lifeos/agenda/schrijven`, maar hier lokaal gedefinieerd zodat dit
 * bestand puur en zonder die (parallel gebouwde) module te testen blijft.
 * `startOp`/`eindOp` zijn ISO-strings — precies wat de agenda-schrijflaag verwacht.
 */
export interface AgendaInvoer {
  titel: string
  startOp: string
  eindOp: string
  locatie?: string
  beschrijving?: string
}

/** Elke schrijfoperatie zegt alleen óf het lukte — meer heeft de uitvoerder niet nodig. */
export type Schrijfuitkomst = Promise<{ ok: boolean }>

/**
 * De databaseschrijf-operaties, injecteerbaar. De standaard (in de webhook-route)
 * bedraadt `maakTaak`, `maakNotitie` en `maakAgendaEvent`; een test schuift er
 * nep-implementaties in en raakt zo nooit een echte database.
 */
export interface UitvoerDeps {
  maakTaak(userId: string, nieuw: NieuweTaak): Schrijfuitkomst
  maakNotitie(userId: string, nieuw: NieuweNotitie): Schrijfuitkomst
  maakAgenda(userId: string, invoer: AgendaInvoer): Schrijfuitkomst
}

export interface VoerUitResultaat {
  gelukt: boolean
}

/** Wanneer een afspraak geen duur meekreeg: één uur is een redelijke standaard. */
const STANDAARD_DUUR_MINUTEN = 60

/** Kapt tekst op de databasegrens af, zodat een lange memo wél opslaat i.p.v. te falen. */
function kap(tekst: string, max: number): string {
  const schoon = tekst.trim()
  return schoon.length > max ? schoon.slice(0, max) : schoon
}

/** De dagsleutel uit een ISO-tijd, of null als er geen (geldige) tijd is. */
function dagUit(wanneer: string | null): string | null {
  if (!wanneer) return null
  const d = new Date(wanneer)
  return Number.isNaN(d.getTime()) ? null : datumSleutel(d)
}

/** De tekst van een brain dump: de volledige gedachte, niet alleen de korte titel. */
function notitieTekst(intentie: Intentie): string {
  const rauw = intentie.rauweTekst.trim()
  return rauw.length > 0 ? rauw : intentie.titel
}

/**
 * Voert de gekozen actie uit op `userId`.
 *
 * `deps` is verplicht (geen stille standaard): de aanroeper — de route in productie,
 * de test met nep-opslag — bepaalt waar de schrijf naartoe gaat. Dit is hetzelfde
 * patroon als `bepaalIntentie`, dat zijn model óók verplicht meekrijgt.
 */
export async function voerUit(
  userId: string,
  intentie: Intentie,
  actie: TelegramActie,
  deps: UitvoerDeps,
  nu: Date = new Date(),
): Promise<VoerUitResultaat> {
  switch (actie) {
    // Niets aanmaken — de bot vraagt terug. Geen actie is hier een succes, geen fout.
    case 'vraag_bevestiging':
      return { gelukt: true }

    case 'maak_taak': {
      const nieuw: NieuweTaak = {
        titel: kap(intentie.titel, MAX_TITEL_LENGTE),
        notitie: null,
        // Noemde het brein een dag, dan hoort de taak op die dag; anders 'ooit'.
        datum: dagUit(intentie.wanneer),
        // Vanuit Telegram nooit automatisch een top-3-plek claimen.
        top3Positie: null,
      }
      const { ok } = await deps.maakTaak(userId, nieuw)
      return { gelukt: ok }
    }

    case 'maak_notitie': {
      const nieuw: NieuweNotitie = {
        tekst: kap(notitieTekst(intentie), MAX_TEKST_LENGTE),
        soort: 'brain_dump',
        // Een notitie hoort altijd bij een dag; zonder genoemde dag: vandaag.
        datum: dagUit(intentie.wanneer) ?? datumSleutel(nu),
      }
      const { ok } = await deps.maakNotitie(userId, nieuw)
      return { gelukt: ok }
    }

    case 'maak_agenda': {
      const start = intentie.wanneer ? new Date(intentie.wanneer) : null
      // Geen geldige tijd → geen afspraak. Dit hoort niet te gebeuren (bepaalActie
      // filtert het al weg), maar deze laag verzint zelf nooit een moment.
      if (!start || Number.isNaN(start.getTime())) return { gelukt: false }

      const duur =
        intentie.duurMinuten && intentie.duurMinuten > 0 ? intentie.duurMinuten : STANDAARD_DUUR_MINUTEN
      const eind = new Date(start.getTime() + duur * 60_000)

      const invoer: AgendaInvoer = {
        titel: kap(intentie.titel, MAX_TITEL_LENGTE),
        startOp: start.toISOString(),
        eindOp: eind.toISOString(),
      }
      // Alleen meegeven wat het brein écht noemde — niets verzinnen.
      if (intentie.persoon) invoer.beschrijving = `Met ${intentie.persoon}.`

      const { ok } = await deps.maakAgenda(userId, invoer)
      return { gelukt: ok }
    }
  }
}
