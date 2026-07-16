// ─── LifeOS — inbox: van mail-metadata naar een suggestie ───────────────────
// FUNCTIE 2, het AI-deel. Gegeven wat de triage al van een mail wist — afzender
// en onderwerp, NOOIT de body — leidt dit via het gedeelde intentiebrein af of
// er een taak of een agenda-item in zit, plus een korte titel voor die actie.
// Eén klik van Kane maakt het pas echt aan (zie InboxKaart); dit bestand bepaalt
// alleen wát er voorgesteld wordt.
//
// ─── DE INBOX-GRENZEN GELDEN OOK HIER ───────────────────────────────────────
// Dit bestand raakt Gmail niet aan en slaat niets op. Het krijgt de afzender en
// het onderwerp die de client al in handen had (uit de triage) en geeft een
// oordeel terug. Geen body, geen snippet, geen opslag van andermans post — die
// grenzen staan in `gmail.ts` en `vandaag/route.ts` en worden hier niet
// opgerekt. Het enige externe dat de flow raakt is het intentiebrein, en alleen
// om afzender+onderwerp te classificeren.
//
// ─── PUUR EN INJECTEERBAAR ──────────────────────────────────────────────────
// Het model is een parameter (`IntentieModel`), net als bij `bepaalIntentie`. Zo
// is de hele mail→suggestie-flow te testen zonder netwerk: een nep-model dat een
// onderwerp op een verwachte intentie afbeeldt, en de pure mapping ernaartoe.
//
// ─── EERLIJKHEID ────────────────────────────────────────────────────────────
// Alleen het onderwerp is geen body. We verzinnen dus geen samenvatting van wat
// er ín de mail staat — de `titel` is de actie die het intentiebrein uit het
// ONDERWERP haalde, niet meer. Bij twijfel (laag vertrouwen, of geen duidelijke
// taak/afspraak): `soort: 'geen'`, en dan verschijnt er geen knop. Een gemiste
// knop kost een tik in Gmail; een verkeerd aangemaakte afspraak kost een
// verkeerde afspraak — die twee wegen niet even zwaar.

import {
  bepaalIntentie,
  vraagtOmBevestiging,
  type Intentie,
  type IntentieModel,
} from '@/lib/lifeos/intentie/intentie'

/**
 * Wat we van één mail aan de analyse geven. Exact wat de triage al toonde:
 * afzender (weergavenaam of adres) en onderwerp. Géén body, géén ontvangers.
 *
 * `externId` is Gmail's message-id — de sleutel om de suggestie terug te koppelen
 * aan de regel in de lijst. Zelfde `extern_id`-begrip als in de agenda-sync.
 */
export interface MailKenmerk {
  externId: string
  afzender: string | null
  onderwerp: string | null
}

/** Wat de analyse voorstelt. 'geen' = geen actie, dus geen knop. */
export type SuggestieSoort = 'taak' | 'agenda' | 'geen'

export interface Suggestie {
  externId: string
  soort: SuggestieSoort
  /** De voorgestelde titel, of null bij 'geen'. Komt uit het onderwerp, niet uit een body. */
  titel: string | null
  /** ISO 8601 met offset als het onderwerp een tijd noemde, anders null. */
  wanneer: string | null
  /** Modelvertrouwen 0-1, doorgegeven zodat de UI het desgewenst kan tonen. */
  vertrouwen: number
}

/** De lege suggestie: niets voorstellen. Eén plek, zodat 'geen' overal gelijk is. */
function geen(externId: string, vertrouwen = 0): Suggestie {
  return { externId, soort: 'geen', titel: null, wanneer: null, vertrouwen }
}

/**
 * Intentie → suggestie. Puur en los testbaar, zonder model.
 *
 * De mapping spiegelt `telegram/antwoord.ts#bepaalActie`, met één verschil: een
 * mail die geen taak of afspraak is, levert hier geen actie op ('geen') — want
 * andermans post is geen notitie die Kane wil bewaren. Twijfelt het brein
 * (`vraagtOmBevestiging`: laag vertrouwen of onduidelijke soort), dan ook 'geen':
 * liever geen knop dan de verkeerde.
 */
export function suggestieVanIntentie(intentie: Intentie, externId: string): Suggestie {
  if (vraagtOmBevestiging(intentie)) return geen(externId, intentie.vertrouwen)

  switch (intentie.soort) {
    case 'agenda':
      // Een afspraak zonder tijd kunnen we niet in de agenda zetten; dan is het
      // eerder een taak. Zelfde veilige terugval als bij Telegram.
      return intentie.wanneer
        ? {
            externId,
            soort: 'agenda',
            titel: intentie.titel,
            wanneer: intentie.wanneer,
            vertrouwen: intentie.vertrouwen,
          }
        : {
            externId,
            soort: 'taak',
            titel: intentie.titel,
            wanneer: null,
            vertrouwen: intentie.vertrouwen,
          }
    case 'taak':
    case 'herinnering':
    case 'follow_up':
      return {
        externId,
        soort: 'taak',
        titel: intentie.titel,
        wanneer: intentie.wanneer,
        vertrouwen: intentie.vertrouwen,
      }
    default:
      // notitie, idee, onduidelijk → geen knop.
      return geen(externId, intentie.vertrouwen)
  }
}

/**
 * Bouwt de tekst die het intentiebrein classificeert.
 *
 * Nadrukkelijk gelabeld als een ONTVANGEN mail, niet als Kane's eigen memo: het
 * onderwerp "Kun je vrijdag de offerte sturen?" is een verzoek aan Kane, en de
 * taak die eruit volgt is "Offerte sturen". De afzender gaat mee als context (een
 * naam kan een verzoek plaatsen), maar het onderwerp is het signaal.
 */
function berichtVanMail(afzender: string | null, onderwerp: string): string {
  const afz = afzender ? `Afzender: ${afzender}. ` : ''
  return `Onderwerp van een e-mail die ik ontving (dit is geen eigen notitie). ${afz}Onderwerp: ${onderwerp}`
}

/**
 * Analyseer één mail. Model injecteerbaar; `nu` zodat "vrijdag" een echte datum
 * kan worden én de test deterministisch blijft.
 *
 * Geen onderwerp = niets om uit te halen: dan bellen we het model niet eens en
 * geven eerlijk 'geen' terug (scheelt kosten en verzint niets).
 */
export async function analyseerMail(
  mail: MailKenmerk,
  model: IntentieModel,
  nu: Date = new Date(),
): Promise<Suggestie> {
  const onderwerp = mail.onderwerp?.trim()
  if (!onderwerp) return geen(mail.externId)

  // `bepaalIntentie` vangt modelstoringen zelf af en geeft dan 'onduidelijk'
  // terug, wat hier op 'geen' uitkomt. Eén kapotte mail sloopt zo nooit de batch.
  const intentie = await bepaalIntentie(berichtVanMail(mail.afzender, onderwerp), model, nu)
  return suggestieVanIntentie(intentie, mail.externId)
}

/**
 * Analyseer een lijst mails. Parallel: elke analyse is een losse modelaanroep en
 * ze hangen niet van elkaar af.
 */
export async function analyseerMails(
  mails: readonly MailKenmerk[],
  model: IntentieModel,
  nu: Date = new Date(),
): Promise<Suggestie[]> {
  return Promise.all(mails.map((m) => analyseerMail(m, model, nu)))
}

// ─── Systeemgrens: het verzoek aan onze eigen API ───────────────────────────
// De client stuurt de metadata mee die hij al had. Ook dat is een grens: we
// casten niet, we narrowen. Een item zonder `extern_id` is een kapot verzoek —
// dan zouden we een suggestie niet aan een regel kunnen terugkoppelen.

/** Zoveel mails analyseren we per verzoek maximaal — gelijk aan de triage-grens. */
export const MAX_ANALYSE = 40

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

function leesKenmerk(ruw: unknown): MailKenmerk | null {
  if (!isObject(ruw)) return null
  const externId = tekst(ruw.extern_id)
  if (externId === null) return null
  return { externId, afzender: tekst(ruw.afzender), onderwerp: tekst(ruw.onderwerp) }
}

export type VerzoekUitkomst =
  | { ok: true; berichten: MailKenmerk[] }
  | { ok: false; fout: string }

/** Leest `{ berichten: [...] }`. Faalt met een leesbare melding i.p.v. te casten. */
export function leesAnalyseVerzoek(body: unknown): VerzoekUitkomst {
  if (!isObject(body) || !Array.isArray(body.berichten)) {
    return { ok: false, fout: 'Geef een lijst berichten mee: { berichten: [...] }.' }
  }
  if (body.berichten.length > MAX_ANALYSE) {
    return { ok: false, fout: `Maximaal ${MAX_ANALYSE} berichten per verzoek.` }
  }
  const berichten = body.berichten.map(leesKenmerk)
  if (berichten.some((b) => b === null)) {
    return { ok: false, fout: 'Elk bericht heeft een extern_id nodig.' }
  }
  return { ok: true, berichten: berichten.filter((b): b is MailKenmerk => b !== null) }
}

// ─── De vorm over de draad ──────────────────────────────────────────────────
// snake_case naar buiten (`extern_id`), zoals de rest van de sync-laag. De
// interne `Suggestie` is camelCase; deze functies vertalen heen en weer.

export interface SuggestieJson {
  extern_id: string
  soort: SuggestieSoort
  titel: string | null
  wanneer: string | null
  vertrouwen: number
}

export function naarSuggestieJson(s: Suggestie): SuggestieJson {
  return {
    extern_id: s.externId,
    soort: s.soort,
    titel: s.titel,
    wanneer: s.wanneer,
    vertrouwen: s.vertrouwen,
  }
}

const SOORTEN: readonly SuggestieSoort[] = ['taak', 'agenda', 'geen']

function alsSoort(v: unknown): SuggestieSoort | null {
  return typeof v === 'string' && (SOORTEN as readonly string[]).includes(v)
    ? (v as SuggestieSoort)
    : null
}

function leesSuggestieJson(ruw: unknown): Suggestie | null {
  if (!isObject(ruw)) return null

  const externId = tekst(ruw.extern_id)
  const soort = alsSoort(ruw.soort)
  if (externId === null || soort === null) return null

  const titel = tekst(ruw.titel)
  // Een actie zonder titel kan de UI niet aanmaken. Behandel 'm als 'geen' i.p.v.
  // een knop te tonen die gegarandeerd faalt.
  if (soort !== 'geen' && titel === null) return null

  const ruwVertrouwen = ruw.vertrouwen
  const vertrouwen =
    typeof ruwVertrouwen === 'number' && Number.isFinite(ruwVertrouwen)
      ? Math.min(1, Math.max(0, ruwVertrouwen))
      : 0

  return { externId, soort, titel, wanneer: tekst(ruw.wanneer), vertrouwen }
}

/**
 * Het antwoord van `POST /api/lifeos/inbox/analyseer`, of null als de vorm niet
 * klopt.
 *
 * Lenient per item, anders dan de triage-lijst: een suggestie is een extraatje
 * bovenop de mail-lijst, geen mail. Valt er één weg, dan mist die ene mail zijn
 * knop — de mail zelf staat er nog gewoon. Een hele batch verwerpen om één kapot
 * item zou dat extraatje voor álle mails wegnemen, en dat is de slechtere ruil.
 */
export function leesSuggesties(ruw: unknown): Suggestie[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.suggesties)) return null
  return ruw.suggesties
    .map(leesSuggestieJson)
    .filter((s): s is Suggestie => s !== null)
}
