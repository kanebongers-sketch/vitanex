// ─── LifeOS — inbox: vorm over de draad ─────────────────────────────────────
// De vorm die de API teruggeeft en die de UI leest. Eén bestand, zodat server en
// client gegarandeerd hetzelfde bedoelen.
//
// Puur: geen fetch, geen DB, geen secrets. Mag dus in een client-component.
//
// WAT HIER BEWUST NIET IN STAAT:
//   - body, snippet, bijlagen  → dit is geen mailclient. Zie README §10.
//   - het adres van de afzender → de weergavenaam volstaat om 'm te herkennen;
//     het adres van een derde hoeft de browser niet in. Alleen als er géén naam
//     is, valt `afzender` terug op het adres — anders staat er een lege regel en
//     is de kaart onbruikbaar.
//   - de ontvangers → die zijn van andere mensen en spelen buiten de
//     ja/nee-vraag "stond ik in de aan" geen enkele rol.

import type { BeoordeeldeMail, Triage } from './classificeer'

export const GMAIL = 'gmail' as const

/**
 * Het sein dat de inbox-routes teruggeven als de Gmail-koppeling te weinig scope
 * heeft (een koppeling van vóór de schrijf-uitbreiding: alleen leesrechten). De
 * server zet 'm in `fout`, de UI herkent 'm en toont dan een "opnieuw
 * koppelen"-knop i.p.v. een kale foutmelding. Eén bron voor server én client zodat
 * de string niet uit elkaar loopt — spiegelt `OPNIEUW_KOPPELEN` in de agenda.
 */
export const OPNIEUW_KOPPELEN = 'opnieuw_koppelen'

/** Eén regel in de triage. Genoeg om 'm te herkennen en te openen — meer niet. */
export interface TriageMailJson {
  /** Gmail's message-id. Hiermee bouwen we de deeplink. */
  id: string
  /**
   * Gmail's thread-id, zodat een concept-antwoord ónder het gesprek belandt.
   * Leeg (`''`) als de bron 'm niet had — het concept wordt dan gewoon los
   * aangemaakt (zie `concept/route.ts`), nooit een fout.
   */
  threadId: string
  /** Weergavenaam, of het adres als de afzender geen naam meestuurde. */
  afzender: string | null
  onderwerp: string | null
  ontvangenOp: string
  /** Waarom dit als actie geldt. Zie `classificeer.ts` — een oordeel zonder reden is niet te controleren. */
  reden: string
}

/**
 * Het antwoord van `GET /api/inbox/vandaag`.
 *
 * "Niet gekoppeld" is een eigen tak, geen lege lijst — anders zegt de kaart
 * "niets vraagt iets van je" terwijl LifeOS gewoon niet mag kijken. Zelfde
 * patroon als `AgendaVandaag`.
 */
export type InboxVandaag =
  | { gekoppeld: false }
  | {
      gekoppeld: true
      /**
       * Hoeveel ongelezen mails we beoordeeld hebben.
       *
       * De noemer, en daarmee de verantwoording: "3 van de 47" laat zien dat er
       * 44 zijn weggefilterd. Zonder dit getal verbergt de kaart precies datgene
       * waar je 'm op zou willen controleren.
       */
      gescand: number
      /**
       * Mails die er wél zijn, maar die we niet konden lezen.
       *
       * Bijna altijd 0. Is hij dat niet, dan moet de kaart dat zeggen: zwijgen
       * zou betekenen dat "3 van de 47" stilletjes "3 van de 47, en 6 waarvan we
       * niets weten" is. Dan is de noemer een leugen.
       */
      nietGelezen: number
      /** Ongelezen post die om actie vraagt, nieuwste eerst. Je to-do. */
      vraagtActie: TriageMailJson[]
      /**
       * Al het overige van vandaag: gelezen post en weggefilterde ruis, nieuwste
       * eerst. Zo toont de kaart álles van vandaag, niet alleen de to-do.
       */
      overige: TriageMailJson[]
    }

/**
 * De deeplink naar één mail in Gmail.
 *
 * LET OP `u/0`: dat is "het eerste account waarmee je in deze browser bent
 * ingelogd", niet "het account dat je gekoppeld hebt". Ben je met meerdere
 * Google-accounts ingelogd en staat het gekoppelde account niet op plek 0, dan
 * opent Gmail de verkeerde mailbox en zegt hij dat de mail niet bestaat. Niet
 * op te lossen vanaf hier — Gmail heeft geen URL-vorm die op message-id zoekt
 * in het juiste account zonder de indexpositie te kennen.
 */
export function gmailLink(id: string): string {
  return `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(id)}`
}

/** Triage (server, met Date's) → de vorm over de draad. */
export function naarTriageMailJson(b: BeoordeeldeMail): TriageMailJson {
  return {
    id: b.mail.id,
    // Geen fallback hier: `MailMeta.threadId` is al een gegarandeerde string.
    // De fallback voor ontbrekende/oude data hoort in `leesTriageMailJson`.
    threadId: b.mail.threadId,
    afzender: b.mail.afzenderNaam ?? b.mail.afzenderAdres,
    onderwerp: b.mail.onderwerp,
    ontvangenOp: b.mail.ontvangenOp.toISOString(),
    reden: b.oordeel.reden,
  }
}

/** De gekoppelde tak. Los benoemd omdat `naarInboxVandaag` de andere nooit maakt. */
export type InboxGekoppeld = Extract<InboxVandaag, { gekoppeld: true }>

export function naarInboxVandaag(triage: Triage, nietGelezen: number): InboxGekoppeld {
  return {
    gekoppeld: true,
    gescand: triage.gescand,
    nietGelezen,
    vraagtActie: triage.vraagtActie.map(naarTriageMailJson),
    overige: triage.overige.map(naarTriageMailJson),
  }
}

/**
 * De deeplink naar je hele inbox in Gmail.
 *
 * Zelfde `u/0`-caveat als `gmailLink`: dat is "het eerste account in deze browser",
 * niet per se het gekoppelde. Voor de gewone gebruiker met één Google-account klopt
 * het; met meerdere accounts kan Gmail een ander postvak openen.
 */
export function gmailInboxLink(): string {
  return 'https://mail.google.com/mail/u/0/#inbox'
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// Ook onze eigen server is een grens. Een `as InboxVandaag` werkt tot iemand het
// antwoord verandert; dan crasht de UI ergens diep in een render in plaats van
// netjes te zeggen dat er iets niet klopt.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/** Een teller: heel getal, niet negatief. Alles anders is een kapot antwoord. */
function telling(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
}

function leesTriageMailJson(ruw: unknown): TriageMailJson | null {
  if (!isObject(ruw)) return null

  const id = tekst(ruw.id)
  const ontvangenOp = tekst(ruw.ontvangenOp)
  const reden = tekst(ruw.reden)
  if (id === null || ontvangenOp === null || reden === null) return null

  // `threadId` staat bewust NIET in de verplichte guard hierboven: een oud of
  // gecacht antwoord kan 'm missen, en een mail zonder thread-id mag daar niet om
  // verdwijnen. Fallback naar `''` — dat levert hooguit "concept niet in thread"
  // op (zie `concept/route.ts`), nooit een geworpen fout. Fout ≠ leeg.
  const threadId = tekst(ruw.threadId) ?? ''

  return {
    id,
    threadId,
    afzender: tekst(ruw.afzender),
    onderwerp: tekst(ruw.onderwerp),
    ontvangenOp,
    reden,
  }
}

/** Het antwoord van `GET /api/inbox/vandaag`, of null als het niet klopt. */
export function leesInboxVandaag(ruw: unknown): InboxVandaag | null {
  if (!isObject(ruw)) return null

  if (ruw.gekoppeld === false) return { gekoppeld: false }
  if (ruw.gekoppeld !== true) return null

  const gescand = telling(ruw.gescand)
  const nietGelezen = telling(ruw.nietGelezen)
  if (gescand === null || nietGelezen === null) return null
  if (!Array.isArray(ruw.vraagtActie)) return null

  const mails = ruw.vraagtActie.map(leesTriageMailJson)
  // Eén kapot item = een kapot antwoord. Stil overslaan zou een mail laten
  // verdwijnen zonder dat iemand het merkt — en dat is hier het gevaar.
  if (mails.some((m) => m === null)) return null

  // `overige` mag ontbreken (een ouder/gecacht antwoord van vóór deze uitbreiding):
  // dan is het een lege lijst, geen kapot antwoord. Een kapot ITEM erin is dat wél.
  const overigeRuw = Array.isArray(ruw.overige) ? ruw.overige.map(leesTriageMailJson) : []
  if (overigeRuw.some((m) => m === null)) return null

  return {
    gekoppeld: true,
    gescand,
    nietGelezen,
    vraagtActie: mails.filter((m): m is TriageMailJson => m !== null),
    overige: overigeRuw.filter((m): m is TriageMailJson => m !== null),
  }
}
