// ─── LifeOS — inbox: van suggestie naar een aanmaak-verzoek ──────────────────
// FUNCTIE 2, de UI-kant. `analyse.ts` (server) leidt uit afzender+onderwerp een
// `Suggestie` af; dit bestand vertaalt zo'n suggestie naar de knop die Kane ziet
// en naar het verzoek dat de klik verstuurt. Puur en React-vrij, zodat het
// zonder netwerk of DOM te testen is (net als `analyse.ts` zelf).
//
// ─── DE INBOX-GRENZEN LOPEN HIER DOOR ───────────────────────────────────────
// We raken Gmail niet aan en slaan niets op. `berichtenVoorAnalyse` bouwt het
// analyse-verzoek uit precies de metadata die de triage AL toonde — afzender en
// onderwerp, nooit een body, nooit de ontvangers. Geen nieuwe Gmail-call, geen
// veld dat de client niet allang in handen had.
//
// ─── NIETS AUTOMATISCH ──────────────────────────────────────────────────────
// Een suggestie wordt pas een taak of afspraak als Kane erop klikt. `actieVan`
// bepaalt óf er een knop verschijnt; alleen een 'taak' of 'agenda' met genoeg
// gegevens komt erdoor. Twijfel ('geen', of een agenda zonder tijd, of een actie
// zonder titel) → geen knop. Liever een gemiste knop dan een verkeerde afspraak.

import type { Suggestie } from '@/lib/lifeos/inbox/analyse'
import type { TriageMailJson } from '@/lib/lifeos/inbox/inbox'

/**
 * Een suggestie die écht aan te maken is. Een discriminated union, geen losse
 * velden: bij 'agenda' is `wanneer` gegarandeerd aanwezig, zodat de agenda-call
 * nooit een startmoment mist. Dat is precies de fout die `actieVan` afvangt.
 */
export type ActieSuggestie =
  | { externId: string; soort: 'taak'; titel: string }
  | { externId: string; soort: 'agenda'; titel: string; wanneer: string }

/**
 * Filtert een suggestie tot een aanmaakbare actie, of `null` als er geen knop
 * hoort te verschijnen.
 *
 * De server dedupliceert al veel ('geen' bij twijfel, geen titel = geen actie),
 * maar dit is een systeemgrens: we vertrouwen de vorm niet blind. Een 'agenda'
 * zonder tijd kan niet in de kalender en valt hier weg — anders zou de knop een
 * verzoek sturen dat de agenda-route gegarandeerd weigert.
 */
export function actieVan(suggestie: Suggestie | null): ActieSuggestie | null {
  if (suggestie === null) return null

  const { externId, soort, titel, wanneer } = suggestie
  if (titel === null) return null // een actie zonder titel kan de UI niet aanmaken

  if (soort === 'taak') {
    return { externId, soort: 'taak', titel }
  }
  if (soort === 'agenda') {
    if (wanneer === null) return null // geen tijd → geen agenda-afspraak
    return { externId, soort: 'agenda', titel, wanneer }
  }

  return null // 'geen', of een onbekende soort
}

// ─── Het analyse-verzoek ────────────────────────────────────────────────────

/** De vorm die `POST /api/lifeos/inbox/analyseer` per mail verwacht: snake_case naar buiten. */
export interface AnalyseBericht {
  extern_id: string
  afzender: string | null
  onderwerp: string | null
}

/**
 * Bouwt het analyse-verzoek uit de al-opgehaalde triage-mails. Neemt bewust
 * alléén id, afzender en onderwerp mee — de enige velden die de triage toont en
 * die het intentiebrein nodig heeft. Geen `reden`, geen `ontvangenOp`: die zijn
 * voor de classificatie irrelevant en horen niet onnodig de draad over.
 */
export function berichtenVoorAnalyse(mails: readonly TriageMailJson[]): AnalyseBericht[] {
  return mails.map((mail) => ({
    extern_id: mail.id,
    afzender: mail.afzender,
    onderwerp: mail.onderwerp,
  }))
}

// ─── Het aanmaak-verzoek ────────────────────────────────────────────────────

/** Waarheen de klik POST't, en met welke body. Puur, zodat de mapping te testen is. */
export interface ActieVerzoek {
  pad: string
  body: Record<string, unknown>
}

/**
 * Standaardduur van een afspraak uit een mail, in minuten.
 *
 * Een onderwerpregel noemt zelden een eindtijd, en `/api/lifeos/agenda/events`
 * verlangt er wél een (een afspraak zonder eind is een gok). Dus kiezen we een
 * bescheiden blok van een half uur; Kane past het in zijn agenda aan als het
 * langer moet. Dat is een zichtbare, bij te stellen aanname — geen verzonnen
 * precisie.
 */
export const STANDAARD_AFSPRAAK_MINUTEN = 30

/** Startmoment + minuten → ISO-eindmoment, of null als de start geen geldige tijd is. */
function eindNa(startIso: string, minuten: number): string | null {
  const start = new Date(startIso).getTime()
  if (Number.isNaN(start)) return null
  return new Date(start + minuten * 60_000).toISOString()
}

/**
 * Vertaalt een actie naar het juiste endpoint. Een taak gaat naar
 * `/api/lifeos/taken` (zonder datum: een mail-taak is geen top-3-belofte voor
 * vandaag, dus hij landt eerlijk op "ooit"). Een afspraak gaat naar
 * `/api/lifeos/agenda/events` met het startmoment uit de suggestie plus een
 * standaard eindtijd.
 *
 * Kan de start niet als datum gelezen worden, dan laten we `eindOp` weg: de route
 * weigert die start dan sowieso met een nette melding, en dat is het eerlijke
 * antwoord — beter dan er een tweede kapotte tijd bovenop te verzinnen.
 */
export function verzoekVoorActie(actie: ActieSuggestie): ActieVerzoek {
  if (actie.soort === 'taak') {
    return { pad: '/api/lifeos/taken', body: { titel: actie.titel } }
  }

  const body: Record<string, unknown> = { titel: actie.titel, startOp: actie.wanneer }
  const eindOp = eindNa(actie.wanneer, STANDAARD_AFSPRAAK_MINUTEN)
  if (eindOp !== null) body.eindOp = eindOp

  return { pad: '/api/lifeos/agenda/events', body }
}
